import React, { useState, useEffect } from 'react';
import {
  Download,
  Trash2,
  HardDrive,
  Wifi,
  WifiOff,
  RefreshCw,
  Check,
  X,
  Cloud,
  CloudOff,
  Database,
  AlertCircle,
  Loader2,
  Pause,
  Play
} from 'lucide-react';
import { useOfflineData, AVAILABLE_DATASETS } from '../hooks/useOfflineData';

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (timestamp) => {
  if (!timestamp) return 'Never';
  return new Date(timestamp).toLocaleDateString('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const DatasetCard = ({
  dataset,
  progress,
  onDownload,
  onDelete,
  isOnline
}) => {
  const isDownloading = progress !== undefined && progress >= 0 && progress < 100;
  const downloadFailed = progress === -1;
  const isComplete = progress === 100 || dataset.isDownloaded;

  return (
    <div className={`dataset-card ${isComplete ? 'downloaded' : ''} ${isDownloading ? 'downloading' : ''}`}>
      <div className="dataset-card-header">
        <div className="dataset-icon">
          <Database size={20} />
        </div>
        <div className="dataset-info">
          <h4>{dataset.name}</h4>
          <p>{dataset.description}</p>
        </div>
        <div className={`priority-badge ${dataset.priority}`}>
          {dataset.priority}
        </div>
      </div>

      <div className="dataset-meta">
        <span className="meta-item">
          <HardDrive size={14} />
          {dataset.cachedSize ? formatBytes(dataset.cachedSize) : dataset.size}
        </span>
        <span className="meta-item">
          Module: {dataset.module}
        </span>
        {dataset.downloadedAt && (
          <span className="meta-item">
            Updated: {formatDate(dataset.downloadedAt)}
          </span>
        )}
      </div>

      {isDownloading && (
        <div className="download-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      )}

      {downloadFailed && (
        <div className="download-error">
          <AlertCircle size={14} />
          <span>Download failed. Please try again.</span>
        </div>
      )}

      <div className="dataset-actions">
        {isComplete ? (
          <>
            <button
              className="btn-secondary"
              onClick={() => onDownload(dataset.id)}
              disabled={!isOnline || isDownloading}
              title="Update data"
            >
              <RefreshCw size={16} />
              Update
            </button>
            <button
              className="btn-danger"
              onClick={() => onDelete(dataset.id)}
              disabled={isDownloading}
              title="Remove from device"
            >
              <Trash2 size={16} />
              Remove
            </button>
          </>
        ) : (
          <button
            className="btn-primary"
            onClick={() => onDownload(dataset.id)}
            disabled={!isOnline || isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 size={16} className="spinning" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={16} />
                Download
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const OfflineDataManager = ({ isOpen, onClose }) => {
  const {
    datasets,
    downloadProgress,
    storageInfo,
    isOnline,
    downloadDataset,
    deleteDataset,
    downloadPriorityDatasets,
    clearAllData
  } = useOfflineData();

  const [activeTab, setActiveTab] = useState('datasets');
  const [isClearing, setIsClearing] = useState(false);

  const downloadedCount = datasets.filter(d => d.isDownloaded).length;
  const totalCount = datasets.length;

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all cached data? This cannot be undone.')) {
      setIsClearing(true);
      await clearAllData();
      setIsClearing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="offline-manager-title">
      <div className="modal-container offline-manager">
        <div className="modal-header">
          <h2 id="offline-manager-title">
            <Database size={24} />
            Offline Data Manager
          </h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        <div className="connection-status">
          {isOnline ? (
            <div className="status online">
              <Wifi size={18} />
              <span>Online - Downloads available</span>
            </div>
          ) : (
            <div className="status offline">
              <WifiOff size={18} />
              <span>Offline - Using cached data</span>
            </div>
          )}
        </div>

        <div className="storage-stats">
          <div className="stat-card">
            <Cloud size={20} />
            <div className="stat-content">
              <span className="stat-value">{downloadedCount}/{totalCount}</span>
              <span className="stat-label">Datasets Cached</span>
            </div>
          </div>

          {storageInfo && (
            <div className="stat-card">
              <HardDrive size={20} />
              <div className="stat-content">
                <span className="stat-value">
                  {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.quota)}
                </span>
                <span className="stat-label">Storage Used ({storageInfo.percentUsed}%)</span>
              </div>
              <div className="storage-bar">
                <div
                  className="storage-fill"
                  style={{ width: `${storageInfo.percentUsed}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="tab-bar" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'datasets'}
            className={`tab ${activeTab === 'datasets' ? 'active' : ''}`}
            onClick={() => setActiveTab('datasets')}
          >
            Datasets
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'settings'}
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        <div className="modal-content" role="tabpanel">
          {activeTab === 'datasets' && (
            <>
              <div className="bulk-actions">
                <button
                  className="btn-secondary"
                  onClick={downloadPriorityDatasets}
                  disabled={!isOnline}
                >
                  <Download size={16} />
                  Download Essential Data
                </button>
                <button
                  className="btn-danger"
                  onClick={handleClearAll}
                  disabled={isClearing || downloadedCount === 0}
                >
                  {isClearing ? (
                    <Loader2 size={16} className="spinning" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  Clear All Data
                </button>
              </div>

              <div className="datasets-list">
                {datasets.map(dataset => (
                  <DatasetCard
                    key={dataset.id}
                    dataset={dataset}
                    progress={downloadProgress[dataset.id]}
                    onDownload={downloadDataset}
                    onDelete={deleteDataset}
                    isOnline={isOnline}
                  />
                ))}
              </div>
            </>
          )}

          {activeTab === 'settings' && (
            <div className="settings-panel">
              <div className="setting-item">
                <div className="setting-info">
                  <h4>WiFi-Only Downloads</h4>
                  <p>Only download data when connected to WiFi</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Auto-Update Data</h4>
                  <p>Automatically refresh cached data when online</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="setting-item">
                <div className="setting-info">
                  <h4>Cache Map Tiles</h4>
                  <p>Store map tiles for offline viewing (uses more storage)</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="info-box">
                <AlertCircle size={18} />
                <div>
                  <h4>About Offline Mode</h4>
                  <p>
                    Downloaded datasets allow you to view and analyze data without an
                    internet connection. Some features like location search require
                    connectivity. Map tiles are cached as you browse.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <p className="footer-note">
            Data is cached locally on your device and persists between sessions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineDataManager;
