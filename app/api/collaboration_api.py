"""
Collaboration API - Endpoints for spatial review and collaboration tools

Provides:
- Location-based comments and annotations
- Shared project markers
- Threaded discussions anchored on map features
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, List
from datetime import datetime
import uuid
import json
import logging
from pathlib import Path

from app.models.collaboration_models import (
    Annotation, AnnotationCreate, AnnotationUpdate, AnnotationFilter,
    AnnotationListResponse, AnnotationType, AnnotationStatus,
    Reply, ReplyCreate, ProjectMarker, GeoLocation
)
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/collaboration", tags=["Collaboration & Review"])

# In-memory storage (would be database in production)
_annotations: dict[str, Annotation] = {}
_replies: dict[str, List[Reply]] = {}
_markers: dict[str, ProjectMarker] = {}

# Persistence file paths
ANNOTATIONS_FILE = settings.CACHE_DIR / "annotations.json"
MARKERS_FILE = settings.CACHE_DIR / "markers.json"


def _load_data():
    """Load persisted data on startup"""
    global _annotations, _replies, _markers

    if ANNOTATIONS_FILE.exists():
        try:
            with open(ANNOTATIONS_FILE, 'r') as f:
                data = json.load(f)
                for item in data.get('annotations', []):
                    ann = Annotation(**item)
                    _annotations[ann.id] = ann
                for ann_id, replies in data.get('replies', {}).items():
                    _replies[ann_id] = [Reply(**r) for r in replies]
        except Exception as e:
            logger.error(f"Failed to load annotations: {e}")

    if MARKERS_FILE.exists():
        try:
            with open(MARKERS_FILE, 'r') as f:
                data = json.load(f)
                for item in data:
                    marker = ProjectMarker(**item)
                    _markers[marker.id] = marker
        except Exception as e:
            logger.error(f"Failed to load markers: {e}")


def _save_annotations():
    """Persist annotations to file"""
    try:
        data = {
            'annotations': [ann.model_dump(mode='json') for ann in _annotations.values()],
            'replies': {
                ann_id: [r.model_dump(mode='json') for r in replies]
                for ann_id, replies in _replies.items()
            }
        }
        with open(ANNOTATIONS_FILE, 'w') as f:
            json.dump(data, f, default=str)
    except Exception as e:
        logger.error(f"Failed to save annotations: {e}")


def _save_markers():
    """Persist markers to file"""
    try:
        data = [m.model_dump(mode='json') for m in _markers.values()]
        with open(MARKERS_FILE, 'w') as f:
            json.dump(data, f, default=str)
    except Exception as e:
        logger.error(f"Failed to save markers: {e}")


# Load data on module import
_load_data()


# ============ Annotation Endpoints ============

@router.post("/annotations", response_model=Annotation)
async def create_annotation(annotation: AnnotationCreate):
    """
    Create a new location-based annotation

    Annotations can be comments, notes, issues, suggestions, or approvals
    tied to specific map locations or features.
    """
    new_annotation = Annotation(
        id=str(uuid.uuid4()),
        location=annotation.location,
        annotation_type=annotation.annotation_type,
        title=annotation.title,
        content=annotation.content,
        author=annotation.author,
        feature_id=annotation.feature_id,
        layer_id=annotation.layer_id,
        tags=annotation.tags,
        attachments=annotation.attachments,
        status=AnnotationStatus.OPEN,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
        reply_count=0
    )

    _annotations[new_annotation.id] = new_annotation
    _replies[new_annotation.id] = []
    _save_annotations()

    logger.info(f"Created annotation {new_annotation.id} by {annotation.author}")
    return new_annotation


@router.get("/annotations", response_model=AnnotationListResponse)
async def list_annotations(
    bbox: Optional[str] = Query(default=None, description="Bounding box: minLng,minLat,maxLng,maxLat"),
    annotation_type: Optional[AnnotationType] = None,
    status: Optional[AnnotationStatus] = None,
    author: Optional[str] = None,
    layer_id: Optional[str] = None,
    tag: Optional[str] = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200)
):
    """
    List annotations with optional filters

    Filter by bounding box, type, status, author, layer, or tags.
    """
    annotations = list(_annotations.values())

    # Apply filters
    if bbox:
        try:
            min_lng, min_lat, max_lng, max_lat = map(float, bbox.split(','))
            annotations = [
                a for a in annotations
                if min_lng <= a.location.lng <= max_lng and min_lat <= a.location.lat <= max_lat
            ]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid bbox format")

    if annotation_type:
        annotations = [a for a in annotations if a.annotation_type == annotation_type]

    if status:
        annotations = [a for a in annotations if a.status == status]

    if author:
        annotations = [a for a in annotations if a.author.lower() == author.lower()]

    if layer_id:
        annotations = [a for a in annotations if a.layer_id == layer_id]

    if tag:
        annotations = [a for a in annotations if tag in a.tags]

    # Sort by created_at descending
    annotations.sort(key=lambda x: x.created_at, reverse=True)

    # Paginate
    total = len(annotations)
    start = (page - 1) * page_size
    end = start + page_size
    paginated = annotations[start:end]

    return AnnotationListResponse(
        annotations=paginated,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/annotations/{annotation_id}", response_model=Annotation)
async def get_annotation(annotation_id: str):
    """Get a specific annotation by ID"""
    if annotation_id not in _annotations:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return _annotations[annotation_id]


@router.patch("/annotations/{annotation_id}", response_model=Annotation)
async def update_annotation(annotation_id: str, update: AnnotationUpdate):
    """Update an existing annotation"""
    if annotation_id not in _annotations:
        raise HTTPException(status_code=404, detail="Annotation not found")

    annotation = _annotations[annotation_id]

    if update.title is not None:
        annotation.title = update.title
    if update.content is not None:
        annotation.content = update.content
    if update.status is not None:
        annotation.status = update.status
    if update.tags is not None:
        annotation.tags = update.tags

    annotation.updated_at = datetime.utcnow()
    _save_annotations()

    return annotation


@router.delete("/annotations/{annotation_id}")
async def delete_annotation(annotation_id: str):
    """Delete an annotation and its replies"""
    if annotation_id not in _annotations:
        raise HTTPException(status_code=404, detail="Annotation not found")

    del _annotations[annotation_id]
    if annotation_id in _replies:
        del _replies[annotation_id]

    _save_annotations()
    return {"message": "Annotation deleted"}


# ============ Reply Endpoints ============

@router.post("/annotations/{annotation_id}/replies", response_model=Reply)
async def create_reply(annotation_id: str, reply: ReplyCreate):
    """Add a reply to an annotation (threaded discussion)"""
    if annotation_id not in _annotations:
        raise HTTPException(status_code=404, detail="Annotation not found")

    new_reply = Reply(
        id=str(uuid.uuid4()),
        annotation_id=annotation_id,
        content=reply.content,
        author=reply.author,
        created_at=datetime.utcnow()
    )

    if annotation_id not in _replies:
        _replies[annotation_id] = []

    _replies[annotation_id].append(new_reply)
    _annotations[annotation_id].reply_count = len(_replies[annotation_id])
    _annotations[annotation_id].updated_at = datetime.utcnow()

    _save_annotations()
    return new_reply


@router.get("/annotations/{annotation_id}/replies", response_model=List[Reply])
async def get_replies(annotation_id: str):
    """Get all replies for an annotation"""
    if annotation_id not in _annotations:
        raise HTTPException(status_code=404, detail="Annotation not found")

    return _replies.get(annotation_id, [])


# ============ Project Marker Endpoints ============

@router.post("/markers", response_model=ProjectMarker)
async def create_marker(
    name: str = Body(...),
    lat: float = Body(...),
    lng: float = Body(...),
    description: Optional[str] = Body(default=None),
    icon: str = Body(default="marker"),
    color: str = Body(default="#3388ff"),
    created_by: str = Body(...)
):
    """Create a shared project marker"""
    marker = ProjectMarker(
        id=str(uuid.uuid4()),
        name=name,
        description=description,
        location=GeoLocation(lat=lat, lng=lng),
        icon=icon,
        color=color,
        created_by=created_by,
        created_at=datetime.utcnow()
    )

    _markers[marker.id] = marker
    _save_markers()

    return marker


@router.get("/markers", response_model=List[ProjectMarker])
async def list_markers(
    bbox: Optional[str] = Query(default=None, description="Bounding box: minLng,minLat,maxLng,maxLat"),
    created_by: Optional[str] = None
):
    """List all project markers"""
    markers = list(_markers.values())

    if bbox:
        try:
            min_lng, min_lat, max_lng, max_lat = map(float, bbox.split(','))
            markers = [
                m for m in markers
                if min_lng <= m.location.lng <= max_lng and min_lat <= m.location.lat <= max_lat
            ]
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid bbox format")

    if created_by:
        markers = [m for m in markers if m.created_by.lower() == created_by.lower()]

    return markers


@router.delete("/markers/{marker_id}")
async def delete_marker(marker_id: str):
    """Delete a project marker"""
    if marker_id not in _markers:
        raise HTTPException(status_code=404, detail="Marker not found")

    del _markers[marker_id]
    _save_markers()
    return {"message": "Marker deleted"}


# ============ Statistics ============

@router.get("/stats")
async def get_collaboration_stats():
    """Get collaboration statistics"""
    annotations = list(_annotations.values())

    by_type = {}
    by_status = {}
    by_author = {}

    for ann in annotations:
        by_type[ann.annotation_type.value] = by_type.get(ann.annotation_type.value, 0) + 1
        by_status[ann.status.value] = by_status.get(ann.status.value, 0) + 1
        by_author[ann.author] = by_author.get(ann.author, 0) + 1

    return {
        "total_annotations": len(annotations),
        "total_replies": sum(len(r) for r in _replies.values()),
        "total_markers": len(_markers),
        "by_type": by_type,
        "by_status": by_status,
        "by_author": by_author,
        "recent_activity": [
            {
                "id": a.id,
                "title": a.title,
                "author": a.author,
                "created_at": a.created_at.isoformat()
            }
            for a in sorted(annotations, key=lambda x: x.created_at, reverse=True)[:10]
        ]
    }
