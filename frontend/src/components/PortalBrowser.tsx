import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Layers,
  Map,
  Eye,
  EyeOff,
  Info,
  ChevronDown,
  ChevronRight,
  MapPin,
  Building,
  TreePine,
  Navigation,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Filter,
  X,
  LucideIcon
} from 'lucide-react';

// Category icons mapping
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  imagery: Map,
  boundaries: MapPin,
  infrastructure: Building,
  environment: TreePine,
  planning: Layers,
  transport: Navigation,
  services: Building,
  safety: AlertTriangle
};

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  imagery: '#8b5cf6',
  boundaries: '#3b82f6',
  infrastructure: '#f59e0b',
  environment: '#22c55e',
  planning: '#ec4899',
  transport: '#06b6d4',
  services: '#f97316',
  safety: '#ef4444'
};

interface Dataset {
  id: string;
  name: string;
  description: string;
  category: string;
  geometry_type: string;
  format: string;
  url: string;
  attribution: string;
}

interface Category {
  name: string;
  displayName: string;
  count: number;
}

interface MetadataResponse {
    metadata: any;
}

interface DatasetCardProps {
  dataset: Dataset;
  isActive: boolean;
  onToggle: (id: string) => void;
  onViewInfo: (dataset: Dataset) => void;
}

const DatasetCard: React.FC<DatasetCardProps> = ({ dataset, isActive, onToggle, onViewInfo }) => {
  const IconComponent = CATEGORY_ICONS[dataset.category] || Layers;
  const categoryColor = CATEGORY_COLORS[dataset.category] || '#6b7280';

  return (
    <div className={`dataset-item ${isActive ? 'active' : ''}`}>
      <div className="dataset-item-header">
        <div
          className="dataset-icon"
          style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
        >
          <IconComponent size={16} />
        </div>
        <div className="dataset-item-info">
          <h4>{dataset.name}</h4>
          <p>{dataset.description}</p>
        </div>
        <div className="dataset-item-actions">
          <button
            className="icon-btn"
            onClick={() => onViewInfo(dataset)}
            title="View details"
          >
            <Info size={16} />
          </button>
          <button
            className={`icon-btn ${isActive ? 'active' : ''}`}
            onClick={() => onToggle(dataset.id)}
            title={isActive ? 'Hide layer' : 'Show layer'}
          >
            {isActive ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>
      </div>
      <div className="dataset-item-meta">
        <span
            className="meta-badge"
            style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
        >
          {dataset.category}
        </span>
        <span className="meta-type">{dataset.geometry_type}</span>
        <span className="meta-format">{dataset.format}</span>
      </div>
    </div>
  );
};

interface CategorySectionProps {
  category: Category;
  datasets: Dataset[];
  activeLayers: string[];
  onToggleLayer: (id: string) => void;
  onViewInfo: (dataset: Dataset) => void;
}

const CategorySection: React.FC<CategorySectionProps> = ({ category, datasets, activeLayers, onToggleLayer, onViewInfo }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const IconComponent = CATEGORY_ICONS[category.name] || Layers;
  const categoryColor = CATEGORY_COLORS[category.name] || '#6b7280';

  const activeCount = datasets.filter(d => activeLayers.includes(d.id)).length;

  return (
    <div className="category-section">
      <button
        className="category-header"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className="category-title">
          <IconComponent size={18} style={{ color: categoryColor }} />
          <span>{category.displayName}</span>
          <span className="category-count">
            {activeCount > 0 && <span className="active-badge">{activeCount}</span>}
            {category.count}
          </span>
        </div>
        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
      </button>

      {isExpanded && (
        <div className="category-datasets">
          {datasets.map(dataset => (
            <DatasetCard
              key={dataset.id}
              dataset={dataset}
              isActive={activeLayers.includes(dataset.id)}
              onToggle={onToggleLayer}
              onViewInfo={onViewInfo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface DatasetInfoModalProps {
  dataset: Dataset;
  onClose: () => void;
  onAddToMap: (id: string) => void;
}

const DatasetInfoModal: React.FC<DatasetInfoModalProps> = ({ dataset, onClose, onAddToMap }) => {
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await fetch(`/api/portal/datasets/${dataset.id}`);
        const data = await response.json();
        setMetadata(data);
      } catch (error) {
        console.error('Error fetching metadata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [dataset.id]);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-container dataset-info-modal">
        <div className="modal-header">
          <h2>
            <Layers size={20} />
            {dataset.name}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close dataset details">
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {loading ? (
            <div className="loading-state">
              <Loader2 size={24} className="spinning" />
              <p>Loading metadata...</p>
            </div>
          ) : (
            <>
              <div className="info-section">
                <h3>Description</h3>
                <p>{dataset.description}</p>
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Category</span>
                  <span className="info-value">{dataset.category}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Geometry Type</span>
                  <span className="info-value">{dataset.geometry_type}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Format</span>
                  <span className="info-value">{dataset.format}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Attribution</span>
                  <span className="info-value">{dataset.attribution}</span>
                </div>
              </div>

              <div className="info-section">
                <h3>Data Source</h3>
                <a
                  href={dataset.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  <ExternalLink size={14} />
                  View on Cape Town Open Data Portal
                </a>
              </div>

              {metadata?.metadata && (
                <div className="info-section">
                  <h3>Layer Details</h3>
                  <pre className="metadata-json">
                    {JSON.stringify(metadata.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn-primary" onClick={() => { onAddToMap(dataset.id); onClose(); }}>
            <Eye size={16} />
            Add to Map
          </button>
        </div>
      </div>
    </div>
  );
};

interface PortalBrowserProps {
  activeLayers: string[];
  onToggleLayer: (id: string) => void;
}
const PortalBrowser: React.FC<PortalBrowserProps> = ({ activeLayers, onToggleLayer }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory] = useState<string | null>(null);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [geometryFilter, setGeometryFilter] = useState<string | null>(null);

  // Fetch categories and datasets
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, datasetsRes] = await Promise.all([
          fetch('/api/portal/categories'),
          fetch('/api/portal/datasets')
        ]);

        const categoriesData = await categoriesRes.json();
        const datasetsData = await datasetsRes.json();

        setCategories(categoriesData);
        setDatasets(datasetsData.datasets);
      } catch (error) {
        console.error('Error fetching portal data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter datasets
  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = !searchQuery ||
      dataset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dataset.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || dataset.category === selectedCategory;
    const matchesGeometry = !geometryFilter || dataset.geometry_type === geometryFilter;

    return matchesSearch && matchesCategory && matchesGeometry;
  });

  // Group datasets by category
  // Using Record<string, Dataset[]> for the accumulator
  const groupedDatasets = categories.reduce((acc, category) => {
    acc[category.name] = filteredDatasets.filter(d => d.category === category.name);
    return acc;
  }, {} as Record<string, Dataset[]>);

  if (loading) {
    return (
      <div className="portal-browser loading">
        <Loader2 size={32} className="spinning" />
        <p>Loading Cape Town Open Data Portal...</p>
      </div>
    );
  }

  return (
    <div className="portal-browser">
      <div className="portal-header">
        <h3>
          <Database size={18} />
          Cape Town Open Data Portal
        </h3>
        <span className="dataset-count">{datasets.length} datasets</span>
      </div>

      <div className="portal-search">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="portal-filters">
        <div className="filter-group">
          <label>
            <Filter size={14} />
            Geometry
          </label>
          <select
            value={geometryFilter || ''}
            onChange={(e) => setGeometryFilter(e.target.value || null)}
          >
            <option value="">All types</option>
            <option value="Point">Points</option>
            <option value="Line">Lines</option>
            <option value="Polygon">Polygons</option>
            <option value="Raster">Raster</option>
          </select>
        </div>
      </div>

      <div className="portal-content">
        {categories.map(category => {
          const categoryDatasets = groupedDatasets[category.name] || [];
          if (categoryDatasets.length === 0) return null;

          return (
            <CategorySection
              key={category.name}
              category={category}
              datasets={categoryDatasets}
              activeLayers={activeLayers}
              onToggleLayer={onToggleLayer}
              onViewInfo={setSelectedDataset}
            />
          );
        })}

        {filteredDatasets.length === 0 && (
          <div className="no-results">
            <Search size={32} />
            <p>No datasets match your search</p>
          </div>
        )}
      </div>

      <div className="portal-footer">
        <a
          href="https://odp-cctegis.opendata.arcgis.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink size={14} />
          Browse full portal
        </a>
      </div>

      {selectedDataset && (
        <DatasetInfoModal
          dataset={selectedDataset}
          onClose={() => setSelectedDataset(null)}
          onAddToMap={onToggleLayer}
        />
      )}
    </div>
  );
};

export default PortalBrowser;
