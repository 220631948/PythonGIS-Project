"""
Sentry utility functions for enhanced monitoring and alerting.

Sprint 4 - S4.5 (G.3.1, G.3.2, G.3.3): Production Monitoring with Sentry
- Geospatial context enrichment
- Database query performance monitoring
- Security event tracking and alerts
"""

from __future__ import annotations

import logging
import time
from typing import Any, Dict, Optional
from functools import wraps

try:
    import sentry_sdk
    from sentry_sdk import capture_message, capture_exception, set_context, set_tag
except Exception:  # pragma: no cover - optional
    sentry_sdk = None
    capture_message = None
    capture_exception = None
    set_context = None
    set_tag = None

logger = logging.getLogger(__name__)


def _sanitize_coord(value: Any) -> str:
    try:
        if isinstance(value, (list, tuple)):
            return ",".join(str(round(float(x), 4)) for x in value)
        return str(value)
    except Exception:
        return str(value)


def attach_geo_context(dataset_id: Optional[str] = None, layer: Optional[str] = None, srid: Optional[str] = None, centroid: Optional[Any] = None, bbox: Optional[Any] = None) -> None:
    """Attach sanitized geospatial context to the current Sentry scope as tags.

    Tags added: dataset_id, layer, srid, centroid (rounded), bbox (rounded)
    """
    if not sentry_sdk:
        return

    try:
        with sentry_sdk.configure_scope() as scope:
            if dataset_id:
                scope.set_tag("dataset_id", str(dataset_id))
            if layer:
                scope.set_tag("layer", str(layer))
            if srid:
                scope.set_tag("srid", str(srid))
            if centroid is not None:
                scope.set_tag("centroid", _sanitize_coord(centroid))
            if bbox is not None:
                scope.set_tag("bbox", _sanitize_coord(bbox))
    except Exception:
        # Avoid any errors affecting application flow
        pass


def make_map_link(centroid: Optional[Any] = None, zoom: Optional[int] = None, layers: Optional[list] = None) -> str:
    """Return a relative map link (query string) given centroid, zoom and optional layers.

    Examples:
        make_map_link([18.4242, -33.9249], zoom=12, layers=['clinics'])
            -> "/?center=-33.9249,18.4242&zoom=12&layers=clinics"
    """
    if centroid is None:
        return "/"
    try:
        # Expect centroid as [lng, lat] or [lat, lng]; normalize to lat,lng
        lat, lng = None, None
        if isinstance(centroid, (list, tuple)) and len(centroid) >= 2:
            # Heuristic: if first value magnitude > 90, treat as lng
            a, b = centroid[0], centroid[1]
            if abs(a) > 90:
                # a is lng, b is lat
                lng, lat = float(a), float(b)
            else:
                lat, lng = float(a), float(b)
        else:
            # Fallback - stringify
            return "/"

        q = f"/?center={lat:.4f},{lng:.4f}"
        if zoom is not None:
            q += f"&zoom={int(zoom)}"
        if layers:
            q += f"&layers={','.join(map(str, layers))}"
        return q
    except Exception:
        return "/"


def attach_map_link(centroid: Optional[Any] = None, zoom: Optional[int] = None, layers: Optional[list] = None) -> None:
    """Attach a reproducible map link to the current Sentry scope as extra."""
    if not sentry_sdk:
        return

    try:
        link = make_map_link(centroid, zoom, layers)
        with sentry_sdk.configure_scope() as scope:
            scope.set_extra("reproducible_map_url", link)
    except Exception:
        pass


# Sprint 4 - S4.5: Enhanced Monitoring Functions

def track_query_performance(
    query_type: str,
    duration: float,
    dataset: Optional[str] = None,
    row_count: Optional[int] = None,
) -> None:
    """
    Track database query performance metrics in Sentry.

    Args:
        query_type: Type of query (e.g., "spatial_intersection", "density_analysis")
        duration: Query execution time in seconds
        dataset: Name of the dataset queried
        row_count: Number of rows returned
    """
    if not sentry_sdk or not set_context:
        return

    query_context = {
        "query_type": query_type,
        "duration_seconds": round(duration, 3),
    }

    if dataset:
        query_context["dataset"] = dataset
    if row_count is not None:
        query_context["row_count"] = row_count

    set_context("query_performance", query_context)

    # Alert on slow queries (> 5 seconds)
    if duration > 5.0 and capture_message:
        capture_message(
            f"Slow query detected: {query_type}",
            level="warning",
            extras={
                "query_type": query_type,
                "duration": duration,
                "dataset": dataset,
                "row_count": row_count,
            },
        )


def track_security_event(
    event_type: str,
    severity: str,
    description: str,
    user_id: Optional[str] = None,
    tenant_id: Optional[int] = None,
    ip_address: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Track security events and send alerts to Sentry.

    Args:
        event_type: Type of security event (e.g., "sql_injection_attempt", "unauthorized_access")
        severity: Severity level ("info", "warning", "error", "critical")
        description: Human-readable description of the event
        user_id: User ID associated with the event
        tenant_id: Tenant ID for multi-tenant isolation tracking
        ip_address: IP address of the requester
        metadata: Additional context data
    """
    if not sentry_sdk or not capture_message:
        logger.warning(f"Security event: {event_type} - {description}")
        return

    # Set security tags for filtering
    if set_tag:
        set_tag("security_event", event_type)
        if user_id:
            set_tag("user_id", user_id)
        if tenant_id:
            set_tag("tenant_id", str(tenant_id))

    # Build security context
    security_context = {
        "event_type": event_type,
        "severity": severity,
        "description": description,
        "timestamp": time.time(),
    }

    if user_id:
        security_context["user_id"] = user_id
    if tenant_id:
        security_context["tenant_id"] = tenant_id
    if ip_address:
        security_context["ip_address"] = ip_address
    if metadata:
        security_context["metadata"] = metadata

    if set_context:
        set_context("security", security_context)

    # Determine Sentry level based on severity
    sentry_level = "info"
    if severity == "warning":
        sentry_level = "warning"
    elif severity in ["error", "critical"]:
        sentry_level = "error"

    # Send to Sentry
    capture_message(
        f"Security Event: {event_type} - {description}",
        level=sentry_level,
        extras=security_context,
    )


def monitor_db_query(query_type: str, dataset: Optional[str] = None):
    """
    Decorator to monitor database query performance.

    Usage:
        @monitor_db_query("spatial_intersection", dataset="clinics")
        async def my_query_function():
            ...
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time

                # Track query performance
                row_count = None
                if isinstance(result, (list, tuple)):
                    row_count = len(result)
                elif hasattr(result, "__len__"):
                    try:
                        row_count = len(result)
                    except:
                        pass

                track_query_performance(
                    query_type=query_type,
                    duration=duration,
                    dataset=dataset,
                    row_count=row_count,
                )

                return result
            except Exception as e:
                duration = time.time() - start_time
                if capture_exception:
                    capture_exception(e)
                raise
        return wrapper
    return decorator


def capture_validation_error(
    error_type: str,
    user_input: str,
    validation_rule: str,
    severity: str = "warning",
) -> None:
    """
    Capture validation errors that might indicate attack attempts.

    Args:
        error_type: Type of validation error (e.g., "invalid_layer_name", "invalid_bbox")
        user_input: The invalid input (sanitized if necessary)
        validation_rule: The validation rule that was violated
        severity: Severity level
    """
    track_security_event(
        event_type=f"validation_error_{error_type}",
        severity=severity,
        description=f"Validation failed: {validation_rule}",
        metadata={
            "user_input": user_input[:200],  # Truncate to avoid large payloads
            "validation_rule": validation_rule,
        },
    )


def capture_rate_limit_exceeded(
    endpoint: str,
    ip_address: str,
    user_id: Optional[str] = None,
    tenant_id: Optional[int] = None,
) -> None:
    """
    Capture rate limit exceeded events.

    Args:
        endpoint: The API endpoint that was rate limited
        ip_address: IP address of the requester
        user_id: Optional user ID
        tenant_id: Optional tenant ID
    """
    track_security_event(
        event_type="rate_limit_exceeded",
        severity="warning",
        description=f"Rate limit exceeded for {endpoint}",
        user_id=user_id,
        tenant_id=tenant_id,
        ip_address=ip_address,
        metadata={"endpoint": endpoint},
    )


def capture_authentication_failure(
    reason: str,
    email: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    """
    Capture authentication failure events.

    Args:
        reason: Reason for authentication failure
        email: Email address (will be hashed for privacy)
        ip_address: IP address of the requester
    """
    import hashlib

    # Hash email for privacy
    email_hash = None
    if email:
        email_hash = hashlib.sha256(email.encode()).hexdigest()[:16]

    track_security_event(
        event_type="authentication_failure",
        severity="warning",
        description=f"Authentication failed: {reason}",
        ip_address=ip_address,
        metadata={
            "reason": reason,
            "email_hash": email_hash,
        },
    )


def capture_authorization_failure(
    resource: str,
    action: str,
    user_id: str,
    tenant_id: int,
    ip_address: Optional[str] = None,
) -> None:
    """
    Capture authorization failure events (access to resources they shouldn't access).

    Args:
        resource: Resource being accessed
        action: Action being attempted
        user_id: User ID attempting the action
        tenant_id: Tenant ID of the user
        ip_address: IP address of the requester
    """
    track_security_event(
        event_type="authorization_failure",
        severity="warning",
        description=f"Unauthorized {action} attempt on {resource}",
        user_id=user_id,
        tenant_id=tenant_id,
        ip_address=ip_address,
        metadata={
            "resource": resource,
            "action": action,
        },
    )


def capture_tenant_isolation_violation(
    user_tenant_id: int,
    accessed_tenant_id: int,
    resource: str,
    user_id: str,
    ip_address: Optional[str] = None,
) -> None:
    """
    Capture tenant isolation violations (critical security event).

    Args:
        user_tenant_id: Tenant ID of the user making the request
        accessed_tenant_id: Tenant ID of the resource accessed
        resource: Resource being accessed
        user_id: User ID attempting the access
        ip_address: IP address of the requester
    """
    track_security_event(
        event_type="tenant_isolation_violation",
        severity="critical",
        description=f"Tenant {user_tenant_id} attempted to access tenant {accessed_tenant_id} resource",
        user_id=user_id,
        tenant_id=user_tenant_id,
        ip_address=ip_address,
        metadata={
            "user_tenant_id": user_tenant_id,
            "accessed_tenant_id": accessed_tenant_id,
            "resource": resource,
        },
    )


def capture_sql_injection_attempt(
    attempted_payload: str,
    endpoint: str,
    ip_address: Optional[str] = None,
    user_id: Optional[str] = None,
) -> None:
    """
    Capture SQL injection attempts (critical security event).

    Args:
        attempted_payload: The malicious payload (sanitized/truncated)
        endpoint: The API endpoint targeted
        ip_address: IP address of the attacker
        user_id: User ID if authenticated
    """
    track_security_event(
        event_type="sql_injection_attempt",
        severity="critical",
        description=f"SQL injection attempt detected at {endpoint}",
        user_id=user_id,
        ip_address=ip_address,
        metadata={
            "payload": attempted_payload[:200],  # Truncate to avoid large payloads
            "endpoint": endpoint,
        },
    )
