# Quick Start Guide - New Features (v2.0)

## Getting Started in 5 Minutes

### 1. Install New Dependencies

```bash
cd /home/mr/PycharmProjects/PythonGIS\ Project
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Start the Server

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Open API Documentation

Visit: http://localhost:8000/api/docs

### 4. Try a New Feature

**Example: AI Traffic Prediction**

```bash
curl -X POST http://localhost:8000/api/ai/traffic/predict \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": -33.925, "lng": 18.424},
    "datetime": "2026-02-10T17:00:00Z",
    "radius_meters": 500
  }'
```

**Response**:
```json
{
  "prediction": {
    "traffic_score": 82.3,
    "level": "heavy",
    "color": "#FF9900",
    "confidence": 0.75
  },
  "affected_roads": [
    {"name": "Main Road", "score": 74.1},
    {"name": "High Street", "score": 90.5}
  ],
  "recommendations": [
    "Traffic expected to be heavy",
    "Consider alternative routes",
    "Allow extra 15 minutes"
  ]
}
```

---

## Feature Quick Tests

### 3D Visualization

**Building Extrusion**:
```bash
curl -X POST http://localhost:8000/api/3d/buildings/extrude \
  -H "Content-Type: application/json" \
  -d '{
    "bounds": {
      "minLat": -33.93,
      "minLng": 18.42,
      "maxLat": -33.92,
      "maxLng": 18.43
    },
    "default_height": 15
  }'
```

**Shadow Analysis**:
```bash
curl -X POST http://localhost:8000/api/3d/shadow/analysis \
  -H "Content-Type: application/json" \
  -d '{
    "geometry": {
      "type": "Polygon",
      "coordinates": [[[18.42, -33.92], [18.43, -33.92], [18.43, -33.93], [18.42, -33.93], [18.42, -33.92]]]
    },
    "height": 20,
    "datetime": "2026-02-10T14:00:00Z",
    "location": {"lat": -33.925, "lng": 18.425}
  }'
```

### Community Engagement

**Report an Issue**:
```bash
curl -X POST http://localhost:8000/api/community/issues/report \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Pothole on Main Road",
    "description": "Large pothole causing traffic issues",
    "category": "pothole",
    "location": {"lat": -33.925, "lng": 18.424},
    "severity": "high",
    "reporter_name": "John Doe",
    "reporter_email": "john@example.com"
  }'
```

**Browse Issues**:
```bash
curl http://localhost:8000/api/community/issues/list?category=pothole&limit=10
```

### Notifications

**Subscribe to Alerts**:
```bash
curl -X POST http://localhost:8000/api/notifications/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "user_email": "user@example.com",
    "alert_types": ["traffic", "safety", "construction"],
    "location": {"lat": -33.925, "lng": 18.424},
    "radius_meters": 1000,
    "channels": ["push", "email"],
    "frequency": "immediate"
  }'
```

**Get Active Alerts**:
```bash
curl "http://localhost:8000/api/notifications/alerts/active?lat=-33.925&lng=18.424&radius_meters=2000"
```

### Demographics

**Population Density**:
```bash
curl -X POST http://localhost:8000/api/demographics/density/heatmap \
  -H "Content-Type: application/json" \
  -d '{
    "bounds": {
      "minLat": -33.93,
      "minLng": 18.42,
      "maxLat": -33.92,
      "maxLng": 18.43
    },
    "resolution": 50
  }'
```

**Socioeconomic Indicators**:
```bash
curl http://localhost:8000/api/demographics/indicators/suburb_001
```

### Environmental

**Flood Risk Assessment**:
```bash
curl -X POST http://localhost:8000/api/environmental/flood/risk \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": -33.925, "lng": 18.424},
    "scenario": "2050"
  }'
```

**Air Quality**:
```bash
curl "http://localhost:8000/api/environmental/air-quality?lat=-33.925&lng=18.424"
```

### Comparison

**Neighborhood Comparison**:
```bash
curl -X POST http://localhost:8000/api/comparison/neighborhoods \
  -H "Content-Type: application/json" \
  -d '{
    "area_ids": ["area_1", "area_2", "area_3"],
    "metrics": ["population", "income", "crime", "schools"]
  }'
```

**Temporal Comparison**:
```bash
curl "http://localhost:8000/api/comparison/temporal?area_id=suburb_001&start_year=2020&end_year=2025&metrics=population,developments"
```

### Workspaces

**Create Workspace**:
```bash
curl -X POST http://localhost:8000/api/workspace/workspaces \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Urban Planning Project 2026",
    "description": "Analysis of development proposals",
    "owner_id": "user123",
    "team_members": ["user456", "user789"],
    "is_public": false
  }'
```

### Dashboard Builder

**Get Templates**:
```bash
curl http://localhost:8000/api/dashboard-builder/templates
```

### Data Quality

**Quality Overview**:
```bash
curl http://localhost:8000/api/data-quality/overview
```

**Dataset Quality**:
```bash
curl http://localhost:8000/api/data-quality/dataset/suburbs
```

### Advanced Search

**Spatial Query**:
```bash
curl -X POST http://localhost:8000/api/advanced-search/spatial-query \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "near",
    "source_dataset": "schools",
    "geometry": {
      "type": "Point",
      "coordinates": [18.424, -33.925]
    },
    "distance_meters": 1000
  }'
```

**Cross-Dataset Search**:
```bash
curl "http://localhost:8000/api/advanced-search/cross-dataset-search?query=park&datasets=parks,schools,services"
```

### Performance

**Clustered Data**:
```bash
curl "http://localhost:8000/api/performance/cluster/schools?zoom=12&bounds=18.40,-33.94,18.46,-33.90"
```

**Cache Stats**:
```bash
curl http://localhost:8000/api/performance/cache/stats
```

### Extensions (API Marketplace)

**Browse Marketplace**:
```bash
curl http://localhost:8000/api/extensions/marketplace?limit=10
```

**Create API Key**:
```bash
curl -X POST http://localhost:8000/api/extensions/api-keys?user_id=developer123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Extension API Key",
    "description": "For testing my extension",
    "rate_limit": 1000,
    "quota": 10000,
    "scopes": ["read", "write"]
  }'
```

---

## Interactive API Exploration

### Using Swagger UI

1. Visit http://localhost:8000/api/docs
2. Expand any endpoint group (e.g., "3D Visualization", "AI Insights")
3. Click "Try it out" on any endpoint
4. Fill in the parameters
5. Click "Execute"
6. View the response

### Using ReDoc

Alternative documentation at: http://localhost:8000/api/redoc

---

## Common Workflows

### Workflow 1: Community Issue Reporting

```bash
# 1. Citizen reports pothole
ISSUE_RESPONSE=$(curl -X POST http://localhost:8000/api/community/issues/report \
  -H "Content-Type: application/json" \
  -d '{"title": "Pothole", "description": "Large pothole", "category": "pothole", "location": {"lat": -33.925, "lng": 18.424}, "severity": "high"}')

ISSUE_ID=$(echo $ISSUE_RESPONSE | jq -r '.issue_id')
echo "Issue ID: $ISSUE_ID"

# 2. Admin creates alert for nearby residents
curl -X POST http://localhost:8000/api/notifications/alerts/create \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Pothole Reported - Road Maintenance Scheduled\",
    \"message\": \"A pothole has been reported and maintenance is scheduled.\",
    \"alert_type\": \"construction\",
    \"severity\": \"medium\",
    \"location\": {\"lat\": -33.925, \"lng\": 18.424},
    \"radius_meters\": 500
  }"

# 3. Check issue status
curl http://localhost:8000/api/community/issues/$ISSUE_ID
```

### Workflow 2: Urban Planning Analysis

```bash
# 1. Create workspace
WORKSPACE_RESPONSE=$(curl -X POST http://localhost:8000/api/workspace/workspaces \
  -H "Content-Type: application/json" \
  -d '{"name": "New Park Planning", "owner_id": "planner1"}')

WORKSPACE_ID=$(echo $WORKSPACE_RESPONSE | jq -r '.workspace_id')

# 2. Run demographic analysis
curl http://localhost:8000/api/demographics/indicators/target_area

# 3. Check environmental factors
curl "http://localhost:8000/api/environmental/green-space/accessibility?lat=-33.925&lng=18.424"

# 4. Save scenario
curl -X POST http://localhost:8000/api/workspace/scenarios \
  -H "Content-Type: application/json" \
  -d "{
    \"workspace_id\": \"$WORKSPACE_ID\",
    \"name\": \"Scenario A - Central Location\",
    \"layers\": [\"demographics\", \"parks\", \"transport\"],
    \"map_state\": {\"center\": [-33.925, 18.424], \"zoom\": 14}
  }"

# 5. Generate PDF report
curl -X POST http://localhost:8000/api/pdf-reports/generate \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "urban_analysis",
    "title": "New Park Site Analysis",
    "sections": ["executive_summary", "demographics", "recommendations"],
    "data": {"area_id": "target_area"}
  }'
```

### Workflow 3: AI-Powered Site Selection

```bash
# 1. Natural language query
curl -X POST http://localhost:8000/api/ai/nlp/query \
  -H "Content-Type: application/json" \
  -d '{"query": "Find areas with good schools and low crime near parks"}'

# 2. Get crime hotspots
curl -X POST http://localhost:8000/api/ai/crime/hotspots \
  -H "Content-Type: application/json" \
  -d '{"start_date": "2025-01-01", "end_date": "2025-12-31"}'

# 3. Compare candidate areas
curl -X POST http://localhost:8000/api/comparison/neighborhoods \
  -H "Content-Type: application/json" \
  -d '{"area_ids": ["area_a", "area_b", "area_c"], "metrics": ["schools", "crime", "parks"]}'

# 4. Find similar successful areas
curl http://localhost:8000/api/comparison/similar/area_a?limit=5
```

---

## Frontend Integration Examples

### React Component Example

```typescript
// TrafficPrediction.tsx
import { useState } from 'react';
import axios from 'axios';

interface TrafficPrediction {
  traffic_score: number;
  level: string;
  color: string;
}

export function TrafficPrediction({ location }: { location: {lat: number, lng: number} }) {
  const [prediction, setPrediction] = useState<TrafficPrediction | null>(null);

  const fetchPrediction = async () => {
    const response = await axios.post('/api/ai/traffic/predict', {
      location,
      datetime: new Date().toISOString(),
      radius_meters: 500
    });
    setPrediction(response.data.prediction);
  };

  return (
    <div>
      <button onClick={fetchPrediction}>Predict Traffic</button>
      {prediction && (
        <div style={{ color: prediction.color }}>
          <h3>Traffic Level: {prediction.level}</h3>
          <p>Score: {prediction.traffic_score}</p>
        </div>
      )}
    </div>
  );
}
```

### Map Integration Example

```typescript
// 3DBuildingLayer.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { GeoJSONLayer } from 'deck.gl';

export function use3DBuildingLayer(bounds: Bounds) {
  const [layer, setLayer] = useState<GeoJSONLayer | null>(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      const response = await axios.post('/api/3d/buildings/extrude', {
        bounds,
        default_height: 10
      });

      const buildingLayer = new GeoJSONLayer({
        id: '3d-buildings',
        data: response.data,
        extruded: true,
        getElevation: (f) => f.properties.height,
        getFillColor: [160, 160, 180],
        getLineColor: [80, 80, 100]
      });

      setLayer(buildingLayer);
    };

    fetchBuildings();
  }, [bounds]);

  return layer;
}
```

---

## Troubleshooting

### Server won't start

**Error**: `ModuleNotFoundError: No module named 'scikit-learn'`

**Solution**:
```bash
pip install -r requirements.txt
```

### API returns 500 error

**Check logs**:
```bash
tail -f backend.log
```

**Common causes**:
- Missing environment variables
- Database connection issues
- Missing datasets

### Can't access API docs

**Issue**: http://localhost:8000/api/docs returns 404

**Solution**: Check that server is running on port 8000:
```bash
curl http://localhost:8000/health
```

---

## Next Steps

1. **Explore the API**: Try all the examples above
2. **Read Full Docs**: See `NEW_FEATURES_2026.md` for complete documentation
3. **Build Frontend**: Create React components for new features
4. **Write Tests**: Add test coverage for new endpoints
5. **Deploy**: Set up production environment

---

## Resources

- **Full Documentation**: `NEW_FEATURES_2026.md`
- **Implementation Details**: `IMPLEMENTATION_SUMMARY.md`
- **API Reference**: http://localhost:8000/api/docs
- **Changelog**: `CHANGELOG.md`
- **Mobile App**: `mobile/README.md`

---

**Happy Coding! 🚀**
