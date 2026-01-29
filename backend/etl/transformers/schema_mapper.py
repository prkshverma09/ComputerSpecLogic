"""
Schema Mapper for Spec-Logic ETL Pipeline

Maps raw component data to the Algolia index schema.
Ensures all records conform to the expected structure.
"""

import logging
from typing import Any, Dict, List, Optional

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class SchemaMapper:
    """
    Maps component data to Algolia index schema.
    
    Handles field mapping, type coercion, and default values
    to ensure consistent record structure.
    """
    
    # Algolia index schema definitions
    CPU_SCHEMA = {
        "objectID": {"type": "str", "required": True},
        "component_type": {"type": "str", "required": True, "default": "CPU"},
        "brand": {"type": "str", "required": True},
        "model": {"type": "str", "required": True},
        "socket": {"type": "str", "required": True},
        "tdp_watts": {"type": "int", "required": True},
        "max_tdp_watts": {"type": "int", "required": False},
        "cores": {"type": "int", "required": True},
        "threads": {"type": "int", "required": True},
        "base_clock_ghz": {"type": "float", "required": False},
        "boost_clock_ghz": {"type": "float", "required": False},
        "memory_type": {"type": "list", "required": True},
        "pcie_version": {"type": "str", "required": False},
        "integrated_graphics": {"type": "bool", "required": False, "default": False},
        "price_usd": {"type": "float", "required": True},
        "release_date": {"type": "str", "required": False},
        "performance_tier": {"type": "str", "required": True},
        "image_url": {"type": "str", "required": False},
        "compatibility_tags": {"type": "list", "required": True},
    }
    
    GPU_SCHEMA = {
        "objectID": {"type": "str", "required": True},
        "component_type": {"type": "str", "required": True, "default": "GPU"},
        "brand": {"type": "str", "required": True},
        "model": {"type": "str", "required": True},
        "length_mm": {"type": "int", "required": True},
        "tdp_watts": {"type": "int", "required": True},
        "vram_gb": {"type": "int", "required": True},
        "memory_type": {"type": "str", "required": False},
        "memory_bandwidth_gbps": {"type": "float", "required": False},
        "pcie_version": {"type": "str", "required": False},
        "power_connectors": {"type": "str", "required": False},
        "recommended_psu_watts": {"type": "int", "required": False},
        "price_usd": {"type": "float", "required": True},
        "release_date": {"type": "str", "required": False},
        "performance_tier": {"type": "str", "required": True},
        "image_url": {"type": "str", "required": False},
        "compatibility_tags": {"type": "list", "required": True},
    }
    
    MOTHERBOARD_SCHEMA = {
        "objectID": {"type": "str", "required": True},
        "component_type": {"type": "str", "required": True, "default": "Motherboard"},
        "brand": {"type": "str", "required": True},
        "model": {"type": "str", "required": True},
        "socket": {"type": "str", "required": True},
        "chipset": {"type": "str", "required": False},
        "form_factor": {"type": "str", "required": True},
        "memory_type": {"type": "list", "required": True},
        "memory_slots": {"type": "int", "required": False, "default": 4},
        "max_memory_gb": {"type": "int", "required": False, "default": 128},
        "m2_slots": {"type": "int", "required": False, "default": 1},
        "wifi": {"type": "bool", "required": False, "default": False},
        "price_usd": {"type": "float", "required": True},
        "performance_tier": {"type": "str", "required": True},
        "image_url": {"type": "str", "required": False},
        "compatibility_tags": {"type": "list", "required": True},
    }
    
    RAM_SCHEMA = {
        "objectID": {"type": "str", "required": True},
        "component_type": {"type": "str", "required": True, "default": "RAM"},
        "brand": {"type": "str", "required": True},
        "model": {"type": "str", "required": True},
        "memory_type": {"type": "str", "required": True},
        "speed_mhz": {"type": "int", "required": True},
        "capacity_gb": {"type": "int", "required": True},
        "modules": {"type": "int", "required": False, "default": 2},
        "cas_latency": {"type": "int", "required": False},
        "voltage": {"type": "float", "required": False},
        "rgb": {"type": "bool", "required": False, "default": False},
        "price_usd": {"type": "float", "required": True},
        "performance_tier": {"type": "str", "required": True},
        "image_url": {"type": "str", "required": False},
        "compatibility_tags": {"type": "list", "required": True},
    }
    
    PSU_SCHEMA = {
        "objectID": {"type": "str", "required": True},
        "component_type": {"type": "str", "required": True, "default": "PSU"},
        "brand": {"type": "str", "required": True},
        "model": {"type": "str", "required": True},
        "wattage": {"type": "int", "required": True},
        "efficiency_rating": {"type": "str", "required": False},
        "modular": {"type": "str", "required": False},
        "form_factor": {"type": "str", "required": False, "default": "ATX"},
        "price_usd": {"type": "float", "required": True},
        "performance_tier": {"type": "str", "required": True},
        "image_url": {"type": "str", "required": False},
        "compatibility_tags": {"type": "list", "required": True},
    }
    
    CASE_SCHEMA = {
        "objectID": {"type": "str", "required": True},
        "component_type": {"type": "str", "required": True, "default": "Case"},
        "brand": {"type": "str", "required": True},
        "model": {"type": "str", "required": True},
        "form_factor_support": {"type": "list", "required": True},
        "max_gpu_length_mm": {"type": "int", "required": True},
        "max_cooler_height_mm": {"type": "int", "required": True},
        "max_psu_length_mm": {"type": "int", "required": False},
        "drive_bays_35": {"type": "int", "required": False, "default": 2},
        "drive_bays_25": {"type": "int", "required": False, "default": 2},
        "radiator_support": {"type": "list", "required": False},
        "price_usd": {"type": "float", "required": True},
        "performance_tier": {"type": "str", "required": True},
        "image_url": {"type": "str", "required": False},
        "compatibility_tags": {"type": "list", "required": True},
    }
    
    COOLER_SCHEMA = {
        "objectID": {"type": "str", "required": True},
        "component_type": {"type": "str", "required": True, "default": "Cooler"},
        "brand": {"type": "str", "required": True},
        "model": {"type": "str", "required": True},
        "cooler_type": {"type": "str", "required": True},
        "socket_support": {"type": "list", "required": True},
        "height_mm": {"type": "int", "required": True},
        "radiator_size_mm": {"type": "int", "required": False},
        "tdp_rating": {"type": "int", "required": False},
        "rgb": {"type": "bool", "required": False, "default": False},
        "price_usd": {"type": "float", "required": True},
        "performance_tier": {"type": "str", "required": True},
        "image_url": {"type": "str", "required": False},
        "compatibility_tags": {"type": "list", "required": True},
    }
    
    SCHEMAS = {
        "CPU": CPU_SCHEMA,
        "GPU": GPU_SCHEMA,
        "Motherboard": MOTHERBOARD_SCHEMA,
        "RAM": RAM_SCHEMA,
        "PSU": PSU_SCHEMA,
        "Case": CASE_SCHEMA,
        "Cooler": COOLER_SCHEMA,
    }
    
    # Field name mappings from common variations
    FIELD_MAPPINGS = {
        "name": "model",
        "tdp": "tdp_watts",
        "price": "price_usd",
        "msrp": "price_usd",
        "vram": "vram_gb",
        "memory_size": "vram_gb",
        "base_clock": "base_clock_ghz",
        "boost_clock": "boost_clock_ghz",
        "length": "length_mm",
        "height": "height_mm",
        "type": "cooler_type",
    }
    
    def map_record(self, record: Dict[str, Any], component_type: str) -> Optional[Dict[str, Any]]:
        """
        Map a single record to the Algolia schema.
        
        Args:
            record: Raw component data
            component_type: Type of component
            
        Returns:
            Mapped record or None if validation fails
        """
        schema = self.SCHEMAS.get(component_type)
        if not schema:
            logger.warning(f"Unknown component type: {component_type}")
            return None
            
        mapped = {}
        
        # Apply field name mappings
        record = self._apply_field_mappings(record)
        
        # Map each field according to schema
        for field_name, field_spec in schema.items():
            value = record.get(field_name)
            
            # Apply default if value is missing
            if value is None or (isinstance(value, float) and np.isnan(value)):
                if "default" in field_spec:
                    value = field_spec["default"]
                elif field_spec["required"]:
                    logger.warning(f"Missing required field '{field_name}' for {component_type}")
                    return None
                else:
                    continue
                    
            # Type coercion
            try:
                value = self._coerce_type(value, field_spec["type"])
            except (ValueError, TypeError) as e:
                logger.warning(f"Type coercion failed for '{field_name}': {e}")
                if field_spec["required"]:
                    return None
                continue
                
            mapped[field_name] = value
            
        return mapped
    
    def _apply_field_mappings(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Apply field name mappings to standardize field names."""
        mapped = {}
        for key, value in record.items():
            # Use mapping if available, otherwise keep original
            mapped_key = self.FIELD_MAPPINGS.get(key, key)
            # Don't overwrite if target field already exists
            if mapped_key not in mapped or mapped.get(mapped_key) is None:
                mapped[mapped_key] = value
        return mapped
    
    def _coerce_type(self, value: Any, target_type: str) -> Any:
        """
        Coerce value to target type.
        
        Args:
            value: Value to coerce
            target_type: Target type string
            
        Returns:
            Coerced value
        """
        if value is None:
            return None
            
        if target_type == "str":
            return str(value)
            
        elif target_type == "int":
            if isinstance(value, str):
                # Handle strings like "65W" or "16GB"
                import re
                match = re.search(r"(\d+)", value)
                if match:
                    return int(match.group(1))
            return int(float(value))
            
        elif target_type == "float":
            if isinstance(value, str):
                import re
                match = re.search(r"(\d+\.?\d*)", value)
                if match:
                    return float(match.group(1))
            return float(value)
            
        elif target_type == "bool":
            if isinstance(value, bool):
                return value
            if isinstance(value, str):
                return value.lower() in ("true", "yes", "1", "y")
            return bool(value)
            
        elif target_type == "list":
            if isinstance(value, list):
                return value
            if isinstance(value, str):
                # Handle comma-separated strings
                if "," in value:
                    return [v.strip() for v in value.split(",")]
                return [value]
            return [value]
            
        return value
    
    def map_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Map all records in DataFrame to Algolia schema.
        
        Args:
            df: DataFrame with component data
            
        Returns:
            DataFrame with mapped records
        """
        if df.empty:
            return df
            
        # Determine component type
        component_type = df["component_type"].iloc[0] if "component_type" in df.columns else None
        if not component_type:
            logger.error("Cannot map DataFrame: no component_type column")
            return pd.DataFrame()
            
        # Map each record
        mapped_records = []
        for _, row in df.iterrows():
            mapped = self.map_record(row.to_dict(), component_type)
            if mapped:
                mapped_records.append(mapped)
            else:
                logger.debug(f"Skipping invalid record: {row.get('model', 'unknown')}")
                
        logger.info(f"Mapped {len(mapped_records)}/{len(df)} {component_type} records")
        return pd.DataFrame(mapped_records)
    
    def validate_record(self, record: Dict[str, Any], component_type: str) -> List[str]:
        """
        Validate a record against the schema.
        
        Args:
            record: Record to validate
            component_type: Type of component
            
        Returns:
            List of validation error messages (empty if valid)
        """
        errors = []
        schema = self.SCHEMAS.get(component_type)
        
        if not schema:
            return [f"Unknown component type: {component_type}"]
            
        for field_name, field_spec in schema.items():
            value = record.get(field_name)
            
            if field_spec["required"] and (value is None or value == ""):
                errors.append(f"Missing required field: {field_name}")
                
        return errors
    
    def get_schema(self, component_type: str) -> Optional[Dict]:
        """Get schema for a component type."""
        return self.SCHEMAS.get(component_type)
    
    def get_all_searchable_attributes(self) -> List[str]:
        """Get list of all searchable attributes across all schemas."""
        return ["model", "brand", "component_type"]
    
    def get_all_facet_attributes(self) -> List[str]:
        """Get list of all attributes that should be faceted."""
        return [
            "component_type",
            "socket",
            "form_factor",
            "memory_type",
            "performance_tier",
            "compatibility_tags",
        ]
    
    def get_numeric_attributes(self) -> List[str]:
        """Get list of numeric attributes for filtering."""
        return [
            "price_usd",
            "tdp_watts",
            "wattage",
            "vram_gb",
            "cores",
            "threads",
            "speed_mhz",
            "capacity_gb",
            "length_mm",
            "height_mm",
            "max_gpu_length_mm",
            "max_cooler_height_mm",
        ]
