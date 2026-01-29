"""
Unit tests for SchemaMapper.
"""

import pytest
import pandas as pd

from etl.transformers.schema_mapper import SchemaMapper


class TestSchemaMapper:
    """Tests for the SchemaMapper class."""
    
    @pytest.fixture
    def mapper(self):
        """Create mapper instance."""
        return SchemaMapper()
    
    # Field mapping tests
    
    def test_apply_field_mappings(self, mapper):
        """Test field name mappings."""
        record = {
            "name": "Test Model",
            "tdp": 65,
            "price": 299.99,
        }
        
        mapped = mapper._apply_field_mappings(record)
        
        assert "model" in mapped
        assert "tdp_watts" in mapped
        assert "price_usd" in mapped
        assert mapped["model"] == "Test Model"
        assert mapped["tdp_watts"] == 65
        assert mapped["price_usd"] == 299.99
    
    def test_apply_field_mappings_preserves_unmapped(self, mapper):
        """Test that unmapped fields are preserved."""
        record = {
            "custom_field": "value",
            "name": "Model",
        }
        
        mapped = mapper._apply_field_mappings(record)
        
        assert "custom_field" in mapped
        assert mapped["custom_field"] == "value"
    
    # Type coercion tests
    
    def test_coerce_type_string(self, mapper):
        """Test string type coercion."""
        assert mapper._coerce_type(123, "str") == "123"
        assert mapper._coerce_type("test", "str") == "test"
    
    def test_coerce_type_int(self, mapper):
        """Test integer type coercion."""
        assert mapper._coerce_type(65, "int") == 65
        assert mapper._coerce_type("65", "int") == 65
        assert mapper._coerce_type(65.7, "int") == 65
        assert mapper._coerce_type("65W", "int") == 65
    
    def test_coerce_type_float(self, mapper):
        """Test float type coercion."""
        assert mapper._coerce_type(65, "float") == 65.0
        assert mapper._coerce_type("65.5", "float") == 65.5
        assert mapper._coerce_type("$299.99", "float") == 299.99
    
    def test_coerce_type_bool(self, mapper):
        """Test boolean type coercion."""
        assert mapper._coerce_type(True, "bool") is True
        assert mapper._coerce_type(False, "bool") is False
        assert mapper._coerce_type("true", "bool") is True
        assert mapper._coerce_type("false", "bool") is False
        assert mapper._coerce_type("yes", "bool") is True
        assert mapper._coerce_type(1, "bool") is True
        assert mapper._coerce_type(0, "bool") is False
    
    def test_coerce_type_list(self, mapper):
        """Test list type coercion."""
        assert mapper._coerce_type(["a", "b"], "list") == ["a", "b"]
        assert mapper._coerce_type("a,b,c", "list") == ["a", "b", "c"]
        assert mapper._coerce_type("single", "list") == ["single"]
        assert mapper._coerce_type(123, "list") == [123]
    
    def test_coerce_type_none(self, mapper):
        """Test None value coercion."""
        assert mapper._coerce_type(None, "str") is None
        assert mapper._coerce_type(None, "int") is None
    
    # Record mapping tests
    
    def test_map_record_cpu(self, mapper):
        """Test mapping a CPU record."""
        record = {
            "objectID": "cpu-test-1",
            "component_type": "CPU",
            "brand": "AMD",
            "model": "Ryzen 7 9700X",
            "socket": "AM5",
            "tdp_watts": 65,
            "cores": 8,
            "threads": 16,
            "memory_type": ["DDR5"],
            "price_usd": 359,
            "performance_tier": "mid-range",
            "compatibility_tags": ["am5", "ddr5"],
        }
        
        mapped = mapper.map_record(record, "CPU")
        
        assert mapped is not None
        assert mapped["objectID"] == "cpu-test-1"
        assert mapped["socket"] == "AM5"
        assert mapped["tdp_watts"] == 65
    
    def test_map_record_gpu(self, mapper):
        """Test mapping a GPU record."""
        record = {
            "objectID": "gpu-test-1",
            "component_type": "GPU",
            "brand": "NVIDIA",
            "model": "RTX 4070",
            "length_mm": 280,
            "tdp_watts": 200,
            "vram_gb": 12,
            "price_usd": 599,
            "performance_tier": "high-end",
            "compatibility_tags": ["mid-tdp", "vram-12gb"],
        }
        
        mapped = mapper.map_record(record, "GPU")
        
        assert mapped is not None
        assert mapped["length_mm"] == 280
        assert mapped["vram_gb"] == 12
    
    def test_map_record_missing_required_field(self, mapper):
        """Test mapping record with missing required field returns None."""
        record = {
            "objectID": "cpu-test-1",
            "component_type": "CPU",
            # Missing required fields: brand, model, socket, etc.
        }
        
        mapped = mapper.map_record(record, "CPU")
        
        assert mapped is None
    
    def test_map_record_with_defaults(self, mapper):
        """Test that default values are applied."""
        record = {
            "objectID": "cpu-test-1",
            "component_type": "CPU",
            "brand": "AMD",
            "model": "Test CPU",
            "socket": "AM5",
            "tdp_watts": 65,
            "cores": 8,
            "threads": 16,
            "memory_type": ["DDR5"],
            "price_usd": 299,
            "performance_tier": "mid-range",
            "compatibility_tags": ["am5"],
            # integrated_graphics not specified, should default to False
        }
        
        mapped = mapper.map_record(record, "CPU")
        
        assert mapped is not None
        assert mapped.get("integrated_graphics") is False
    
    def test_map_record_unknown_component_type(self, mapper):
        """Test mapping unknown component type returns None."""
        record = {"objectID": "unknown-1"}
        
        mapped = mapper.map_record(record, "UnknownType")
        
        assert mapped is None
    
    # DataFrame mapping tests
    
    def test_map_dataframe(self, mapper, sample_cpu_df):
        """Test mapping a DataFrame."""
        df = sample_cpu_df.copy()
        result = mapper.map_dataframe(df)
        
        assert isinstance(result, pd.DataFrame)
        # May have fewer records if some are invalid
        assert len(result) <= len(df)
    
    def test_map_dataframe_empty(self, mapper):
        """Test mapping empty DataFrame."""
        df = pd.DataFrame()
        result = mapper.map_dataframe(df)
        
        assert isinstance(result, pd.DataFrame)
        assert result.empty
    
    def test_map_dataframe_no_component_type(self, mapper):
        """Test mapping DataFrame without component_type column."""
        df = pd.DataFrame([{"name": "Test"}])
        result = mapper.map_dataframe(df)
        
        assert result.empty
    
    # Validation tests
    
    def test_validate_record_valid(self, mapper):
        """Test validating a valid record."""
        record = {
            "objectID": "cpu-test-1",
            "component_type": "CPU",
            "brand": "AMD",
            "model": "Test CPU",
            "socket": "AM5",
            "tdp_watts": 65,
            "cores": 8,
            "threads": 16,
            "memory_type": ["DDR5"],
            "price_usd": 299,
            "performance_tier": "mid-range",
            "compatibility_tags": ["am5"],
        }
        
        errors = mapper.validate_record(record, "CPU")
        
        assert len(errors) == 0
    
    def test_validate_record_missing_fields(self, mapper):
        """Test validating a record with missing fields."""
        record = {
            "objectID": "cpu-test-1",
            "component_type": "CPU",
            # Missing many required fields
        }
        
        errors = mapper.validate_record(record, "CPU")
        
        assert len(errors) > 0
        assert any("brand" in error for error in errors)
    
    def test_validate_record_unknown_type(self, mapper):
        """Test validating unknown component type."""
        errors = mapper.validate_record({}, "Unknown")
        
        assert len(errors) == 1
        assert "Unknown component type" in errors[0]
    
    # Schema access tests
    
    def test_get_schema_cpu(self, mapper):
        """Test getting CPU schema."""
        schema = mapper.get_schema("CPU")
        
        assert schema is not None
        assert "objectID" in schema
        assert "socket" in schema
        assert "cores" in schema
    
    def test_get_schema_unknown(self, mapper):
        """Test getting schema for unknown type."""
        schema = mapper.get_schema("Unknown")
        
        assert schema is None
    
    def test_get_all_searchable_attributes(self, mapper):
        """Test getting searchable attributes."""
        attrs = mapper.get_all_searchable_attributes()
        
        assert isinstance(attrs, list)
        assert "model" in attrs
        assert "brand" in attrs
    
    def test_get_all_facet_attributes(self, mapper):
        """Test getting facet attributes."""
        attrs = mapper.get_all_facet_attributes()
        
        assert isinstance(attrs, list)
        assert "component_type" in attrs
        assert "socket" in attrs
    
    def test_get_numeric_attributes(self, mapper):
        """Test getting numeric attributes."""
        attrs = mapper.get_numeric_attributes()
        
        assert isinstance(attrs, list)
        assert "price_usd" in attrs
        assert "tdp_watts" in attrs
