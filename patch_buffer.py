with open("app/api/spatial_tools_api.py", "r") as f:
    content = f.read()

search_block = """        # Use PostGIS ST_Buffer
        query = text(\"\"\"
            SELECT ST_AsGeoJSON(
                ST_Buffer(
                    ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography,
                    :distance
                )::geometry
            ) as geojson
        \"\"\")

        result = await db.execute(query, {"lon": lon, "lat": lat, "distance": distance})
        geojson_str = result.scalar()

        if geojson_str:
            geom = json.loads(geojson_str)
            return {
                "type": "Feature",
                "geometry": geom,
                "properties": {"type": "buffer", "radius": distance}
            }
        else:
             raise HTTPException(status_code=500, detail="Buffer generation failed")"""

replace_block = """        # Use PostGIS native JSON construction to bypass FastAPI serialization overhead
        query = text(\"\"\"
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
        \"\"\")

        result = await db.execute(query, {"lon": lon, "lat": lat, "distance": distance})
        geojson_str = result.scalar()

        if geojson_str:
            # Return raw JSON string to avoid Dict overhead
            return Response(content=geojson_str, media_type="application/json")
        else:
             raise HTTPException(status_code=500, detail="Buffer generation failed")"""

new_content = content.replace(search_block, replace_block)

with open("app/api/spatial_tools_api.py", "w") as f:
    f.write(new_content)
