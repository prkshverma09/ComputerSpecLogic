"""
Integration tests for the ETL pipeline.
"""

import pytest
import json
from pathlib import Path

from etl.pipeline import ETLPipeline
from etl.extractors import KaggleExtractor
from etl.transformers import DataNormalizer, CompatibilityTagger, SchemaMapper


@pytest.mark.integration
class TestETLPipelineIntegration:
    """Integration tests for the complete ETL pipeline."""
    
    @pytest.fixture
    def pipeline(self, temp_data_dir, mock_algolia_env):
        """Create pipeline with temp directories."""
        return ETLPipeline(
            data_dir=str(temp_data_dir),
            cache_dir=str(temp_data_dir / "cache"),
        )
    
    @pytest.fixture
    def pipeline_with_data(self, pipeline, sample_cpu_csv, sample_gpu_csv):
        """Pipeline with sample data files present."""
        return pipeline
    
    def test_pipeline_extract_phase(self, pipeline_with_data):
        """Test extraction phase of pipeline."""
        # Run only extraction
        raw_data = pipeline_with_data._extract(
            components=["CPU", "GPU"],
            skip_scraping=True
        )
        
        assert "CPU" in raw_data
        assert "GPU" in raw_data
        assert len(raw_data["CPU"]) > 0
        assert len(raw_data["GPU"]) > 0
    
    def test_pipeline_transform_phase(self, pipeline_with_data):
        """Test transformation phase of pipeline."""
        # Extract first
        raw_data = pipeline_with_data._extract(
            components=["CPU"],
            skip_scraping=True
        )
        
        # Then transform
        records = pipeline_with_data._transform(raw_data)
        
        assert len(records) > 0
        
        # Verify records have required fields
        for record in records:
            assert "objectID" in record
            assert "component_type" in record
            assert "compatibility_tags" in record
    
    def test_pipeline_dry_run(self, pipeline_with_data):
        """Test full pipeline in dry run mode."""
        stats = pipeline_with_data.run(
            components=["CPU", "GPU"],
            skip_scraping=True,
            dry_run=True
        )
        
        assert stats.total_extracted > 0
        assert stats.normalized_records > 0
        assert stats.tagged_records > 0
        assert stats.mapped_records > 0
        assert stats.uploaded_records > 0  # Dry run reports as uploaded
        assert len(stats.errors) == 0
    
    def test_pipeline_generates_processed_files(self, pipeline_with_data, temp_data_dir):
        """Test that pipeline generates processed JSON files."""
        stats = pipeline_with_data.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=True
        )
        
        # Check for processed files
        processed_dir = temp_data_dir / "processed"
        cpu_file = processed_dir / "cpu_processed.json"
        
        assert cpu_file.exists()
        
        # Verify JSON is valid
        with open(cpu_file) as f:
            data = json.load(f)
            assert len(data) > 0
    
    def test_pipeline_validation(self, pipeline_with_data):
        """Test pipeline data validation."""
        # Extract and transform
        raw_data = pipeline_with_data._extract(
            components=["CPU"],
            skip_scraping=True
        )
        records = pipeline_with_data._transform(raw_data)
        
        # Validate
        report = pipeline_with_data.validate_data(records)
        
        assert report["total"] == len(records)
        assert report["valid"] > 0
        assert "by_type" in report
        assert "CPU" in report["by_type"]
    
    def test_pipeline_stats_accuracy(self, pipeline_with_data):
        """Test that pipeline statistics are accurate."""
        stats = pipeline_with_data.run(
            components=["CPU", "GPU"],
            skip_scraping=True,
            dry_run=True
        )
        
        # Total extracted should match sum of individual types
        total = sum(stats.extracted_records.values())
        assert stats.total_extracted == total
        
        # Duration should be positive
        assert stats.duration_seconds > 0
        
        # No records should fail in dry run with valid data
        assert stats.failed_records == 0


@pytest.mark.integration
class TestComponentDataFlowIntegration:
    """Test data flows through the entire pipeline correctly."""
    
    def test_cpu_data_flow(self, temp_data_dir, sample_cpu_df):
        """Test CPU data flows correctly through all stages."""
        # Save sample data
        raw_dir = temp_data_dir / "raw"
        raw_dir.mkdir(exist_ok=True)
        sample_cpu_df.to_csv(raw_dir / "cpus.csv", index=False)
        
        # Initialize components
        extractor = KaggleExtractor(str(raw_dir))
        normalizer = DataNormalizer()
        tagger = CompatibilityTagger()
        mapper = SchemaMapper()
        
        # Extract
        df = extractor.extract_cpus()
        assert len(df) > 0
        
        # Normalize
        normalized = normalizer.normalize_dataframe(df)
        assert "objectID" in normalized.columns
        
        # Tag
        tagged = tagger.tag_dataframe(normalized)
        assert "compatibility_tags" in tagged.columns
        assert all(isinstance(tags, list) for tags in tagged["compatibility_tags"])
        
        # Map
        mapped = mapper.map_dataframe(tagged)
        assert len(mapped) > 0
        
        # Verify final records
        records = mapped.to_dict(orient="records")
        for record in records:
            assert "objectID" in record
            assert "component_type" in record
            assert record["component_type"] == "CPU"
            assert "compatibility_tags" in record
            assert len(record["compatibility_tags"]) > 0
    
    def test_gpu_data_flow(self, temp_data_dir, sample_gpu_df):
        """Test GPU data flows correctly through all stages."""
        # Save sample data
        raw_dir = temp_data_dir / "raw"
        raw_dir.mkdir(exist_ok=True)
        sample_gpu_df.to_csv(raw_dir / "gpus.csv", index=False)
        
        # Initialize components
        extractor = KaggleExtractor(str(raw_dir))
        normalizer = DataNormalizer()
        tagger = CompatibilityTagger()
        mapper = SchemaMapper()
        
        # Extract
        df = extractor.extract_gpus()
        assert len(df) > 0
        
        # Normalize
        normalized = normalizer.normalize_dataframe(df)
        
        # Tag
        tagged = tagger.tag_dataframe(normalized)
        
        # Map
        mapped = mapper.map_dataframe(tagged)
        
        # Verify final records have GPU-specific fields
        records = mapped.to_dict(orient="records")
        for record in records:
            assert record["component_type"] == "GPU"
            # GPU should have TDP-related tags
            tags = record["compatibility_tags"]
            tdp_tags = [t for t in tags if "tdp" in t]
            assert len(tdp_tags) > 0


@pytest.mark.integration
class TestCompatibilityTagIntegration:
    """Test that compatibility tags are generated correctly."""
    
    def test_am5_cpu_gets_am5_tag(self):
        """Test that AM5 CPUs get the am5 tag."""
        normalizer = DataNormalizer()
        tagger = CompatibilityTagger()
        
        cpu_data = {
            "component_type": "CPU",
            "brand": "AMD",
            "model": "Test CPU",
            "socket": "Socket AM5",  # Various format
            "memory_type": "DDR5",
            "tdp_watts": 65,
        }
        
        # Normalize
        normalized = {"socket": normalizer.normalize_socket(cpu_data["socket"])}
        normalized.update(cpu_data)
        
        # Tag
        tags = tagger.generate_tags(normalized)
        
        assert "am5" in tags
        assert "ddr5" in tags
    
    def test_high_tdp_gpu_gets_warning_tags(self):
        """Test that high TDP GPUs get appropriate warning tags."""
        tagger = CompatibilityTagger()
        
        gpu_data = {
            "component_type": "GPU",
            "brand": "NVIDIA",
            "model": "RTX 4090",
            "tdp_watts": 450,
            "vram_gb": 24,
            "length_mm": 336,
        }
        
        tags = tagger.generate_tags(gpu_data)
        
        assert "extreme-tdp" in tags
        assert "extreme-power-gpu" in tags
        assert "vram-24gb" in tags
        assert "extra-long-gpu" in tags
    
    def test_ddr4_motherboard_gets_ddr4_tag(self):
        """Test DDR4 motherboard compatibility tagging."""
        tagger = CompatibilityTagger()
        
        mobo_data = {
            "component_type": "Motherboard",
            "socket": "LGA1700",
            "memory_type": ["DDR4"],
            "form_factor": "ATX",
        }
        
        tags = tagger.generate_tags(mobo_data)
        
        assert "lga1700" in tags
        assert "ddr4" in tags
        assert "atx" in tags
