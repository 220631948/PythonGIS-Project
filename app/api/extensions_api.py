"""
API Marketplace & Extensions API

Provides endpoints for:
- Plugin architecture for third-party extensions
- API usage dashboard with quotas
- Developer documentation portal
- Webhook support for integrations
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, Field, HttpUrl
from typing import List, Optional
from datetime import datetime, timedelta
import logging
import uuid
import hashlib

router = APIRouter(prefix="/extensions", tags=["Extensions & Marketplace"])
logger = logging.getLogger(__name__)

extensions_db = []
api_keys_db = []
webhooks_db = []
usage_stats_db = []


class ExtensionCreate(BaseModel):
    """Register a new extension"""
    name: str
    description: str
    version: str
    author: str
    homepage_url: Optional[HttpUrl] = None
    documentation_url: Optional[HttpUrl] = None
    permissions: List[str] = Field(..., description="Required permissions")
    webhook_url: Optional[HttpUrl] = None


class APIKeyCreate(BaseModel):
    """Create API key for extension"""
    name: str
    description: Optional[str] = None
    rate_limit: int = Field(1000, description="Requests per hour")
    quota: int = Field(10000, description="Requests per month")
    scopes: List[str] = Field(["read"], description="read, write, admin")


class WebhookCreate(BaseModel):
    """Register a webhook"""
    url: HttpUrl
    events: List[str] = Field(..., description="Events to subscribe to")
    secret: Optional[str] = Field(None, description="Webhook secret for verification")


@router.post("/register")
async def register_extension(extension: ExtensionCreate):
    """Register a new extension in the marketplace."""
    try:
        extension_entry = {
            "id": str(uuid.uuid4()),
            "name": extension.name,
            "description": extension.description,
            "version": extension.version,
            "author": extension.author,
            "homepage_url": str(extension.homepage_url) if extension.homepage_url else None,
            "documentation_url": str(extension.documentation_url) if extension.documentation_url else None,
            "permissions": extension.permissions,
            "webhook_url": str(extension.webhook_url) if extension.webhook_url else None,
            "status": "pending_review",
            "created_at": datetime.now().isoformat(),
            "installs": 0,
            "rating": 0.0
        }

        extensions_db.append(extension_entry)

        return {
            "success": True,
            "extension_id": extension_entry["id"],
            "message": "Extension registered successfully. Awaiting review.",
            "status": "pending_review"
        }

    except Exception as e:
        logger.error(f"Extension registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/marketplace")
async def get_marketplace_extensions(
    category: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 50
):
    """Browse extensions in the marketplace."""
    try:
        filtered = [e for e in extensions_db if e["status"] == "approved"]

        if category:
            filtered = [e for e in filtered if category in e.get("categories", [])]

        if search:
            search_lower = search.lower()
            filtered = [
                e for e in filtered
                if search_lower in e["name"].lower() or search_lower in e["description"].lower()
            ]

        # Sort by popularity
        filtered = sorted(filtered, key=lambda x: (x["rating"], x["installs"]), reverse=True)

        return {
            "extensions": filtered[:limit],
            "total": len(filtered)
        }

    except Exception as e:
        logger.error(f"Marketplace browse error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/api-keys")
async def create_api_key(key_request: APIKeyCreate, user_id: str):
    """Create an API key for extension development."""
    try:
        # Generate secure API key
        api_key = f"gk_{hashlib.sha256(f'{user_id}{datetime.now().isoformat()}'.encode()).hexdigest()[:32]}"

        key_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "name": key_request.name,
            "description": key_request.description,
            "api_key": api_key,
            "rate_limit": key_request.rate_limit,
            "quota": key_request.quota,
            "scopes": key_request.scopes,
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "last_used": None,
            "usage": {"requests": 0, "quota_used": 0}
        }

        api_keys_db.append(key_entry)

        return {
            "success": True,
            "api_key": api_key,
            "key_id": key_entry["id"],
            "rate_limit": key_request.rate_limit,
            "quota": key_request.quota,
            "message": "API key created successfully. Keep it secure!"
        }

    except Exception as e:
        logger.error(f"API key creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api-keys/{user_id}")
async def get_user_api_keys(user_id: str):
    """Get API keys for a user."""
    try:
        user_keys = [
            {**k, "api_key": f"{k['api_key'][:8]}...{k['api_key'][-4:]}"} # Mask key
            for k in api_keys_db
            if k["user_id"] == user_id
        ]

        return {
            "api_keys": user_keys,
            "total": len(user_keys)
        }

    except Exception as e:
        logger.error(f"Get API keys error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/usage")
async def get_api_usage(
    api_key: str = Header(..., description="X-API-Key header"),
    period: str = "day"
):
    """Get API usage statistics for a key."""
    try:
        key_entry = next((k for k in api_keys_db if k["api_key"] == api_key), None)

        if not key_entry:
            raise HTTPException(status_code=401, detail="Invalid API key")

        # Mock usage data
        usage_data = {
            "period": period,
            "requests": {
                "total": 850,
                "successful": 820,
                "failed": 30,
                "rate_limited": 5
            },
            "quota": {
                "limit": key_entry["quota"],
                "used": 850,
                "remaining": key_entry["quota"] - 850,
                "reset_at": (datetime.now() + timedelta(days=30)).isoformat()
            },
            "endpoints": [
                {"path": "/api/data/suburbs", "calls": 350},
                {"path": "/api/geocode/search", "calls": 250},
                {"path": "/api/network/route", "calls": 150},
                {"path": "/api/3d/buildings/extrude", "calls": 100}
            ],
            "rate_limit": {
                "limit": key_entry["rate_limit"],
                "window": "hour",
                "current": 45,
                "reset_at": (datetime.now() + timedelta(hours=1)).isoformat()
            }
        }

        return usage_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Usage stats error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhooks")
async def register_webhook(webhook: WebhookCreate, user_id: str):
    """Register a webhook for event notifications."""
    try:
        webhook_entry = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "url": str(webhook.url),
            "events": webhook.events,
            "secret": webhook.secret or hashlib.sha256(str(uuid.uuid4()).encode()).hexdigest(),
            "status": "active",
            "created_at": datetime.now().isoformat(),
            "last_triggered": None,
            "delivery_count": 0,
            "failure_count": 0
        }

        webhooks_db.append(webhook_entry)

        return {
            "success": True,
            "webhook_id": webhook_entry["id"],
            "secret": webhook_entry["secret"],
            "message": "Webhook registered successfully"
        }

    except Exception as e:
        logger.error(f"Webhook registration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/webhooks/{user_id}")
async def get_user_webhooks(user_id: str):
    """Get webhooks for a user."""
    try:
        user_webhooks = [w for w in webhooks_db if w["user_id"] == user_id]
        return {"webhooks": user_webhooks, "total": len(user_webhooks)}
    except Exception as e:
        logger.error(f"Get webhooks error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/docs/getting-started")
async def get_developer_docs():
    """Get developer documentation."""
    try:
        return {
            "title": "Cape Town GeoHub API Documentation",
            "version": "2.0",
            "base_url": "https://api.geohub.capetown/api",
            "authentication": {
                "type": "API Key",
                "header": "X-API-Key",
                "instructions": "Create an API key in your developer dashboard"
            },
            "quickstart": {
                "step_1": "Register for an account",
                "step_2": "Create an API key",
                "step_3": "Make your first request",
                "example": {
                    "endpoint": "/api/data/suburbs?limit=10",
                    "method": "GET",
                    "headers": {"X-API-Key": "your_api_key_here"}
                }
            },
            "rate_limits": {
                "default": "1000 requests/hour",
                "premium": "10000 requests/hour"
            },
            "resources": {
                "api_reference": "/api/docs",
                "tutorials": "/docs/tutorials",
                "examples": "/docs/examples",
                "support": "support@geohub.capetown"
            }
        }
    except Exception as e:
        logger.error(f"Get docs error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
