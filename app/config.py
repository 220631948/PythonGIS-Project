from pathlib import Path
from typing import Dict, List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Application Metadata
    APP_NAME: str = "Cape Town GeoHub"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    API_PREFIX: str = "/api"

    # Directory Paths
    BASE_DIR: Path = Path(__file__).resolve().parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DATA_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DATA_DIR: Path = DATA_DIR / "processed"
    CACHE_DIR: Path = DATA_DIR / "cache"
    STATIC_DIR: Path = BASE_DIR / "static"
    LOG_DIR: Path = BASE_DIR / "logs"

    # Database Settings
    POSTGRES_USER: str = "geohub"
    POSTGRES_PASSWORD: str = ""  # Set via POSTGRES_PASSWORD env var — required for production
    POSTGRES_SERVER: str = "db"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "geohub_db"

    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Spatial Settings
    TARGET_CRS: str = "EPSG:4326"
    PROJECTED_CRS: str = "EPSG:32734"  # UTM Zone 34S for Cape Town
    SIMPLIFICATION_TOLERANCE: float = 0.0001
    COORDINATE_PRECISION: int = 6

    # Data Source URLs - Using verified City of Cape Town ArcGIS MapServer endpoints
    DATA_URLS: Dict[str, str] = {
        # Open Data Service endpoints (verified working)
        "informal_settlements": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/75/query?where=1%3D1&outFields=*&f=geojson",
        # Using Suburbs as placeholder if not found
        "water_facilities": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/178/query?where=1%3D1&outFields=*&f=geojson",
        # Smart Facilities Water
        "electricity_facilities": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/176/query?where=1%3D1&outFields=*&f=geojson",
        # Smart Facilities Energy
        "myciti_stops": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/96/query?where=1%3D1&outFields=*&f=geojson",
        "myciti_routes": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/95/query?where=1%3D1&outFields=*&f=geojson",
        "rail_stations": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/235/query?where=1%3D1&outFields=*&f=geojson",
        "flood_zones": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/71/query?where=1%3D1&outFields=*&f=geojson",
        # Stormwater Waterbodies
        "suburbs": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/75/query?where=1%3D1&outFields=*&f=geojson",
        "zoning": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/58/query?where=1%3D1&outFields=*&f=geojson",
        "waste_collection": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/136/query?where=1%3D1&outFields=*&f=geojson",
        # Refuse Collection Beats
        "recycling_facilities": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/101/query?where=1%3D1&outFields=*&f=geojson",
        # Think Twice Areas - Recycling
        "clinics": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/44/query?where=1%3D1&outFields=*&f=geojson",
        # Health Care Facilities
        "schools": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/26/query?where=1%3D1&outFields=*&f=geojson",
        "parks": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/29/query?where=1%3D1&outFields=*&f=geojson",
        "sports_grounds": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/27/query?where=1%3D1&outFields=*&f=geojson",
        "swimming_pools": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/28/query?where=1%3D1&outFields=*&f=geojson",
        "cemeteries": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/30/query?where=1%3D1&outFields=*&f=geojson",
        "trading_locations": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/39/query?where=1%3D1&outFields=*&f=geojson",
        # Informal Trading
        "courts": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/19/query?where=1%3D1&outFields=*&f=geojson",
        # Municipal Courts
        "housing_offices": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/152/query?where=1%3D1&outFields=*&f=geojson",
        # Housing and Maintenance Offices
        "open_spaces": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/212/query?where=1%3D1&outFields=*&f=geojson",
        # Environmental Focus Areas
        "building_footprints": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/86/query?where=1%3D1&outFields=*&resultRecordCount=1000&f=geojson",
        "precincts": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/75/query?where=1%3D1&outFields=*&f=geojson",
        # Suburbs as proxy for precincts
        "crime_stats": "https://raw.githubusercontent.com/datasets/crime-statistics/master/data/crime-stats.csv",
        # Placeholder external dataset
    }

    # ArcGIS Map Services (for direct frontend consumption or tiles)
    ARCGIS_SERVICES: Dict[str, str] = {
        "aerial_imagery": "https://citymaps.capetown.gov.za/agsext/rest/services/Background_Maps/City_Aerial_Photography_2023/MapServer",
        "contours": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/161",
        # 2m Contours
        "building_footprints": "https://citymaps.capetown.gov.za/agsext/rest/services/Theme_Based/Open_Data_Service/MapServer/86",
    }

    # Cache Settings
    CACHE_DURATION_DAYS: int = 7
    MAX_CACHE_SIZE_MB: int = 500

    # API Settings
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:3000",  # Alternate dev port
        "http://localhost:4173",  # Vite preview
        "http://localhost:8000",  # Self (for testing)
        "https://*.github.io",  # GitHub Pages
    ]
    RATE_LIMIT_PER_MINUTE: int = 60

    # Logging
    LOG_LEVEL: str = "INFO"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 1

    # Admin Authentication
    # Set via ADMIN_API_KEY env var or .env file. Empty = admin endpoints unprotected.
    ADMIN_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()

# Create directories if they don't exist
for d in [
    settings.RAW_DATA_DIR,
    settings.PROCESSED_DATA_DIR,
    settings.CACHE_DIR,
    settings.LOG_DIR,
]:
    d.mkdir(parents=True, exist_ok=True)
