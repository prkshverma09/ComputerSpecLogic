"""
Unit tests for DataNormalizer.
"""

import pytest
import pandas as pd

from etl.transformers.normalizer import DataNormalizer


class TestDataNormalizer:
    """Tests for the DataNormalizer class."""
    
    @pytest.fixture
    def normalizer(self):
        """Create normalizer instance."""
        return DataNormalizer()
    
    # Socket normalization tests
    
    def test_normalize_socket_am5_variations(self, normalizer):
        """Test various AM5 socket name formats."""
        assert normalizer.normalize_socket("AM5") == "AM5"
        assert normalizer.normalize_socket("am5") == "AM5"
        assert normalizer.normalize_socket("Socket AM5") == "AM5"
        assert normalizer.normalize_socket("AMD AM5") == "AM5"
    
    def test_normalize_socket_lga1700_variations(self, normalizer):
        """Test various LGA1700 socket name formats."""
        assert normalizer.normalize_socket("LGA1700") == "LGA1700"
        assert normalizer.normalize_socket("LGA 1700") == "LGA1700"
        assert normalizer.normalize_socket("lga1700") == "LGA1700"
        assert normalizer.normalize_socket("Intel 1700") == "LGA1700"
    
    def test_normalize_socket_lga1851(self, normalizer):
        """Test LGA1851 socket normalization."""
        assert normalizer.normalize_socket("LGA1851") == "LGA1851"
        assert normalizer.normalize_socket("LGA 1851") == "LGA1851"
    
    def test_normalize_socket_none(self, normalizer):
        """Test handling of None socket value."""
        assert normalizer.normalize_socket(None) is None
    
    def test_normalize_socket_unknown_format(self, normalizer):
        """Test handling of unknown socket format."""
        result = normalizer.normalize_socket("UnknownSocket")
        assert result is not None  # Should return cleaned value, not None
    
    # Memory type normalization tests
    
    def test_normalize_memory_type_ddr5(self, normalizer):
        """Test DDR5 memory type normalization."""
        assert normalizer.normalize_memory_type("DDR5") == "DDR5"
        assert normalizer.normalize_memory_type("DDR5-6000") == "DDR5"
        assert normalizer.normalize_memory_type("ddr5-5600") == "DDR5"
    
    def test_normalize_memory_type_ddr4(self, normalizer):
        """Test DDR4 memory type normalization."""
        assert normalizer.normalize_memory_type("DDR4") == "DDR4"
        assert normalizer.normalize_memory_type("DDR4-3600") == "DDR4"
    
    def test_normalize_memory_type_gddr(self, normalizer):
        """Test GDDR memory type normalization."""
        assert normalizer.normalize_memory_type("GDDR6X") == "GDDR6X"
        assert normalizer.normalize_memory_type("GDDR6") == "GDDR6"
    
    def test_normalize_memory_type_none(self, normalizer):
        """Test handling of None memory type."""
        assert normalizer.normalize_memory_type(None) is None
    
    # TDP normalization tests
    
    def test_normalize_tdp_integer(self, normalizer):
        """Test TDP normalization from integer."""
        assert normalizer.normalize_tdp(65) == 65
        assert normalizer.normalize_tdp(125) == 125
    
    def test_normalize_tdp_string_with_unit(self, normalizer):
        """Test TDP normalization from string with unit."""
        assert normalizer.normalize_tdp("65W") == 65
        assert normalizer.normalize_tdp("125 W") == 125
        assert normalizer.normalize_tdp("65 Watts") == 65
    
    def test_normalize_tdp_float(self, normalizer):
        """Test TDP normalization from float."""
        assert normalizer.normalize_tdp(65.5) == 65
    
    def test_normalize_tdp_none(self, normalizer):
        """Test handling of None TDP."""
        assert normalizer.normalize_tdp(None) is None
    
    # Price normalization tests
    
    def test_normalize_price_numeric(self, normalizer):
        """Test price normalization from numeric values."""
        assert normalizer.normalize_price(499.99) == 499.99
        assert normalizer.normalize_price(299) == 299.0
    
    def test_normalize_price_string_with_symbol(self, normalizer):
        """Test price normalization from string with currency symbol."""
        assert normalizer.normalize_price("$499.99") == 499.99
        assert normalizer.normalize_price("$299") == 299.0
    
    def test_normalize_price_string_with_text(self, normalizer):
        """Test price normalization from string with text."""
        assert normalizer.normalize_price("499 USD") == 499.0
    
    def test_normalize_price_none(self, normalizer):
        """Test handling of None price."""
        assert normalizer.normalize_price(None) is None
    
    # Clock speed normalization tests
    
    def test_normalize_clock_speed_ghz(self, normalizer):
        """Test clock speed normalization in GHz."""
        assert normalizer.normalize_clock_speed("4.5 GHz") == 4.5
        assert normalizer.normalize_clock_speed("4.5GHz") == 4.5
        assert normalizer.normalize_clock_speed(4.5) == 4.5
    
    def test_normalize_clock_speed_mhz(self, normalizer):
        """Test clock speed normalization from MHz."""
        assert normalizer.normalize_clock_speed("4500 MHz") == 4.5
        assert normalizer.normalize_clock_speed(4500) == 4.5  # Assumes MHz if > 100
    
    # Performance tier tests
    
    def test_derive_performance_tier_cpu(self, normalizer):
        """Test CPU performance tier derivation."""
        assert normalizer.derive_performance_tier("CPU", price=100, tdp=45) == "budget"
        assert normalizer.derive_performance_tier("CPU", price=300, tdp=100) == "mid-range"
        assert normalizer.derive_performance_tier("CPU", price=500, tdp=150) == "high-end"
        assert normalizer.derive_performance_tier("CPU", price=700, tdp=200) == "enthusiast"
    
    def test_derive_performance_tier_gpu(self, normalizer):
        """Test GPU performance tier derivation."""
        assert normalizer.derive_performance_tier("GPU", price=200, tdp=100) == "budget"
        assert normalizer.derive_performance_tier("GPU", price=400, tdp=200) == "mid-range"
        assert normalizer.derive_performance_tier("GPU", price=800, tdp=300) == "high-end"
        assert normalizer.derive_performance_tier("GPU", price=1500, tdp=400) == "enthusiast"
    
    def test_derive_performance_tier_unknown_component(self, normalizer):
        """Test performance tier for unknown component type."""
        # Should default to mid-range
        assert normalizer.derive_performance_tier("Unknown", price=100) == "mid-range"
    
    # Object ID generation tests
    
    def test_generate_object_id(self, normalizer):
        """Test object ID generation."""
        assert normalizer.generate_object_id("CPU", "AMD", "Ryzen 7 9700X") == "cpu-amd-ryzen-7-9700x"
        assert normalizer.generate_object_id("GPU", "NVIDIA", "RTX 4070") == "gpu-nvidia-rtx-4070"
    
    def test_generate_object_id_special_characters(self, normalizer):
        """Test object ID generation with special characters."""
        result = normalizer.generate_object_id("Motherboard", "ASUS", "ROG Strix X670E-E")
        assert "-" in result
        assert " " not in result
    
    # Boolean normalization tests
    
    def test_normalize_boolean_true_values(self, normalizer):
        """Test boolean normalization for true values."""
        assert normalizer.normalize_boolean(True) is True
        assert normalizer.normalize_boolean("true") is True
        assert normalizer.normalize_boolean("yes") is True
        assert normalizer.normalize_boolean("1") is True
        assert normalizer.normalize_boolean(1) is True
    
    def test_normalize_boolean_false_values(self, normalizer):
        """Test boolean normalization for false values."""
        assert normalizer.normalize_boolean(False) is False
        assert normalizer.normalize_boolean("false") is False
        assert normalizer.normalize_boolean("no") is False
        assert normalizer.normalize_boolean("0") is False
        assert normalizer.normalize_boolean(0) is False
    
    def test_normalize_boolean_none(self, normalizer):
        """Test boolean normalization for None."""
        assert normalizer.normalize_boolean(None) is False
    
    # DataFrame normalization tests
    
    def test_normalize_dataframe(self, normalizer, sample_cpu_df):
        """Test normalizing a complete DataFrame."""
        df = sample_cpu_df.copy()
        result = normalizer.normalize_dataframe(df)
        
        assert len(result) == len(df)
        assert "objectID" in result.columns
        assert "performance_tier" in result.columns
    
    def test_normalize_dataframe_preserves_columns(self, normalizer, sample_cpu_df):
        """Test that DataFrame normalization preserves existing columns."""
        df = sample_cpu_df.copy()
        original_columns = set(df.columns)
        result = normalizer.normalize_dataframe(df)
        
        # Should have all original columns plus any added ones
        assert original_columns.issubset(set(result.columns))
