import json
import logging
import time
from pathlib import Path
from typing import Any, Dict, Optional
from app.config import settings

logger = logging.getLogger(__name__)

# Maximum number of dataset entries in metadata (prevents unbounded growth)
MAX_METADATA_ENTRIES = 100


class CacheManager:
    def __init__(self, cache_dir: Path = settings.CACHE_DIR):
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.metadata_file = self.cache_dir / "metadata.json"
        self._load_metadata()

    def _load_metadata(self):
        if self.metadata_file.exists():
            try:
                with open(self.metadata_file, "r") as f:
                    self.metadata = json.load(f)
            except (json.JSONDecodeError, OSError) as e:
                logger.error(f"Error loading metadata (resetting): {e}")
                self.metadata = {}
        else:
            self.metadata = {}

    def _save_metadata(self):
        try:
            with open(self.metadata_file, "w") as f:
                json.dump(self.metadata, f, indent=4)
        except OSError as e:
            logger.error(f"Error saving metadata: {e}")

    def _evict_oldest(self) -> None:
        """Remove the oldest metadata entry if we exceed MAX_METADATA_ENTRIES."""
        if len(self.metadata) <= MAX_METADATA_ENTRIES:
            return
        # Find oldest entry by last_updated timestamp
        oldest_key = min(
            self.metadata,
            key=lambda k: self.metadata[k].get("last_updated", 0),
        )
        logger.info(f"CacheManager: evicting oldest entry '{oldest_key}'")
        # Also remove the cached file if it exists
        cached_file = self.get_processed_path(oldest_key)
        if cached_file.exists():
            try:
                cached_file.unlink()
            except OSError as e:
                logger.warning(f"Failed to remove cached file {cached_file}: {e}")
        del self.metadata[oldest_key]

    def is_cache_valid(self, dataset_name: str) -> bool:
        if dataset_name not in self.metadata:
            return False

        last_updated = self.metadata[dataset_name].get("last_updated", 0)
        expiry_seconds = settings.CACHE_DURATION_DAYS * 24 * 60 * 60

        return (time.time() - last_updated) < expiry_seconds

    def get_processed_path(self, dataset_name: str) -> Path:
        return settings.PROCESSED_DATA_DIR / f"{dataset_name}.geojson"

    def update_metadata(self, dataset_name: str, info: Dict[str, Any]):
        self.metadata[dataset_name] = {
            **self.metadata.get(dataset_name, {}),
            **info,
            "last_updated": time.time(),
        }
        self._evict_oldest()
        self._save_metadata()

    def get_metadata(self, dataset_name: str) -> Dict[str, Any]:
        return self.metadata.get(dataset_name, {})

cache_manager = CacheManager()
