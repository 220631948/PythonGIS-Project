import sys
from unittest.mock import MagicMock

# Mock dependencies
sys.modules["pandas"] = MagicMock()
sys.modules["geopandas"] = MagicMock()
sys.modules["httpx"] = MagicMock()
sys.modules["sqlalchemy"] = MagicMock()
sys.modules["app.core.database"] = MagicMock()
sys.modules["app.core.cache_manager"] = MagicMock()
sys.modules["requests"] = MagicMock()
sys.modules["cachetools"] = MagicMock()
sys.modules["psycopg2"] = MagicMock()
sys.modules["shapely"] = MagicMock()
sys.modules["shapely.geometry"] = MagicMock()
sys.modules["pydantic_settings"] = MagicMock()
sys.modules["pydantic"] = MagicMock()
sys.modules["fastapi"] = MagicMock()
sys.modules["uvicorn"] = MagicMock()

# Now try importing
try:
    from app.core.data_loader import DataLoader
    dl = DataLoader()
    print("Import and instantiation successful")
except ImportError as e:
    print(f"Import failed: {e}")
except Exception as e:
    print(f"Error: {e}")
