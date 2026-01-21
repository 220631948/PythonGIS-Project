import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ReactDOMServer from 'react-dom/server'; // Needed for rendering popup to string
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import Dashboard from './components/Dashboard';
import NotificationContainer from './components/Notification';
import OfflineDataManager from './components/OfflineDataManager';
import DataStatusPanel from './components/DataStatusPanel';
import { InstallBanner, InstallModal } from './components/InstallPrompt';
import { SkipLink, LiveRegion, useKeyboardShortcuts, announce } from './components/Accessibility';
import { ToastProvider, useToast } from './components/Common';
import { useOnlineStatus } from './hooks/useOfflineData';
import { useUrlState } from './hooks/useUrlState';
import apiClient from './api-client';
import './App.css';

// Phase 5: Spatial Analysis
import { useSpatialAnalysis, SpatialAnalysisPopup } from './modules/Tools';

const DEFAULT_STATE = {
  lat: -33.9249,
  lng: 18.4241,
  zoom: 11,
  layers: [],
  basemap: 'light'
};

function MainApp() {
  const [urlState, setUrlState] = useUrlState(DEFAULT_STATE);
  const [metadata] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loadingLayers, setLoadingLayers] = useState([]);
  const [flyTo, setFlyTo] = useState(null);
  const [clickedLocation, setClickedLocation] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isOfflineManagerOpen, setIsOfflineManagerOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isDataStatusOpen, setIsDataStatusOpen] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [isochroneData, setIsochroneData] = useState(null);
  const [activeFilters, setActiveFilters] = useState({});
  const [collaborationMarkers, setCollaborationMarkers] = useState([]);
  const [moduleLayerData, setModuleLayerData] = useState(null);
  const [isDataLoading] = useState(false); // Will be connected to data hooks later
  const isOnline = useOnlineStatus();

  // Load collaboration markers
  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const markers = await apiClient.getMarkers();
        setCollaborationMarkers(markers);
      } catch (error) {
        console.error("Failed to fetch collaboration markers:", error);
      }
    };
    if (isOnline) fetchMarkers();
  }, [isOnline]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    announce(message);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const handleLayerToggle = (layerId) => {
    const newLayers = urlState.layers.includes(layerId)
      ? urlState.layers.filter(l => l !== layerId)
      : [...urlState.layers, layerId];
    setUrlState({ ...urlState, layers: newLayers });
    addNotification(`${urlState.layers.includes(layerId) ? 'Removed' : 'Added'} layer: ${layerId}`);
  };

  const handleModuleLayerUpdate = (data) => {
    setModuleLayerData(data);
  };

  // Phase 5: Spatial Analysis
  const { analyzeGeometry } = useSpatialAnalysis();

  const handleGeometryCreated = useCallback((e) => {
    const { layer, type, geometry } = e;

    // Analyze using the new hook
    const result = analyzeGeometry(geometry, type);

    // Create popup content (rendered to string for Leaflet)
    const popupContent = ReactDOMServer.renderToString(
      <div className="leaflet-popup-content-wrapper-reset">
        <SpatialAnalysisPopup result={result} />
      </div>
    );

    // Bind and open popup
    layer.bindPopup(popupContent).openPopup();

    addNotification(`${type} analysis complete`, 'success');
  }, [analyzeGeometry]);

  const handleBasemapChange = (basemap) => {
    setUrlState({ ...urlState, basemap });
  };

  const handleMapMove = (moveState) => {
    setUrlState({
      ...urlState,
      lat: moveState.lat,
      lng: moveState.lng,
      zoom: moveState.zoom
    });
  };

  const handleSearch = (location) => {
    setFlyTo({
      lat: location.lat,
      lng: location.lng,
      zoom: location.zoom || 14
    });
    setClickedLocation({ lat: location.lat, lng: location.lng });
    addNotification(`Found: ${location.name}`, 'success');
  };

  const handleRouteCalculated = (route) => {
    setRouteData(route);
    if (route) {
      setFlyTo({
        lat: route.origin.lat,
        lng: route.origin.lon,
        zoom: 12
      });
    }
  };

  const handleIsochroneCalculated = (isochrone) => {
    setIsochroneData(isochrone);
    if (isochrone) {
      setFlyTo({
        lat: isochrone.center.lat,
        lng: isochrone.center.lon,
        zoom: 13
      });
    }
  };

  const handleFilterChange = (dataset, filterData) => {
    setActiveFilters(prev => ({
      ...prev,
      [dataset]: filterData
    }));
  };

  const handleShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    addNotification('Map link copied to clipboard!', 'success');
  };

  const handleExport = () => {
    addNotification('Preparing export...', 'info');
    // Logic for export modal/panel can be added here
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'h': () => setIsSidebarOpen(prev => !prev),
    'd': () => setIsDashboardOpen(prev => !prev),
    'f': () => document.querySelector('.search-input')?.focus(),
    't': () => setIsDarkMode(prev => !prev),
    'm': () => setIsOfflineManagerOpen(prev => !prev),
    's': () => setIsDataStatusOpen(prev => !prev),
    '?': () => addNotification('Available shortcuts: H (sidebar), D (dashboard), F (search), T (theme), M (offline data), S (data status)'),
  });

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      <SkipLink targetId="main-map" />
      <LiveRegion message={notifications[notifications.length - 1]?.message} />

      <Header
        onSearch={handleSearch}
        onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onShareUrl={handleShareUrl}
        onDashboardOpen={() => setIsDashboardOpen(!isDashboardOpen)}
        onBasemapChange={handleBasemapChange}
        onOpenOfflineManager={() => setIsOfflineManagerOpen(true)}
        onDataStatus={() => setIsDataStatusOpen(true)}
        onExport={handleExport}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        isDarkMode={isDarkMode}
        currentBasemap={urlState.basemap}
        isOnline={isOnline}
      />

      <main className="app-main">
        <Sidebar
          isOpen={isSidebarOpen}
          activeLayers={urlState.layers}
          onLayerToggle={handleLayerToggle}
          onLayerUpdate={handleModuleLayerUpdate}
          metadata={metadata}
          loadingLayers={loadingLayers}
          clickedLocation={clickedLocation}
          isOnline={isOnline}
          isLoading={isDataLoading || loadingLayers.length > 0}
        />

        <div id="main-map" className="map-view-container">
          <MapView
            center={{ lat: urlState.lat, lng: urlState.lng }}
            zoom={urlState.zoom}
            layers={urlState.layers}
            moduleLayerData={moduleLayerData} // Passed here
            basemap={urlState.basemap}
            onMapMove={handleMapMove}
            flyTo={flyTo}
            onLayerLoading={(id, loading) => {
              setLoadingLayers(prev =>
                loading ? [...prev, id] : prev.filter(l => l !== id)
              );
            }}
            clickedLocation={clickedLocation}
            routeData={routeData}
            isochroneData={isochroneData}
            activeFilters={activeFilters}
            collaborationMarkers={collaborationMarkers}
            onBasemapChange={handleBasemapChange}
            onGeometryCreated={handleGeometryCreated} // Connected here
            showDrawingTools={true}
            showFullscreen={true}
            showLocation={true}
            showMinimap={true}
          />
        </div>
      </main>

      {isDashboardOpen && (
        <Dashboard
          isOpen={isDashboardOpen}
          onClose={() => setIsDashboardOpen(false)}
          activeLayers={urlState.layers}
        />
      )}

      {isOfflineManagerOpen && (
        <OfflineDataManager onClose={() => setIsOfflineManagerOpen(false)} />
      )}

      <DataStatusPanel
        isOpen={isDataStatusOpen}
        onClose={() => setIsDataStatusOpen(false)}
      />

      <NotificationContainer
        notifications={notifications}
        onRemove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />

      <InstallBanner />
      <InstallModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainApp />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
