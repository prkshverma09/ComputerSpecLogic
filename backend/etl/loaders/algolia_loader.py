"""
Algolia Loader for Spec-Logic ETL Pipeline

Manages Algolia index creation, configuration, and data upload.
"""

import os
import logging
import time
import math
from typing import Any, Dict, List, Optional

from algoliasearch.search.client import SearchClientSync
from algoliasearch.search.models.index_settings import IndexSettings
from algoliasearch.search.models.rule import Rule, Consequence
from algoliasearch.search.models.consequence_params import ConsequenceParams

logger = logging.getLogger(__name__)


class AlgoliaLoader:
    """
    Manages Algolia index operations.
    
    Handles:
    - Index creation and configuration
    - Batch record uploads
    - Facet and ranking configuration
    - Query rules setup
    """
    
    DEFAULT_INDEX_NAME = "prod_components"
    BATCH_SIZE = 1000
    MAX_RETRIES = 3
    
    def __init__(
        self,
        app_id: Optional[str] = None,
        api_key: Optional[str] = None,
        index_name: Optional[str] = None
    ):
        """
        Initialize the Algolia loader.
        
        Args:
            app_id: Algolia application ID (defaults to env var)
            api_key: Algolia admin API key (defaults to env var)
            index_name: Name of the index to use
        """
        self.app_id = app_id or os.environ.get("ALGOLIA_APP_ID")
        self.api_key = api_key or os.environ.get("ALGOLIA_ADMIN_KEY")
        self.index_name = index_name or os.environ.get("ALGOLIA_INDEX_NAME", self.DEFAULT_INDEX_NAME)
        
        if not self.app_id or not self.api_key:
            raise ValueError(
                "Algolia credentials not found. Set ALGOLIA_APP_ID and ALGOLIA_ADMIN_KEY "
                "environment variables or pass them to the constructor."
            )
            
        self.client = SearchClientSync(self.app_id, self.api_key)
        logger.info(f"Initialized Algolia loader for index: {self.index_name}")
    
    def create_index(self, settings: Optional[Dict[str, Any]] = None) -> None:
        """
        Create or update index with settings.
        
        Args:
            settings: Index settings dictionary
        """
        if settings is None:
            settings = self._get_default_settings()
            
        logger.info(f"Configuring index '{self.index_name}' with settings")
        
        try:
            # Convert settings dict to IndexSettings model
            index_settings = IndexSettings(**settings)
            
            response = self.client.set_settings(
                index_name=self.index_name,
                index_settings=index_settings
            )
            
            # Wait for task to complete
            self.client.wait_for_task(
                index_name=self.index_name,
                task_id=response.task_id
            )
            
            logger.info(f"Index '{self.index_name}' configured successfully")
            
        except Exception as e:
            logger.error(f"Failed to configure index: {e}")
            raise
    
    def _get_default_settings(self) -> Dict[str, Any]:
        """Get default index settings."""
        return {
            "searchableAttributes": [
                "model",
                "brand",
                "component_type",
                "socket",
                "chipset",
            ],
            "attributesForFaceting": [
                "filterOnly(socket)",
                "filterOnly(form_factor)",
                "filterOnly(memory_type)",
                "searchable(component_type)",
                "searchable(brand)",
                "searchable(performance_tier)",
                "compatibility_tags",
                "price_usd",
                "tdp_watts",
                "wattage",
                "vram_gb",
                "cores",
            ],
            "customRanking": [
                "desc(performance_tier_score)",
                "asc(price_usd)",
            ],
            "ranking": [
                "typo",
                "geo",
                "words",
                "filters",
                "proximity",
                "attribute",
                "exact",
                "custom",
            ],
            "highlightPreTag": "<mark>",
            "highlightPostTag": "</mark>",
            "hitsPerPage": 20,
            "maxValuesPerFacet": 100,
        }
    
    def upload_records(
        self,
        records: List[Dict[str, Any]],
        clear_existing: bool = False
    ) -> Dict[str, Any]:
        """
        Upload records to Algolia index.
        
        Args:
            records: List of records to upload
            clear_existing: If True, clear index before uploading
            
        Returns:
            Upload statistics
        """
        if not records:
            logger.warning("No records to upload")
            return {"uploaded": 0, "errors": 0}
            
        logger.info(f"Uploading {len(records)} records to '{self.index_name}'")
        
        # Clear existing records if requested
        if clear_existing:
            self._clear_index()
            
        # Upload in batches
        total_uploaded = 0
        total_errors = 0
        
        for i in range(0, len(records), self.BATCH_SIZE):
            batch = records[i:i + self.BATCH_SIZE]
            batch_num = (i // self.BATCH_SIZE) + 1
            total_batches = (len(records) + self.BATCH_SIZE - 1) // self.BATCH_SIZE
            
            logger.info(f"Uploading batch {batch_num}/{total_batches} ({len(batch)} records)")
            
            try:
                response = self._upload_batch_with_retry(batch)
                total_uploaded += len(batch)
                
            except Exception as e:
                logger.error(f"Failed to upload batch {batch_num}: {e}")
                total_errors += len(batch)
                
        logger.info(f"Upload complete: {total_uploaded} uploaded, {total_errors} errors")
        
        return {
            "uploaded": total_uploaded,
            "errors": total_errors,
            "index": self.index_name,
        }
    
    def _sanitize_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """
        Sanitize a record for JSON serialization.
        
        Replaces NaN, Inf values with None (null in JSON).
        """
        sanitized = {}
        for key, value in record.items():
            if isinstance(value, float) and (math.isnan(value) or math.isinf(value)):
                sanitized[key] = None
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_record(value)
            elif isinstance(value, list):
                sanitized[key] = [
                    self._sanitize_record(v) if isinstance(v, dict)
                    else (None if isinstance(v, float) and (math.isnan(v) or math.isinf(v)) else v)
                    for v in value
                ]
            else:
                sanitized[key] = value
        return sanitized
    
    def _upload_batch_with_retry(self, batch: List[Dict[str, Any]]) -> Any:
        """Upload a batch with retry logic."""
        # Sanitize all records to handle NaN/Inf values
        batch = [self._sanitize_record(record) for record in batch]
        
        for attempt in range(self.MAX_RETRIES):
            try:
                response = self.client.save_objects(
                    index_name=self.index_name,
                    objects=batch
                )
                
                # Wait for indexing to complete
                for r in response:
                    self.client.wait_for_task(
                        index_name=self.index_name,
                        task_id=r.task_id
                    )
                    
                return response
                
            except Exception as e:
                if attempt < self.MAX_RETRIES - 1:
                    wait_time = 2 ** attempt
                    logger.warning(
                        f"Upload attempt {attempt + 1} failed: {e}. "
                        f"Retrying in {wait_time}s..."
                    )
                    time.sleep(wait_time)
                else:
                    raise
    
    def _clear_index(self) -> None:
        """Clear all records from the index."""
        logger.info(f"Clearing index '{self.index_name}'")
        
        try:
            response = self.client.clear_objects(index_name=self.index_name)
            self.client.wait_for_task(
                index_name=self.index_name,
                task_id=response.task_id
            )
            logger.info("Index cleared successfully")
            
        except Exception as e:
            logger.warning(f"Failed to clear index: {e}")
    
    def configure_facets(self, facets: List[str]) -> None:
        """
        Configure faceting attributes.
        
        Args:
            facets: List of facet attribute configurations
        """
        logger.info(f"Configuring {len(facets)} facet attributes")
        
        settings = IndexSettings(attributesForFaceting=facets)
        
        response = self.client.set_settings(
            index_name=self.index_name,
            index_settings=settings
        )
        
        self.client.wait_for_task(
            index_name=self.index_name,
            task_id=response.task_id
        )
        
        logger.info("Facets configured successfully")
    
    def configure_ranking(self, custom_ranking: List[str]) -> None:
        """
        Configure custom ranking rules.
        
        Args:
            custom_ranking: List of custom ranking attributes
        """
        logger.info(f"Configuring custom ranking: {custom_ranking}")
        
        settings = IndexSettings(customRanking=custom_ranking)
        
        response = self.client.set_settings(
            index_name=self.index_name,
            index_settings=settings
        )
        
        self.client.wait_for_task(
            index_name=self.index_name,
            task_id=response.task_id
        )
        
        logger.info("Ranking configured successfully")
    
    def get_index_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the index.
        
        Returns:
            Dictionary with index statistics
        """
        try:
            # Search with empty query to get stats
            response = self.client.search_single_index(
                index_name=self.index_name,
                search_params={"query": "", "hitsPerPage": 0}
            )
            
            return {
                "index_name": self.index_name,
                "nb_hits": response.nb_hits,
                "processing_time_ms": response.processing_time_ms,
            }
            
        except Exception as e:
            logger.error(f"Failed to get index stats: {e}")
            return {"error": str(e)}
    
    def search(
        self,
        query: str,
        filters: Optional[str] = None,
        facets: Optional[List[str]] = None,
        hits_per_page: int = 20
    ) -> Dict[str, Any]:
        """
        Perform a search query.
        
        Args:
            query: Search query string
            filters: Filter string
            facets: List of facets to retrieve
            hits_per_page: Number of results per page
            
        Returns:
            Search results
        """
        search_params = {
            "query": query,
            "hitsPerPage": hits_per_page,
        }
        
        if filters:
            search_params["filters"] = filters
        if facets:
            search_params["facets"] = facets
            
        response = self.client.search_single_index(
            index_name=self.index_name,
            search_params=search_params
        )
        
        return {
            "hits": [dict(hit) for hit in response.hits],
            "nb_hits": response.nb_hits,
            "facets": response.facets,
            "processing_time_ms": response.processing_time_ms,
        }
    
    def delete_index(self) -> None:
        """Delete the entire index."""
        logger.warning(f"Deleting index '{self.index_name}'")
        
        self.client.delete_index(index_name=self.index_name)
        logger.info("Index deleted successfully")
