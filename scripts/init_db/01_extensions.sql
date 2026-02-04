-- Cape Town GeoHub - PostGIS Extensions and Custom Functions
-- This script runs automatically on first database initialization

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS hstore;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Set default SRID to WGS84 (4326)
-- This is the standard coordinate system for GPS and web mapping
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'geometry_4326') THEN
        EXECUTE 'CREATE DOMAIN geometry_4326 AS geometry CHECK (ST_SRID(VALUE) = 4326)';
    END IF;
END $$;

COMMENT ON DOMAIN geometry_4326 IS 'Default geometry domain for WGS84 (SRID 4326)';

-- Custom function: Calculate area in hectares
-- Takes a geometry and returns the area in hectares
CREATE OR REPLACE FUNCTION calculate_area_hectares(geom geometry)
RETURNS numeric AS $$
BEGIN
    IF geom IS NULL THEN
        RETURN NULL;
    END IF;
    -- Transform to appropriate projected CRS for South Africa (EPSG:32734 - UTM Zone 34S)
    -- Then calculate area and convert from m² to hectares
    RETURN ST_Area(ST_Transform(geom, 32734)) / 10000.0;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Custom function: Safe buffer with null handling
-- Takes a geometry and distance in meters, returns buffered geometry
CREATE OR REPLACE FUNCTION safe_buffer(geom geometry, distance_meters double precision)
RETURNS geometry AS $$
BEGIN
    IF geom IS NULL THEN
        RETURN NULL;
    END IF;
    IF distance_meters IS NULL OR distance_meters = 0 THEN
        RETURN geom;
    END IF;
    -- Transform to projected CRS, buffer, transform back to WGS84
    RETURN ST_Transform(
        ST_Buffer(ST_Transform(geom, 32734), distance_meters),
        4326
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper function to create GIST spatial indexes safely
CREATE OR REPLACE FUNCTION create_spatial_gist_index(
    schema_name text,
    table_name text,
    column_name text
)
RETURNS void AS $$
BEGIN
    EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON %I.%I USING GIST (%I)',
        table_name || '_' || column_name || '_gist_idx',
        schema_name,
        table_name,
        column_name
    );
END;
$$ LANGUAGE plpgsql;

-- Create GIST indexes for common geometry tables if they already exist
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'spatial_data'
          AND table_name = 'spatial_cache'
          AND column_name = 'geometry'
    ) THEN
        PERFORM create_spatial_gist_index('spatial_data', 'spatial_cache', 'geometry');
    END IF;
END $$;

-- Create spatial_data schema for organized data storage
CREATE SCHEMA IF NOT EXISTS spatial_data;

-- Grant privileges
GRANT ALL ON SCHEMA spatial_data TO geohub;
GRANT ALL ON ALL TABLES IN SCHEMA spatial_data TO geohub;
ALTER DEFAULT PRIVILEGES IN SCHEMA spatial_data GRANT ALL ON TABLES TO geohub;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'PostGIS extensions and custom functions initialized successfully!';
    RAISE NOTICE 'PostGIS version: %', PostGIS_Version();
END $$;
