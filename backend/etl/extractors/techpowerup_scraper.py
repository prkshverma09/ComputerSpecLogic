"""
TechPowerUp Scraper for Spec-Logic ETL Pipeline

Scrapes detailed GPU specifications from TechPowerUp website.
Includes rate limiting and caching to be respectful of the source.
"""

import time
import logging
import hashlib
import json
from pathlib import Path
from typing import Optional, Dict, Any, List
from functools import wraps

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)


def rate_limit(delay_seconds: float = 2.0):
    """
    Decorator to add rate limiting between requests.
    
    Args:
        delay_seconds: Minimum delay between requests
    """
    def decorator(func):
        last_call = [0.0]
        
        @wraps(func)
        def wrapper(*args, **kwargs):
            elapsed = time.time() - last_call[0]
            if elapsed < delay_seconds:
                time.sleep(delay_seconds - elapsed)
            result = func(*args, **kwargs)
            last_call[0] = time.time()
            return result
        return wrapper
    return decorator


class TechPowerUpScraper:
    """
    Scrapes GPU specifications from TechPowerUp.
    
    Features:
    - Rate limiting to avoid overwhelming the server
    - Local caching to minimize requests
    - Retry logic with exponential backoff
    """
    
    BASE_URL = "https://www.techpowerup.com"
    GPU_DB_URL = f"{BASE_URL}/gpu-specs"
    
    USER_AGENT = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
    
    def __init__(
        self,
        cache_dir: str = "data/cache",
        delay_seconds: float = 2.0,
        max_retries: int = 3
    ):
        """
        Initialize the scraper.
        
        Args:
            cache_dir: Directory for caching scraped data
            delay_seconds: Delay between requests
            max_retries: Maximum retry attempts for failed requests
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.delay_seconds = delay_seconds
        self.max_retries = max_retries
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": self.USER_AGENT})
        
    def _get_cache_key(self, url: str) -> str:
        """Generate cache key from URL."""
        return hashlib.md5(url.encode()).hexdigest()
    
    def _get_cached(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached data for URL.
        
        Args:
            url: URL to check cache for
            
        Returns:
            Cached data if exists, None otherwise
        """
        cache_key = self._get_cache_key(url)
        cache_file = self.cache_dir / f"{cache_key}.json"
        
        if cache_file.exists():
            with open(cache_file, "r") as f:
                data = json.load(f)
                logger.debug(f"Cache hit for {url}")
                return data
        return None
    
    def _save_cache(self, url: str, data: Dict[str, Any]) -> None:
        """
        Save data to cache.
        
        Args:
            url: URL the data was fetched from
            data: Data to cache
        """
        cache_key = self._get_cache_key(url)
        cache_file = self.cache_dir / f"{cache_key}.json"
        
        with open(cache_file, "w") as f:
            json.dump(data, f, indent=2)
        logger.debug(f"Cached data for {url}")
    
    def _fetch_with_retry(self, url: str) -> Optional[str]:
        """
        Fetch URL content with retry logic.
        
        Args:
            url: URL to fetch
            
        Returns:
            HTML content if successful, None otherwise
        """
        for attempt in range(self.max_retries):
            try:
                # Rate limiting
                time.sleep(self.delay_seconds)
                
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                return response.text
                
            except requests.exceptions.RequestException as e:
                wait_time = (2 ** attempt) * self.delay_seconds
                logger.warning(
                    f"Request failed (attempt {attempt + 1}/{self.max_retries}): {e}. "
                    f"Retrying in {wait_time}s..."
                )
                time.sleep(wait_time)
                
        logger.error(f"Failed to fetch {url} after {self.max_retries} attempts")
        return None
    
    def scrape_gpu_specs(self, gpu_url: str) -> Optional[Dict[str, Any]]:
        """
        Scrape detailed specs for a single GPU.
        
        Args:
            gpu_url: URL to GPU specs page on TechPowerUp
            
        Returns:
            Dictionary with GPU specifications
        """
        # Check cache first
        cached = self._get_cached(gpu_url)
        if cached:
            return cached
            
        logger.info(f"Scraping GPU specs from {gpu_url}")
        
        html = self._fetch_with_retry(gpu_url)
        if not html:
            return None
            
        soup = BeautifulSoup(html, "lxml")
        specs = {}
        
        try:
            # Extract GPU name
            title = soup.find("h1", class_="gpudb-name")
            if title:
                specs["name"] = title.text.strip()
            
            # Extract specs from table
            spec_table = soup.find("table", class_="gpudb-specs")
            if spec_table:
                rows = spec_table.find_all("tr")
                for row in rows:
                    cells = row.find_all(["th", "td"])
                    if len(cells) >= 2:
                        key = cells[0].text.strip().lower().replace(" ", "_")
                        value = cells[1].text.strip()
                        specs[key] = value
            
            # Parse specific fields
            specs["length_mm"] = self._parse_length(specs.get("length", ""))
            specs["tdp_watts"] = self._parse_tdp(specs.get("tdp", ""))
            specs["vram_gb"] = self._parse_vram(specs.get("memory_size", ""))
            specs["memory_bandwidth_gbps"] = self._parse_bandwidth(
                specs.get("memory_bandwidth", "")
            )
            specs["recommended_psu_watts"] = self._parse_psu(
                specs.get("suggested_psu", "")
            )
            
            # Cache the result
            self._save_cache(gpu_url, specs)
            
            return specs
            
        except Exception as e:
            logger.error(f"Error parsing GPU specs from {gpu_url}: {e}")
            return None
    
    def scrape_gpu_list(
        self,
        generation: Optional[str] = None,
        brand: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """
        Scrape list of GPUs from TechPowerUp database.
        
        Args:
            generation: Filter by GPU generation (e.g., "GeForce RTX 40")
            brand: Filter by brand (e.g., "NVIDIA", "AMD")
            limit: Maximum number of GPUs to scrape
            
        Returns:
            List of GPU specification dictionaries
        """
        logger.info(f"Scraping GPU list (limit={limit})")
        
        # Build URL with filters
        url = self.GPU_DB_URL
        params = []
        if generation:
            params.append(f"generation={generation}")
        if brand:
            params.append(f"mfgr={brand}")
        if params:
            url += "?" + "&".join(params)
            
        html = self._fetch_with_retry(url)
        if not html:
            return []
            
        soup = BeautifulSoup(html, "lxml")
        gpus = []
        
        # Find GPU links in the table
        gpu_table = soup.find("table", class_="processors")
        if not gpu_table:
            logger.warning("Could not find GPU table on page")
            return []
            
        rows = gpu_table.find_all("tr")[1:]  # Skip header row
        
        for row in rows[:limit]:
            try:
                link = row.find("a")
                if link and link.get("href"):
                    gpu_url = self.BASE_URL + link["href"]
                    gpu_specs = self.scrape_gpu_specs(gpu_url)
                    if gpu_specs:
                        gpus.append(gpu_specs)
            except Exception as e:
                logger.warning(f"Error processing GPU row: {e}")
                continue
                
        logger.info(f"Scraped {len(gpus)} GPU specifications")
        return gpus
    
    @staticmethod
    def _parse_length(value: str) -> Optional[int]:
        """Parse GPU length from string (e.g., '336 mm')."""
        try:
            if "mm" in value.lower():
                return int(float(value.lower().replace("mm", "").strip()))
        except (ValueError, AttributeError):
            pass
        return None
    
    @staticmethod
    def _parse_tdp(value: str) -> Optional[int]:
        """Parse TDP from string (e.g., '285 W')."""
        try:
            if "w" in value.lower():
                return int(float(value.lower().replace("w", "").strip()))
        except (ValueError, AttributeError):
            pass
        return None
    
    @staticmethod
    def _parse_vram(value: str) -> Optional[int]:
        """Parse VRAM from string (e.g., '16 GB')."""
        try:
            if "gb" in value.lower():
                return int(float(value.lower().replace("gb", "").strip()))
        except (ValueError, AttributeError):
            pass
        return None
    
    @staticmethod
    def _parse_bandwidth(value: str) -> Optional[float]:
        """Parse memory bandwidth from string (e.g., '504.2 GB/s')."""
        try:
            if "gb/s" in value.lower():
                return float(value.lower().replace("gb/s", "").strip())
        except (ValueError, AttributeError):
            pass
        return None
    
    @staticmethod
    def _parse_psu(value: str) -> Optional[int]:
        """Parse recommended PSU from string (e.g., '700 W')."""
        try:
            if "w" in value.lower():
                return int(float(value.lower().replace("w", "").strip()))
        except (ValueError, AttributeError):
            pass
        return None
    
    def clear_cache(self) -> int:
        """
        Clear all cached data.
        
        Returns:
            Number of cache files deleted
        """
        count = 0
        for cache_file in self.cache_dir.glob("*.json"):
            cache_file.unlink()
            count += 1
        logger.info(f"Cleared {count} cache files")
        return count
