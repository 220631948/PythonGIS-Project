import time
import geopandas as gpd
from shapely.geometry import Point
import json

# Create a sample GeoDataFrame with 10,000 points
points = [Point(x, y) for x, y in zip(range(10000), range(10000))]
gdf = gpd.GeoDataFrame({'geometry': points, 'id': range(10000)})

# Method 1: to_json() -> loads()
start = time.time()
method1 = json.loads(gdf.to_json())
t1 = time.time() - start

# Method 2: to_json() directly
start = time.time()
method2 = gdf.to_json()
t2 = time.time() - start

print(f"Method 1 (loads): {t1:.4f}s")
print(f"Method 2 (direct string): {t2:.4f}s")
