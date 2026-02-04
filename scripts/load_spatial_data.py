import sys
import os
from pathlib import Path
import logging
import geopandas as gpd
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from shapely.geometry import Point, Polygon, MultiPolygon

# Add app to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config import settings
from app.models.sql_models import (
    Suburb, ServiceFacility, TransportStop, TransportRoute,
    FloodZone, ZoningArea, InformalSettlement, SpatialLayer, LayerType
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def load_data():
    """
    Loads data from configured URLs into PostGIS.
    """
    logger.info(f"Connecting to database at {settings.POSTGRES_SERVER}")
    try:
        engine = create_engine(settings.DATABASE_URL)

        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection successful.")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return

    # Mappings for dataset consolidation
    # { "dataset_name": ("target_table", "model_class", "type_field", "type_value") }
    DATASET_MAPPINGS = {
        "suburbs": ("suburbs", Suburb, None, None),
        "schools": ("service_facilities", ServiceFacility, "facility_type", "school"),
        "clinics": ("service_facilities", ServiceFacility, "facility_type", "clinic"),
        "libraries": ("service_facilities", ServiceFacility, "facility_type", "library"),
        "hospitals": ("service_facilities", ServiceFacility, "facility_type", "hospital"),
        "police_stations": ("service_facilities", ServiceFacility, "facility_type", "police_station"),
        "fire_stations": ("service_facilities", ServiceFacility, "facility_type", "fire_station"),
        "water_facilities": ("service_facilities", ServiceFacility, "facility_type", "water_facility"),
        "electricity_facilities": ("service_facilities", ServiceFacility, "facility_type", "electricity_facility"),
        "myciti_stops": ("transport_stops", TransportStop, "stop_type", "bus_stop"),
        "rail_stations": ("transport_stops", TransportStop, "stop_type", "rail_station"),
        "taxi_ranks": ("transport_stops", TransportStop, "stop_type", "taxi_rank"),
        "informal_settlements": ("informal_settlements", InformalSettlement, None, None),
        "zoning": ("zoning_areas", ZoningArea, None, None),
        "flood_zones": ("flood_zones", FloodZone, None, None),
    }

    # Ensure PostGIS extension exists
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.commit()

    for name, url in settings.DATA_URLS.items():
        logger.info(f"Processing {name}...")
        try:
            # Load GeoJSON
            gdf = gpd.read_file(url)

            if gdf.empty:
                logger.warning(f"Dataset {name} is empty.")
                continue

            # Reproject to 4326 if needed
            if gdf.crs is not None and gdf.crs.to_string() != "EPSG:4326":
                gdf = gdf.to_crs("EPSG:4326")

            # Clean column names
            gdf.columns = [c.lower().replace(' ', '_').replace('-', '_') for c in gdf.columns]

            # Fix geometries
            gdf['geometry'] = gdf['geometry'].apply(lambda g: g if g is None or g.is_valid else g.buffer(0))

            # Determine target table
            mapping_info = DATASET_MAPPINGS.get(name)

            if mapping_info:
                table_name, model_class, type_field, type_value = mapping_info
                logger.info(f"Mapping {name} to table {table_name} as {type_value or 'default'}")

                # Normalize data for consolidated tables
                if type_field and type_value:
                    gdf[type_field] = type_value

                # For consolidated tables (ServiceFacility, TransportStop), we need to handle columns
                # We'll map common columns and put the rest in 'properties'
                if table_name in ['service_facilities', 'transport_stops']:
                    # Extract common columns
                    common_cols = []
                    if 'name' in gdf.columns: common_cols.append('name')
                    else: gdf['name'] = "Unknown " + (type_value or "Facility")

                    if 'address' in gdf.columns: common_cols.append('address')

                    # Store everything else in properties
                    props = gdf.drop(columns=['geometry'] + common_cols).to_dict(orient='records')
                    gdf['properties'] = props

                    # Rename geometry to geom for PostGIS
                    gdf = gdf.rename(columns={'geometry': 'geom'})

                    # Filter to model columns only
                    valid_cols = [c.name for c in model_class.__table__.columns if c.name in gdf.columns]
                    gdf_final = gdf[valid_cols].copy()

                    # Append mode if table exists (to not wipe other facility types)
                    if_exists = 'append'
                else:
                    # Rename geometry to geom
                    gdf = gdf.rename(columns={'geometry': 'geom'})
                    # Store excess columns in properties
                    valid_cols = [c.name for c in model_class.__table__.columns if c.name in gdf.columns]
                    # Identify extra columns
                    extra_cols = [c for c in gdf.columns if c not in valid_cols and c != 'geom']
                    if extra_cols:
                        props = gdf[extra_cols].to_dict(orient='records')
                        gdf['properties'] = props

                    gdf_final = gdf[[c for c in valid_cols if c in gdf.columns]].copy()
                    if_exists = 'replace'
            else:
                # Generic load for unmapped datasets
                table_name = name.lower()
                gdf_final = gdf.rename(columns={'geometry': 'geom'})
                if_exists = 'replace'

            logger.info(f"Writing {len(gdf_final)} records to table '{table_name}'...")

            # Write to PostGIS
            gdf_final.to_postgis(
                table_name,
                engine,
                if_exists=if_exists,
                index=True,
                index_label='id',
                dtype={'geom': 'Geometry'}
            )

            # Update SpatialLayer metadata
            with engine.connect() as conn:
                # Check if entry exists
                check_query = text("SELECT id FROM spatial_layers WHERE name = :name")
                result = conn.execute(check_query, {"name": name})

                geom_type = str(gdf.geom_type.mode()[0]) if not gdf.empty else "Unknown"

                if result.rowcount == 0:
                    insert_query = text("""
                        INSERT INTO spatial_layers 
                        (name, table_name, layer_type, source_url, record_count, last_updated, created_at)
                        VALUES (:name, :table_name, :layer_type, :source_url, :record_count, NOW(), NOW())
                    """)
                    conn.execute(insert_query, {
                        "name": name,
                        "table_name": table_name,
                        "layer_type": geom_type,
                        "source_url": url,
                        "record_count": len(gdf)
                    })
                else:
                    update_query = text("""
                        UPDATE spatial_layers 
                        SET record_count = :record_count, last_updated = NOW(), table_name = :table_name
                        WHERE name = :name
                    """)
                    conn.execute(update_query, {
                        "name": name,
                        "record_count": len(gdf),
                        "table_name": table_name
                    })
                conn.commit()

            logger.info(f"Successfully loaded {name}")

        except Exception as e:
            logger.error(f"Failed to load {name}: {e}")

if __name__ == "__main__":
    load_data()
