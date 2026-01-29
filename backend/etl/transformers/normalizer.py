"""
Data Normalizer for Spec-Logic ETL Pipeline

Normalizes raw component data to consistent formats:
- Socket names (AM5, LGA1700, etc.)
- Memory types (DDR4, DDR5)
- TDP values
- Prices
- Performance tiers
"""

import re
import logging
from typing import Any, Optional, Dict, List, Union

import pandas as pd
import numpy as np

logger = logging.getLogger(__name__)


class DataNormalizer:
    """
    Normalizes component data to consistent formats for indexing.
    
    Handles variations in naming conventions and data formats
    from different sources.
    """
    
    # Socket name normalization mapping
    SOCKET_MAPPINGS = {
        # AMD sockets
        r"(?i)^am5$|socket\s*am5|amd\s*am5": "AM5",
        r"(?i)^am4$|socket\s*am4|amd\s*am4": "AM4",
        r"(?i)^str5$|socket\s*str5|strx4": "sTRX4",
        r"(?i)^sp5$|socket\s*sp5": "SP5",
        
        # Intel sockets
        r"(?i)lga\s*1700|lga1700|intel\s*1700": "LGA1700",
        r"(?i)lga\s*1851|lga1851|intel\s*1851": "LGA1851",
        r"(?i)lga\s*1200|lga1200|intel\s*1200": "LGA1200",
        r"(?i)lga\s*1151|lga1151": "LGA1151",
        r"(?i)lga\s*2066|lga2066": "LGA2066",
        r"(?i)lga\s*4677|lga4677": "LGA4677",
    }
    
    # Memory type normalization
    MEMORY_TYPE_MAPPINGS = {
        r"(?i)ddr5[-\s]*\d*": "DDR5",
        r"(?i)ddr4[-\s]*\d*": "DDR4",
        r"(?i)ddr3[-\s]*\d*": "DDR3",
        r"(?i)gddr6x": "GDDR6X",
        r"(?i)gddr6": "GDDR6",
        r"(?i)gddr5x": "GDDR5X",
        r"(?i)gddr5": "GDDR5",
        r"(?i)hbm3": "HBM3",
        r"(?i)hbm2e": "HBM2e",
        r"(?i)hbm2": "HBM2",
    }
    
    # Form factor normalization
    FORM_FACTOR_MAPPINGS = {
        r"(?i)^atx$|full\s*atx": "ATX",
        r"(?i)micro[-\s]*atx|matx|m-atx": "Micro-ATX",
        r"(?i)mini[-\s]*itx|itx": "Mini-ITX",
        r"(?i)e[-\s]*atx|extended\s*atx": "E-ATX",
        r"(?i)sfx[-\s]*l": "SFX-L",
        r"(?i)^sfx$": "SFX",
    }
    
    # Performance tier thresholds
    TIER_THRESHOLDS = {
        "CPU": {
            "budget": {"max_price": 150, "max_tdp": 65},
            "mid-range": {"max_price": 350, "max_tdp": 105},
            "high-end": {"max_price": 550, "max_tdp": 170},
            "enthusiast": {"max_price": float("inf"), "max_tdp": float("inf")},
        },
        "GPU": {
            "budget": {"max_price": 250, "max_tdp": 150},
            "mid-range": {"max_price": 500, "max_tdp": 250},
            "high-end": {"max_price": 900, "max_tdp": 350},
            "enthusiast": {"max_price": float("inf"), "max_tdp": float("inf")},
        },
        "Motherboard": {
            "budget": {"max_price": 150},
            "mid-range": {"max_price": 300},
            "high-end": {"max_price": 500},
            "enthusiast": {"max_price": float("inf")},
        },
    }
    
    def normalize_socket(self, value: Any) -> Optional[str]:
        """
        Normalize socket name to standard format.
        
        Args:
            value: Raw socket name string
            
        Returns:
            Normalized socket name or None if unrecognized
        """
        if pd.isna(value) or value is None:
            return None
            
        value_str = str(value).strip()
        
        for pattern, normalized in self.SOCKET_MAPPINGS.items():
            if re.search(pattern, value_str):
                return normalized
                
        # If no pattern matches, clean up and return as-is
        logger.debug(f"Unknown socket format: {value_str}")
        return value_str.upper().replace(" ", "")
    
    def normalize_memory_type(self, value: Any) -> Optional[str]:
        """
        Normalize memory type to standard format.
        
        Args:
            value: Raw memory type string (e.g., "DDR5-6000", "DDR4")
            
        Returns:
            Normalized memory type (e.g., "DDR5", "DDR4")
        """
        if pd.isna(value) or value is None:
            return None
            
        value_str = str(value).strip()
        
        for pattern, normalized in self.MEMORY_TYPE_MAPPINGS.items():
            if re.search(pattern, value_str):
                return normalized
                
        logger.debug(f"Unknown memory type: {value_str}")
        return value_str.upper()
    
    def normalize_form_factor(self, value: Any) -> Optional[str]:
        """
        Normalize form factor to standard format.
        
        Args:
            value: Raw form factor string
            
        Returns:
            Normalized form factor
        """
        if pd.isna(value) or value is None:
            return None
            
        value_str = str(value).strip()
        
        for pattern, normalized in self.FORM_FACTOR_MAPPINGS.items():
            if re.search(pattern, value_str):
                return normalized
                
        logger.debug(f"Unknown form factor: {value_str}")
        return value_str
    
    def normalize_tdp(self, value: Any) -> Optional[int]:
        """
        Normalize TDP value to integer watts.
        
        Args:
            value: Raw TDP value (e.g., "65W", 65, "65 Watts")
            
        Returns:
            TDP as integer or None if invalid
        """
        if pd.isna(value) or value is None:
            return None
            
        # If already numeric
        if isinstance(value, (int, float)):
            return int(value)
            
        # Parse from string
        value_str = str(value).strip()
        
        # Remove common suffixes
        match = re.search(r"(\d+(?:\.\d+)?)", value_str)
        if match:
            return int(float(match.group(1)))
            
        logger.debug(f"Could not parse TDP: {value_str}")
        return None
    
    def normalize_price(self, value: Any) -> Optional[float]:
        """
        Normalize price to float USD.
        
        Args:
            value: Raw price value (e.g., "$499.99", 499.99, "499 USD")
            
        Returns:
            Price as float or None if invalid
        """
        if pd.isna(value) or value is None:
            return None
            
        # If already numeric
        if isinstance(value, (int, float)):
            return float(value)
            
        # Parse from string
        value_str = str(value).strip()
        
        # Remove currency symbols and text
        value_str = re.sub(r"[^\d.]", "", value_str)
        
        try:
            return float(value_str)
        except ValueError:
            logger.debug(f"Could not parse price: {value}")
            return None
    
    def normalize_clock_speed(self, value: Any) -> Optional[float]:
        """
        Normalize clock speed to GHz.
        
        Args:
            value: Raw clock speed (e.g., "4.5 GHz", 4500, "4500 MHz")
            
        Returns:
            Clock speed in GHz or None if invalid
        """
        if pd.isna(value) or value is None:
            return None
            
        if isinstance(value, (int, float)):
            # Assume MHz if > 100, otherwise GHz
            if value > 100:
                return value / 1000
            return float(value)
            
        value_str = str(value).strip().lower()
        
        match = re.search(r"(\d+(?:\.\d+)?)\s*(ghz|mhz)?", value_str)
        if match:
            num = float(match.group(1))
            unit = match.group(2) or "ghz"
            
            if unit == "mhz":
                return num / 1000
            return num
            
        logger.debug(f"Could not parse clock speed: {value}")
        return None
    
    def derive_performance_tier(
        self,
        component_type: str,
        price: Optional[float] = None,
        tdp: Optional[int] = None
    ) -> str:
        """
        Derive performance tier based on price and TDP.
        
        Args:
            component_type: Type of component (CPU, GPU, etc.)
            price: Price in USD
            tdp: TDP in watts
            
        Returns:
            Performance tier string
        """
        thresholds = self.TIER_THRESHOLDS.get(component_type)
        if not thresholds:
            return "mid-range"  # Default for unknown component types
            
        for tier, limits in thresholds.items():
            price_ok = price is None or price <= limits.get("max_price", float("inf"))
            tdp_ok = tdp is None or tdp <= limits.get("max_tdp", float("inf"))
            
            if price_ok and tdp_ok:
                return tier
                
        return "enthusiast"
    
    def normalize_boolean(self, value: Any) -> bool:
        """
        Normalize various boolean representations.
        
        Args:
            value: Raw boolean value (True, "yes", 1, "true", etc.)
            
        Returns:
            Boolean value
        """
        if pd.isna(value) or value is None:
            return False
            
        if isinstance(value, bool):
            return value
            
        if isinstance(value, (int, float)):
            return bool(value)
            
        value_str = str(value).strip().lower()
        return value_str in ("true", "yes", "1", "y", "t")
    
    def generate_object_id(
        self,
        component_type: str,
        brand: str,
        model: str
    ) -> str:
        """
        Generate a unique object ID for Algolia.
        
        Args:
            component_type: Type of component
            brand: Brand name
            model: Model name
            
        Returns:
            Slug-formatted object ID
        """
        # Clean and slugify
        def slugify(text: str) -> str:
            text = str(text).lower().strip()
            text = re.sub(r"[^\w\s-]", "", text)
            text = re.sub(r"[-\s]+", "-", text)
            return text
            
        return f"{slugify(component_type)}-{slugify(brand)}-{slugify(model)}"
    
    def normalize_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply all normalizations to a DataFrame.
        
        Args:
            df: DataFrame with raw component data
            
        Returns:
            DataFrame with normalized data
        """
        df = df.copy()
        
        # Normalize socket if present
        if "socket" in df.columns:
            df["socket"] = df["socket"].apply(self.normalize_socket)
            
        # Normalize memory type if present
        if "memory_type" in df.columns:
            df["memory_type"] = df["memory_type"].apply(self.normalize_memory_type)
            
        # Normalize form factor if present
        if "form_factor" in df.columns:
            df["form_factor"] = df["form_factor"].apply(self.normalize_form_factor)
            
        # Normalize TDP columns
        for col in ["tdp", "tdp_watts", "max_tdp_watts"]:
            if col in df.columns:
                df[col] = df["tdp_watts" if col == "tdp" else col].apply(self.normalize_tdp)
                
        # Normalize price columns
        for col in ["price", "price_usd", "msrp"]:
            if col in df.columns:
                df[col] = df[col].apply(self.normalize_price)
                
        # Normalize clock speeds
        for col in ["base_clock", "boost_clock", "base_clock_ghz", "boost_clock_ghz"]:
            if col in df.columns:
                df[col] = df[col].apply(self.normalize_clock_speed)
                
        # Generate object IDs if not present
        has_model_or_name = "model" in df.columns or "name" in df.columns
        if "objectID" not in df.columns and "component_type" in df.columns and "brand" in df.columns and has_model_or_name:
            df["objectID"] = df.apply(
                lambda row: self.generate_object_id(
                    row["component_type"],
                    row.get("brand", "unknown"),
                    row.get("model", row.get("name", "unknown"))
                ),
                axis=1
            )
            
        # Ensure model column exists (alias from name if needed)
        if "model" not in df.columns and "name" in df.columns:
            df["model"] = df["name"]
            
        # Derive performance tier if not present
        if "performance_tier" not in df.columns:
            df["performance_tier"] = df.apply(
                lambda row: self.derive_performance_tier(
                    row.get("component_type", ""),
                    row.get("price_usd") or row.get("price"),
                    row.get("tdp_watts") or row.get("tdp")
                ),
                axis=1
            )
            
        logger.info(f"Normalized {len(df)} records")
        return df
