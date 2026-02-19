import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

class DataRetrievalLogger:
    """Manages logging of data retrieval operations."""

    def __init__(self):
        self._retrieval_log: List[Dict[str, Any]] = []

    def log_retrieval(self, dataset_name: str, success: bool, message: str):
        """Log data retrieval attempts for monitoring."""
        log_entry = {
            "dataset": dataset_name,
            "success": success,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }
        self._retrieval_log.append(log_entry)
        # Keep only last 100 entries
        if len(self._retrieval_log) > 100:
            self._retrieval_log = self._retrieval_log[-100:]

        if not success:
            logger.error(f"Data retrieval failed for {dataset_name}: {message}")

    def get_log(self) -> List[Dict[str, Any]]:
        """Get the data retrieval log for monitoring."""
        return self._retrieval_log.copy()
