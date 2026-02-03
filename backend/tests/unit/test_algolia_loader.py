"""
Unit tests for Algolia Loader.

Tests index operations, uploads, sanitization, and error handling.
"""

import math
import os
from unittest.mock import Mock, patch, MagicMock

import pytest

from etl.loaders.algolia_loader import AlgoliaLoader


class TestAlgoliaLoaderInitialization:
    """Tests for AlgoliaLoader initialization."""

    def test_init_with_env_vars(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        monkeypatch.setenv("ALGOLIA_INDEX_NAME", "test_index")

        with patch("etl.loaders.algolia_loader.SearchClientSync"):
            loader = AlgoliaLoader()

            assert loader.app_id == "test_app"
            assert loader.api_key == "test_key"
            assert loader.index_name == "test_index"

    def test_init_with_constructor_args(self, monkeypatch):
        monkeypatch.delenv("ALGOLIA_APP_ID", raising=False)
        monkeypatch.delenv("ALGOLIA_ADMIN_KEY", raising=False)

        with patch("etl.loaders.algolia_loader.SearchClientSync"):
            loader = AlgoliaLoader(
                app_id="custom_app",
                api_key="custom_key",
                index_name="custom_index"
            )

            assert loader.app_id == "custom_app"
            assert loader.api_key == "custom_key"
            assert loader.index_name == "custom_index"

    def test_init_missing_credentials_raises_error(self, monkeypatch):
        monkeypatch.delenv("ALGOLIA_APP_ID", raising=False)
        monkeypatch.delenv("ALGOLIA_ADMIN_KEY", raising=False)

        with pytest.raises(ValueError, match="Algolia credentials not found"):
            AlgoliaLoader()

    def test_init_missing_app_id_raises_error(self, monkeypatch):
        monkeypatch.delenv("ALGOLIA_APP_ID", raising=False)
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")

        with pytest.raises(ValueError, match="Algolia credentials not found"):
            AlgoliaLoader()

    def test_init_missing_api_key_raises_error(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.delenv("ALGOLIA_ADMIN_KEY", raising=False)

        with pytest.raises(ValueError, match="Algolia credentials not found"):
            AlgoliaLoader()

    def test_init_uses_default_index_name(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        monkeypatch.delenv("ALGOLIA_INDEX_NAME", raising=False)

        with patch("etl.loaders.algolia_loader.SearchClientSync"):
            loader = AlgoliaLoader()
            assert loader.index_name == "prod_components"


class TestCreateIndex:
    """Tests for index creation and configuration."""

    @pytest.fixture
    def loader(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        with patch("etl.loaders.algolia_loader.SearchClientSync") as mock_client:
            loader = AlgoliaLoader(index_name="test_index")
            loader.client = mock_client.return_value
            return loader

    def test_create_index_with_default_settings(self, loader):
        mock_response = Mock()
        mock_response.task_id = 123
        loader.client.set_settings.return_value = mock_response

        loader.create_index()

        loader.client.set_settings.assert_called_once()
        call_kwargs = loader.client.set_settings.call_args
        assert call_kwargs.kwargs["index_name"] == "test_index"

    def test_create_index_with_custom_settings(self, loader):
        mock_response = Mock()
        mock_response.task_id = 123
        loader.client.set_settings.return_value = mock_response

        custom_settings = {
            "searchableAttributes": ["name", "description"],
            "hitsPerPage": 50
        }

        loader.create_index(settings=custom_settings)

        loader.client.set_settings.assert_called_once()

    def test_create_index_waits_for_task(self, loader):
        mock_response = Mock()
        mock_response.task_id = 123
        loader.client.set_settings.return_value = mock_response

        loader.create_index()

        loader.client.wait_for_task.assert_called_once_with(
            index_name="test_index",
            task_id=123
        )

    def test_create_index_raises_on_error(self, loader):
        loader.client.set_settings.side_effect = Exception("API Error")

        with pytest.raises(Exception, match="API Error"):
            loader.create_index()


class TestConfigureFacets:
    """Tests for facet configuration."""

    @pytest.fixture
    def loader(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        with patch("etl.loaders.algolia_loader.SearchClientSync") as mock_client:
            loader = AlgoliaLoader(index_name="test_index")
            loader.client = mock_client.return_value
            return loader

    def test_configure_facets_success(self, loader):
        mock_response = Mock()
        mock_response.task_id = 456
        loader.client.set_settings.return_value = mock_response

        facets = ["searchable(brand)", "filterOnly(socket)", "price_usd"]
        loader.configure_facets(facets)

        loader.client.set_settings.assert_called_once()
        loader.client.wait_for_task.assert_called_once()


class TestConfigureRanking:
    """Tests for custom ranking configuration."""

    @pytest.fixture
    def loader(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        with patch("etl.loaders.algolia_loader.SearchClientSync") as mock_client:
            loader = AlgoliaLoader(index_name="test_index")
            loader.client = mock_client.return_value
            return loader

    def test_configure_ranking_success(self, loader):
        mock_response = Mock()
        mock_response.task_id = 789
        loader.client.set_settings.return_value = mock_response

        ranking = ["desc(performance_tier_score)", "asc(price_usd)"]
        loader.configure_ranking(ranking)

        loader.client.set_settings.assert_called_once()
        loader.client.wait_for_task.assert_called_once()


class TestSanitizeRecord:
    """Tests for record sanitization."""

    @pytest.fixture
    def loader(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        with patch("etl.loaders.algolia_loader.SearchClientSync"):
            return AlgoliaLoader(index_name="test_index")

    def test_sanitize_nan_value(self, loader):
        record = {"name": "Test", "value": float("nan")}
        sanitized = loader._sanitize_record(record)
        assert sanitized["value"] is None
        assert sanitized["name"] == "Test"

    def test_sanitize_inf_value(self, loader):
        record = {"name": "Test", "value": float("inf")}
        sanitized = loader._sanitize_record(record)
        assert sanitized["value"] is None

    def test_sanitize_negative_inf_value(self, loader):
        record = {"name": "Test", "value": float("-inf")}
        sanitized = loader._sanitize_record(record)
        assert sanitized["value"] is None

    def test_sanitize_valid_float_unchanged(self, loader):
        record = {"name": "Test", "value": 123.45}
        sanitized = loader._sanitize_record(record)
        assert sanitized["value"] == 123.45

    def test_sanitize_nested_dict(self, loader):
        record = {
            "name": "Test",
            "specs": {
                "tdp": float("nan"),
                "price": 299.99
            }
        }
        sanitized = loader._sanitize_record(record)
        assert sanitized["specs"]["tdp"] is None
        assert sanitized["specs"]["price"] == 299.99

    def test_sanitize_list_with_nan(self, loader):
        record = {
            "name": "Test",
            "values": [1.0, float("nan"), 3.0, float("inf")]
        }
        sanitized = loader._sanitize_record(record)
        assert sanitized["values"] == [1.0, None, 3.0, None]

    def test_sanitize_list_of_dicts(self, loader):
        record = {
            "name": "Test",
            "items": [
                {"value": float("nan")},
                {"value": 123}
            ]
        }
        sanitized = loader._sanitize_record(record)
        assert sanitized["items"][0]["value"] is None
        assert sanitized["items"][1]["value"] == 123


class TestUploadRecords:
    """Tests for record uploading."""

    @pytest.fixture
    def loader(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        with patch("etl.loaders.algolia_loader.SearchClientSync") as mock_client:
            loader = AlgoliaLoader(index_name="test_index")
            loader.client = mock_client.return_value
            return loader

    def test_upload_empty_records_returns_zero(self, loader):
        result = loader.upload_records([])
        assert result == {"uploaded": 0, "errors": 0}

    def test_upload_records_success(self, loader):
        mock_response = Mock()
        mock_response.task_id = 123

        loader.client.save_objects.return_value = [mock_response]

        records = [
            {"objectID": "1", "name": "CPU 1"},
            {"objectID": "2", "name": "CPU 2"}
        ]

        result = loader.upload_records(records)

        assert result["uploaded"] == 2
        assert result["errors"] == 0
        assert result["index"] == "test_index"

    def test_upload_records_batches_correctly(self, loader):
        mock_response = Mock()
        mock_response.task_id = 123
        loader.client.save_objects.return_value = [mock_response]

        loader.BATCH_SIZE = 2
        records = [{"objectID": str(i), "name": f"Item {i}"} for i in range(5)]

        result = loader.upload_records(records)

        assert loader.client.save_objects.call_count == 3
        assert result["uploaded"] == 5

    def test_upload_records_with_clear_existing(self, loader):
        mock_clear_response = Mock()
        mock_clear_response.task_id = 100
        loader.client.clear_objects.return_value = mock_clear_response

        mock_upload_response = Mock()
        mock_upload_response.task_id = 200
        loader.client.save_objects.return_value = [mock_upload_response]

        records = [{"objectID": "1", "name": "Test"}]
        loader.upload_records(records, clear_existing=True)

        loader.client.clear_objects.assert_called_once()

    def test_upload_records_sanitizes_nan(self, loader):
        mock_response = Mock()
        mock_response.task_id = 123
        loader.client.save_objects.return_value = [mock_response]

        records = [{"objectID": "1", "value": float("nan")}]
        loader.upload_records(records)

        call_args = loader.client.save_objects.call_args
        saved_records = call_args.kwargs["objects"]
        assert saved_records[0]["value"] is None


class TestUploadBatchWithRetry:
    """Tests for batch upload retry logic."""

    @pytest.fixture
    def loader(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        with patch("etl.loaders.algolia_loader.SearchClientSync") as mock_client:
            loader = AlgoliaLoader(index_name="test_index")
            loader.client = mock_client.return_value
            return loader

    def test_retry_on_failure_success(self, loader):
        mock_response = Mock()
        mock_response.task_id = 123

        loader.client.save_objects.side_effect = [
            Exception("Network error"),
            [mock_response]
        ]

        with patch("time.sleep"):
            batch = [{"objectID": "1", "name": "Test"}]
            result = loader._upload_batch_with_retry(batch)

            assert loader.client.save_objects.call_count == 2

    def test_retry_exhausted_raises(self, loader):
        loader.client.save_objects.side_effect = Exception("Persistent error")

        with patch("time.sleep"):
            batch = [{"objectID": "1", "name": "Test"}]

            with pytest.raises(Exception, match="Persistent error"):
                loader._upload_batch_with_retry(batch)

            assert loader.client.save_objects.call_count == 3


class TestClearIndex:
    """Tests for index clearing."""

    @pytest.fixture
    def loader(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        with patch("etl.loaders.algolia_loader.SearchClientSync") as mock_client:
            loader = AlgoliaLoader(index_name="test_index")
            loader.client = mock_client.return_value
            return loader

    def test_clear_index_success(self, loader):
        mock_response = Mock()
        mock_response.task_id = 456
        loader.client.clear_objects.return_value = mock_response

        loader._clear_index()

        loader.client.clear_objects.assert_called_once_with(index_name="test_index")
        loader.client.wait_for_task.assert_called_once()

    def test_clear_index_handles_error(self, loader):
        loader.client.clear_objects.side_effect = Exception("Clear failed")

        loader._clear_index()


class TestSearch:
    """Tests for search functionality."""

    @pytest.fixture
    def loader(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        with patch("etl.loaders.algolia_loader.SearchClientSync") as mock_client:
            loader = AlgoliaLoader(index_name="test_index")
            loader.client = mock_client.return_value
            return loader

    def test_search_returns_results(self, loader):
        mock_response = Mock()
        mock_response.hits = [{"objectID": "1", "name": "Test CPU"}]
        mock_response.nb_hits = 1
        mock_response.facets = {"brand": {"AMD": 5}}
        mock_response.processing_time_ms = 10

        loader.client.search_single_index.return_value = mock_response

        result = loader.search("CPU")

        assert result["nb_hits"] == 1
        assert result["processing_time_ms"] == 10

    def test_search_with_filters(self, loader):
        mock_response = Mock()
        mock_response.hits = []
        mock_response.nb_hits = 0
        mock_response.facets = {}
        mock_response.processing_time_ms = 5

        loader.client.search_single_index.return_value = mock_response

        loader.search("CPU", filters="brand:AMD")

        call_args = loader.client.search_single_index.call_args
        assert call_args.kwargs["search_params"]["filters"] == "brand:AMD"

    def test_search_with_facets(self, loader):
        mock_response = Mock()
        mock_response.hits = []
        mock_response.nb_hits = 0
        mock_response.facets = {"brand": {"AMD": 10, "Intel": 5}}
        mock_response.processing_time_ms = 5

        loader.client.search_single_index.return_value = mock_response

        result = loader.search("CPU", facets=["brand"])

        call_args = loader.client.search_single_index.call_args
        assert call_args.kwargs["search_params"]["facets"] == ["brand"]


class TestGetIndexStats:
    """Tests for index statistics retrieval."""

    @pytest.fixture
    def loader(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        with patch("etl.loaders.algolia_loader.SearchClientSync") as mock_client:
            loader = AlgoliaLoader(index_name="test_index")
            loader.client = mock_client.return_value
            return loader

    def test_get_index_stats_success(self, loader):
        mock_response = Mock()
        mock_response.nb_hits = 1000
        mock_response.processing_time_ms = 2

        loader.client.search_single_index.return_value = mock_response

        stats = loader.get_index_stats()

        assert stats["index_name"] == "test_index"
        assert stats["nb_hits"] == 1000
        assert stats["processing_time_ms"] == 2

    def test_get_index_stats_handles_error(self, loader):
        loader.client.search_single_index.side_effect = Exception("API Error")

        stats = loader.get_index_stats()

        assert "error" in stats


class TestDeleteIndex:
    """Tests for index deletion."""

    @pytest.fixture
    def loader(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        with patch("etl.loaders.algolia_loader.SearchClientSync") as mock_client:
            loader = AlgoliaLoader(index_name="test_index")
            loader.client = mock_client.return_value
            return loader

    def test_delete_index_success(self, loader):
        loader.delete_index()
        loader.client.delete_index.assert_called_once_with(index_name="test_index")


class TestDefaultSettings:
    """Tests for default index settings."""

    @pytest.fixture
    def loader(self, monkeypatch):
        monkeypatch.setenv("ALGOLIA_APP_ID", "test_app")
        monkeypatch.setenv("ALGOLIA_ADMIN_KEY", "test_key")
        with patch("etl.loaders.algolia_loader.SearchClientSync"):
            return AlgoliaLoader(index_name="test_index")

    def test_default_settings_has_searchable_attributes(self, loader):
        settings = loader._get_default_settings()
        assert "searchableAttributes" in settings
        assert "model" in settings["searchableAttributes"]
        assert "brand" in settings["searchableAttributes"]

    def test_default_settings_has_facets(self, loader):
        settings = loader._get_default_settings()
        assert "attributesForFaceting" in settings
        assert any("socket" in f for f in settings["attributesForFaceting"])

    def test_default_settings_has_custom_ranking(self, loader):
        settings = loader._get_default_settings()
        assert "customRanking" in settings
        assert "desc(performance_tier_score)" in settings["customRanking"]

    def test_default_settings_has_hits_per_page(self, loader):
        settings = loader._get_default_settings()
        assert settings["hitsPerPage"] == 20
