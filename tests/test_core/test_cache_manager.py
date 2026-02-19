import json
import time
from pathlib import Path
from unittest.mock import patch

import pytest
from app.core.cache_manager import CacheManager
from app.config import settings

@pytest.fixture
def cache_dir(tmp_path):
    return tmp_path / "cache"

@pytest.fixture
def cache_manager(cache_dir):
    return CacheManager(cache_dir=cache_dir)

def test_init_creates_dir(cache_dir):
    assert not cache_dir.exists()
    cm = CacheManager(cache_dir=cache_dir)
    assert cache_dir.exists()
    # metadata.json is NOT created yet, only when saved
    assert not (cache_dir / "metadata.json").exists()
    assert cm.metadata == {}

def test_load_metadata_empty(cache_manager):
    assert cache_manager.metadata == {}

def test_load_metadata_existing(cache_dir):
    metadata = {"dataset1": {"last_updated": 100}}
    cache_dir.mkdir(parents=True, exist_ok=True)
    with open(cache_dir / "metadata.json", "w") as f:
        json.dump(metadata, f)

    cm = CacheManager(cache_dir=cache_dir)
    assert cm.metadata == metadata

def test_load_metadata_corrupted(cache_dir):
    cache_dir.mkdir(parents=True, exist_ok=True)
    with open(cache_dir / "metadata.json", "w") as f:
        f.write("invalid json")

    cm = CacheManager(cache_dir=cache_dir)
    assert cm.metadata == {}

def test_save_metadata(cache_manager):
    cache_manager.metadata = {"dataset1": {"some": "info"}}
    cache_manager._save_metadata()

    with open(cache_manager.metadata_file, "r") as f:
        data = json.load(f)
    assert data == {"dataset1": {"some": "info"}}

def test_update_metadata(cache_manager):
    with patch("time.time", return_value=1234567890.0):
        cache_manager.update_metadata("dataset1", {"status": "ok"})

    assert "dataset1" in cache_manager.metadata
    assert cache_manager.metadata["dataset1"]["status"] == "ok"
    assert cache_manager.metadata["dataset1"]["last_updated"] == 1234567890.0

    # Verify persistence
    with open(cache_manager.metadata_file, "r") as f:
        data = json.load(f)
    assert data["dataset1"]["status"] == "ok"

def test_evict_oldest(cache_manager, monkeypatch):
    # Mock MAX_METADATA_ENTRIES to 2
    monkeypatch.setattr("app.core.cache_manager.MAX_METADATA_ENTRIES", 2)

    # Mock get_processed_path to return a file in our temp dir
    processed_dir = cache_manager.cache_dir / "processed"
    processed_dir.mkdir()

    def mock_get_processed_path(name):
        return processed_dir / f"{name}.geojson"

    monkeypatch.setattr(cache_manager, "get_processed_path", mock_get_processed_path)

    # Create 3 files
    for name in ["d1", "d2", "d3"]:
        (processed_dir / f"{name}.geojson").touch()

    # Add 3 entries with different timestamps
    cache_manager.metadata = {
        "d1": {"last_updated": 100},
        "d2": {"last_updated": 200},
        "d3": {"last_updated": 300},
    }

    # Trigger eviction logic (usually called inside update_metadata)
    cache_manager._evict_oldest()

    # Should have 2 entries
    assert len(cache_manager.metadata) == 2
    # Oldest (d1) should be gone
    assert "d1" not in cache_manager.metadata
    assert "d2" in cache_manager.metadata
    assert "d3" in cache_manager.metadata

    # File for d1 should be gone
    assert not (processed_dir / "d1.geojson").exists()
    assert (processed_dir / "d2.geojson").exists()
    assert (processed_dir / "d3.geojson").exists()

def test_is_cache_valid_fresh(cache_manager, monkeypatch):
    current_time = 1000.0
    monkeypatch.setattr("time.time", lambda: current_time)

    # Cache duration is 7 days = 604800 seconds
    # Fresh if diff < 604800

    cache_manager.metadata["fresh"] = {"last_updated": current_time - 100}
    assert cache_manager.is_cache_valid("fresh")

def test_is_cache_valid_expired(cache_manager, monkeypatch):
    current_time = 1000000.0
    monkeypatch.setattr("time.time", lambda: current_time)

    expiry_seconds = settings.CACHE_DURATION_DAYS * 24 * 60 * 60

    cache_manager.metadata["expired"] = {"last_updated": current_time - expiry_seconds - 1}
    assert not cache_manager.is_cache_valid("expired")

def test_is_cache_valid_missing(cache_manager):
    assert not cache_manager.is_cache_valid("missing")

def test_get_processed_path(cache_manager):
    path = cache_manager.get_processed_path("dataset_abc")
    assert path == settings.PROCESSED_DATA_DIR / "dataset_abc.geojson"
    assert isinstance(path, Path)

def test_get_metadata(cache_manager):
    cache_manager.metadata = {"d1": {"info": "test"}}
    assert cache_manager.get_metadata("d1") == {"info": "test"}
    assert cache_manager.get_metadata("missing") == {}
