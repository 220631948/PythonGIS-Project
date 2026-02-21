/**
 * ExportPanel - Data export and printable reports
 *
 * Provides:
 * - Export spatial data in CSV, XLSX, GeoJSON formats
 * - Export analysis results
 * - Printable map configuration
 */

import { useState, useEffect, useId } from 'react'; // React is still needed for hooks
import { Download, FileText, Printer, Clock, X } from 'lucide-react';
import { apiClient } from '../lib/api';
// Removed ts-ignore as apiClient is typed

const EXPORT_FORMATS = [
  { id: 'csv', name: 'CSV', icon: '📊', description: 'Comma-separated values (attributes only)' },
  { id: 'xlsx', name: 'Excel', icon: '📗', description: 'Microsoft Excel format' },
  { id: 'geojson', name: 'GeoJSON', icon: '🗺️', description: 'GeoJSON with full geometry' },
  { id: 'kml', name: 'KML', icon: '🌍', description: 'Google Earth format' }
];

interface Dataset {
  id: string;
  title: string;
}

interface ExportRequest {
  dataset?: string;
  analysis_type?: string;
  format: string;
  parameters?: {
    lat: number;
    lng: number;
  };
}

interface ExportFile {
  file_id: string;
  filename: string;
  size_bytes: number;
}

interface PrintConfig {
  title: string;
  subtitle: string;
  paper_size: string;
  orientation: string;
  show_legend: boolean;
  show_scale_bar: boolean;
  show_north_arrow: boolean;
  dpi: number;
  bounds?: any;
  layers?: string[];
}

interface ExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  mapBounds: any;
  activeLayers: string[];
  onNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
}

function DataExportForm({ datasets, onExport }: { datasets: Dataset[], onExport: (_req: ExportRequest) => Promise<void> }) {
  const [selectedDataset, setSelectedDataset] = useState('');
  const [format, setFormat] = useState('geojson');
  const [isExporting, setIsExporting] = useState(false);
  const datasetId = useId();

  const handleExport = async () => {
    if (!selectedDataset) return;

    setIsExporting(true);
    try {
      await onExport({
        dataset: selectedDataset,
        format: format
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-form">
      <h3><Download size={18} /> Export Dataset</h3>

      <div className="form-group">
        <label htmlFor={datasetId}>Dataset</label>
        <select
          id={datasetId}
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value)}
        >
          <option value="">Select a dataset...</option>
          {datasets.map(d => (
            <option key={d.id} value={d.id}>{d.title || d.id}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Format</label>
        <div className="format-options">
          {EXPORT_FORMATS.map(f => (
            <button
              key={f.id}
              className={`format-option ${format === f.id ? 'selected' : ''}`}
              onClick={() => setFormat(f.id)}
              title={f.description}
            >
              <span className="format-icon">{f.icon}</span>
              <span className="format-name">{f.name}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        className="btn-primary export-btn"
        onClick={handleExport}
        disabled={!selectedDataset || isExporting}
      >
        {isExporting ? (
          <>
            <Clock size={16} className="spin" /> Exporting...
          </>
        ) : (
          <>
            <Download size={16} /> Export
          </>
        )}
      </button>
    </div>
  );
}

function AnalysisExportForm({ onExport }: { onExport: (_req: ExportRequest) => Promise<void> }) {
  const [analysisType, setAnalysisType] = useState('suitability');
  const [lat, setLat] = useState(-33.9249);
  const [lng, setLng] = useState(18.4241);
  const [format, setFormat] = useState('geojson');
  const [isExporting, setIsExporting] = useState(false);

  const analysisTypeId = useId();
  const latId = useId();
  const lngId = useId();
  const formatId = useId();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport({
        analysis_type: analysisType,
        format: format,
        parameters: { lat, lng }
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-form">
      <h3><FileText size={18} /> Export Analysis</h3>

      <div className="form-group">
        <label htmlFor={analysisTypeId}>Analysis Type</label>
        <select
          id={analysisTypeId}
          value={analysisType}
          onChange={(e) => setAnalysisType(e.target.value)}
        >
          <option value="suitability">Site Suitability</option>
          <option value="flood_risk">Flood Risk</option>
          <option value="accessibility">Accessibility</option>
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor={latId}>Latitude</label>
          <input
            id={latId}
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => setLat(parseFloat(e.target.value))}
          />
        </div>
        <div className="form-group">
          <label htmlFor={lngId}>Longitude</label>
          <input
            id={lngId}
            type="number"
            step="0.0001"
            value={lng}
            onChange={(e) => setLng(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor={formatId}>Format</label>
        <select id={formatId} value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="geojson">JSON</option>
          <option value="csv">CSV</option>
        </select>
      </div>

      <button
        className="btn-primary export-btn"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? 'Exporting...' : 'Export Analysis'}
      </button>
    </div>
  );
}

function PrintMapForm({ mapBounds, activeLayers, onPrint }: { mapBounds: any, activeLayers: string[], onPrint: (_config: PrintConfig) => void }) {
  const [config, setConfig] = useState<PrintConfig>({
    title: 'Cape Town Map',
    subtitle: '',
    paper_size: 'a4',
    orientation: 'landscape',
    show_legend: true,
    show_scale_bar: true,
    show_north_arrow: true,
    dpi: 150
  });

  const titleId = useId();
  const subtitleId = useId();
  const paperSizeId = useId();
  const orientationId = useId();

  const handlePrint = () => {
    onPrint({
      ...config,
      bounds: mapBounds,
      layers: activeLayers
    });
  };

  return (
    <div className="export-form">
      <h3><Printer size={18} /> Print Map</h3>

      <div className="form-group">
        <label htmlFor={titleId}>Title</label>
        <input
          id={titleId}
          type="text"
          value={config.title}
          onChange={(e) => setConfig({...config, title: e.target.value})}
          placeholder="Map title"
        />
      </div>

      <div className="form-group">
        <label htmlFor={subtitleId}>Subtitle</label>
        <input
          id={subtitleId}
          type="text"
          value={config.subtitle}
          onChange={(e) => setConfig({...config, subtitle: e.target.value})}
          placeholder="Optional subtitle"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor={paperSizeId}>Paper Size</label>
          <select
            id={paperSizeId}
            value={config.paper_size}
            onChange={(e) => setConfig({...config, paper_size: e.target.value})}
          >
            <option value="a4">A4</option>
            <option value="a3">A3</option>
            <option value="letter">Letter</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor={orientationId}>Orientation</label>
          <select
            id={orientationId}
            value={config.orientation}
            onChange={(e) => setConfig({...config, orientation: e.target.value})}
          >
            <option value="landscape">Landscape</option>
            <option value="portrait">Portrait</option>
          </select>
        </div>
      </div>

      <div className="form-group checkboxes">
        <label>
          <input
            type="checkbox"
            checked={config.show_legend}
            onChange={(e) => setConfig({...config, show_legend: e.target.checked})}
          />
          Show Legend
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.show_scale_bar}
            onChange={(e) => setConfig({...config, show_scale_bar: e.target.checked})}
          />
          Show Scale Bar
        </label>
        <label>
          <input
            type="checkbox"
            checked={config.show_north_arrow}
            onChange={(e) => setConfig({...config, show_north_arrow: e.target.checked})}
          />
          Show North Arrow
        </label>
      </div>

      <button className="btn-primary" onClick={handlePrint}>
        <Printer size={16} /> Generate Print Layout
      </button>

      <p className="print-hint">
        Tip: Use your browser's print function (Ctrl+P) with the generated layout
      </p>
    </div>
  );
}

function PendingExports({ exports }: { exports: ExportFile[] }) {
  if (!exports || exports.length === 0) return null;

  return (
    <div className="pending-exports">
      <h4>Recent Exports</h4>
      {exports.map(exp => (
        <div key={exp.file_id} className="export-item">
          <span className="export-filename">{exp.filename}</span>
          <span className="export-size">{(exp.size_bytes / 1024).toFixed(1)} KB</span>
          <a
            href={apiClient.export.getDownloadUrl(exp.file_id)}
            className="download-link"
            download
          >
            <Download size={14} /> Download
          </a>
        </div>
      ))}
    </div>
  );
}

export default function ExportPanel({
  isOpen,
  onClose,
  mapBounds,
  activeLayers,
  onNotification
}: ExportPanelProps) {
  const [activeTab, setActiveTab] = useState<'data' | 'analysis' | 'print'>('data');
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [pendingExports, setPendingExports] = useState<ExportFile[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadDatasets();
      loadPendingExports();
    }
  }, [isOpen]);

  const loadDatasets = async () => {
    try {
      const data = (await apiClient.catalog.getDatasets()) as Dataset[];
      setDatasets(data ?? []);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  const loadPendingExports = async () => {
    try {
      const data = (await apiClient.export.getPending()) as { exports?: ExportFile[] };
      setPendingExports(data.exports ?? []);
    } catch (error) {
      console.error('Failed to load pending exports:', error);
    }
  };

  const handleDataExport = async (request: ExportRequest) => {
    try {
      const result = await apiClient.export.exportData(request) as { filename: string };
      onNotification?.(`Export ready: ${result.filename}`, 'success');
      loadPendingExports();
    } catch (error: any) {
      onNotification?.('Export failed: ' + error.message, 'error');
    }
  };

  const handleAnalysisExport = async (request: ExportRequest) => {
    try {
      const result = await apiClient.export.exportAnalysis(request) as { filename: string };
      onNotification?.(`Analysis export ready: ${result.filename}`, 'success');
      loadPendingExports();
    } catch (error: any) {
      onNotification?.('Export failed: ' + error.message, 'error');
    }
  };

  const handlePrint = (config: PrintConfig) => {
    // For now, trigger browser print with current map view
    // Full implementation would generate a printable layout
    onNotification?.(`Print layout configured for "${config.title}". Use Ctrl+P to print.`, 'info');
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="export-panel">
      <div className="panel-header">
        <h2><Download size={20} /> Export & Print</h2>
        <button onClick={onClose} aria-label="Close export panel"><X size={18} /></button>
      </div>

      <div className="tab-bar">
        <button
          className={activeTab === 'data' ? 'active' : ''}
          onClick={() => setActiveTab('data')}
        >
          <Download size={14} /> Data
        </button>
        <button
          className={activeTab === 'analysis' ? 'active' : ''}
          onClick={() => setActiveTab('analysis')}
        >
          <FileText size={14} /> Analysis
        </button>
        <button
          className={activeTab === 'print' ? 'active' : ''}
          onClick={() => setActiveTab('print')}
        >
          <Printer size={14} /> Print
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'data' && (
          <DataExportForm
            datasets={datasets}
            onExport={handleDataExport}
          />
        )}
        {activeTab === 'analysis' && (
          <AnalysisExportForm onExport={handleAnalysisExport} />
        )}
        {activeTab === 'print' && (
          <PrintMapForm
            mapBounds={mapBounds}
            activeLayers={activeLayers}
            onPrint={handlePrint}
          />
        )}
      </div>

      <PendingExports exports={pendingExports} />
    </div>
  );
}

