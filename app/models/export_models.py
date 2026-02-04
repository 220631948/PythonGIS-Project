"""
Export Models - Pydantic models for data export and printable reports

Supports:
- Export formats: CSV, XLSX, GeoJSON, PDF
- Printable maps with legends, titles, scale bars
- Report generation configuration
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional
from enum import Enum
from datetime import datetime


class ExportFormat(str, Enum):
    """Supported export formats"""
    CSV = "csv"
    XLSX = "xlsx"
    GEOJSON = "geojson"
    PDF = "pdf"
    SHAPEFILE = "shapefile"
    KML = "kml"


class PaperSize(str, Enum):
    """Paper sizes for print exports"""
    A4 = "a4"
    A3 = "a3"
    LETTER = "letter"
    LEGAL = "legal"


class Orientation(str, Enum):
    """Page orientation"""
    PORTRAIT = "portrait"
    LANDSCAPE = "landscape"


class MapBounds(BaseModel):
    """Geographic bounds for map export"""
    north: float
    south: float
    east: float
    west: float


class LegendItem(BaseModel):
    """Legend entry for printable maps"""
    label: str
    color: str
    symbol: str = "square"  # square, circle, line


class MapPrintConfig(BaseModel):
    """Configuration for printable map generation"""
    title: str = Field(..., max_length=200)
    subtitle: Optional[str] = Field(default=None, max_length=300)
    bounds: MapBounds
    zoom: int = Field(default=14, ge=1, le=22)
    paper_size: PaperSize = Field(default=PaperSize.A4)
    orientation: Orientation = Field(default=Orientation.LANDSCAPE)
    show_legend: bool = True
    legend_items: List[LegendItem] = Field(default_factory=list)
    show_scale_bar: bool = True
    show_north_arrow: bool = True
    show_grid: bool = False
    layers: List[str] = Field(default_factory=list, description="Layer IDs to include")
    base_map: str = Field(default="streets", description="Base map style")
    dpi: int = Field(default=150, ge=72, le=300)
    footer_text: Optional[str] = None
    include_timestamp: bool = True


class DataExportRequest(BaseModel):
    """Request for exporting spatial data"""
    dataset: str = Field(..., description="Dataset ID to export")
    format: ExportFormat
    columns: Optional[List[str]] = Field(default=None, description="Columns to include (all if None)")
    filter_bbox: Optional[List[float]] = Field(default=None, description="[minLng, minLat, maxLng, maxLat]")
    filter_query: Optional[Dict[str, Any]] = Field(default=None, description="Attribute filter")
    simplify: Optional[float] = Field(default=None, description="Geometry simplification tolerance")
    include_metadata: bool = True


class AnalysisExportRequest(BaseModel):
    """Request for exporting analysis results"""
    analysis_type: str = Field(..., description="Type of analysis (suitability, flood_risk, etc.)")
    format: ExportFormat
    parameters: Dict[str, Any] = Field(default_factory=dict)
    include_source_data: bool = False
    include_summary_stats: bool = True


class ExportResponse(BaseModel):
    """Response containing export file info"""
    file_id: str
    filename: str
    format: ExportFormat
    size_bytes: int
    download_url: str
    expires_at: datetime
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ReportSection(BaseModel):
    """Section of a generated report"""
    title: str
    content_type: str = "text"  # text, table, chart, map
    content: Any


class ReportConfig(BaseModel):
    """Configuration for comprehensive report generation"""
    title: str
    description: Optional[str] = None
    location: Optional[Dict[str, float]] = None  # {lat, lng}
    sections: List[str] = Field(
        default=["summary", "location_analysis", "environmental", "infrastructure", "recommendations"],
        description="Report sections to include"
    )
    include_maps: bool = True
    include_charts: bool = True
    format: ExportFormat = Field(default=ExportFormat.PDF)
