"""
Smart Notifications & Alerts API

Provides endpoints for:
- Location-based alerts (service disruptions, safety warnings)
- Subscription management for area-specific updates
- Push notification registration
- Email digests for watched locations
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging
import uuid

router = APIRouter(prefix="/notifications", tags=["Notifications & Alerts"])
logger = logging.getLogger(__name__)

# In-memory storage (in production, use database)
subscriptions_db = []
alerts_db = []
notifications_db = []


class AlertSubscription(BaseModel):
    """Subscribe to location-based alerts"""
    user_id: str
    user_email: Optional[EmailStr] = None
    alert_types: List[str] = Field(..., description="traffic, safety, weather, construction, events")
    location: Dict[str, float] = Field(..., description="lat, lng")
    radius_meters: float = Field(1000, description="Alert radius")
    channels: List[str] = Field(["push"], description="push, email, sms")
    frequency: str = Field("immediate", description="immediate, hourly, daily")


class PushTokenRegistration(BaseModel):
    """Register device for push notifications"""
    user_id: str
    device_token: str
    platform: str = Field(..., description="ios, android, web")
    device_name: Optional[str] = None


class AlertCreate(BaseModel):
    """Create a new alert (admin only)"""
    title: str = Field(..., max_length=200)
    message: str = Field(..., max_length=1000)
    alert_type: str = Field(..., description="traffic, safety, weather, construction, events")
    severity: str = Field("medium", description="low, medium, high, critical")
    location: Dict[str, float]
    radius_meters: float = Field(1000)
    expires_at: Optional[str] = None
    action_url: Optional[str] = None


class LocationWatch(BaseModel):
    """Watch a specific location for changes"""
    user_id: str
    user_email: EmailStr
    location_name: str
    location: Dict[str, float]
    watch_types: List[str] = Field(..., description="development, zoning, infrastructure")
    digest_frequency: str = Field("weekly", description="daily, weekly, monthly")


@router.post("/subscribe")
async def create_subscription(subscription: AlertSubscription):
    """
    Subscribe to location-based alerts.
    """
    try:
        subscription_entry = {
            "id": str(uuid.uuid4()),
            "user_id": subscription.user_id,
            "user_email": subscription.user_email,
            "alert_types": subscription.alert_types,
            "location": subscription.location,
            "radius_meters": subscription.radius_meters,
            "channels": subscription.channels,
            "frequency": subscription.frequency,
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "last_notified": None
        }

        subscriptions_db.append(subscription_entry)

        return {
            "success": True,
            "subscription_id": subscription_entry["id"],
            "message": "Subscription created successfully",
            "alert_types": subscription.alert_types,
            "location": subscription.location
        }

    except Exception as e:
        logger.error(f"Subscription creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/subscriptions/{user_id}")
async def get_user_subscriptions(user_id: str):
    """
    Get all subscriptions for a user.
    """
    try:
        user_subs = [s for s in subscriptions_db if s["user_id"] == user_id]

        return {
            "subscriptions": user_subs,
            "total": len(user_subs)
        }

    except Exception as e:
        logger.error(f"Get subscriptions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/subscriptions/{subscription_id}")
async def delete_subscription(subscription_id: str):
    """
    Unsubscribe from alerts.
    """
    try:
        global subscriptions_db
        original_length = len(subscriptions_db)
        subscriptions_db = [s for s in subscriptions_db if s["id"] != subscription_id]

        if len(subscriptions_db) == original_length:
            raise HTTPException(status_code=404, detail="Subscription not found")

        return {
            "success": True,
            "message": "Subscription deleted successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete subscription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/push/register")
async def register_push_token(registration: PushTokenRegistration):
    """
    Register device token for push notifications.
    """
    try:
        # In production, store tokens securely and handle platform-specific registration

        return {
            "success": True,
            "message": "Device registered for push notifications",
            "user_id": registration.user_id,
            "platform": registration.platform
        }

    except Exception as e:
        logger.error(f"Push registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/alerts/create")
async def create_alert(alert: AlertCreate, background_tasks: BackgroundTasks):
    """
    Create a new location-based alert (admin only).

    Automatically notifies subscribed users.
    """
    try:
        alert_entry = {
            "id": str(uuid.uuid4()),
            "title": alert.title,
            "message": alert.message,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "location": alert.location,
            "radius_meters": alert.radius_meters,
            "expires_at": alert.expires_at or (datetime.now() + timedelta(hours=24)).isoformat(),
            "action_url": alert.action_url,
            "created_at": datetime.now().isoformat(),
            "status": "active",
            "views": 0,
            "clicks": 0
        }

        alerts_db.append(alert_entry)

        # Find affected subscribers
        affected_subs = _find_affected_subscribers(alert_entry)

        # Queue notifications in background
        background_tasks.add_task(_send_notifications, alert_entry, affected_subs)

        return {
            "success": True,
            "alert_id": alert_entry["id"],
            "message": "Alert created and notifications queued",
            "affected_subscribers": len(affected_subs)
        }

    except Exception as e:
        logger.error(f"Alert creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/active")
async def get_active_alerts(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius_meters: Optional[float] = None,
    alert_type: Optional[str] = None
):
    """
    Get active alerts for a location.
    """
    try:
        now = datetime.now().isoformat()
        active = [a for a in alerts_db if a["status"] == "active" and a["expires_at"] > now]

        if alert_type:
            active = [a for a in active if a["alert_type"] == alert_type]

        if lat is not None and lng is not None and radius_meters:
            # Filter by proximity
            active = [
                a for a in active
                if _distance_meters(
                    lat, lng,
                    a["location"]["lat"], a["location"]["lng"]
                ) <= radius_meters
            ]

        return {
            "alerts": active,
            "total": len(active),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Get active alerts error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/alerts/{alert_id}")
async def get_alert_details(alert_id: str):
    """
    Get detailed information about a specific alert.
    """
    try:
        alert = next((a for a in alerts_db if a["id"] == alert_id), None)

        if not alert:
            raise HTTPException(status_code=404, detail="Alert not found")

        # Increment view count
        alert["views"] += 1

        return alert

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get alert error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/notifications/{user_id}")
async def get_user_notifications(
    user_id: str,
    unread_only: bool = False,
    limit: int = Query(50, le=200),
    offset: int = 0
):
    """
    Get notifications for a user.
    """
    try:
        user_notifs = [n for n in notifications_db if n["user_id"] == user_id]

        if unread_only:
            user_notifs = [n for n in user_notifs if not n["read"]]

        # Sort by date
        user_notifs = sorted(user_notifs, key=lambda x: x["created_at"], reverse=True)

        return {
            "notifications": user_notifs[offset:offset+limit],
            "total": len(user_notifs),
            "unread_count": len([n for n in user_notifs if not n["read"]]),
            "limit": limit,
            "offset": offset
        }

    except Exception as e:
        logger.error(f"Get notifications error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """
    Mark a notification as read.
    """
    try:
        notif = next((n for n in notifications_db if n["id"] == notification_id), None)

        if not notif:
            raise HTTPException(status_code=404, detail="Notification not found")

        notif["read"] = True
        notif["read_at"] = datetime.now().isoformat()

        return {
            "success": True,
            "message": "Notification marked as read"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mark read error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/watch/add")
async def add_location_watch(watch: LocationWatch):
    """
    Add a location to watch list for change notifications.
    """
    try:
        watch_entry = {
            "id": str(uuid.uuid4()),
            "user_id": watch.user_id,
            "user_email": watch.user_email,
            "location_name": watch.location_name,
            "location": watch.location,
            "watch_types": watch.watch_types,
            "digest_frequency": watch.digest_frequency,
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "last_digest_sent": None,
            "changes_detected": 0
        }

        return {
            "success": True,
            "watch_id": watch_entry["id"],
            "message": f"Now watching {watch.location_name}",
            "digest_frequency": watch.digest_frequency
        }

    except Exception as e:
        logger.error(f"Add watch error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats")
async def get_notification_stats():
    """
    Get notification system statistics.
    """
    try:
        now = datetime.now().isoformat()
        active_alerts = [a for a in alerts_db if a["status"] == "active" and a["expires_at"] > now]

        return {
            "active_alerts": len(active_alerts),
            "total_subscriptions": len(subscriptions_db),
            "active_subscriptions": len([s for s in subscriptions_db if s["status"] == "active"]),
            "notifications_sent_today": len([
                n for n in notifications_db
                if n["created_at"][:10] == datetime.now().isoformat()[:10]
            ]),
            "alerts_by_type": _count_by_field(active_alerts, "alert_type"),
            "alerts_by_severity": _count_by_field(active_alerts, "severity")
        }

    except Exception as e:
        logger.error(f"Notification stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Helper functions
def _find_affected_subscribers(alert: Dict) -> List[Dict]:
    """Find subscribers within alert radius"""
    affected = []

    for sub in subscriptions_db:
        if sub["status"] != "active":
            continue

        if alert["alert_type"] not in sub["alert_types"]:
            continue

        distance = _distance_meters(
            alert["location"]["lat"], alert["location"]["lng"],
            sub["location"]["lat"], sub["location"]["lng"]
        )

        if distance <= alert["radius_meters"] + sub["radius_meters"]:
            affected.append(sub)

    return affected


def _distance_meters(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points in meters"""
    from math import radians, sin, cos, sqrt, atan2

    R = 6371000  # Earth radius in meters

    phi1, phi2 = radians(lat1), radians(lat2)
    dphi = radians(lat2 - lat1)
    dlambda = radians(lng2 - lng1)

    a = sin(dphi/2)**2 + cos(phi1) * cos(phi2) * sin(dlambda/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))

    return R * c


def _send_notifications(alert: Dict, subscribers: List[Dict]):
    """Send notifications to subscribers (background task)"""
    logger.info(f"Sending alert {alert['id']} to {len(subscribers)} subscribers")

    for sub in subscribers:
        notification = {
            "id": str(uuid.uuid4()),
            "user_id": sub["user_id"],
            "alert_id": alert["id"],
            "title": alert["title"],
            "message": alert["message"],
            "alert_type": alert["alert_type"],
            "severity": alert["severity"],
            "channels": sub["channels"],
            "created_at": datetime.now().isoformat(),
            "read": False,
            "read_at": None
        }

        notifications_db.append(notification)

        # In production, actually send push/email/SMS notifications here

    logger.info(f"Notifications queued for alert {alert['id']}")


def _count_by_field(items: List[Dict], field: str) -> Dict[str, int]:
    """Count items by a specific field value"""
    counts = {}
    for item in items:
        value = item.get(field, "unknown")
        counts[value] = counts.get(value, 0) + 1
    return counts


# Initialize with sample alerts
alerts_db.append({
    "id": "alert_001",
    "title": "Traffic Congestion on N1",
    "message": "Heavy traffic reported on N1 northbound. Consider alternative routes.",
    "alert_type": "traffic",
    "severity": "medium",
    "location": {"lat": -33.925, "lng": 18.424},
    "radius_meters": 2000,
    "expires_at": (datetime.now() + timedelta(hours=2)).isoformat(),
    "action_url": None,
    "created_at": datetime.now().isoformat(),
    "status": "active",
    "views": 0,
    "clicks": 0
})
