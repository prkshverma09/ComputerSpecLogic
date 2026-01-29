"""
Data Extractors for Spec-Logic ETL Pipeline

This module contains extractors for various data sources:
    - KaggleExtractor: Extracts CPU/GPU data from Kaggle datasets
    - TechPowerUpScraper: Scrapes detailed GPU specs from TechPowerUp
"""

from .kaggle_extractor import KaggleExtractor
from .techpowerup_scraper import TechPowerUpScraper

__all__ = ["KaggleExtractor", "TechPowerUpScraper"]
