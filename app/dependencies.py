from typing import Generator
import logging
from app.config import settings

logger = logging.getLogger(__name__)

def get_settings():
    return settings

# Add more dependencies as needed (e.g., database session, cache manager)
