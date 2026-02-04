import pytest
from sqlalchemy import create_engine, text
from app.config import settings
from app.core.database import SessionLocal, Base

# Skip all tests if DB not reachable
try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    DB_AVAILABLE = True
except:
    DB_AVAILABLE = False

@pytest.mark.skipif(not DB_AVAILABLE, reason="Database not available")
class TestPostGISIntegration:

    @classmethod
    def setup_class(cls):
        # Create tables
        # Base.metadata.create_all(bind=engine) # Handled by migration usually
        pass

    def test_postgis_extension_enabled(self):
        with engine.connect() as conn:
            result = conn.execute(text("SELECT PostGIS_Version();")).scalar()
            assert result is not None
            print(f"PostGIS Version: {result}")

    def test_spatial_query_st_dwithin(self):
        # Create a temp table and test
        with engine.connect() as conn:
            conn.execute(text("CREATE TEMPORARY TABLE test_points (id SERIAL PRIMARY KEY, geom GEOMETRY(POINT, 4326));"))
            conn.execute(text("INSERT INTO test_points (geom) VALUES (ST_SetSRID(ST_MakePoint(18.42, -33.92), 4326));")) # Cape Town
            conn.commit()

            # Query nearby
            result = conn.execute(text("""
                SELECT COUNT(*) FROM test_points 
                WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(18.42, -33.92), 4326)::geography, 1000)
            """)).scalar()

            assert result == 1

            # Query far away
            result_far = conn.execute(text("""
                SELECT COUNT(*) FROM test_points 
                WHERE ST_DWithin(geom::geography, ST_SetSRID(ST_MakePoint(0, 0), 4326)::geography, 1000)
            """)).scalar()

            assert result_far == 0
