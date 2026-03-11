"""
Field Data API - Endpoints for mobile/field data capture with offline support

Provides:
- Field survey form management
- Field data submission and sync
- Photo upload handling
- Offline data package generation
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Body, Response
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import json
import uuid
import logging
from pathlib import Path

from app.models.field_data_models import (
    FieldSurveyForm, FormField, FieldType, FieldDataEntry,
    FieldDataSubmission, SyncResult, OfflinePackage, PhotoAttachment,
    FieldEntryStatus
)
from app.core.data_loader import data_loader
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/field", tags=["Field Data Capture"])

# Storage directories
FIELD_DATA_DIR = settings.DATA_DIR / "field_data"
FIELD_DATA_DIR.mkdir(exist_ok=True)
PHOTOS_DIR = FIELD_DATA_DIR / "photos"
PHOTOS_DIR.mkdir(exist_ok=True)

# In-memory storage (would be database in production)
_forms: Dict[str, FieldSurveyForm] = {}
_entries: Dict[str, FieldDataEntry] = {}

# Default survey forms
DEFAULT_FORMS = [
    FieldSurveyForm(
        id="infrastructure_survey",
        name="Infrastructure Survey",
        description="Capture infrastructure conditions in the field",
        version="1.0",
        fields=[
            FormField(id="type", label="Infrastructure Type", field_type=FieldType.SELECT,
                     required=True, options=["Road", "Bridge", "Drain", "Streetlight", "Water Pipe", "Other"]),
            FormField(id="condition", label="Condition", field_type=FieldType.SELECT,
                     required=True, options=["Good", "Fair", "Poor", "Critical"]),
            FormField(id="description", label="Description", field_type=FieldType.TEXT, required=False),
            FormField(id="photo", label="Photo", field_type=FieldType.PHOTO, required=False),
            FormField(id="priority", label="Requires Immediate Attention", field_type=FieldType.CHECKBOX, required=False)
        ],
        geometry_type="Point",
        offline_enabled=True
    ),
    FieldSurveyForm(
        id="environmental_observation",
        name="Environmental Observation",
        description="Report environmental issues or observations",
        version="1.0",
        fields=[
            FormField(id="category", label="Category", field_type=FieldType.SELECT,
                     required=True, options=["Pollution", "Flooding", "Erosion", "Vegetation", "Wildlife", "Other"]),
            FormField(id="severity", label="Severity", field_type=FieldType.SELECT,
                     required=True, options=["Low", "Medium", "High"]),
            FormField(id="notes", label="Notes", field_type=FieldType.TEXT, required=True),
            FormField(id="photos", label="Photos", field_type=FieldType.PHOTO, required=False),
            FormField(id="date_observed", label="Date Observed", field_type=FieldType.DATE, required=True)
        ],
        geometry_type="Point",
        offline_enabled=True
    ),
    FieldSurveyForm(
        id="community_asset",
        name="Community Asset Mapping",
        description="Map community assets and resources",
        version="1.0",
        fields=[
            FormField(id="asset_type", label="Asset Type", field_type=FieldType.SELECT,
                     required=True, options=["School", "Clinic", "Community Center", "Park", "Market", "Religious Site", "Other"]),
            FormField(id="name", label="Name", field_type=FieldType.TEXT, required=True),
            FormField(id="services", label="Services Provided", field_type=FieldType.MULTISELECT,
                     options=["Education", "Healthcare", "Recreation", "Commerce", "Social Services"]),
            FormField(id="contact", label="Contact Information", field_type=FieldType.TEXT, required=False),
            FormField(id="operating_hours", label="Operating Hours", field_type=FieldType.TEXT, required=False)
        ],
        geometry_type="Point",
        offline_enabled=True
    )
]

# Initialize default forms
for form in DEFAULT_FORMS:
    _forms[form.id] = form


def _load_entries():
    """Load persisted field data entries"""
    entries_file = FIELD_DATA_DIR / "entries.json"
    if entries_file.exists():
        try:
            with open(entries_file, 'r') as f:
                data = json.load(f)
                for item in data:
                    entry = FieldDataEntry(**item)
                    _entries[entry.id] = entry
        except Exception as e:
            logger.error(f"Failed to load field entries: {e}")


def _save_entries():
    """Persist field data entries"""
    entries_file = FIELD_DATA_DIR / "entries.json"
    try:
        data = [e.model_dump(mode='json') for e in _entries.values()]
        with open(entries_file, 'w') as f:
            json.dump(data, f, default=str)
    except Exception as e:
        logger.error(f"Failed to save field entries: {e}")


_load_entries()


# ============ Form Management ============

@router.get("/forms", response_model=List[FieldSurveyForm])
async def list_forms(offline_only: bool = Query(default=False)):
    """List available survey forms"""
    forms = list(_forms.values())
    if offline_only:
        forms = [f for f in forms if f.offline_enabled]
    return forms


@router.get("/forms/{form_id}", response_model=FieldSurveyForm)
async def get_form(form_id: str):
    """Get a specific survey form"""
    if form_id not in _forms:
        raise HTTPException(status_code=404, detail="Form not found")
    return _forms[form_id]


@router.post("/forms", response_model=FieldSurveyForm)
async def create_form(form: FieldSurveyForm):
    """Create a new survey form"""
    if form.id in _forms:
        raise HTTPException(status_code=400, detail="Form ID already exists")

    form.created_at = datetime.utcnow()
    form.updated_at = datetime.utcnow()
    _forms[form.id] = form

    logger.info(f"Created form: {form.id}")
    return form


# ============ Field Data Submission ============

@router.post("/entries", response_model=FieldDataEntry)
async def submit_entry(entry: FieldDataEntry):
    """Submit a single field data entry"""
    if entry.form_id not in _forms:
        raise HTTPException(status_code=400, detail=f"Form {entry.form_id} not found")

    entry.id = entry.id or str(uuid.uuid4())
    entry.status = FieldEntryStatus.SUBMITTED
    entry.synced_at = datetime.utcnow()

    _entries[entry.id] = entry
    _save_entries()

    logger.info(f"Submitted field entry {entry.id} for form {entry.form_id}")
    return entry


@router.post("/sync", response_model=SyncResult)
async def sync_entries(submission: FieldDataSubmission):
    """
    Sync multiple field data entries (for offline sync)

    Handles batch submission from offline-collected data.
    """
    synced = 0
    failed = 0
    errors = []

    for entry in submission.entries:
        try:
            if entry.form_id not in _forms:
                raise ValueError(f"Form {entry.form_id} not found")

            # Handle based on sync mode
            if submission.sync_mode == "update" and entry.id in _entries:
                _entries[entry.id] = entry
            elif submission.sync_mode == "upsert":
                _entries[entry.id] = entry
            elif entry.id not in _entries:
                _entries[entry.id] = entry
            else:
                raise ValueError(f"Entry {entry.id} already exists")

            entry.status = FieldEntryStatus.SYNCED
            entry.synced_at = datetime.utcnow()
            synced += 1

        except Exception as e:
            failed += 1
            errors.append({
                "entry_id": entry.id or "unknown",
                "offline_id": entry.offline_id,
                "error": str(e)
            })

    _save_entries()

    return SyncResult(
        total=len(submission.entries),
        synced=synced,
        failed=failed,
        errors=errors
    )


@router.get("/entries", response_model=List[FieldDataEntry])
async def list_entries(
    form_id: Optional[str] = None,
    status: Optional[FieldEntryStatus] = None,
    collected_by: Optional[str] = None,
    from_date: Optional[str] = None,
    limit: int = Query(default=100, ge=1, le=500)
):
    """List field data entries with filters"""
    entries = list(_entries.values())

    if form_id:
        entries = [e for e in entries if e.form_id == form_id]
    if status:
        entries = [e for e in entries if e.status == status]
    if collected_by:
        entries = [e for e in entries if e.collected_by.lower() == collected_by.lower()]
    if from_date:
        try:
            dt = datetime.fromisoformat(from_date)
            entries = [e for e in entries if e.collected_at >= dt]
        except ValueError:
            pass

    # Sort by collected_at descending
    entries.sort(key=lambda x: x.collected_at, reverse=True)

    return entries[:limit]


@router.get("/entries/{entry_id}", response_model=FieldDataEntry)
async def get_entry(entry_id: str):
    """Get a specific field data entry"""
    if entry_id not in _entries:
        raise HTTPException(status_code=404, detail="Entry not found")
    return _entries[entry_id]


@router.delete("/entries/{entry_id}")
async def delete_entry(entry_id: str):
    """Delete a field data entry"""
    if entry_id not in _entries:
        raise HTTPException(status_code=404, detail="Entry not found")

    del _entries[entry_id]
    _save_entries()
    return {"message": "Entry deleted"}


# ============ Photo Upload ============

@router.post("/photos")
async def upload_photo(
    file: UploadFile = File(...),
    entry_id: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None
):
    """Upload a photo attachment"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    photo_id = str(uuid.uuid4())
    extension = Path(file.filename).suffix or ".jpg"
    filename = f"{photo_id}{extension}"
    filepath = PHOTOS_DIR / filename

    content = await file.read()
    with open(filepath, 'wb') as f:
        f.write(content)

    photo = PhotoAttachment(
        id=photo_id,
        filename=filename,
        content_type=file.content_type,
        size_bytes=len(content),
        url=f"/api/field/photos/{photo_id}",
        location={"lat": lat, "lng": lng} if lat and lng else None
    )

    # Associate with entry if provided
    if entry_id and entry_id in _entries:
        _entries[entry_id].photos.append(photo)
        _save_entries()

    return photo


@router.get("/photos/{photo_id}")
async def get_photo(photo_id: str):
    """Retrieve a photo"""
    from fastapi.responses import FileResponse

    # Find the photo file
    for ext in ['.jpg', '.jpeg', '.png', '.gif']:
        filepath = PHOTOS_DIR / f"{photo_id}{ext}"
        if filepath.exists():
            return FileResponse(filepath)

    raise HTTPException(status_code=404, detail="Photo not found")


# ============ Offline Package ============

@router.post("/offline-package", response_model=OfflinePackage)
async def create_offline_package(
    forms: List[str] = Body(default=None, description="Form IDs to include"),
    layers: List[str] = Body(default=None, description="Layer IDs to include"),
    bbox: Optional[List[float]] = Body(default=None, description="[minLng, minLat, maxLng, maxLat]")
):
    """
    Create an offline data package for field work

    Includes forms, reference layers, and tile information.
    """
    # Get requested forms
    package_forms = []
    form_ids = forms or list(_forms.keys())
    for form_id in form_ids:
        if form_id in _forms and _forms[form_id].offline_enabled:
            package_forms.append(_forms[form_id])

    # Get reference layers
    package_layers_json = []
    size_estimate = len(package_forms) * 0.01  # Rough estimate

    if layers:
        for layer_id in layers:
            try:
                gdf = data_loader.get_gdf(layer_id)
                if bbox:
                    gdf = gdf.cx[bbox[0]:bbox[2], bbox[1]:bbox[3]]
                if not gdf.empty:
                    # Simplify for offline use
                    gdf_simplified = gdf.copy()
                    gdf_simplified['geometry'] = gdf_simplified['geometry'].simplify(0.0001)

                    # ⚡ Bolt Optimization: Avoid json.loads() double-serialization overhead
                    # We serialize the GeoJSON directly to a string and wrap it in a custom JSON object
                    geojson_str = gdf_simplified.to_json()
                    safe_layer_id = json.dumps(layer_id)
                    layer_json_str = f'{{"id": {safe_layer_id}, "feature_count": {len(gdf_simplified)}, "geojson": {geojson_str}}}'
                    package_layers_json.append(layer_json_str)
                    size_estimate += len(layer_json_str) / (1024 * 1024)
            except Exception as e:
                logger.warning(f"Could not include layer {layer_id}: {e}")

    package = OfflinePackage(
        id=str(uuid.uuid4()),
        name=f"Offline Package {datetime.utcnow().strftime('%Y-%m-%d')}",
        forms=package_forms,
        layers=[],  # We will manually append the pre-serialized layers
        tile_bounds=bbox,
        tile_zoom_range=[12, 16],
        size_estimate_mb=round(size_estimate, 2),
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=7)
    )

    # ⚡ Bolt Optimization: Skip Pydantic/FastAPI re-serialization of massive layer data
    # Serialize the package without the layers, then manually inject the layer array string
    package_json = package.model_dump_json(exclude={"layers"})
    layers_str = ",".join(package_layers_json)

    # We strip the closing brace and inject the layers property manually
    response_content = f'{package_json[:-1]}, "layers": [{layers_str}]}}'

    return Response(content=response_content, media_type="application/json")


# ============ Statistics ============

@router.get("/stats")
async def get_field_data_stats():
    """Get field data collection statistics"""
    entries = list(_entries.values())

    by_form = {}
    by_status = {}
    by_collector = {}

    for entry in entries:
        by_form[entry.form_id] = by_form.get(entry.form_id, 0) + 1
        by_status[entry.status.value] = by_status.get(entry.status.value, 0) + 1
        by_collector[entry.collected_by] = by_collector.get(entry.collected_by, 0) + 1

    return {
        "total_forms": len(_forms),
        "total_entries": len(entries),
        "by_form": by_form,
        "by_status": by_status,
        "by_collector": by_collector,
        "recent_entries": [
            {
                "id": e.id,
                "form_id": e.form_id,
                "collected_by": e.collected_by,
                "collected_at": e.collected_at.isoformat()
            }
            for e in sorted(entries, key=lambda x: x.collected_at, reverse=True)[:10]
        ]
    }
