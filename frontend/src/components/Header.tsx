import React from 'react';
import {
  MapPin, Menu, X, Wifi, WifiOff, Layers, BarChart3,
  Share2, Download, Database, Sun, Moon, Info, Activity
} from 'lucide-react';
import SearchAutocomplete from './SearchAutocomplete';

interface SearchResult {
  lat: number;
  lng: number;
  name: string;
  zoom?: number;
}

interface HeaderProps {
  onSearch?: (location: SearchResult) => void;
  onMenuToggle?: () => void;
  isSidebarOpen?: boolean;
  onShareUrl?: () => void;
  onDashboardOpen?: () => void;
  onBasemapChange?: (basemap: string) => void;
  onOpenOfflineManager?: () => void;
  onDataStatus?: () => void;
  onExport?: () => void;
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
  currentBasemap?: string;
  isOnline?: boolean;
}

const Header: React.FC<HeaderProps> = ({
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
  currentBasemap = 'streets',
  isOnline = true
}) => {
  const basemapOptions = [
    { id: 'streets', name: 'Streets' },
    { id: 'aerial', name: 'Aerial' },
    { id: 'satellite', name: 'Satellite' },
    { id: 'dark', name: 'Dark' },
    { id: 'terrain', name: 'Terrain' }
  ];

  const handleSearchResult = (result: any) => {
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
    <header className={`app-header ${isDarkMode ? 'dark' : ''}`} role="banner">
      <div className="header-left">
        <button
          className="menu-toggle"
          onClick={onMenuToggle}
          aria-label={isSidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
          aria-expanded={isSidebarOpen}
          aria-controls="sidebar-navigation"
        >
          {isSidebarOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
        <h1 className="logo">
          <MapPin size={24} className="logo-icon" aria-hidden="true" />
          <span className="logo-text">Cape Town GeoHub</span>
        </h1>
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
          aria-label="Open analytics dashboard"
        >
          <BarChart3 size={18} aria-hidden="true" />
          <span className="btn-text">Dashboard</span>
        </button>

        <div className="basemap-selector">
          <Layers size={18} className="basemap-icon" aria-hidden="true" />
          <select
            value={currentBasemap}
            onChange={(e) => onBasemapChange?.(e.target.value)}
            className="basemap-select"
            aria-label={`Select map basemap style. Current: ${basemapOptions.find(o => o.id === currentBasemap)?.name}`}
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
          aria-label="Manage offline data"
        >
          <Database size={18} aria-hidden="true" />
          <span className="btn-text">Data</span>
        </button>

        <button
          className="header-btn"
          onClick={onDataStatus}
          title="Data source health status (S)"
          aria-label="View data source status"
        >
          <Activity size={18} aria-hidden="true" />
          <span className="btn-text">Status</span>
        </button>

        <button
          className="header-btn"
          onClick={handleShareUrl}
          title="Share current view"
          aria-label="Share current map view"
        >
          <Share2 size={18} aria-hidden="true" />
          <span className="btn-text">Share</span>
        </button>

        <button
          className="header-btn"
          onClick={onExport}
          title="Export report"
          aria-label="Export map data as report"
        >
          <Download size={18} aria-hidden="true" />
          <span className="btn-text">Export</span>
        </button>

        <button
          className="header-btn theme-toggle"
          onClick={onThemeToggle}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="header-btn"
          title="About Cape Town GeoHub"
          aria-label="About Cape Town GeoHub (opens in new tab)"
        >
          <Info size={18} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
};

export default Header;
