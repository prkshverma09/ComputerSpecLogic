"""
Query Rules Configuration for Spec-Logic

Configures Algolia Query Rules for automatic socket detection,
GPU power warnings, and other compatibility-related rules.
"""

import os
import sys
import logging
from typing import Dict, Any, List

from dotenv import load_dotenv
from algoliasearch.search.client import SearchClientSync

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

logger = logging.getLogger(__name__)


class QueryRulesConfigurator:
    """
    Configures Algolia Query Rules for the Spec-Logic index.
    
    Creates rules for:
    - CPU model detection → socket filter
    - High-TDP GPU warnings
    - Form factor detection
    """
    
    def __init__(
        self,
        app_id: str = None,
        api_key: str = None,
        index_name: str = None
    ):
        """Initialize the configurator."""
        self.app_id = app_id or os.environ.get("ALGOLIA_APP_ID")
        self.api_key = api_key or os.environ.get("ALGOLIA_ADMIN_KEY")
        self.index_name = index_name or os.environ.get("ALGOLIA_INDEX_NAME", "prod_components")
        
        if not self.app_id or not self.api_key:
            raise ValueError("Algolia credentials not configured")
            
        self.client = SearchClientSync(self.app_id, self.api_key)
    
    def create_all_rules(self) -> Dict[str, int]:
        """
        Create all query rules.
        
        Returns:
            Dictionary with counts of rules created per category
        """
        results = {
            "cpu_detection": 0,
            "gpu_warnings": 0,
            "form_factor": 0,
        }
        
        # Create CPU detection rules
        cpu_rules = self._get_cpu_detection_rules()
        self._save_rules(cpu_rules)
        results["cpu_detection"] = len(cpu_rules)
        
        # Create GPU warning rules
        gpu_rules = self._get_gpu_warning_rules()
        self._save_rules(gpu_rules)
        results["gpu_warnings"] = len(gpu_rules)
        
        # Create form factor rules
        ff_rules = self._get_form_factor_rules()
        self._save_rules(ff_rules)
        results["form_factor"] = len(ff_rules)
        
        total = sum(results.values())
        logger.info(f"Created {total} query rules")
        
        return results
    
    def _get_cpu_detection_rules(self) -> List[Dict[str, Any]]:
        """Get CPU model detection rules."""
        return [
            # Intel 14th Gen (LGA1700)
            {
                "objectID": "cpu-intel-14th-gen",
                "description": "Intel 14th Gen CPU detection - apply LGA1700 socket filter",
                "condition": {
                    "pattern": "i9-14|i7-14|i5-14|14900K|14700K|14600K",
                    "anchoring": "contains",
                },
                "consequence": {
                    "params": {
                        "filters": "socket:LGA1700",
                    },
                    "userData": {
                        "detected_socket": "LGA1700",
                        "detected_platform": "Intel 14th Gen",
                        "compatibility_mode": True,
                    },
                },
            },
            # Intel 13th Gen (LGA1700)
            {
                "objectID": "cpu-intel-13th-gen",
                "description": "Intel 13th Gen CPU detection - apply LGA1700 socket filter",
                "condition": {
                    "pattern": "i9-13|i7-13|i5-13|13900K|13700K|13600K",
                    "anchoring": "contains",
                },
                "consequence": {
                    "params": {
                        "filters": "socket:LGA1700",
                    },
                    "userData": {
                        "detected_socket": "LGA1700",
                        "detected_platform": "Intel 13th Gen",
                        "compatibility_mode": True,
                    },
                },
            },
            # Intel 12th Gen (LGA1700)
            {
                "objectID": "cpu-intel-12th-gen",
                "description": "Intel 12th Gen CPU detection - apply LGA1700 socket filter",
                "condition": {
                    "pattern": "i9-12|i7-12|i5-12|12900K|12700K|12600K",
                    "anchoring": "contains",
                },
                "consequence": {
                    "params": {
                        "filters": "socket:LGA1700",
                    },
                    "userData": {
                        "detected_socket": "LGA1700",
                        "detected_platform": "Intel 12th Gen",
                        "compatibility_mode": True,
                    },
                },
            },
            # Intel Core Ultra (LGA1851)
            {
                "objectID": "cpu-intel-core-ultra",
                "description": "Intel Core Ultra detection - apply LGA1851 socket filter",
                "condition": {
                    "pattern": "Core Ultra|Ultra 9|Ultra 7|Ultra 5|285K|265K|245K",
                    "anchoring": "contains",
                },
                "consequence": {
                    "params": {
                        "filters": "socket:LGA1851",
                    },
                    "userData": {
                        "detected_socket": "LGA1851",
                        "detected_platform": "Intel Core Ultra",
                        "compatibility_mode": True,
                    },
                },
            },
            # AMD Ryzen 9000 Series (AM5)
            {
                "objectID": "cpu-amd-ryzen-9000",
                "description": "AMD Ryzen 9000 detection - apply AM5 socket filter",
                "condition": {
                    "pattern": "Ryzen 9 9|Ryzen 7 9|Ryzen 5 9|9950X|9900X|9700X|9600X",
                    "anchoring": "contains",
                },
                "consequence": {
                    "params": {
                        "filters": "socket:AM5",
                    },
                    "userData": {
                        "detected_socket": "AM5",
                        "detected_platform": "AMD Ryzen 9000",
                        "memory_type": "DDR5",
                        "compatibility_mode": True,
                    },
                },
            },
            # AMD Ryzen 8000 Series (AM5)
            {
                "objectID": "cpu-amd-ryzen-8000",
                "description": "AMD Ryzen 8000 detection - apply AM5 socket filter",
                "condition": {
                    "pattern": "Ryzen 9 8|Ryzen 7 8|Ryzen 5 8|8700G|8600G|8500G",
                    "anchoring": "contains",
                },
                "consequence": {
                    "params": {
                        "filters": "socket:AM5",
                    },
                    "userData": {
                        "detected_socket": "AM5",
                        "detected_platform": "AMD Ryzen 8000",
                        "memory_type": "DDR5",
                        "has_igpu": True,
                        "compatibility_mode": True,
                    },
                },
            },
            # AMD Ryzen 7000 Series (AM5)
            {
                "objectID": "cpu-amd-ryzen-7000",
                "description": "AMD Ryzen 7000 detection - apply AM5 socket filter",
                "condition": {
                    "pattern": "Ryzen 9 7|Ryzen 7 7|Ryzen 5 7|7950X|7900X|7800X|7700X|7600X",
                    "anchoring": "contains",
                },
                "consequence": {
                    "params": {
                        "filters": "socket:AM5",
                    },
                    "userData": {
                        "detected_socket": "AM5",
                        "detected_platform": "AMD Ryzen 7000",
                        "memory_type": "DDR5",
                        "compatibility_mode": True,
                    },
                },
            },
            # AMD Ryzen 5000 Series (AM4)
            {
                "objectID": "cpu-amd-ryzen-5000",
                "description": "AMD Ryzen 5000 detection - apply AM4 socket filter",
                "condition": {
                    "pattern": "Ryzen 9 5|Ryzen 7 5|Ryzen 5 5|5950X|5900X|5800X|5700X|5600X|5600",
                    "anchoring": "contains",
                },
                "consequence": {
                    "params": {
                        "filters": "socket:AM4",
                    },
                    "userData": {
                        "detected_socket": "AM4",
                        "detected_platform": "AMD Ryzen 5000",
                        "memory_type": "DDR4",
                        "compatibility_mode": True,
                    },
                },
            },
        ]
    
    def _get_gpu_warning_rules(self) -> List[Dict[str, Any]]:
        """Get high-TDP GPU warning rules."""
        return [
            # NVIDIA RTX 4090
            {
                "objectID": "gpu-rtx-4090-warning",
                "description": "RTX 4090 power warning",
                "condition": {
                    "pattern": "RTX 4090|4090",
                    "anchoring": "contains",
                },
                "consequence": {
                    "userData": {
                        "power_warning": True,
                        "min_psu_watts": 850,
                        "recommended_psu_watts": 1000,
                        "gpu_tdp": 450,
                        "transient_spike_warning": True,
                        "message": "The RTX 4090 requires a minimum 850W PSU (1000W recommended) with proper transient spike handling. Consider PSUs with 12VHPWR connector.",
                    },
                },
            },
            # NVIDIA RTX 4080 Super
            {
                "objectID": "gpu-rtx-4080-super-warning",
                "description": "RTX 4080 Super power warning",
                "condition": {
                    "pattern": "RTX 4080 Super|4080 Super",
                    "anchoring": "contains",
                },
                "consequence": {
                    "userData": {
                        "power_warning": True,
                        "min_psu_watts": 750,
                        "recommended_psu_watts": 850,
                        "gpu_tdp": 320,
                        "message": "The RTX 4080 Super requires a minimum 750W PSU (850W recommended).",
                    },
                },
            },
            # NVIDIA RTX 4080
            {
                "objectID": "gpu-rtx-4080-warning",
                "description": "RTX 4080 power warning",
                "condition": {
                    "pattern": "RTX 4080",
                    "anchoring": "contains",
                },
                "consequence": {
                    "userData": {
                        "power_warning": True,
                        "min_psu_watts": 750,
                        "recommended_psu_watts": 850,
                        "gpu_tdp": 320,
                        "message": "The RTX 4080 requires a minimum 750W PSU (850W recommended).",
                    },
                },
            },
            # AMD RX 7900 XTX
            {
                "objectID": "gpu-rx-7900-xtx-warning",
                "description": "RX 7900 XTX power warning",
                "condition": {
                    "pattern": "RX 7900 XTX|7900 XTX|7900XTX",
                    "anchoring": "contains",
                },
                "consequence": {
                    "userData": {
                        "power_warning": True,
                        "min_psu_watts": 800,
                        "recommended_psu_watts": 850,
                        "gpu_tdp": 355,
                        "message": "The RX 7900 XTX requires a minimum 800W PSU (850W recommended).",
                    },
                },
            },
            # AMD RX 7900 XT
            {
                "objectID": "gpu-rx-7900-xt-warning",
                "description": "RX 7900 XT power warning",
                "condition": {
                    "pattern": "RX 7900 XT|7900 XT|7900XT",
                    "anchoring": "contains",
                },
                "consequence": {
                    "userData": {
                        "power_warning": True,
                        "min_psu_watts": 750,
                        "recommended_psu_watts": 800,
                        "gpu_tdp": 315,
                        "message": "The RX 7900 XT requires a minimum 750W PSU (800W recommended).",
                    },
                },
            },
        ]
    
    def _get_form_factor_rules(self) -> List[Dict[str, Any]]:
        """Get form factor detection rules."""
        return [
            # Mini-ITX build detection
            {
                "objectID": "form-factor-itx",
                "description": "Mini-ITX form factor detection",
                "condition": {
                    "pattern": "ITX|mini-itx|SFF|small form factor",
                    "anchoring": "contains",
                },
                "consequence": {
                    "userData": {
                        "form_factor_hint": "Mini-ITX",
                        "size_constraints": True,
                        "message": "Mini-ITX builds have limited space. Check GPU length and cooler height clearances.",
                    },
                },
            },
            # Micro-ATX detection
            {
                "objectID": "form-factor-matx",
                "description": "Micro-ATX form factor detection",
                "condition": {
                    "pattern": "micro-?atx|mATX|m-atx",
                    "anchoring": "contains",
                },
                "consequence": {
                    "userData": {
                        "form_factor_hint": "Micro-ATX",
                        "message": "Micro-ATX boards offer a good balance of size and expandability.",
                    },
                },
            },
        ]
    
    def _save_rules(self, rules: List[Dict[str, Any]]) -> None:
        """Save rules to Algolia."""
        if not rules:
            return
            
        try:
            response = self.client.save_rules(
                index_name=self.index_name,
                rules=rules,
                clear_existing_rules=False
            )
            
            self.client.wait_for_task(
                index_name=self.index_name,
                task_id=response.task_id
            )
            
            logger.info(f"Saved {len(rules)} rules to '{self.index_name}'")
            
        except Exception as e:
            logger.error(f"Failed to save rules: {e}")
            raise
    
    def clear_all_rules(self) -> None:
        """Clear all existing query rules."""
        logger.warning("Clearing all query rules")
        
        try:
            response = self.client.clear_rules(index_name=self.index_name)
            self.client.wait_for_task(
                index_name=self.index_name,
                task_id=response.task_id
            )
            logger.info("All rules cleared")
            
        except Exception as e:
            logger.error(f"Failed to clear rules: {e}")
            raise
    
    def list_rules(self) -> List[Dict[str, Any]]:
        """List all existing query rules."""
        try:
            response = self.client.search_rules(
                index_name=self.index_name,
                search_rules_params={"query": ""}
            )
            return [dict(rule) for rule in response.hits]
            
        except Exception as e:
            logger.error(f"Failed to list rules: {e}")
            return []


def main():
    """Main function to configure query rules."""
    load_dotenv()
    
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    try:
        configurator = QueryRulesConfigurator()
        
        # Option to clear existing rules
        if "--clear" in sys.argv:
            configurator.clear_all_rules()
            
        # Create all rules
        results = configurator.create_all_rules()
        
        print("\nQuery Rules Configuration Complete:")
        print(f"  CPU Detection Rules: {results['cpu_detection']}")
        print(f"  GPU Warning Rules: {results['gpu_warnings']}")
        print(f"  Form Factor Rules: {results['form_factor']}")
        print(f"  Total: {sum(results.values())}")
        
        # List rules for verification
        rules = configurator.list_rules()
        print(f"\nVerified {len(rules)} rules in index")
        
    except Exception as e:
        logger.error(f"Configuration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
