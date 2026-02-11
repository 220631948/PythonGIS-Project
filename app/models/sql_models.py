"""
SQLAlchemy Spatial Models for Cape Town GeoHub

Defines ORM models with GeoAlchemy2 spatial columns for PostGIS integration.
All models use SRID 4326 (WGS84) for compatibility with web mapping.
"""

from typing import Dict, Any
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, JSON,
    Boolean, Text, Index
)
from sqlalchemy.sql import func
from geoalchemy2 import Geometry
from geoalchemy2.shape import to_shape
from shapely.geometry import mapping
import enum

from app.core.database import Base


# Enums for categorization
class LayerType(str, enum.Enum):
    POINT = "point"
    LINE = "line"
    POLYGON = "polygon"
    MULTIPOINT = "multipoint"
    MULTILINE = "multiline"
    MULTIPOLYGON = "multipolygon"


class FacilityType(str, enum.Enum):
    SCHOOL = "school"
    CLINIC = "clinic"
    HOSPITAL = "hospital"
    LIBRARY = "library"
    POLICE_STATION = "police_station"
    FIRE_STATION = "fire_station"
    WATER_FACILITY = "water_facility"
    ELECTRICITY_FACILITY = "electricity_facility"
    RECYCLING = "recycling"
    OTHER = "other"


class TransportType(str, enum.Enum):
    BUS_STOP = "bus_stop"
    BUS_ROUTE = "bus_route"
    TAXI_RANK = "taxi_rank"
    RAIL_STATION = "rail_station"
    RAIL_LINE = "rail_line"


# ============= Metadata & Configuration Tables =============

class SpatialLayer(Base):
    """
    Metadata registry for all spatial datasets loaded into PostGIS.
    """
    __tablename__ = "spatial_layers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), unique=True, index=True, nullable=False)
    table_name = Column(String(255), nullable=True)  # Actual PostGIS table name
    layer_type = Column(String(50), nullable=True)  # Geometry type
    description = Column(Text, nullable=True)
    source_url = Column(String(512), nullable=True)
    attribution = Column(String(512), nullable=True)
    srid = Column(Integer, default=4326)
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    record_count = Column(Integer, default=0)
    bounds = Column(JSON, nullable=True)  # [minx, miny, maxx, maxy]
    properties_schema = Column(JSON, nullable=True)  # Column info
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "table_name": self.table_name,
            "layer_type": self.layer_type,
            "description": self.description,
            "source_url": self.source_url,
            "srid": self.srid,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
            "record_count": self.record_count,
            "bounds": self.bounds,
            "is_active": self.is_active
        }


# ============= Boundary & Administrative Tables =============

class Suburb(Base):
    """
    Cape Town suburbs/neighbourhoods with polygon boundaries.
    """
    __tablename__ = "suburbs"
    __table_args__ = (
        Index('idx_suburbs_geom', 'geom', postgresql_using='gist'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    official_name = Column(String(255), nullable=True)
    postal_code = Column(String(20), nullable=True)
    city = Column(String(100), default="Cape Town")
    subcouncil = Column(String(100), nullable=True)
    ward = Column(String(50), nullable=True)
    area_sqkm = Column(Float, nullable=True)
    population = Column(Integer, nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "official_name": self.official_name,
            "postal_code": self.postal_code,
            "city": self.city,
            "subcouncil": self.subcouncil,
            "ward": self.ward,
            "area_sqkm": self.area_sqkm,
            "population": self.population
        }

    def to_feature(self) -> Dict[str, Any]:
        geom_json = None
        if self.geom is not None:
            shape = to_shape(self.geom)
            geom_json = mapping(shape)
        return {
            "type": "Feature",
            "id": self.id,
            "geometry": geom_json,
            "properties": self.to_dict()
        }


class Ward(Base):
    """
    Electoral wards in Cape Town.
    """
    __tablename__ = "wards"
    __table_args__ = (
        Index('idx_wards_geom', 'geom', postgresql_using='gist'),
    )

    id = Column(Integer, primary_key=True, index=True)
    ward_id = Column(String(50), unique=True, index=True)
    ward_name = Column(String(255), nullable=True)
    councillor = Column(String(255), nullable=True)
    subcouncil = Column(String(100), nullable=True)
    population = Column(Integer, nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)


# ============= Service Facilities =============

class ServiceFacility(Base):
    """
    Public service facilities (schools, clinics, libraries, etc.).
    """
    __tablename__ = "service_facilities"
    __table_args__ = (
        Index('idx_service_facilities_geom', 'geom', postgresql_using='gist'),
        Index('idx_service_facilities_type', 'facility_type'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    facility_type = Column(String(100), index=True, nullable=False)
    category = Column(String(100), nullable=True)  # Subcategory
    address = Column(String(512), nullable=True)
    suburb_name = Column(String(255), index=True, nullable=True)
    ward = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(512), nullable=True)
    operating_hours = Column(String(255), nullable=True)
    capacity = Column(Integer, nullable=True)
    properties = Column(JSON, nullable=True)  # Store original attributes
    geom = Column(Geometry("POINT", srid=4326), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "facility_type": self.facility_type,
            "category": self.category,
            "address": self.address,
            "suburb_name": self.suburb_name,
            "ward": self.ward,
            "phone": self.phone,
            "properties": self.properties
        }

    def to_feature(self) -> Dict[str, Any]:
        geom_json = None
        if self.geom is not None:
            shape = to_shape(self.geom)
            geom_json = mapping(shape)
        return {
            "type": "Feature",
            "id": self.id,
            "geometry": geom_json,
            "properties": self.to_dict()
        }


# ============= Transport =============

class TransportStop(Base):
    """
    Public transport stops (MyCiTi, train stations, taxi ranks).
    """
    __tablename__ = "transport_stops"
    __table_args__ = (
        Index('idx_transport_stops_geom', 'geom', postgresql_using='gist'),
        Index('idx_transport_stops_type', 'stop_type'),
    )

    id = Column(Integer, primary_key=True, index=True)
    stop_id = Column(String(100), unique=True, index=True, nullable=True)
    name = Column(String(255), index=True, nullable=False)
    stop_type = Column(String(100), index=True, nullable=False)  # bus_stop, rail_station, taxi_rank
    suburb = Column(String(255), nullable=True)
    routes = Column(JSON, nullable=True)  # List of route IDs serving this stop
    wheelchair_accessible = Column(Boolean, nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("POINT", srid=4326), nullable=True)

    def to_feature(self) -> Dict[str, Any]:
        geom_json = mapping(to_shape(self.geom)) if self.geom else None
        return {
            "type": "Feature",
            "id": self.id,
            "geometry": geom_json,
            "properties": {
                "id": self.id,
                "stop_id": self.stop_id,
                "name": self.name,
                "stop_type": self.stop_type,
                "suburb": self.suburb,
                "routes": self.routes
            }
        }


class TransportRoute(Base):
    """
    Public transport routes (bus lines, train lines).
    """
    __tablename__ = "transport_routes"
    __table_args__ = (
        Index('idx_transport_routes_geom', 'geom', postgresql_using='gist'),
    )

    id = Column(Integer, primary_key=True, index=True)
    route_id = Column(String(100), unique=True, index=True, nullable=True)
    name = Column(String(255), index=True, nullable=False)
    route_type = Column(String(100), index=True, nullable=False)  # bus, rail
    operator = Column(String(255), nullable=True)
    color = Column(String(20), nullable=True)  # For display
    frequency_minutes = Column(Integer, nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("MULTILINESTRING", srid=4326), nullable=True)


# ============= Environment & Hazards =============

class FloodZone(Base):
    """
    Flood risk zones.
    """
    __tablename__ = "flood_zones"
    __table_args__ = (
        Index('idx_flood_zones_geom', 'geom', postgresql_using='gist'),
    )

    id = Column(Integer, primary_key=True, index=True)
    zone_id = Column(String(100), nullable=True)
    risk_level = Column(String(50), index=True, nullable=True)  # high, medium, low
    return_period = Column(String(50), nullable=True)  # 1:10, 1:50, 1:100 year
    description = Column(Text, nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)


class BiodiversityArea(Base):
    """
    Biodiversity network and critical biodiversity areas.
    """
    __tablename__ = "biodiversity_areas"
    __table_args__ = (
        Index('idx_biodiversity_areas_geom', 'geom', postgresql_using='gist'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    area_type = Column(String(100), index=True, nullable=True)  # CBA, ESA, PA
    category = Column(String(100), nullable=True)
    status = Column(String(100), nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)


class Wetland(Base):
    """
    Wetland areas.
    """
    __tablename__ = "wetlands"
    __table_args__ = (
        Index('idx_wetlands_geom', 'geom', postgresql_using='gist'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=True)
    wetland_type = Column(String(100), nullable=True)
    status = Column(String(100), nullable=True)
    area_ha = Column(Float, nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)


# ============= Land Use & Zoning =============

class ZoningArea(Base):
    """
    Zoning scheme areas.
    """
    __tablename__ = "zoning_areas"
    __table_args__ = (
        Index('idx_zoning_areas_geom', 'geom', postgresql_using='gist'),
        Index('idx_zoning_areas_zone_type', 'zone_type'),
    )

    id = Column(Integer, primary_key=True, index=True)
    zone_code = Column(String(50), index=True, nullable=True)
    zone_type = Column(String(100), index=True, nullable=True)
    zone_name = Column(String(255), nullable=True)
    permitted_uses = Column(JSON, nullable=True)
    max_height = Column(Float, nullable=True)
    max_coverage = Column(Float, nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)


class InformalSettlement(Base):
    """
    Informal settlement areas.
    """
    __tablename__ = "informal_settlements"
    __table_args__ = (
        Index('idx_informal_settlements_geom', 'geom', postgresql_using='gist'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=True)
    settlement_type = Column(String(100), nullable=True)
    estimated_households = Column(Integer, nullable=True)
    area_ha = Column(Float, nullable=True)
    ward = Column(String(50), nullable=True)
    suburb = Column(String(255), nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)


# ============= Infrastructure =============

class Road(Base):
    """
    Road network.
    """
    __tablename__ = "roads"
    __table_args__ = (
        Index('idx_roads_geom', 'geom', postgresql_using='gist'),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=True)
    road_type = Column(String(100), index=True, nullable=True)  # highway, primary, secondary, etc.
    road_class = Column(String(50), nullable=True)
    suburb = Column(String(255), nullable=True)
    speed_limit = Column(Integer, nullable=True)
    lanes = Column(Integer, nullable=True)
    length_m = Column(Float, nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("MULTILINESTRING", srid=4326), nullable=True)


class Building(Base):
    """
    Building footprints.
    """
    __tablename__ = "buildings"
    __table_args__ = (
        Index('idx_buildings_geom', 'geom', postgresql_using='gist'),
    )

    id = Column(Integer, primary_key=True, index=True)
    building_use = Column(String(100), index=True, nullable=True)
    height_m = Column(Float, nullable=True)
    floors = Column(Integer, nullable=True)
    area_sqm = Column(Float, nullable=True)
    suburb = Column(String(255), nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)


# ============= Safety =============

class CrimePrecinct(Base):
    """
    Police precincts with aggregated crime statistics.
    """
    __tablename__ = "crime_precincts"
    __table_args__ = (
        Index('idx_crime_precincts_geom', 'geom', postgresql_using='gist'),
    )

    id = Column(Integer, primary_key=True, index=True)
    precinct_name = Column(String(255), index=True, nullable=False)
    station_name = Column(String(255), nullable=True)
    risk_level = Column(String(50), index=True, nullable=True)  # High, Medium, Low
    crime_index = Column(Float, nullable=True)
    year = Column(Integer, nullable=True)
    properties = Column(JSON, nullable=True)  # Crime stats by category
    geom = Column(Geometry("MULTIPOLYGON", srid=4326), nullable=True)


# ============= Generic Spatial Feature =============

class GenericSpatialFeature(Base):
    """
    Generic table for storing arbitrary spatial features that don't fit
    into the specific models above. Useful for dynamic data loading.
    """
    __tablename__ = "generic_spatial_features"
    __table_args__ = (
        Index('idx_generic_features_geom', 'geom', postgresql_using='gist'),
        Index('idx_generic_features_layer', 'layer_name'),
    )

    id = Column(Integer, primary_key=True, index=True)
    layer_name = Column(String(255), index=True, nullable=False)
    feature_id = Column(String(255), nullable=True)  # Original ID
    name = Column(String(255), nullable=True)
    properties = Column(JSON, nullable=True)
    geom = Column(Geometry("GEOMETRY", srid=4326), nullable=True)  # Generic geometry
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ============= Suitability Analysis Results =============

class SuitabilityAnalysisResult(Base):
    """
    Stores results of site suitability analyses for later retrieval.
    """
    __tablename__ = "suitability_results"
    __table_args__ = (
        Index('idx_suitability_results_geom', 'geom', postgresql_using='gist'),
    )

    id = Column(Integer, primary_key=True, index=True)
    analysis_name = Column(String(255), nullable=True)
    analysis_type = Column(String(100), nullable=True)  # point, polygon, multi-site
    overall_score = Column(Float, nullable=True)
    criteria_scores = Column(JSON, nullable=True)  # Individual criterion scores
    weights = Column(JSON, nullable=True)  # Weights used
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String(255), nullable=True)  # User/session ID
    geom = Column(Geometry("GEOMETRY", srid=4326), nullable=True)


# Export all models for Alembic autogeneration
__all__ = [
    "SpatialLayer",
    "Suburb",
    "Ward",
    "ServiceFacility",
    "TransportStop",
    "TransportRoute",
    "FloodZone",
    "BiodiversityArea",
    "Wetland",
    "ZoningArea",
    "InformalSettlement",
    "Road",
    "Building",
    "CrimePrecinct",
    "GenericSpatialFeature",
    "SuitabilityAnalysisResult",
    "LayerType",
    "FacilityType",
    "TransportType",
]
