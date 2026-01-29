"""
Kaggle Dataset Extractor for Spec-Logic ETL Pipeline

Extracts CPU and GPU data from Kaggle CSV datasets.
"""

import os
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any

import pandas as pd

logger = logging.getLogger(__name__)


class KaggleExtractor:
    """
    Extracts component data from Kaggle CSV datasets.
    
    Handles CPU and GPU datasets with schema validation and
    basic data cleaning.
    """
    
    # Required columns for each component type
    REQUIRED_CPU_COLUMNS = [
        "name", "brand", "cores", "threads"
    ]
    
    REQUIRED_GPU_COLUMNS = [
        "name", "brand", "vram"
    ]
    
    def __init__(self, data_dir: str = "data/raw"):
        """
        Initialize the Kaggle extractor.
        
        Args:
            data_dir: Directory containing raw CSV files
        """
        self.data_dir = Path(data_dir)
        
    def extract_cpus(self, filepath: Optional[str] = None) -> pd.DataFrame:
        """
        Extract CPU data from CSV file.
        
        Args:
            filepath: Path to CPU CSV file. If None, uses default location.
            
        Returns:
            DataFrame with CPU data
            
        Raises:
            FileNotFoundError: If CSV file doesn't exist
            ValueError: If required columns are missing
        """
        if filepath is None:
            filepath = self.data_dir / "cpus.csv"
        else:
            filepath = Path(filepath)
            
        logger.info(f"Extracting CPU data from {filepath}")
        
        if not filepath.exists():
            raise FileNotFoundError(f"CPU data file not found: {filepath}")
            
        df = pd.read_csv(filepath)
        
        # Validate schema
        if not self.validate_schema(df, self.REQUIRED_CPU_COLUMNS):
            missing = set(self.REQUIRED_CPU_COLUMNS) - set(df.columns)
            raise ValueError(f"Missing required CPU columns: {missing}")
            
        # Add component type
        df["component_type"] = "CPU"
        
        logger.info(f"Extracted {len(df)} CPU records")
        return df
    
    def extract_gpus(self, filepath: Optional[str] = None) -> pd.DataFrame:
        """
        Extract GPU data from CSV file.
        
        Args:
            filepath: Path to GPU CSV file. If None, uses default location.
            
        Returns:
            DataFrame with GPU data
            
        Raises:
            FileNotFoundError: If CSV file doesn't exist
            ValueError: If required columns are missing
        """
        if filepath is None:
            filepath = self.data_dir / "gpus.csv"
        else:
            filepath = Path(filepath)
            
        logger.info(f"Extracting GPU data from {filepath}")
        
        if not filepath.exists():
            raise FileNotFoundError(f"GPU data file not found: {filepath}")
            
        df = pd.read_csv(filepath)
        
        # Validate schema
        if not self.validate_schema(df, self.REQUIRED_GPU_COLUMNS):
            missing = set(self.REQUIRED_GPU_COLUMNS) - set(df.columns)
            raise ValueError(f"Missing required GPU columns: {missing}")
            
        # Add component type
        df["component_type"] = "GPU"
        
        logger.info(f"Extracted {len(df)} GPU records")
        return df
    
    def extract_motherboards(self, filepath: Optional[str] = None) -> pd.DataFrame:
        """
        Extract motherboard data from CSV file.
        
        Args:
            filepath: Path to motherboard CSV file.
            
        Returns:
            DataFrame with motherboard data
        """
        if filepath is None:
            filepath = self.data_dir / "motherboards.csv"
        else:
            filepath = Path(filepath)
            
        logger.info(f"Extracting motherboard data from {filepath}")
        
        if not filepath.exists():
            logger.warning(f"Motherboard data file not found: {filepath}")
            return pd.DataFrame()
            
        df = pd.read_csv(filepath)
        df["component_type"] = "Motherboard"
        
        logger.info(f"Extracted {len(df)} motherboard records")
        return df
    
    def extract_ram(self, filepath: Optional[str] = None) -> pd.DataFrame:
        """
        Extract RAM data from CSV file.
        
        Args:
            filepath: Path to RAM CSV file.
            
        Returns:
            DataFrame with RAM data
        """
        if filepath is None:
            filepath = self.data_dir / "ram.csv"
        else:
            filepath = Path(filepath)
            
        logger.info(f"Extracting RAM data from {filepath}")
        
        if not filepath.exists():
            logger.warning(f"RAM data file not found: {filepath}")
            return pd.DataFrame()
            
        df = pd.read_csv(filepath)
        df["component_type"] = "RAM"
        
        logger.info(f"Extracted {len(df)} RAM records")
        return df
    
    def extract_psus(self, filepath: Optional[str] = None) -> pd.DataFrame:
        """
        Extract PSU data from CSV file.
        
        Args:
            filepath: Path to PSU CSV file.
            
        Returns:
            DataFrame with PSU data
        """
        if filepath is None:
            filepath = self.data_dir / "psus.csv"
        else:
            filepath = Path(filepath)
            
        logger.info(f"Extracting PSU data from {filepath}")
        
        if not filepath.exists():
            logger.warning(f"PSU data file not found: {filepath}")
            return pd.DataFrame()
            
        df = pd.read_csv(filepath)
        df["component_type"] = "PSU"
        
        logger.info(f"Extracted {len(df)} PSU records")
        return df
    
    def extract_cases(self, filepath: Optional[str] = None) -> pd.DataFrame:
        """
        Extract case data from CSV file.
        
        Args:
            filepath: Path to case CSV file.
            
        Returns:
            DataFrame with case data
        """
        if filepath is None:
            filepath = self.data_dir / "cases.csv"
        else:
            filepath = Path(filepath)
            
        logger.info(f"Extracting case data from {filepath}")
        
        if not filepath.exists():
            logger.warning(f"Case data file not found: {filepath}")
            return pd.DataFrame()
            
        df = pd.read_csv(filepath)
        df["component_type"] = "Case"
        
        logger.info(f"Extracted {len(df)} case records")
        return df
    
    def extract_coolers(self, filepath: Optional[str] = None) -> pd.DataFrame:
        """
        Extract cooler data from CSV file.
        
        Args:
            filepath: Path to cooler CSV file.
            
        Returns:
            DataFrame with cooler data
        """
        if filepath is None:
            filepath = self.data_dir / "coolers.csv"
        else:
            filepath = Path(filepath)
            
        logger.info(f"Extracting cooler data from {filepath}")
        
        if not filepath.exists():
            logger.warning(f"Cooler data file not found: {filepath}")
            return pd.DataFrame()
            
        df = pd.read_csv(filepath)
        df["component_type"] = "Cooler"
        
        logger.info(f"Extracted {len(df)} cooler records")
        return df
    
    def extract_all(self) -> Dict[str, pd.DataFrame]:
        """
        Extract data from all available CSV files.
        
        Returns:
            Dictionary mapping component types to DataFrames
        """
        logger.info("Extracting all component data")
        
        data = {}
        
        # Extract each component type, handling missing files gracefully
        try:
            data["CPU"] = self.extract_cpus()
        except FileNotFoundError as e:
            logger.warning(f"Skipping CPUs: {e}")
            data["CPU"] = pd.DataFrame()
            
        try:
            data["GPU"] = self.extract_gpus()
        except FileNotFoundError as e:
            logger.warning(f"Skipping GPUs: {e}")
            data["GPU"] = pd.DataFrame()
            
        data["Motherboard"] = self.extract_motherboards()
        data["RAM"] = self.extract_ram()
        data["PSU"] = self.extract_psus()
        data["Case"] = self.extract_cases()
        data["Cooler"] = self.extract_coolers()
        
        total_records = sum(len(df) for df in data.values())
        logger.info(f"Extracted {total_records} total records across {len(data)} component types")
        
        return data
    
    @staticmethod
    def validate_schema(df: pd.DataFrame, required_columns: List[str]) -> bool:
        """
        Validate that DataFrame contains required columns.
        
        Args:
            df: DataFrame to validate
            required_columns: List of required column names
            
        Returns:
            True if all required columns present, False otherwise
        """
        return all(col in df.columns for col in required_columns)
