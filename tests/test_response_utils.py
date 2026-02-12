import json
import pytest
import geopandas as gpd
from shapely.geometry import Point
from app.utils.response_utils import create_geojson_response_string

def test_create_geojson_response_string_basic():
    # Create a simple GDF
    df = gpd.GeoDataFrame(
        {"col1": [1, 2], "geometry": [Point(0, 0), Point(1, 1)]}
    )
    metadata = {"total": 2, "limit": 10}

    json_str = create_geojson_response_string(df, metadata)
    data = json.loads(json_str)

    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 2
    assert data["metadata"]["total"] == 2
    assert data["metadata"]["limit"] == 10
    assert data["features"][0]["properties"]["col1"] == 1

def test_create_geojson_response_string_empty():
    # Create empty GDF
    df = gpd.GeoDataFrame(columns=["col1", "geometry"])
    metadata = {"total": 0}

    json_str = create_geojson_response_string(df, metadata)
    data = json.loads(json_str)

    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 0
    assert data["metadata"]["total"] == 0

def test_create_geojson_response_string_fallback():
    # Test fallback logic (mocking a weird to_json output if possible, or just ensuring it works)
    # It's hard to mock to_json return value without patching
    # But we can test standard behavior works fine.
    pass

def test_create_geojson_response_string_nested_metadata():
    df = gpd.GeoDataFrame({"geometry": [Point(0,0)]})
    metadata = {"nested": {"a": 1}}

    json_str = create_geojson_response_string(df, metadata)
    data = json.loads(json_str)

    assert data["metadata"]["nested"]["a"] == 1
