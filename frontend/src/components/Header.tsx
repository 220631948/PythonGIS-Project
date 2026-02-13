import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Menu, X, Wifi, WifiOff, Layers, BarChart3,
  Share2, Download, Sun, Moon, Info, Activity, Folder,
  Layout, GitCompare, User, LogOut
} from 'lucide-react';
import SearchAutocomplete from './SearchAutocomplete';
import { useAuth } from '../modules/Auth/AuthContext';

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
  onDashboardBuilderOpen?: () => void;
  onComparativeAnalysisOpen?: () => void;
  onBasemapChange?: (basemap: string) => void;
  onOpenOfflineManager?: () => void;
  onDataStatus?: () => void;
  onExport?: () => void;
  onThemeToggle?: () => void;
  onWorkspaceOpen?: () => void;
  isDarkMode?: boolean;
  currentBasemap?: string;
  isOnline?: boolean;
  currentWorkspace?: any;
}

const Header: React.FC<HeaderProps> = ({
  onSearch,
  onMenuToggle,
  isSidebarOpen,
  onShareUrl,
  onDashboardOpen,
  onDashboardBuilderOpen,
  onComparativeAnalysisOpen,
  onBasemapChange,
  onDataStatus,
  onExport,
  onThemeToggle,
  onWorkspaceOpen,
  isDarkMode = false,
  currentBasemap = 'streets',
  isOnline = true,
}) => {
  const basemapOptions = [
    { id: 'streets', name: 'Streets' },
    { id: 'aerial', name: 'Aerial' },
    { id: 'satellite', name: 'Satellite' },
    { id: 'dark', name: 'Dark' },
    { id: 'terrain', name: 'Terrain' }
  ];

  const navigate = useNavigate();
  const { isAuthenticated, logout, user } = useAuth();

  const handleLoginLogout = async () => {
    if (isAuthenticated) {
      await logout();
    } else {
      navigate('/login');
    }
  };

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
    <header
      className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 px-4 h-16 flex items-center gap-4"
      role="banner"
    >
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors md:hidden"
          onClick={onMenuToggle}
          aria-label={isSidebarOpen ? 'Close sidebar menu' : 'Open sidebar menu'}
          aria-expanded={isSidebarOpen}
          aria-controls="sidebar-navigation"
        >
          {isSidebarOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <MapPin size={24} className="text-teal-500" aria-hidden="true" />
          <span className="hidden sm:inline">Cape Town GeoHub</span>
          <span className="sm:hidden">CT GeoHub</span>
        </h1>
      </div>

      {/* Search - Center on desktop */}
      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <SearchAutocomplete onSelect={handleSearchResult} />
      </div>

      {/* Actions - Right Section */}
      <div className="flex items-center gap-1.5">
        {/* Online/Offline indicator */}
        <div
          className={`px-2 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-medium ${
            isOnline
              ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
          }`}
          title={isOnline ? 'Online' : 'Offline - using cached data'}
          role="status"
          aria-label={isOnline ? 'Online' : 'Offline'}
        >
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          <span className="hidden lg:inline">{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Primary Actions (hidden on mobile) */}
        <div className="hidden md:flex items-center gap-1">
          <button
            className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
            onClick={onDashboardOpen}
            title="Analytics Dashboard (D)"
            aria-label="Open analytics dashboard"
          >
            <BarChart3 size={16} aria-hidden="true" />
            <span className="hidden lg:inline">Dashboard</span>
          </button>

          {/* Basemap Selector */}
          <div className="relative flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Layers size={14} className="text-slate-600 dark:text-slate-400" aria-hidden="true" />
            <select
              value={currentBasemap}
              onChange={(e) => onBasemapChange?.(e.target.value)}
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-300 border-none outline-none cursor-pointer"
              aria-label={`Select map basemap style. Current: ${basemapOptions.find(o => o.id === currentBasemap)?.name}`}
            >
              {basemapOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Secondary Actions */}
        <div className="hidden lg:flex items-center gap-1">
          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            onClick={onWorkspaceOpen}
            title="Workspaces (W)"
            aria-label="Open workspace manager"
          >
            <Folder size={18} aria-hidden="true" />
          </button>

          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            onClick={onDashboardBuilderOpen}
            title="Dashboard Builder (B)"
            aria-label="Open dashboard builder"
          >
            <Layout size={18} aria-hidden="true" />
          </button>

          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            onClick={onComparativeAnalysisOpen}
            title="Comparative Analysis (C)"
            aria-label="Open comparative analysis"
          >
            <GitCompare size={18} aria-hidden="true" />
          </button>

          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            onClick={onDataStatus}
            title="Data source health status (S)"
            aria-label="View data source status"
          >
            <Activity size={18} aria-hidden="true" />
          </button>

          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            onClick={handleShareUrl}
            title="Share current view"
            aria-label="Share current map view"
          >
            <Share2 size={18} aria-hidden="true" />
          </button>

          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            onClick={onExport}
            title="Export report"
            aria-label="Export map data as report"
          >
            <Download size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
          onClick={onThemeToggle}
          title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
        </button>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600 dark:text-slate-400 hidden md:block">
              {user.email} ({user.role})
            </span>
            <button
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
              onClick={handleLoginLogout}
              title="Logout"
              aria-label="Logout"
            >
              <LogOut size={18} aria-hidden="true" />
            </button>
          </div>
        ) : (
          <button
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            onClick={handleLoginLogout}
            title="Login"
            aria-label="Login"
          >
            <User size={18} aria-hidden="true" />
          </button>
        )}

        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
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
