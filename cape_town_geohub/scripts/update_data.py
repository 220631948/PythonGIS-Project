import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from app.config import DATA_URLS
from app.data_loader import get_gdf
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_all_datasets():
    logger.info("Starting data update process...")
    for name in DATA_URLS.keys():
        logger.info(f"Checking dataset: {name}")
        try:
            get_gdf(name)
        except Exception as e:
            logger.error(f"Failed to update {name}: {e}")
    logger.info("Data update process completed.")

if __name__ == "__main__":
    update_all_datasets()
