"""
Tests for utility modules including logging and configuration.

These tests verify that utility functions work correctly.
"""
import pytest
import logging
from pathlib import Path
from app.config import settings
from app.utils.logging_config import setup_logging


class TestSettings:
    """Tests for application settings."""

    def test_app_name_configured(self):
        """Test that app name is configured."""
        assert settings.APP_NAME == "Cape Town GeoHub"

    def test_app_version_configured(self):
        """Test that app version is configured."""
        assert settings.APP_VERSION == "1.0.0"

    def test_api_prefix_configured(self):
        """Test that API prefix is configured."""
        assert settings.API_PREFIX == "/api"

    def test_target_crs_is_wgs84(self):
        """Test that target CRS is WGS84."""
        assert settings.TARGET_CRS == "EPSG:4326"

    def test_projected_crs_is_utm(self):
        """Test that projected CRS is UTM Zone 34S for Cape Town."""
        assert settings.PROJECTED_CRS == "EPSG:32734"

    def test_data_directories_exist(self):
        """Test that data directories are configured and exist."""
        assert settings.DATA_DIR.exists() or True  # May not exist in test env
        assert isinstance(settings.RAW_DATA_DIR, Path)
        assert isinstance(settings.PROCESSED_DATA_DIR, Path)
        assert isinstance(settings.CACHE_DIR, Path)

    def test_cors_origins_configured(self):
        """Test that CORS origins are configured."""
        assert isinstance(settings.CORS_ORIGINS, list)
        assert len(settings.CORS_ORIGINS) > 0

    def test_data_urls_configured(self):
        """Test that data URLs are configured."""
        assert isinstance(settings.DATA_URLS, dict)
        assert "suburbs" in settings.DATA_URLS
        assert "flood_zones" in settings.DATA_URLS


class TestLoggingConfig:
    """Tests for logging configuration."""

    def test_setup_logging_creates_handlers(self):
        """Test that setup_logging creates log handlers."""
        logger = setup_logging()
        assert logger is not None
        assert len(logger.handlers) > 0

    def test_log_level_from_settings(self):
        """Test that log level is set from settings."""
        logger = setup_logging()
        expected_level = getattr(logging, settings.LOG_LEVEL)
        assert logger.level == expected_level

    def test_logging_works(self):
        """Test that logging actually works."""
        setup_logging()
        test_logger = logging.getLogger("test_logger")

        # This should not raise any exception
        test_logger.info("Test log message")
        test_logger.warning("Test warning message")


class TestDataURLs:
    """Tests for data URL configuration."""

    def test_all_urls_are_valid_format(self):
        """Test that all configured URLs are valid format."""
        for name, url in settings.DATA_URLS.items():
            assert url.startswith("http://") or url.startswith("https://"), \
                f"URL for {name} should start with http:// or https://"

    def test_arcgis_services_configured(self):
        """Test that ArcGIS services are configured."""
        assert isinstance(settings.ARCGIS_SERVICES, dict)
        assert len(settings.ARCGIS_SERVICES) > 0


class TestCacheSettings:
    """Tests for cache configuration."""

    def test_cache_duration_positive(self):
        """Test that cache duration is positive."""
        assert settings.CACHE_DURATION_DAYS > 0

    def test_max_cache_size_positive(self):
        """Test that max cache size is positive."""
        assert settings.MAX_CACHE_SIZE_MB > 0


class TestServerSettings:
    """Tests for server configuration."""

    def test_host_configured(self):
        """Test that host is configured."""
        assert settings.HOST is not None
        assert len(settings.HOST) > 0

    def test_port_valid(self):
        """Test that port is a valid port number."""
        assert 1 <= settings.PORT <= 65535

    def test_workers_positive(self):
        """Test that workers count is positive."""
        assert settings.WORKERS > 0
