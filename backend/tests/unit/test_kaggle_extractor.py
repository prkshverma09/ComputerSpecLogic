"""
Unit tests for KaggleExtractor.
"""

import pytest
import pandas as pd
from pathlib import Path

from etl.extractors.kaggle_extractor import KaggleExtractor


class TestKaggleExtractor:
    """Tests for the KaggleExtractor class."""
    
    @pytest.fixture
    def extractor(self, temp_data_dir):
        """Create extractor instance with temp directory."""
        return KaggleExtractor(str(temp_data_dir / "raw"))
    
    def test_extract_cpus_success(self, extractor, sample_cpu_csv):
        """Test successful CPU extraction."""
        df = extractor.extract_cpus(str(sample_cpu_csv))
        
        assert len(df) > 0
        assert "component_type" in df.columns
        assert all(df["component_type"] == "CPU")
    
    def test_extract_cpus_file_not_found(self, extractor):
        """Test extraction with missing file."""
        with pytest.raises(FileNotFoundError):
            extractor.extract_cpus("/nonexistent/path/cpus.csv")
    
    def test_extract_gpus_success(self, extractor, sample_gpu_csv):
        """Test successful GPU extraction."""
        df = extractor.extract_gpus(str(sample_gpu_csv))
        
        assert len(df) > 0
        assert "component_type" in df.columns
        assert all(df["component_type"] == "GPU")
    
    def test_extract_gpus_file_not_found(self, extractor):
        """Test extraction with missing GPU file."""
        with pytest.raises(FileNotFoundError):
            extractor.extract_gpus("/nonexistent/path/gpus.csv")
    
    def test_validate_schema_success(self, extractor):
        """Test schema validation success."""
        df = pd.DataFrame({
            "name": ["Test CPU"],
            "brand": ["AMD"],
            "cores": [8],
            "threads": [16],
        })
        
        assert extractor.validate_schema(df, ["name", "brand", "cores", "threads"])
    
    def test_validate_schema_failure(self, extractor):
        """Test schema validation failure."""
        df = pd.DataFrame({
            "name": ["Test CPU"],
            "brand": ["AMD"],
        })
        
        assert not extractor.validate_schema(df, ["name", "brand", "cores", "threads"])
    
    def test_extract_motherboards_missing_file(self, extractor):
        """Test motherboard extraction with missing file returns empty DataFrame."""
        df = extractor.extract_motherboards()
        
        assert isinstance(df, pd.DataFrame)
        assert df.empty
    
    def test_extract_ram_missing_file(self, extractor):
        """Test RAM extraction with missing file returns empty DataFrame."""
        df = extractor.extract_ram()
        
        assert isinstance(df, pd.DataFrame)
        assert df.empty
    
    def test_extract_psus_missing_file(self, extractor):
        """Test PSU extraction with missing file returns empty DataFrame."""
        df = extractor.extract_psus()
        
        assert isinstance(df, pd.DataFrame)
        assert df.empty
    
    def test_extract_cases_missing_file(self, extractor):
        """Test case extraction with missing file returns empty DataFrame."""
        df = extractor.extract_cases()
        
        assert isinstance(df, pd.DataFrame)
        assert df.empty
    
    def test_extract_coolers_missing_file(self, extractor):
        """Test cooler extraction with missing file returns empty DataFrame."""
        df = extractor.extract_coolers()
        
        assert isinstance(df, pd.DataFrame)
        assert df.empty
    
    def test_extract_all_with_available_files(self, extractor, sample_cpu_csv, sample_gpu_csv):
        """Test extracting all component types."""
        data = extractor.extract_all()
        
        assert isinstance(data, dict)
        assert "CPU" in data
        assert "GPU" in data
        assert len(data["CPU"]) > 0
        assert len(data["GPU"]) > 0
    
    def test_extract_all_handles_missing_files(self, extractor):
        """Test that extract_all handles missing files gracefully."""
        data = extractor.extract_all()
        
        assert isinstance(data, dict)
        # All component types should be present as keys, even if empty
        expected_types = ["CPU", "GPU", "Motherboard", "RAM", "PSU", "Case", "Cooler"]
        for comp_type in expected_types:
            assert comp_type in data


class TestKaggleExtractorWithCustomData:
    """Tests with custom test data."""
    
    @pytest.fixture
    def custom_cpu_data(self, temp_data_dir):
        """Create custom CPU test data."""
        df = pd.DataFrame([
            {
                "name": "Ryzen 7 9700X",
                "brand": "AMD",
                "cores": 8,
                "threads": 16,
                "socket": "AM5",
                "tdp_watts": 65,
            },
            {
                "name": "Core i5-14600K",
                "brand": "Intel",
                "cores": 14,
                "threads": 20,
                "socket": "LGA1700",
                "tdp_watts": 125,
            },
        ])
        
        csv_path = temp_data_dir / "raw" / "cpus.csv"
        df.to_csv(csv_path, index=False)
        return csv_path
    
    def test_extract_custom_cpu_data(self, temp_data_dir, custom_cpu_data):
        """Test extraction of custom CPU data."""
        extractor = KaggleExtractor(str(temp_data_dir / "raw"))
        df = extractor.extract_cpus(str(custom_cpu_data))
        
        assert len(df) == 2
        assert "Ryzen 7 9700X" in df["name"].values
        assert "Core i5-14600K" in df["name"].values
    
    @pytest.fixture
    def invalid_csv_data(self, temp_data_dir):
        """Create CSV with invalid schema."""
        df = pd.DataFrame([
            {"invalid_column": "data"},
        ])
        
        csv_path = temp_data_dir / "raw" / "invalid.csv"
        df.to_csv(csv_path, index=False)
        return csv_path
    
    def test_extract_cpus_invalid_schema(self, temp_data_dir, invalid_csv_data):
        """Test extraction with invalid schema raises error."""
        extractor = KaggleExtractor(str(temp_data_dir / "raw"))
        
        with pytest.raises(ValueError) as exc_info:
            extractor.extract_cpus(str(invalid_csv_data))
        
        assert "Missing required CPU columns" in str(exc_info.value)
