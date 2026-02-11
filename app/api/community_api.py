"""
Community Engagement API

Provides endpoints for:
- Public feedback on urban planning proposals
- Citizen-reported issues (potholes, streetlights, etc.)
- Voting/polling on municipal initiatives
- Community-contributed data validation
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import uuid

router = APIRouter(prefix="/community", tags=["Community Engagement"])
logger = logging.getLogger(__name__)

# In-memory storage (in production, use database)
feedback_db = []
issues_db = []
polls_db = []
contributions_db = []


class FeedbackSubmission(BaseModel):
    """Public feedback on planning proposals"""
    proposal_id: str
    author_name: Optional[str] = Field(None, description="Anonymous if not provided")
    author_email: Optional[str] = None
    comment: str = Field(..., min_length=10, max_length=2000)
    sentiment: Optional[str] = Field(None, description="positive, neutral, negative")
    location: Optional[Dict[str, float]] = None
    tags: Optional[List[str]] = None


class IssueReport(BaseModel):
    """Citizen-reported issue"""
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=2000)
    category: str = Field(..., description="pothole, streetlight, litter, graffiti, etc.")
    location: Dict[str, float] = Field(..., description="lat, lng")
    severity: Optional[str] = Field("medium", description="low, medium, high, urgent")
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    reporter_phone: Optional[str] = None


class VoteSubmission(BaseModel):
    """Vote on a poll or initiative"""
    poll_id: str
    option_id: str
    voter_id: Optional[str] = Field(None, description="Anonymous voting if not provided")


class DataContribution(BaseModel):
    """Community-contributed data point"""
    dataset: str = Field(..., description="Dataset to contribute to")
    geometry: Dict[str, Any] = Field(..., description="GeoJSON geometry")
    properties: Dict[str, Any] = Field(..., description="Attributes")
    contributor_name: Optional[str] = None
    contributor_email: Optional[str] = None
    notes: Optional[str] = None


@router.post("/feedback/submit")
async def submit_feedback(feedback: FeedbackSubmission):
    """
    Submit public feedback on urban planning proposals.
    """
    try:
        feedback_entry = {
            "id": str(uuid.uuid4()),
            "proposal_id": feedback.proposal_id,
            "author": feedback.author_name or "Anonymous",
            "email": feedback.author_email,
            "comment": feedback.comment,
            "sentiment": feedback.sentiment or "neutral",
            "location": feedback.location,
            "tags": feedback.tags or [],
            "status": "pending_review",
            "created_at": datetime.now().isoformat(),
            "upvotes": 0,
            "replies": []
        }

        feedback_db.append(feedback_entry)

        return {
            "success": True,
            "feedback_id": feedback_entry["id"],
            "message": "Thank you for your feedback! It will be reviewed by city planners.",
            "moderation_note": "Your feedback is pending review and will be published shortly."
        }

    except Exception as e:
        logger.error(f"Feedback submission error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feedback/list")
async def list_feedback(
    proposal_id: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0
):
    """
    List public feedback for proposals.
    """
    try:
        filtered = feedback_db

        if proposal_id:
            filtered = [f for f in filtered if f["proposal_id"] == proposal_id]

        # Sort by date
        filtered = sorted(filtered, key=lambda x: x["created_at"], reverse=True)

        return {
            "feedback": filtered[offset:offset+limit],
            "total": len(filtered),
            "limit": limit,
            "offset": offset
        }

    except Exception as e:
        logger.error(f"Feedback list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/issues/report")
async def report_issue(issue: IssueReport):
    """
    Report a community issue (pothole, broken streetlight, etc.).
    """
    try:
        issue_entry = {
            "id": str(uuid.uuid4()),
            "reference_number": f"ISS-{len(issues_db)+1:06d}",
            "title": issue.title,
            "description": issue.description,
            "category": issue.category,
            "location": issue.location,
            "severity": issue.severity,
            "status": "reported",
            "reporter": {
                "name": issue.reporter_name or "Anonymous",
                "email": issue.reporter_email,
                "phone": issue.reporter_phone
            },
            "reported_at": datetime.now().isoformat(),
            "assigned_to": None,
            "resolved_at": None,
            "photos": [],
            "updates": [],
            "upvotes": 0
        }

        issues_db.append(issue_entry)

        return {
            "success": True,
            "issue_id": issue_entry["id"],
            "reference_number": issue_entry["reference_number"],
            "message": f"Issue reported successfully. Reference: {issue_entry['reference_number']}",
            "estimated_response_time": "2-3 business days"
        }

    except Exception as e:
        logger.error(f"Issue report error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/issues/upload-photo")
async def upload_issue_photo(
    issue_id: str = Form(...),
    photo: UploadFile = File(...)
):
    """
    Upload a photo for a reported issue.
    """
    try:
        # In production, save to cloud storage (S3, Azure Blob, etc.)
        # For now, simulate upload

        if photo.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
            raise HTTPException(status_code=400, detail="Only JPEG/PNG images allowed")

        # Find issue
        issue = next((i for i in issues_db if i["id"] == issue_id), None)
        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")

        photo_url = f"/uploads/issues/{issue_id}/{photo.filename}"

        issue["photos"].append({
            "url": photo_url,
            "uploaded_at": datetime.now().isoformat()
        })

        return {
            "success": True,
            "photo_url": photo_url,
            "message": "Photo uploaded successfully"
        }

    except Exception as e:
        logger.error(f"Photo upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/issues/list")
async def list_issues(
    category: Optional[str] = None,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    bounds: Optional[str] = Query(None, description="minLat,minLng,maxLat,maxLng"),
    limit: int = Query(50, le=200),
    offset: int = 0
):
    """
    List reported community issues.
    """
    try:
        filtered = issues_db

        if category:
            filtered = [i for i in filtered if i["category"] == category]
        if status:
            filtered = [i for i in filtered if i["status"] == status]
        if severity:
            filtered = [i for i in filtered if i["severity"] == severity]

        if bounds:
            # Parse bounds and filter by location
            coords = [float(x) for x in bounds.split(",")]
            min_lat, min_lng, max_lat, max_lng = coords

            filtered = [
                i for i in filtered
                if min_lat <= i["location"]["lat"] <= max_lat
                and min_lng <= i["location"]["lng"] <= max_lng
            ]

        # Sort by date
        filtered = sorted(filtered, key=lambda x: x["reported_at"], reverse=True)

        return {
            "issues": filtered[offset:offset+limit],
            "total": len(filtered),
            "limit": limit,
            "offset": offset,
            "statistics": {
                "by_category": _count_by_field(filtered, "category"),
                "by_status": _count_by_field(filtered, "status"),
                "by_severity": _count_by_field(filtered, "severity")
            }
        }

    except Exception as e:
        logger.error(f"Issues list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/issues/{issue_id}")
async def get_issue_details(issue_id: str):
    """
    Get detailed information about a specific issue.
    """
    try:
        issue = next((i for i in issues_db if i["id"] == issue_id), None)

        if not issue:
            raise HTTPException(status_code=404, detail="Issue not found")

        return issue

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get issue error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/polls/vote")
async def submit_vote(vote: VoteSubmission):
    """
    Submit a vote on a municipal poll or initiative.
    """
    try:
        # Find poll
        poll = next((p for p in polls_db if p["id"] == vote.poll_id), None)

        if not poll:
            raise HTTPException(status_code=404, detail="Poll not found")

        if poll["status"] != "active":
            raise HTTPException(status_code=400, detail="Poll is not active")

        # Check if already voted (if voter_id provided)
        if vote.voter_id:
            already_voted = any(
                v["voter_id"] == vote.voter_id
                for v in poll.get("votes", [])
            )
            if already_voted:
                raise HTTPException(status_code=400, detail="You have already voted")

        # Record vote
        if "votes" not in poll:
            poll["votes"] = []

        poll["votes"].append({
            "option_id": vote.option_id,
            "voter_id": vote.voter_id,
            "timestamp": datetime.now().isoformat()
        })

        # Update vote counts
        for option in poll["options"]:
            if option["id"] == vote.option_id:
                option["votes"] = option.get("votes", 0) + 1

        return {
            "success": True,
            "message": "Vote recorded successfully",
            "poll_id": vote.poll_id
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Vote submission error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/polls/list")
async def list_polls(status: Optional[str] = Query(None, description="active, closed")):
    """
    List active polls and initiatives.
    """
    try:
        filtered = polls_db

        if status:
            filtered = [p for p in filtered if p["status"] == status]

        return {
            "polls": filtered,
            "total": len(filtered)
        }

    except Exception as e:
        logger.error(f"Polls list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/contribute/data")
async def contribute_data(contribution: DataContribution):
    """
    Submit community-contributed spatial data for validation.
    """
    try:
        contribution_entry = {
            "id": str(uuid.uuid4()),
            "dataset": contribution.dataset,
            "geometry": contribution.geometry,
            "properties": contribution.properties,
            "contributor": {
                "name": contribution.contributor_name or "Anonymous",
                "email": contribution.contributor_email
            },
            "notes": contribution.notes,
            "status": "pending_validation",
            "submitted_at": datetime.now().isoformat(),
            "validated_by": None,
            "validation_notes": None
        }

        contributions_db.append(contribution_entry)

        return {
            "success": True,
            "contribution_id": contribution_entry["id"],
            "message": "Thank you for your contribution! It will be validated by our team.",
            "status": "pending_validation"
        }

    except Exception as e:
        logger.error(f"Data contribution error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/contribute/list")
async def list_contributions(
    dataset: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0
):
    """
    List community data contributions.
    """
    try:
        filtered = contributions_db

        if dataset:
            filtered = [c for c in filtered if c["dataset"] == dataset]
        if status:
            filtered = [c for c in filtered if c["status"] == status]

        filtered = sorted(filtered, key=lambda x: x["submitted_at"], reverse=True)

        return {
            "contributions": filtered[offset:offset+limit],
            "total": len(filtered),
            "limit": limit,
            "offset": offset
        }

    except Exception as e:
        logger.error(f"Contributions list error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_community_stats():
    """
    Get community engagement statistics.
    """
    try:
        return {
            "feedback": {
                "total": len(feedback_db),
                "pending": len([f for f in feedback_db if f["status"] == "pending_review"]),
                "published": len([f for f in feedback_db if f["status"] == "published"])
            },
            "issues": {
                "total": len(issues_db),
                "reported": len([i for i in issues_db if i["status"] == "reported"]),
                "in_progress": len([i for i in issues_db if i["status"] == "in_progress"]),
                "resolved": len([i for i in issues_db if i["status"] == "resolved"])
            },
            "contributions": {
                "total": len(contributions_db),
                "pending": len([c for c in contributions_db if c["status"] == "pending_validation"]),
                "approved": len([c for c in contributions_db if c["status"] == "approved"])
            },
            "active_polls": len([p for p in polls_db if p["status"] == "active"])
        }

    except Exception as e:
        logger.error(f"Community stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper function
def _count_by_field(items: List[Dict], field: str) -> Dict[str, int]:
    """Count items by a specific field value"""
    counts = {}
    for item in items:
        value = item.get(field, "unknown")
        counts[value] = counts.get(value, 0) + 1
    return counts


# Initialize with sample poll
polls_db.append({
    "id": "poll_001",
    "title": "New Public Park Location",
    "description": "Help us choose the location for a new public park in your area",
    "status": "active",
    "options": [
        {"id": "opt_1", "text": "Site A: Near the waterfront", "votes": 45},
        {"id": "opt_2", "text": "Site B: Central business district", "votes": 32},
        {"id": "opt_3", "text": "Site C: Residential neighborhood", "votes": 28}
    ],
    "created_at": datetime.now().isoformat(),
    "closes_at": (datetime.now().replace(hour=23, minute=59) + timedelta(days=30)).isoformat(),
    "votes": []
})
