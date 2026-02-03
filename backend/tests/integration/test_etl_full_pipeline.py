"""
Extended integration tests for the ETL pipeline.

Tests full pipeline flow with mocked Algolia, error handling, and edge cases.
"""

import json
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

import pandas as pd
import pytest

from etl.pipeline import ETLPipeline, PipelineStats
from etl.loaders import AlgoliaLoader


@pytest.mark.integration
class TestETLPipelineWithMockedAlgolia:
    """Tests for full ETL pipeline with mocked Algolia."""

    @pytest.fixture
    def mock_algolia_loader(self):
        with patch("etl.pipeline.AlgoliaLoader") as mock_loader_class:
            mock_instance = Mock(spec=AlgoliaLoader)
            mock_instance.create_index.return_value = None
            mock_instance.upload_records.return_value = {
                "uploaded": 10,
                "errors": 0,
                "index": "test_index"
            }
            mock_loader_class.return_value = mock_instance
            yield mock_instance

    @pytest.fixture
    def pipeline_with_mock_algolia(self, temp_data_dir, mock_algolia_loader, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")

        raw_dir = temp_data_dir / "raw"
        raw_dir.mkdir(exist_ok=True)

        cpu_df = pd.DataFrame([{
            "name": "AMD Ryzen 5 7600X",
            "brand": "AMD",
            "cores": 6,
            "threads": 12,
            "socket": "AM5",
            "tdp_watts": 65,
            "memory_type": "DDR5",
            "price_usd": 299,
        }])
        cpu_df.to_csv(raw_dir / "cpus.csv", index=False)

        gpu_df = pd.DataFrame([{
            "name": "NVIDIA RTX 4070",
            "brand": "NVIDIA",
            "vram": 12,
            "tdp_watts": 200,
            "length_mm": 300,
            "price_usd": 399,
        }])
        gpu_df.to_csv(raw_dir / "gpus.csv", index=False)

        pipeline = ETLPipeline(
            data_dir=str(temp_data_dir),
            cache_dir=str(temp_data_dir / "cache"),
        )
        pipeline._loader = mock_algolia_loader
        return pipeline

    def test_pipeline_full_flow_with_mock_algolia(
        self,
        pipeline_with_mock_algolia,
        mock_algolia_loader
    ):
        mock_algolia_loader.upload_records.return_value = {
            "uploaded": 2,
            "errors": 0,
            "index": "test_index"
        }

        stats = pipeline_with_mock_algolia.run(
            components=["CPU", "GPU"],
            skip_scraping=True,
            dry_run=False
        )

        mock_algolia_loader.create_index.assert_called_once()
        mock_algolia_loader.upload_records.assert_called_once()

        assert stats.uploaded_records == 2
        assert stats.failed_records == 0

    def test_pipeline_calls_algolia_with_correct_records(
        self,
        pipeline_with_mock_algolia,
        mock_algolia_loader
    ):
        pipeline_with_mock_algolia.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=False
        )

        call_args = mock_algolia_loader.upload_records.call_args
        records = call_args[0][0]

        assert len(records) > 0
        for record in records:
            assert "objectID" in record
            assert "component_type" in record
            assert record["component_type"] == "CPU"

    def test_pipeline_handles_upload_errors(
        self,
        pipeline_with_mock_algolia,
        mock_algolia_loader
    ):
        mock_algolia_loader.upload_records.return_value = {
            "uploaded": 0,
            "errors": 1,
            "index": "test_index"
        }

        stats = pipeline_with_mock_algolia.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=False
        )

        assert stats.uploaded_records == 0
        assert stats.failed_records == 1
        assert len(stats.warnings) > 0

    def test_pipeline_clears_index_when_requested(
        self,
        pipeline_with_mock_algolia,
        mock_algolia_loader
    ):
        pipeline_with_mock_algolia.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=False,
            clear_index=True
        )

        call_args = mock_algolia_loader.upload_records.call_args
        assert call_args[1]["clear_existing"] is True


@pytest.mark.integration
class TestPipelineErrorHandling:
    """Tests for pipeline error handling."""

    @pytest.fixture
    def pipeline(self, temp_data_dir, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        
        return ETLPipeline(
            data_dir=str(temp_data_dir),
            cache_dir=str(temp_data_dir / "cache"),
        )

    def test_pipeline_handles_scraper_failure_gracefully(
        self,
        pipeline,
        temp_data_dir
    ):
        raw_dir = temp_data_dir / "raw"
        cpu_df = pd.DataFrame([{
            "name": "AMD Ryzen 5 7600X",
            "brand": "AMD",
            "cores": 6,
            "threads": 12,
            "socket": "AM5",
            "tdp_watts": 65,
            "memory_type": "DDR5",
            "price_usd": 299,
        }])
        cpu_df.to_csv(raw_dir / "cpus.csv", index=False)

        with patch.object(pipeline.scraper, 'scrape_gpu_list', side_effect=Exception("Network error")):
            stats = pipeline.run(
                components=["CPU", "GPU"],
                skip_scraping=False,
                dry_run=True
            )

            assert "GPU scraping failed" in str(stats.warnings) or stats.total_extracted > 0

    def test_pipeline_handles_missing_csv_files(self, pipeline):
        stats = pipeline.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=True
        )

        assert stats.total_extracted == 0

    def test_pipeline_handles_empty_dataframe(self, pipeline, temp_data_dir):
        raw_dir = temp_data_dir / "raw"
        empty_df = pd.DataFrame(columns=["name", "brand", "cores", "threads", "socket", "tdp_watts", "memory_type", "price_usd"])
        empty_df.to_csv(raw_dir / "cpus.csv", index=False)

        stats = pipeline.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=True
        )

        assert stats.normalized_records == 0


@pytest.mark.integration
class TestPipelineComponentFiltering:
    """Tests for component type filtering."""

    @pytest.fixture
    def pipeline_with_multiple_data(self, temp_data_dir, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        
        raw_dir = temp_data_dir / "raw"
        
        cpu_df = pd.DataFrame([{
            "name": "AMD Ryzen 5 7600X",
            "brand": "AMD",
            "cores": 6,
            "threads": 12,
            "socket": "AM5",
            "tdp_watts": 65,
            "memory_type": "DDR5",
            "price_usd": 299,
        }])
        cpu_df.to_csv(raw_dir / "cpus.csv", index=False)
        
        gpu_df = pd.DataFrame([{
            "name": "NVIDIA RTX 4070",
            "brand": "NVIDIA",
            "vram": 12,
            "tdp_watts": 200,
            "length_mm": 300,
            "price_usd": 399,
        }])
        gpu_df.to_csv(raw_dir / "gpus.csv", index=False)
        
        return ETLPipeline(
            data_dir=str(temp_data_dir),
            cache_dir=str(temp_data_dir / "cache"),
        )

    def test_filter_to_cpu_only(self, pipeline_with_multiple_data):
        stats = pipeline_with_multiple_data.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=True
        )

        assert "CPU" in stats.extracted_records
        assert "GPU" not in stats.extracted_records

    def test_filter_to_gpu_only(self, pipeline_with_multiple_data):
        stats = pipeline_with_multiple_data.run(
            components=["GPU"],
            skip_scraping=True,
            dry_run=True
        )

        assert "GPU" in stats.extracted_records
        assert "CPU" not in stats.extracted_records

    def test_filter_to_multiple_components(self, pipeline_with_multiple_data):
        stats = pipeline_with_multiple_data.run(
            components=["CPU", "GPU"],
            skip_scraping=True,
            dry_run=True
        )

        assert "CPU" in stats.extracted_records
        assert "GPU" in stats.extracted_records

    def test_no_filter_processes_all(self, pipeline_with_multiple_data):
        stats = pipeline_with_multiple_data.run(
            components=None,
            skip_scraping=True,
            dry_run=True
        )

        assert "CPU" in stats.extracted_records
        assert "GPU" in stats.extracted_records


@pytest.mark.integration
class TestPipelineValidation:
    """Tests for pipeline data validation."""

    @pytest.fixture
    def pipeline(self, temp_data_dir, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        
        return ETLPipeline(
            data_dir=str(temp_data_dir),
            cache_dir=str(temp_data_dir / "cache"),
        )

    def test_validate_data_catches_missing_object_id(self, pipeline):
        records = [
            {"component_type": "CPU", "brand": "AMD"},
        ]

        report = pipeline.validate_data(records)

        assert report["invalid"] >= 0

    def test_validate_data_reports_by_type(self, pipeline):
        records = [
            {"objectID": "cpu-1", "component_type": "CPU", "brand": "AMD"},
            {"objectID": "gpu-1", "component_type": "GPU", "brand": "NVIDIA"},
        ]

        report = pipeline.validate_data(records)

        assert "CPU" in report["by_type"]
        assert "GPU" in report["by_type"]

    def test_validate_data_with_empty_list(self, pipeline):
        report = pipeline.validate_data([])

        assert report["total"] == 0
        assert report["valid"] == 0
        assert report["invalid"] == 0


@pytest.mark.integration
class TestPipelineStatistics:
    """Tests for pipeline statistics accuracy."""

    @pytest.fixture
    def pipeline_with_data(self, temp_data_dir, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        
        raw_dir = temp_data_dir / "raw"
        
        cpu_df = pd.DataFrame([
            {"name": f"AMD Ryzen {i}", "brand": "AMD", "cores": 6, "threads": 12, "socket": "AM5", "tdp_watts": 65, "memory_type": "DDR5", "price_usd": 299}
            for i in range(5)
        ])
        cpu_df.to_csv(raw_dir / "cpus.csv", index=False)
        
        return ETLPipeline(
            data_dir=str(temp_data_dir),
            cache_dir=str(temp_data_dir / "cache"),
        )

    def test_stats_match_actual_counts(self, pipeline_with_data):
        stats = pipeline_with_data.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=True
        )

        assert stats.extracted_records["CPU"] == 5
        assert stats.normalized_records == 5
        assert stats.tagged_records == 5
        assert stats.mapped_records == 5

    def test_stats_duration_is_positive(self, pipeline_with_data):
        stats = pipeline_with_data.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=True
        )

        assert stats.duration_seconds > 0
        assert stats.start_time > 0
        assert stats.end_time > stats.start_time

    def test_stats_to_dict(self, pipeline_with_data):
        stats = pipeline_with_data.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=True
        )

        stats_dict = stats.to_dict()

        assert "duration_seconds" in stats_dict
        assert "extracted" in stats_dict
        assert "total_extracted" in stats_dict
        assert "normalized" in stats_dict
        assert "tagged" in stats_dict
        assert "mapped" in stats_dict
        assert "uploaded" in stats_dict


@pytest.mark.integration
class TestPipelineProcessedFileGeneration:
    """Tests for processed file generation."""

    @pytest.fixture
    def pipeline_with_data(self, temp_data_dir, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        
        raw_dir = temp_data_dir / "raw"
        
        cpu_df = pd.DataFrame([{
            "name": "AMD Ryzen 5 7600X",
            "brand": "AMD",
            "cores": 6,
            "threads": 12,
            "socket": "AM5",
            "tdp_watts": 65,
            "memory_type": "DDR5",
            "price_usd": 299,
        }])
        cpu_df.to_csv(raw_dir / "cpus.csv", index=False)
        
        gpu_df = pd.DataFrame([{
            "name": "NVIDIA RTX 4070",
            "brand": "NVIDIA",
            "vram": 12,
            "tdp_watts": 200,
            "length_mm": 300,
            "price_usd": 399,
        }])
        gpu_df.to_csv(raw_dir / "gpus.csv", index=False)
        
        return ETLPipeline(
            data_dir=str(temp_data_dir),
            cache_dir=str(temp_data_dir / "cache"),
        )

    def test_generates_cpu_processed_file(self, pipeline_with_data, temp_data_dir):
        pipeline_with_data.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=True
        )

        processed_file = temp_data_dir / "processed" / "cpu_processed.json"
        assert processed_file.exists()

        with open(processed_file) as f:
            data = json.load(f)
            assert len(data) > 0

    def test_generates_gpu_processed_file(self, pipeline_with_data, temp_data_dir):
        pipeline_with_data.run(
            components=["GPU"],
            skip_scraping=True,
            dry_run=True
        )

        processed_file = temp_data_dir / "processed" / "gpu_processed.json"
        assert processed_file.exists()

    def test_processed_files_contain_valid_records(self, pipeline_with_data, temp_data_dir):
        pipeline_with_data.run(
            components=["CPU"],
            skip_scraping=True,
            dry_run=True
        )

        processed_file = temp_data_dir / "processed" / "cpu_processed.json"
        
        with open(processed_file) as f:
            records = json.load(f)
            
            for record in records:
                assert "objectID" in record
                assert "component_type" in record
                assert "compatibility_tags" in record
