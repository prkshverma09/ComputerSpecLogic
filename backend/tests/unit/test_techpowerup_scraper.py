"""
Unit tests for TechPowerUp Scraper.

Tests parsing methods, caching, rate limiting, and retry logic.
"""

import json
import time
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock

import pytest
import requests

from etl.extractors.techpowerup_scraper import TechPowerUpScraper, rate_limit


class TestParsingMethods:
    """Tests for static parsing methods."""

    def test_parse_length_valid_mm(self):
        assert TechPowerUpScraper._parse_length("350 mm") == 350
        assert TechPowerUpScraper._parse_length("336 MM") == 336
        assert TechPowerUpScraper._parse_length("280mm") == 280

    def test_parse_length_with_decimal(self):
        assert TechPowerUpScraper._parse_length("335.5 mm") == 335

    def test_parse_length_invalid_returns_none(self):
        assert TechPowerUpScraper._parse_length("") is None
        assert TechPowerUpScraper._parse_length("350 cm") is None
        assert TechPowerUpScraper._parse_length("invalid") is None
        assert TechPowerUpScraper._parse_length("350") is None

    def test_parse_tdp_valid(self):
        assert TechPowerUpScraper._parse_tdp("450 W") == 450
        assert TechPowerUpScraper._parse_tdp("285w") == 285
        assert TechPowerUpScraper._parse_tdp("170 W ") == 170

    def test_parse_tdp_with_decimal(self):
        assert TechPowerUpScraper._parse_tdp("165.5 W") == 165

    def test_parse_tdp_invalid_returns_none(self):
        assert TechPowerUpScraper._parse_tdp("") is None
        assert TechPowerUpScraper._parse_tdp("450") is None
        assert TechPowerUpScraper._parse_tdp("invalid") is None

    def test_parse_vram_valid_gb(self):
        assert TechPowerUpScraper._parse_vram("24 GB") == 24
        assert TechPowerUpScraper._parse_vram("16gb") == 16
        assert TechPowerUpScraper._parse_vram("8 GB ") == 8

    def test_parse_vram_with_decimal(self):
        assert TechPowerUpScraper._parse_vram("12.5 GB") == 12

    def test_parse_vram_invalid_returns_none(self):
        assert TechPowerUpScraper._parse_vram("") is None
        assert TechPowerUpScraper._parse_vram("8192 MB") is None
        assert TechPowerUpScraper._parse_vram("invalid") is None

    def test_parse_bandwidth_valid(self):
        assert TechPowerUpScraper._parse_bandwidth("504.2 GB/s") == 504.2
        assert TechPowerUpScraper._parse_bandwidth("320 gb/s") == 320.0
        assert TechPowerUpScraper._parse_bandwidth("1008.4 GB/s") == 1008.4

    def test_parse_bandwidth_invalid_returns_none(self):
        assert TechPowerUpScraper._parse_bandwidth("") is None
        assert TechPowerUpScraper._parse_bandwidth("504 MB/s") is None
        assert TechPowerUpScraper._parse_bandwidth("invalid") is None

    def test_parse_psu_valid(self):
        assert TechPowerUpScraper._parse_psu("700 W") == 700
        assert TechPowerUpScraper._parse_psu("850w") == 850
        assert TechPowerUpScraper._parse_psu("1000 W ") == 1000

    def test_parse_psu_invalid_returns_none(self):
        assert TechPowerUpScraper._parse_psu("") is None
        assert TechPowerUpScraper._parse_psu("850") is None
        assert TechPowerUpScraper._parse_psu("invalid") is None


class TestCaching:
    """Tests for caching functionality."""

    def test_get_cache_key_generates_md5(self):
        scraper = TechPowerUpScraper(cache_dir="/tmp/test_cache")
        url = "https://example.com/gpu/test"
        key = scraper._get_cache_key(url)
        assert len(key) == 32
        assert key == scraper._get_cache_key(url)

    def test_get_cache_key_different_urls(self):
        scraper = TechPowerUpScraper(cache_dir="/tmp/test_cache")
        key1 = scraper._get_cache_key("https://example.com/gpu/1")
        key2 = scraper._get_cache_key("https://example.com/gpu/2")
        assert key1 != key2

    def test_cache_hit_returns_cached(self, tmp_path):
        cache_dir = tmp_path / "cache"
        cache_dir.mkdir()
        scraper = TechPowerUpScraper(cache_dir=str(cache_dir))

        url = "https://example.com/gpu/test"
        test_data = {"name": "Test GPU", "tdp": "450 W"}

        scraper._save_cache(url, test_data)
        cached = scraper._get_cached(url)

        assert cached == test_data

    def test_cache_miss_returns_none(self, tmp_path):
        cache_dir = tmp_path / "cache"
        cache_dir.mkdir()
        scraper = TechPowerUpScraper(cache_dir=str(cache_dir))

        url = "https://example.com/gpu/nonexistent"
        cached = scraper._get_cached(url)

        assert cached is None

    def test_save_cache_creates_file(self, tmp_path):
        cache_dir = tmp_path / "cache"
        cache_dir.mkdir()
        scraper = TechPowerUpScraper(cache_dir=str(cache_dir))

        url = "https://example.com/gpu/test"
        test_data = {"name": "Test GPU"}

        scraper._save_cache(url, test_data)

        cache_key = scraper._get_cache_key(url)
        cache_file = cache_dir / f"{cache_key}.json"
        assert cache_file.exists()

        with open(cache_file) as f:
            saved_data = json.load(f)
        assert saved_data == test_data

    def test_clear_cache_removes_files(self, tmp_path):
        cache_dir = tmp_path / "cache"
        cache_dir.mkdir()
        scraper = TechPowerUpScraper(cache_dir=str(cache_dir))

        for i in range(3):
            scraper._save_cache(f"https://example.com/gpu/{i}", {"id": i})

        assert len(list(cache_dir.glob("*.json"))) == 3

        count = scraper.clear_cache()

        assert count == 3
        assert len(list(cache_dir.glob("*.json"))) == 0


class TestRateLimiting:
    """Tests for rate limiting functionality."""

    def test_rate_limit_decorator_delays_requests(self):
        call_times = []

        @rate_limit(delay_seconds=0.1)
        def test_func():
            call_times.append(time.time())
            return True

        test_func()
        test_func()
        test_func()

        assert len(call_times) == 3
        for i in range(1, len(call_times)):
            elapsed = call_times[i] - call_times[i-1]
            assert elapsed >= 0.09

    def test_rate_limit_first_call_immediate(self):
        start = time.time()

        @rate_limit(delay_seconds=1.0)
        def test_func():
            return time.time()

        result = test_func()

        assert result - start < 0.1


class TestRetryLogic:
    """Tests for fetch with retry functionality."""

    def test_fetch_success_first_attempt(self, tmp_path):
        scraper = TechPowerUpScraper(
            cache_dir=str(tmp_path / "cache"),
            delay_seconds=0.01,
            max_retries=3
        )

        with patch.object(scraper.session, 'get') as mock_get:
            mock_response = Mock()
            mock_response.text = "<html>test</html>"
            mock_response.raise_for_status = Mock()
            mock_get.return_value = mock_response

            result = scraper._fetch_with_retry("https://example.com/test")

            assert result == "<html>test</html>"
            assert mock_get.call_count == 1

    def test_fetch_retries_on_failure(self, tmp_path):
        scraper = TechPowerUpScraper(
            cache_dir=str(tmp_path / "cache"),
            delay_seconds=0.01,
            max_retries=3
        )

        with patch.object(scraper.session, 'get') as mock_get:
            mock_get.side_effect = [
                requests.exceptions.ConnectionError("Connection failed"),
                requests.exceptions.ConnectionError("Connection failed"),
                Mock(text="<html>success</html>", raise_for_status=Mock())
            ]

            result = scraper._fetch_with_retry("https://example.com/test")

            assert result == "<html>success</html>"
            assert mock_get.call_count == 3

    def test_fetch_returns_none_after_max_retries(self, tmp_path):
        scraper = TechPowerUpScraper(
            cache_dir=str(tmp_path / "cache"),
            delay_seconds=0.01,
            max_retries=3
        )

        with patch.object(scraper.session, 'get') as mock_get:
            mock_get.side_effect = requests.exceptions.ConnectionError("Connection failed")

            result = scraper._fetch_with_retry("https://example.com/test")

            assert result is None
            assert mock_get.call_count == 3

    def test_fetch_retries_on_http_error(self, tmp_path):
        scraper = TechPowerUpScraper(
            cache_dir=str(tmp_path / "cache"),
            delay_seconds=0.01,
            max_retries=2
        )

        with patch.object(scraper.session, 'get') as mock_get:
            mock_response_fail = Mock()
            mock_response_fail.raise_for_status.side_effect = requests.exceptions.HTTPError("500")

            mock_response_success = Mock()
            mock_response_success.text = "<html>success</html>"
            mock_response_success.raise_for_status = Mock()

            mock_get.side_effect = [mock_response_fail, mock_response_success]

            result = scraper._fetch_with_retry("https://example.com/test")

            assert result == "<html>success</html>"


class TestScrapeGpuSpecs:
    """Tests for GPU specs scraping."""

    def test_scrape_gpu_specs_returns_cached(self, tmp_path):
        cache_dir = tmp_path / "cache"
        cache_dir.mkdir()
        scraper = TechPowerUpScraper(cache_dir=str(cache_dir))

        url = "https://example.com/gpu/rtx4090"
        cached_data = {
            "name": "RTX 4090",
            "tdp_watts": 450,
            "length_mm": 336
        }
        scraper._save_cache(url, cached_data)

        result = scraper.scrape_gpu_specs(url)

        assert result == cached_data

    def test_scrape_gpu_specs_parses_html(self, tmp_path):
        cache_dir = tmp_path / "cache"
        cache_dir.mkdir()
        scraper = TechPowerUpScraper(
            cache_dir=str(cache_dir),
            delay_seconds=0.01
        )

        sample_html = """
        <html>
        <body>
            <h1 class="gpudb-name">NVIDIA GeForce RTX 4090</h1>
            <table class="gpudb-specs">
                <tr><th>Length</th><td>336 mm</td></tr>
                <tr><th>TDP</th><td>450 W</td></tr>
                <tr><th>Memory Size</th><td>24 GB</td></tr>
                <tr><th>Memory Bandwidth</th><td>1008.4 GB/s</td></tr>
                <tr><th>Suggested PSU</th><td>850 W</td></tr>
            </table>
        </body>
        </html>
        """

        with patch.object(scraper, '_fetch_with_retry', return_value=sample_html):
            result = scraper.scrape_gpu_specs("https://example.com/gpu/rtx4090")

            assert result is not None
            assert result["name"] == "NVIDIA GeForce RTX 4090"
            assert result["length_mm"] == 336
            assert result["tdp_watts"] == 450
            assert result["vram_gb"] == 24
            assert result["memory_bandwidth_gbps"] == 1008.4
            assert result["recommended_psu_watts"] == 850

    def test_scrape_gpu_specs_returns_none_on_fetch_failure(self, tmp_path):
        scraper = TechPowerUpScraper(
            cache_dir=str(tmp_path / "cache"),
            delay_seconds=0.01
        )

        with patch.object(scraper, '_fetch_with_retry', return_value=None):
            result = scraper.scrape_gpu_specs("https://example.com/gpu/nonexistent")
            assert result is None

    def test_scrape_gpu_specs_handles_missing_fields(self, tmp_path):
        cache_dir = tmp_path / "cache"
        cache_dir.mkdir()
        scraper = TechPowerUpScraper(
            cache_dir=str(cache_dir),
            delay_seconds=0.01
        )

        sample_html = """
        <html>
        <body>
            <h1 class="gpudb-name">Test GPU</h1>
            <table class="gpudb-specs">
                <tr><th>Length</th><td>N/A</td></tr>
            </table>
        </body>
        </html>
        """

        with patch.object(scraper, '_fetch_with_retry', return_value=sample_html):
            result = scraper.scrape_gpu_specs("https://example.com/gpu/test")

            assert result is not None
            assert result["name"] == "Test GPU"
            assert result["length_mm"] is None
            assert result["tdp_watts"] is None


class TestScrapeGpuList:
    """Tests for GPU list scraping."""

    def test_scrape_gpu_list_returns_empty_on_fetch_failure(self, tmp_path):
        scraper = TechPowerUpScraper(
            cache_dir=str(tmp_path / "cache"),
            delay_seconds=0.01
        )

        with patch.object(scraper, '_fetch_with_retry', return_value=None):
            result = scraper.scrape_gpu_list(limit=10)
            assert result == []

    def test_scrape_gpu_list_parses_table(self, tmp_path):
        cache_dir = tmp_path / "cache"
        cache_dir.mkdir()
        scraper = TechPowerUpScraper(
            cache_dir=str(cache_dir),
            delay_seconds=0.01
        )

        list_html = """
        <html>
        <body>
            <table class="processors">
                <tr><th>Name</th></tr>
                <tr><td><a href="/gpu-specs/rtx-4090">RTX 4090</a></td></tr>
                <tr><td><a href="/gpu-specs/rtx-4080">RTX 4080</a></td></tr>
            </table>
        </body>
        </html>
        """

        gpu_data = {
            "name": "Test GPU",
            "tdp_watts": 300
        }

        with patch.object(scraper, '_fetch_with_retry', return_value=list_html):
            with patch.object(scraper, 'scrape_gpu_specs', return_value=gpu_data):
                result = scraper.scrape_gpu_list(limit=2)

                assert len(result) == 2
                assert all(gpu["name"] == "Test GPU" for gpu in result)

    def test_scrape_gpu_list_respects_limit(self, tmp_path):
        cache_dir = tmp_path / "cache"
        cache_dir.mkdir()
        scraper = TechPowerUpScraper(
            cache_dir=str(cache_dir),
            delay_seconds=0.01
        )

        list_html = """
        <html>
        <body>
            <table class="processors">
                <tr><th>Name</th></tr>
                <tr><td><a href="/gpu-specs/gpu1">GPU 1</a></td></tr>
                <tr><td><a href="/gpu-specs/gpu2">GPU 2</a></td></tr>
                <tr><td><a href="/gpu-specs/gpu3">GPU 3</a></td></tr>
                <tr><td><a href="/gpu-specs/gpu4">GPU 4</a></td></tr>
                <tr><td><a href="/gpu-specs/gpu5">GPU 5</a></td></tr>
            </table>
        </body>
        </html>
        """

        with patch.object(scraper, '_fetch_with_retry', return_value=list_html):
            with patch.object(scraper, 'scrape_gpu_specs', return_value={"name": "GPU"}):
                result = scraper.scrape_gpu_list(limit=2)
                assert len(result) == 2

    def test_scrape_gpu_list_handles_missing_table(self, tmp_path):
        scraper = TechPowerUpScraper(
            cache_dir=str(tmp_path / "cache"),
            delay_seconds=0.01
        )

        html_without_table = "<html><body><p>No table here</p></body></html>"

        with patch.object(scraper, '_fetch_with_retry', return_value=html_without_table):
            result = scraper.scrape_gpu_list(limit=10)
            assert result == []


class TestScraperInitialization:
    """Tests for scraper initialization."""

    def test_init_creates_cache_dir(self, tmp_path):
        cache_dir = tmp_path / "new_cache"
        assert not cache_dir.exists()

        scraper = TechPowerUpScraper(cache_dir=str(cache_dir))

        assert cache_dir.exists()

    def test_init_sets_default_values(self, tmp_path):
        scraper = TechPowerUpScraper(cache_dir=str(tmp_path))

        assert scraper.delay_seconds == 2.0
        assert scraper.max_retries == 3

    def test_init_accepts_custom_values(self, tmp_path):
        scraper = TechPowerUpScraper(
            cache_dir=str(tmp_path),
            delay_seconds=5.0,
            max_retries=5
        )

        assert scraper.delay_seconds == 5.0
        assert scraper.max_retries == 5

    def test_init_sets_user_agent(self, tmp_path):
        scraper = TechPowerUpScraper(cache_dir=str(tmp_path))

        assert "User-Agent" in scraper.session.headers
        assert "Mozilla" in scraper.session.headers["User-Agent"]
