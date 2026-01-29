"""
Data Loaders for Spec-Logic ETL Pipeline

This module contains loaders for uploading data to Algolia:
    - AlgoliaLoader: Manages Algolia index creation and data upload
"""

from .algolia_loader import AlgoliaLoader

__all__ = ["AlgoliaLoader"]
