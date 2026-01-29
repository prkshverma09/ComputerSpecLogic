#!/usr/bin/env python3
"""
ETL Pipeline Runner for Spec-Logic

Command-line interface for running the ETL pipeline.
"""

import os
import sys
import argparse
import logging
import json

from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from etl.pipeline import ETLPipeline


def setup_logging(verbose: bool = False) -> None:
    """Configure logging."""
    level = logging.DEBUG if verbose else logging.INFO
    
    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("pipeline.log"),
        ]
    )


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Run the Spec-Logic ETL pipeline"
    )
    
    parser.add_argument(
        "--components",
        nargs="+",
        choices=["CPU", "GPU", "Motherboard", "RAM", "PSU", "Case", "Cooler"],
        help="Specific component types to process (default: all)"
    )
    
    parser.add_argument(
        "--clear-index",
        action="store_true",
        help="Clear existing index before uploading"
    )
    
    parser.add_argument(
        "--scrape",
        action="store_true",
        help="Enable web scraping for additional GPU specs"
    )
    
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Run pipeline without uploading to Algolia"
    )
    
    parser.add_argument(
        "--data-dir",
        default="data",
        help="Base directory for data files (default: data)"
    )
    
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging"
    )
    
    parser.add_argument(
        "--output-stats",
        help="Path to save statistics JSON"
    )
    
    return parser.parse_args()


def main() -> int:
    """Main entry point."""
    # Load environment variables
    load_dotenv()
    
    # Parse arguments
    args = parse_args()
    
    # Setup logging
    setup_logging(args.verbose)
    
    logger = logging.getLogger(__name__)
    
    # Validate Algolia credentials (unless dry run)
    if not args.dry_run:
        if not os.environ.get("ALGOLIA_APP_ID"):
            logger.error("ALGOLIA_APP_ID environment variable not set")
            return 1
        if not os.environ.get("ALGOLIA_ADMIN_KEY"):
            logger.error("ALGOLIA_ADMIN_KEY environment variable not set")
            return 1
    
    try:
        # Initialize pipeline
        pipeline = ETLPipeline(
            data_dir=args.data_dir,
            cache_dir=os.path.join(args.data_dir, "cache"),
        )
        
        # Run pipeline
        logger.info("=" * 60)
        logger.info("SPEC-LOGIC ETL PIPELINE")
        logger.info("=" * 60)
        
        stats = pipeline.run(
            components=args.components,
            clear_index=args.clear_index,
            skip_scraping=not args.scrape,
            dry_run=args.dry_run,
        )
        
        # Save statistics if requested
        if args.output_stats:
            with open(args.output_stats, "w") as f:
                json.dump(stats.to_dict(), f, indent=2)
            logger.info(f"Statistics saved to {args.output_stats}")
        
        # Print summary
        print("\n" + "=" * 60)
        print("PIPELINE COMPLETE")
        print("=" * 60)
        print(f"Duration: {stats.duration_seconds:.2f} seconds")
        print(f"Records processed: {stats.total_extracted}")
        print(f"Records uploaded: {stats.uploaded_records}")
        print(f"Errors: {len(stats.errors)}")
        print(f"Warnings: {len(stats.warnings)}")
        print("=" * 60)
        
        # Return error code if there were errors
        return 1 if stats.errors else 0
        
    except Exception as e:
        logger.exception(f"Pipeline failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
