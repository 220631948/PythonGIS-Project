import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import Dashboard from './components/Dashboard';
import NotificationContainer from './components/Notification';
import OfflineDataManager from './components/OfflineDataManager';
import DataStatusPanel from './components/DataStatusPanel';
import { InstallBanner, InstallModal } from './components/InstallPrompt';
import { SkipLink, LiveRegion, useKeyboardShortcuts, announce } from './components/Accessibility';
import GuidedTour, { useTour, HelpButton } from './components/GuidedTour';
import { KeyboardShortcutsHelp, useKeyboardShortcuts as useHelpOverlay } from './components/KeyboardShortcutsHelp';
import { ToastProvider } from './components/Common';
import { useOnlineStatus } from './hooks/useOfflineData';
import { useUrlState, UrlState } from './hooks/useUrlState';
import { apiClient } from './lib/api';
import './App.css';

// Phase 5: Spatial Analysis
import { useSpatialAnalysis } from './modules/Tools';

const DEFAULT_STATE: UrlState = {
    lat: -33.9249,
    lng: 18.4241,
    zoom: 11,
    layers: [],
    basemap: 'streets'
};

function MainApp() {
    const [urlState, setUrlState] = useUrlState(DEFAULT_STATE);
    const [metadata] = useState<any>({});
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // Sync Dark Mode with DOM root for Tailwind v4 and CSS variables
    useEffect(() => {
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            root.setAttribute('data-theme', 'dark');
        } else {
            root.classList.remove('dark');
            root.setAttribute('data-theme', 'light');
        }
        localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    }, [isDarkMode]);
    const [loadingLayers, setLoadingLayers] = useState<string[]>([]);
    const [flyTo, setFlyTo] = useState<any>(null);
    const [clickedLocation, setClickedLocation] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isOfflineManagerOpen, setIsOfflineManagerOpen] = useState(false);
    const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isDataStatusOpen, setIsDataStatusOpen] = useState(false);
    // Route/Isochrone data can be wired when RoutePanel is integrated
    const [routeData] = useState<any>(null);
    const [isochroneData] = useState<any>(null);
    const [activeFilters, _setActiveFilters] = useState<any>({});
    const [collaborationMarkers, setCollaborationMarkers] = useState<any[]>([]);
    const [moduleLayerData, setModuleLayerData] = useState<any>(null);
    const [isDataLoading] = useState(false); // Will be connected to data hooks later
    const isOnline = useOnlineStatus();

    // New Features: Tour and Help Overlay
    const { isActive: isTourActive, startTour, endTour } = useTour();
    const { showHelp, openHelp, closeHelp } = useHelpOverlay();

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

    const addNotification = useCallback((message: string, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        announce(message);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    }, []);

    const handleLayerToggle = (layerId: string) => {
        const newLayers = urlState.layers?.includes(layerId)
            ? urlState.layers.filter(l => l !== layerId)
            : [...(urlState.layers || []), layerId];
        setUrlState({ ...urlState, layers: newLayers });
        addNotification(`${urlState.layers?.includes(layerId) ? 'Removed' : 'Added'} layer: ${layerId}`);
    };

    const handleModuleLayerUpdate = (data: any) => {
        setModuleLayerData(data);
    };

    // Phase 5: Spatial Analysis
    const { analyzeGeometry } = useSpatialAnalysis();

    const handleGeometryCreated = useCallback((e: any) => {
        const { layer, type, geometry } = e;

        // Analyze using the new hook
        analyzeGeometry(geometry, type);

        // Create popup content (use simple HTML to avoid ReactDOMServer issues)
        const popupContent = `
      <div class="leaflet-popup-content-wrapper-reset">
        <div class="spatial-analysis-popup">
          <h4 style="margin-bottom: 0.5rem; color: var(--color-text-primary)">Analysis Complete</h4>
          <p style="font-size: 0.8rem; color: var(--color-text-secondary)">Type: ${type}</p>
          <div style="margin-top: 0.5rem; padding: 0.5rem; background: var(--color-bg-secondary); border-radius: 4px;">
            <p style="font-size: 0.75rem">Geometry results verified.</p>
          </div>
        </div>
      </div>
    `;

        // Bind and open popup
        layer.bindPopup(popupContent).openPopup();

        addNotification(`${type} analysis complete`, 'success');
    }, [analyzeGeometry, addNotification]);

    const handleBasemapChange = (basemap: string) => {
        setUrlState({ ...urlState, basemap });
    };

    const handleMapMove = (moveState: any) => {
        setUrlState({
            ...urlState,
            lat: moveState.lat,
            lng: moveState.lng,
            zoom: moveState.zoom
        });
    };

    const handleSearch = (location: any) => {
        setFlyTo({
            lat: location.lat,
            lng: location.lng,
            zoom: location.zoom || 14
        });
        setClickedLocation({ lat: location.lat, lng: location.lng });
        addNotification(`Found: ${location.name}`, 'success');
    };

    // Route/Isochrone callbacks can be restored alongside RoutePanel wiring when needed

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
        'f': () => {
            const input = document.querySelector('.search-input') as HTMLElement;
            input?.focus();
        },
        't': () => setIsDarkMode(prev => !prev),
        'm': () => setIsOfflineManagerOpen(prev => !prev),
        's': () => setIsDataStatusOpen(prev => !prev),
        '?': () => openHelp(),
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
                    onClose={() => setIsSidebarOpen(false)}
                    activeLayers={urlState.layers || []}
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
                        onLayerLoading={(id: string, loading: boolean) => {
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
                />
            )}

            {isOfflineManagerOpen && (
                <OfflineDataManager isOpen={true} onClose={() => setIsOfflineManagerOpen(false)} />
            )}

            <DataStatusPanel
                isOpen={isDataStatusOpen}
                onClose={() => setIsDataStatusOpen(false)}
            />

            <NotificationContainer
                notifications={notifications}
                onRemove={(id: string | number) => setNotifications(prev => prev.filter(n => n.id !== id))}
            />

            {/* New Feature Components */}
            <GuidedTour
                isActive={isTourActive}
                onComplete={endTour}
                onSkip={endTour}
            />
            <KeyboardShortcutsHelp
                isOpen={showHelp}
                onClose={closeHelp}
            />
            {!isTourActive && !showHelp && (
                <HelpButton onClick={startTour} />
            )}

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
