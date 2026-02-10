"""Utilities to attach geospatial context to Sentry events."""

from __future__ import annotations

from typing import Any, Optional

try:
    import sentry_sdk
except Exception:  # pragma: no cover - optional
    sentry_sdk = None


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
