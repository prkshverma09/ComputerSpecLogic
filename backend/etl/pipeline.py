"""
ETL Pipeline Orchestrator for Spec-Logic

Coordinates the entire Extract-Transform-Load process for PC component data.
"""

import logging
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Any, Optional

import pandas as pd

from .extractors import KaggleExtractor, TechPowerUpScraper
from .transformers import DataNormalizer, CompatibilityTagger, SchemaMapper
from .loaders import AlgoliaLoader

logger = logging.getLogger(__name__)


@dataclass
class PipelineStats:
    """Statistics from pipeline execution."""
    start_time: float = 0.0
    end_time: float = 0.0
    
    extracted_records: Dict[str, int] = field(default_factory=dict)
    normalized_records: int = 0
    tagged_records: int = 0
    mapped_records: int = 0
    uploaded_records: int = 0
    failed_records: int = 0
    
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    
    @property
    def duration_seconds(self) -> float:
        return self.end_time - self.start_time
    
    @property
    def total_extracted(self) -> int:
        return sum(self.extracted_records.values())
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "duration_seconds": round(self.duration_seconds, 2),
            "extracted": self.extracted_records,
            "total_extracted": self.total_extracted,
            "normalized": self.normalized_records,
            "tagged": self.tagged_records,
            "mapped": self.mapped_records,
            "uploaded": self.uploaded_records,
            "failed": self.failed_records,
            "errors": self.errors,
            "warnings": self.warnings,
        }


class ETLPipeline:
    """
    Orchestrates the ETL pipeline for PC component data.
    
    Pipeline stages:
    1. Extract: Load data from CSV files and scrape additional specs
    2. Transform: Normalize, tag, and map data to schema
    3. Load: Upload to Algolia index
    """
    
    def __init__(
        self,
        data_dir: str = "data",
        cache_dir: str = "data/cache",
        algolia_app_id: Optional[str] = None,
        algolia_api_key: Optional[str] = None,
        index_name: Optional[str] = None,
    ):
        """
        Initialize the ETL pipeline.
        
        Args:
            data_dir: Base directory for data files
            cache_dir: Directory for caching scraped data
            algolia_app_id: Algolia application ID
            algolia_api_key: Algolia admin API key
            index_name: Name of the Algolia index
        """
        self.data_dir = Path(data_dir)
        self.raw_dir = self.data_dir / "raw"
        self.processed_dir = self.data_dir / "processed"
        
        # Ensure directories exist
        self.raw_dir.mkdir(parents=True, exist_ok=True)
        self.processed_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize components
        self.extractor = KaggleExtractor(str(self.raw_dir))
        self.scraper = TechPowerUpScraper(cache_dir)
        self.normalizer = DataNormalizer()
        self.tagger = CompatibilityTagger()
        self.mapper = SchemaMapper()
        
        # Algolia loader (initialized lazily)
        self._algolia_app_id = algolia_app_id
        self._algolia_api_key = algolia_api_key
        self._index_name = index_name
        self._loader: Optional[AlgoliaLoader] = None
        
        self.stats = PipelineStats()
    
    @property
    def loader(self) -> AlgoliaLoader:
        """Lazily initialize Algolia loader."""
        if self._loader is None:
            self._loader = AlgoliaLoader(
                app_id=self._algolia_app_id,
                api_key=self._algolia_api_key,
                index_name=self._index_name,
            )
        return self._loader
    
    def run(
        self,
        components: Optional[List[str]] = None,
        clear_index: bool = False,
        skip_scraping: bool = True,
        dry_run: bool = False,
    ) -> PipelineStats:
        """
        Run the complete ETL pipeline.
        
        Args:
            components: List of component types to process (None = all)
            clear_index: If True, clear existing index data
            skip_scraping: If True, skip web scraping step
            dry_run: If True, don't upload to Algolia
            
        Returns:
            Pipeline execution statistics
        """
        self.stats = PipelineStats()
        self.stats.start_time = time.time()
        
        logger.info("Starting ETL pipeline")
        
        try:
            # Stage 1: Extract
            logger.info("=== Stage 1: Extraction ===")
            raw_data = self._extract(components, skip_scraping)
            
            # Stage 2: Transform
            logger.info("=== Stage 2: Transformation ===")
            processed_data = self._transform(raw_data)
            
            # Stage 3: Load
            logger.info("=== Stage 3: Loading ===")
            if not dry_run:
                self._load(processed_data, clear_index)
            else:
                logger.info("Dry run - skipping upload")
                self.stats.uploaded_records = self.stats.mapped_records
                
        except Exception as e:
            logger.error(f"Pipeline failed: {e}")
            self.stats.errors.append(str(e))
            raise
            
        finally:
            self.stats.end_time = time.time()
            
        self._log_summary()
        return self.stats
    
    def _extract(
        self,
        components: Optional[List[str]],
        skip_scraping: bool
    ) -> Dict[str, pd.DataFrame]:
        """Extract data from all sources."""
        all_components = ["CPU", "GPU", "Motherboard", "RAM", "PSU", "Case", "Cooler"]
        target_components = components or all_components
        
        data = {}
        
        # Extract from CSV files
        logger.info("Extracting from CSV files...")
        csv_data = self.extractor.extract_all()
        
        for comp_type, df in csv_data.items():
            if comp_type in target_components and not df.empty:
                data[comp_type] = df
                self.stats.extracted_records[comp_type] = len(df)
                logger.info(f"  Extracted {len(df)} {comp_type} records from CSV")
                
        # Optionally scrape additional GPU specs
        if not skip_scraping and "GPU" in target_components:
            logger.info("Scraping additional GPU specs from TechPowerUp...")
            try:
                scraped_gpus = self.scraper.scrape_gpu_list(limit=20)
                if scraped_gpus:
                    scraped_df = pd.DataFrame(scraped_gpus)
                    scraped_df["component_type"] = "GPU"
                    
                    # Merge with existing GPU data or use as primary
                    if "GPU" in data:
                        # Could implement merge logic here
                        pass
                    else:
                        data["GPU"] = scraped_df
                        self.stats.extracted_records["GPU_scraped"] = len(scraped_df)
                        
            except Exception as e:
                logger.warning(f"Scraping failed: {e}")
                self.stats.warnings.append(f"GPU scraping failed: {e}")
                
        return data
    
    def _transform(self, raw_data: Dict[str, pd.DataFrame]) -> List[Dict[str, Any]]:
        """Transform and normalize all data."""
        all_records = []
        
        for comp_type, df in raw_data.items():
            if df.empty:
                continue
                
            logger.info(f"Transforming {comp_type} data...")
            
            # Step 1: Normalize
            normalized_df = self.normalizer.normalize_dataframe(df)
            self.stats.normalized_records += len(normalized_df)
            
            # Step 2: Add compatibility tags
            tagged_df = self.tagger.tag_dataframe(normalized_df)
            self.stats.tagged_records += len(tagged_df)
            
            # Step 3: Map to schema
            mapped_df = self.mapper.map_dataframe(tagged_df)
            self.stats.mapped_records += len(mapped_df)
            
            if mapped_df.empty:
                self.stats.warnings.append(f"No valid {comp_type} records after mapping")
                continue
                
            # Convert to records
            records = mapped_df.to_dict(orient="records")
            all_records.extend(records)
            
            # Save processed data
            output_path = self.processed_dir / f"{comp_type.lower()}_processed.json"
            mapped_df.to_json(output_path, orient="records", indent=2)
            logger.info(f"  Saved {len(records)} {comp_type} records to {output_path}")
            
        logger.info(f"Total records after transformation: {len(all_records)}")
        return all_records
    
    def _load(self, records: List[Dict[str, Any]], clear_index: bool) -> None:
        """Load records to Algolia."""
        if not records:
            logger.warning("No records to upload")
            return
            
        # Create/configure index
        logger.info("Configuring Algolia index...")
        self.loader.create_index()
        
        # Upload records
        logger.info(f"Uploading {len(records)} records to Algolia...")
        result = self.loader.upload_records(records, clear_existing=clear_index)
        
        self.stats.uploaded_records = result["uploaded"]
        self.stats.failed_records = result["errors"]
        
        if result["errors"] > 0:
            self.stats.warnings.append(f"{result['errors']} records failed to upload")
    
    def _log_summary(self) -> None:
        """Log pipeline execution summary."""
        stats = self.stats
        
        logger.info("=" * 50)
        logger.info("PIPELINE EXECUTION SUMMARY")
        logger.info("=" * 50)
        logger.info(f"Duration: {stats.duration_seconds:.2f} seconds")
        logger.info(f"Extracted: {stats.total_extracted} records")
        for comp_type, count in stats.extracted_records.items():
            logger.info(f"  - {comp_type}: {count}")
        logger.info(f"Normalized: {stats.normalized_records}")
        logger.info(f"Tagged: {stats.tagged_records}")
        logger.info(f"Mapped: {stats.mapped_records}")
        logger.info(f"Uploaded: {stats.uploaded_records}")
        logger.info(f"Failed: {stats.failed_records}")
        
        if stats.warnings:
            logger.warning(f"Warnings ({len(stats.warnings)}):")
            for warning in stats.warnings:
                logger.warning(f"  - {warning}")
                
        if stats.errors:
            logger.error(f"Errors ({len(stats.errors)}):")
            for error in stats.errors:
                logger.error(f"  - {error}")
                
        logger.info("=" * 50)
    
    def validate_data(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Validate processed records before upload.
        
        Args:
            records: List of processed records
            
        Returns:
            Validation report
        """
        report = {
            "total": len(records),
            "valid": 0,
            "invalid": 0,
            "by_type": {},
            "issues": [],
        }
        
        for record in records:
            comp_type = record.get("component_type")
            
            if comp_type not in report["by_type"]:
                report["by_type"][comp_type] = {"valid": 0, "invalid": 0}
                
            errors = self.mapper.validate_record(record, comp_type)
            
            if errors:
                report["invalid"] += 1
                report["by_type"][comp_type]["invalid"] += 1
                report["issues"].append({
                    "objectID": record.get("objectID"),
                    "errors": errors,
                })
            else:
                report["valid"] += 1
                report["by_type"][comp_type]["valid"] += 1
                
        return report
