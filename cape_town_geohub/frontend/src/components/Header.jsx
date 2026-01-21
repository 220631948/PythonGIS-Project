import React from 'react';
import {
  MapPin, Menu, X, Wifi, WifiOff, Layers, BarChart3,
  Share2, Download, Database, Sun, Moon, Info, Activity
} from 'lucide-react';
import SearchAutocomplete from './SearchAutocomplete';

const Header = ({
  onSearch,
  onMenuToggle,
  isSidebarOpen,
  onShareUrl,
  onDashboardOpen,
  onBasemapChange,
  onOpenOfflineManager,
  onDataStatus,
  onExport,
  onThemeToggle,
  isDarkMode = false,
  currentBasemap = 'light',
  isOnline = true
}) => {
  const basemapOptions = [
    { id: 'light', name: 'Standard' },
    { id: 'dark', name: 'Dark' },
    { id: 'aerial', name: 'Aerial' },
    { id: 'terrain', name: 'Terrain' }
  ];

  const handleSearchResult = (result) => {
    if (onSearch) {
      onSearch({
        lat: result.lat,
        lng: result.lng,
        name: result.name,
        zoom: 14
      });
    }
  };

  const handleShareUrl = () => {
    if (onShareUrl) onShareUrl();
  };

  return (
    <header className={`app-header ${isDarkMode ? 'dark' : ''}`}>
      <div className="header-left">
        <button
          className="menu-toggle"
          onClick={onMenuToggle}
          aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="logo">
          <MapPin size={24} className="logo-icon" />
          <span className="logo-text">Cape Town GeoHub</span>
        </div>
      </div>

      <div className="search-container">
        <SearchAutocomplete onSelect={handleSearchResult} />
      </div>

      <div className="header-actions">
        {/* Online/Offline indicator */}
        <div
          className={`connection-indicator ${isOnline ? 'online' : 'offline'}`}
          title={isOnline ? 'Online' : 'Offline - using cached data'}
          role="status"
          aria-label={isOnline ? 'Online' : 'Offline'}
        >
          {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
        </div>

        <button
          className="header-btn"
          onClick={onDashboardOpen}
          title="Analytics Dashboard"
        >
          <BarChart3 size={18} />
          <span className="btn-text">Dashboard</span>
        </button>

        <div className="basemap-selector">
          <Layers size={18} className="basemap-icon" />
          <select
            value={currentBasemap}
            onChange={(e) => onBasemapChange(e.target.value)}
            className="basemap-select"
            aria-label="Select basemap"
          >
            {basemapOptions.map(option => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>

        <button
          className="header-btn"
          onClick={onOpenOfflineManager}
          title="Manage offline data"
        >
          <Database size={18} />
          <span className="btn-text">Data</span>
        </button>

        <button
          className="header-btn"
          onClick={onDataStatus}
          title="Data source health status (S)"
        >
          <Activity size={18} />
          <span className="btn-text">Status</span>
        </button>

        <button
          className="header-btn"
          onClick={handleShareUrl}
          title="Share current view"
        >
          <Share2 size={18} />
          <span className="btn-text">Share</span>
        </button>

        <button
          className="header-btn"
          onClick={onExport}
          title="Export report"
        >
          <Download size={18} />
          <span className="btn-text">Export</span>
        </button>

        <button
          className="header-btn theme-toggle"
          onClick={onThemeToggle}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="header-btn"
          title="About"
        >
          <Info size={18} />
        </a>
      </div>
    </header>
  );
};

export default Header;
