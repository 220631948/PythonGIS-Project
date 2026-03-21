import asyncio
from app.core.database import get_db, engine
from sqlalchemy import text

async def main():
    async for db in get_db():
        query = text("""
            SELECT json_build_object(
                'type', 'Feature',
                'geometry', ST_AsGeoJSON(
                    ST_Buffer(
                        ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                        :distance
                    )::geometry
                )::json,
                'properties', json_build_object(
                    'type', 'buffer',
                    'radius', :distance
                )
            )::text as geojson
        """)
        result = await db.execute(query, {"lon": 18.42, "lat": -33.92, "distance": 500})
        geojson_str = result.scalar()
        print(geojson_str)
        break

if __name__ == "__main__":
    asyncio.run(main())
