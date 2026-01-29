#!/usr/bin/env python3
"""
Algolia Index Setup Script for Spec-Logic

Sets up the Algolia index with proper configuration including:
- Index settings
- Searchable attributes
- Faceting configuration
- Custom ranking rules
- Query rules
"""

import os
import sys
import argparse
import logging

from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from etl.loaders import AlgoliaLoader
from scripts.configure_query_rules import QueryRulesConfigurator


def setup_logging() -> None:
    """Configure logging."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )


def parse_args() -> argparse.Namespace:
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Set up the Algolia index for Spec-Logic"
    )
    
    parser.add_argument(
        "--index-name",
        default="prod_components",
        help="Name of the Algolia index (default: prod_components)"
    )
    
    parser.add_argument(
        "--skip-rules",
        action="store_true",
        help="Skip query rules configuration"
    )
    
    parser.add_argument(
        "--clear-rules",
        action="store_true",
        help="Clear existing query rules before creating new ones"
    )
    
    parser.add_argument(
        "--delete-index",
        action="store_true",
        help="Delete the index (DANGER: irreversible)"
    )
    
    return parser.parse_args()


def main() -> int:
    """Main entry point."""
    load_dotenv()
    setup_logging()
    
    logger = logging.getLogger(__name__)
    
    # Validate credentials
    if not os.environ.get("ALGOLIA_APP_ID"):
        logger.error("ALGOLIA_APP_ID environment variable not set")
        return 1
    if not os.environ.get("ALGOLIA_ADMIN_KEY"):
        logger.error("ALGOLIA_ADMIN_KEY environment variable not set")
        return 1
    
    args = parse_args()
    
    try:
        # Initialize loader
        loader = AlgoliaLoader(index_name=args.index_name)
        
        # Handle delete request
        if args.delete_index:
            confirm = input(f"Are you sure you want to delete '{args.index_name}'? (yes/no): ")
            if confirm.lower() == "yes":
                loader.delete_index()
                logger.info("Index deleted")
                return 0
            else:
                logger.info("Delete cancelled")
                return 0
        
        # Create/configure index
        logger.info(f"Setting up index '{args.index_name}'...")
        
        settings = {
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
            ],
            "numericAttributesForFiltering": [
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
            "snippetEllipsisText": "...",
            "removeStopWords": True,
            "ignorePlurals": True,
        }
        
        loader.create_index(settings)
        logger.info("Index settings configured")
        
        # Configure query rules
        if not args.skip_rules:
            logger.info("Configuring query rules...")
            
            configurator = QueryRulesConfigurator(index_name=args.index_name)
            
            if args.clear_rules:
                configurator.clear_all_rules()
                
            results = configurator.create_all_rules()
            
            total_rules = sum(results.values())
            logger.info(f"Created {total_rules} query rules")
            
        # Get index stats
        stats = loader.get_index_stats()
        
        print("\n" + "=" * 50)
        print("INDEX SETUP COMPLETE")
        print("=" * 50)
        print(f"Index Name: {args.index_name}")
        print(f"Records: {stats.get('nb_hits', 0)}")
        print("=" * 50)
        
        return 0
        
    except Exception as e:
        logger.exception(f"Setup failed: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
