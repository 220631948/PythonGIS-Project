"""initial spatial setup

Revision ID: 001
Revises:
Create Date: 2026-01-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # Enable PostGIS extensions
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    op.execute("CREATE EXTENSION IF NOT EXISTS postgis_topology;")

    # --- Metadata Tables ---
    op.create_table('spatial_layers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('table_name', sa.String(length=255), nullable=True),
        sa.Column('layer_type', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('source_url', sa.String(length=512), nullable=True),
        sa.Column('attribution', sa.String(length=512), nullable=True),
        sa.Column('srid', sa.Integer(), nullable=True),
        sa.Column('last_updated', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('record_count', sa.Integer(), nullable=True),
        sa.Column('bounds', sa.JSON(), nullable=True),
        sa.Column('properties_schema', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_spatial_layers_id'), 'spatial_layers', ['id'], unique=False)
    op.create_index(op.f('ix_spatial_layers_name'), 'spatial_layers', ['name'], unique=True)

    # --- Boundaries ---
    op.create_table('suburbs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('official_name', sa.String(length=255), nullable=True),
        sa.Column('postal_code', sa.String(length=20), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('subcouncil', sa.String(length=100), nullable=True),
        sa.Column('ward', sa.String(length=50), nullable=True),
        sa.Column('area_sqkm', sa.Float(), nullable=True),
        sa.Column('population', sa.Integer(), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_suburbs_id'), 'suburbs', ['id'], unique=False)
    op.create_index(op.f('ix_suburbs_name'), 'suburbs', ['name'], unique=False)
    # Note: GeoAlchemy2 automatically creates spatial indexes

    op.create_table('wards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('ward_id', sa.String(length=50), nullable=True),
        sa.Column('ward_name', sa.String(length=255), nullable=True),
        sa.Column('councillor', sa.String(length=255), nullable=True),
        sa.Column('subcouncil', sa.String(length=100), nullable=True),
        sa.Column('population', sa.Integer(), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_wards_id'), 'wards', ['id'], unique=False)
    op.create_index(op.f('ix_wards_ward_id'), 'wards', ['ward_id'], unique=True)

    # --- Service Facilities ---
    op.create_table('service_facilities',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('facility_type', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('address', sa.String(length=512), nullable=True),
        sa.Column('suburb_name', sa.String(length=255), nullable=True),
        sa.Column('ward', sa.String(length=50), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('website', sa.String(length=512), nullable=True),
        sa.Column('operating_hours', sa.String(length=255), nullable=True),
        sa.Column('capacity', sa.Integer(), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_service_facilities_id'), 'service_facilities', ['id'], unique=False)
    op.create_index(op.f('ix_service_facilities_name'), 'service_facilities', ['name'], unique=False)
    op.create_index(op.f('ix_service_facilities_facility_type'), 'service_facilities', ['facility_type'], unique=False)
    op.create_index(op.f('ix_service_facilities_suburb_name'), 'service_facilities', ['suburb_name'], unique=False)

    # --- Transport ---
    op.create_table('transport_stops',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('stop_id', sa.String(length=100), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('stop_type', sa.String(length=100), nullable=False),
        sa.Column('suburb', sa.String(length=255), nullable=True),
        sa.Column('routes', sa.JSON(), nullable=True),
        sa.Column('wheelchair_accessible', sa.Boolean(), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='POINT', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transport_stops_id'), 'transport_stops', ['id'], unique=False)
    op.create_index(op.f('ix_transport_stops_stop_id'), 'transport_stops', ['stop_id'], unique=True)
    op.create_index(op.f('ix_transport_stops_stop_type'), 'transport_stops', ['stop_type'], unique=False)

    op.create_table('transport_routes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('route_id', sa.String(length=100), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('route_type', sa.String(length=100), nullable=False),
        sa.Column('operator', sa.String(length=255), nullable=True),
        sa.Column('color', sa.String(length=20), nullable=True),
        sa.Column('frequency_minutes', sa.Integer(), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTILINESTRING', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_transport_routes_id'), 'transport_routes', ['id'], unique=False)
    op.create_index(op.f('ix_transport_routes_route_id'), 'transport_routes', ['route_id'], unique=True)

    # --- Environment ---
    op.create_table('flood_zones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('zone_id', sa.String(length=100), nullable=True),
        sa.Column('risk_level', sa.String(length=50), nullable=True),
        sa.Column('return_period', sa.String(length=50), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_flood_zones_id'), 'flood_zones', ['id'], unique=False)

    op.create_table('biodiversity_areas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('area_type', sa.String(length=100), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=100), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_biodiversity_areas_id'), 'biodiversity_areas', ['id'], unique=False)

    op.create_table('wetlands',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('wetland_type', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=100), nullable=True),
        sa.Column('area_ha', sa.Float(), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_wetlands_id'), 'wetlands', ['id'], unique=False)

    # --- Land Use ---
    op.create_table('zoning_areas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('zone_code', sa.String(length=50), nullable=True),
        sa.Column('zone_type', sa.String(length=100), nullable=True),
        sa.Column('zone_name', sa.String(length=255), nullable=True),
        sa.Column('permitted_uses', sa.JSON(), nullable=True),
        sa.Column('max_height', sa.Float(), nullable=True),
        sa.Column('max_coverage', sa.Float(), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_zoning_areas_id'), 'zoning_areas', ['id'], unique=False)
    op.create_index(op.f('ix_zoning_areas_zone_type'), 'zoning_areas', ['zone_type'], unique=False)

    op.create_table('informal_settlements',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('settlement_type', sa.String(length=100), nullable=True),
        sa.Column('estimated_households', sa.Integer(), nullable=True),
        sa.Column('area_ha', sa.Float(), nullable=True),
        sa.Column('ward', sa.String(length=50), nullable=True),
        sa.Column('suburb', sa.String(length=255), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_informal_settlements_id'), 'informal_settlements', ['id'], unique=False)

    # --- Infrastructure ---
    op.create_table('roads',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('road_type', sa.String(length=100), nullable=True),
        sa.Column('road_class', sa.String(length=50), nullable=True),
        sa.Column('suburb', sa.String(length=255), nullable=True),
        sa.Column('speed_limit', sa.Integer(), nullable=True),
        sa.Column('lanes', sa.Integer(), nullable=True),
        sa.Column('length_m', sa.Float(), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTILINESTRING', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_roads_id'), 'roads', ['id'], unique=False)

    op.create_table('buildings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('building_use', sa.String(length=100), nullable=True),
        sa.Column('height_m', sa.Float(), nullable=True),
        sa.Column('floors', sa.Integer(), nullable=True),
        sa.Column('area_sqm', sa.Float(), nullable=True),
        sa.Column('suburb', sa.String(length=255), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_buildings_id'), 'buildings', ['id'], unique=False)

    # --- Safety ---
    op.create_table('crime_precincts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('precinct_name', sa.String(length=255), nullable=False),
        sa.Column('station_name', sa.String(length=255), nullable=True),
        sa.Column('risk_level', sa.String(length=50), nullable=True),
        sa.Column('crime_index', sa.Float(), nullable=True),
        sa.Column('year', sa.Integer(), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_crime_precincts_id'), 'crime_precincts', ['id'], unique=False)

    # --- Generic & Analysis ---
    op.create_table('generic_spatial_features',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('layer_name', sa.String(length=255), nullable=False),
        sa.Column('feature_id', sa.String(length=255), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=True),
        sa.Column('properties', sa.JSON(), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='GEOMETRY', srid=4326), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_generic_spatial_features_id'), 'generic_spatial_features', ['id'], unique=False)
    op.create_index(op.f('ix_generic_spatial_features_layer_name'), 'generic_spatial_features', ['layer_name'], unique=False)

    op.create_table('suitability_results',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('analysis_name', sa.String(length=255), nullable=True),
        sa.Column('analysis_type', sa.String(length=100), nullable=True),
        sa.Column('overall_score', sa.Float(), nullable=True),
        sa.Column('criteria_scores', sa.JSON(), nullable=True),
        sa.Column('weights', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('created_by', sa.String(length=255), nullable=True),
        sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='GEOMETRY', srid=4326), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_suitability_results_id'), 'suitability_results', ['id'], unique=False)


def downgrade() -> None:
    # Drop in reverse order of dependencies
    op.drop_table('suitability_results')
    op.drop_table('generic_spatial_features')
    op.drop_table('crime_precincts')
    op.drop_table('buildings')
    op.drop_table('roads')
    op.drop_table('informal_settlements')
    op.drop_table('zoning_areas')
    op.drop_table('wetlands')
    op.drop_table('biodiversity_areas')
    op.drop_table('flood_zones')
    op.drop_table('transport_routes')
    op.drop_table('transport_stops')
    op.drop_table('service_facilities')
    op.drop_table('wards')
    op.drop_table('suburbs')
    op.drop_table('spatial_layers')
    # op.execute("DROP EXTENSION IF EXISTS postgis;")
