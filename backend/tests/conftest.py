"""
Pytest configuration and shared fixtures for Spec-Logic tests.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, Any, List

import pytest
import pandas as pd

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture
def fixtures_dir() -> Path:
    """Path to test fixtures directory."""
    return Path(__file__).parent.parent / "data" / "fixtures"


@pytest.fixture
def sample_components(fixtures_dir: Path) -> Dict[str, List[Dict[str, Any]]]:
    """Load sample component data from fixtures."""
    fixtures_file = fixtures_dir / "test_components.json"
    
    if fixtures_file.exists():
        with open(fixtures_file) as f:
            return json.load(f)
    
    # Return minimal test data if file doesn't exist
    return {
        "cpus": [
            {
                "objectID": "cpu-test-1",
                "component_type": "CPU",
                "brand": "AMD",
                "model": "Test CPU",
                "socket": "AM5",
                "tdp_watts": 65,
                "cores": 8,
                "threads": 16,
                "memory_type": ["DDR5"],
                "price_usd": 299,
                "performance_tier": "mid-range",
                "compatibility_tags": ["am5", "ddr5"]
            }
        ],
        "gpus": [
            {
                "objectID": "gpu-test-1",
                "component_type": "GPU",
                "brand": "NVIDIA",
                "model": "Test GPU",
                "length_mm": 300,
                "tdp_watts": 200,
                "vram_gb": 8,
                "price_usd": 399,
                "performance_tier": "mid-range",
                "compatibility_tags": ["mid-tdp", "vram-8gb"]
            }
        ]
    }


@pytest.fixture
def sample_cpu_df(sample_components: Dict) -> pd.DataFrame:
    """DataFrame with sample CPU data."""
    return pd.DataFrame(sample_components["cpus"])


@pytest.fixture
def sample_gpu_df(sample_components: Dict) -> pd.DataFrame:
    """DataFrame with sample GPU data."""
    return pd.DataFrame(sample_components["gpus"])


@pytest.fixture
def sample_motherboard_df(sample_components: Dict) -> pd.DataFrame:
    """DataFrame with sample motherboard data."""
    return pd.DataFrame(sample_components.get("motherboards", []))


@pytest.fixture
def temp_data_dir(tmp_path: Path) -> Path:
    """Create temporary data directory structure."""
    raw_dir = tmp_path / "raw"
    processed_dir = tmp_path / "processed"
    raw_dir.mkdir()
    processed_dir.mkdir()
    return tmp_path


@pytest.fixture
def sample_cpu_csv(temp_data_dir: Path, sample_cpu_df: pd.DataFrame) -> Path:
    """Create temporary CPU CSV file."""
    csv_path = temp_data_dir / "raw" / "cpus.csv"
    sample_cpu_df.to_csv(csv_path, index=False)
    return csv_path


@pytest.fixture
def sample_gpu_csv(temp_data_dir: Path, sample_gpu_df: pd.DataFrame) -> Path:
    """Create temporary GPU CSV file."""
    csv_path = temp_data_dir / "raw" / "gpus.csv"
    sample_gpu_df.to_csv(csv_path, index=False)
    return csv_path


@pytest.fixture
def mock_algolia_env(monkeypatch):
    """Set mock Algolia environment variables."""
    monkeypatch.setenv("ALGOLIA_APP_ID", "test_app_id")
    monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_admin_key")
    monkeypatch.setenv("ALGOLIA_INDEX_NAME", "test_index")
