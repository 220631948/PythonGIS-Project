"""
Demo test to verify the testing setup works correctly.
This test is created as part of the .junie/guidelines.md documentation.
"""
import pytest
from app.config import Settings


class TestSettingsDefaults:
    """Verify that Settings can be instantiated with defaults."""

    def test_default_app_name(self):
        s = Settings()
        assert s.APP_NAME == "Cape Town GeoHub"

    def test_default_crs(self):
        s = Settings()
        assert s.TARGET_CRS == "EPSG:4326"
        assert s.PROJECTED_CRS == "EPSG:32734"

    def test_database_url_format(self):
        s = Settings()
        assert s.DATABASE_URL.startswith("postgresql://")
