import { useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import Dashboard from './components/Dashboard';
import OfflineDataManager from './components/OfflineDataManager';
import DataStatusPanel from './components/DataStatusPanel';
import { InstallBanner, InstallModal } from './components/InstallPrompt';
import { SkipLink, LiveRegion, useKeyboardShortcuts } from './components/Accessibility';
import GuidedTour, { useTour, HelpButton } from './components/GuidedTour';
import { KeyboardShortcutsHelp, useKeyboardShortcuts as useHelpOverlay } from './components/KeyboardShortcutsHelp';
import { ToastProvider, useToast } from './components/Common/ToastContext';
import { useOnlineStatus } from './hooks/useOfflineData';
import './App.css';

// Phase 5: Spatial Analysis
import { useSpatialAnalysis } from './modules/Tools';

// Workspace Management
import { WorkspaceManager } from './modules/Workspace';

// Dashboard Builder & Comparative Analysis
import { DashboardBuilder } from './modules/DashboardBuilder';
import { ComparativeAnalysis } from './modules/ComparativeAnalysis';

// New Hooks
import { useTheme } from './hooks/useTheme';
import { useUIState } from './hooks/useUIState';
import { useMapLogic } from './hooks/useMapLogic';
import { useCollaborationMarkers } from './hooks/useCollaborationMarkers';
import { useWorkspaceState } from './hooks/useWorkspaceState';

function MainApp() {
    const { isDarkMode, setIsDarkMode } = useTheme();
    const uiState = useUIState();
    const {
        isSidebarOpen, setIsSidebarOpen,
        isOfflineManagerOpen, setIsOfflineManagerOpen,
        isInstallModalOpen, setIsInstallModalOpen,
        isDashboardOpen, setIsDashboardOpen,
        isDataStatusOpen, setIsDataStatusOpen,
        isWorkspaceManagerOpen, setIsWorkspaceManagerOpen,
        isDashboardBuilderOpen, setIsDashboardBuilderOpen,
        isComparativeAnalysisOpen, setIsComparativeAnalysisOpen
    } = uiState;

    const { addToast, toasts } = useToast();
    const isOnline = useOnlineStatus();

    // Phase 5: Spatial Analysis
    const { analyzeGeometry } = useSpatialAnalysis();

    const {
        urlState,
        setUrlState,
        flyTo,
        clickedLocation,
        loadingLayers,
        moduleLayerData,
        routeData,
        isochroneData,
        activeFilters,
        metadata,
        handleLayerToggle,
        handleBasemapChange,
        handleMapMove,
        handleSearch,
        handleModuleLayerUpdate,
        handleGeometryCreated,
        handleShareUrl,
        handleExport,
        handleLayerLoading
    } = useMapLogic({ analyzeGeometry });

    const { collaborationMarkers } = useCollaborationMarkers(isOnline);
    const { currentWorkspace, setCurrentWorkspace, currentScenario, setCurrentScenario } = useWorkspaceState();

    // New Features: Tour and Help Overlay
    const { isActive: isTourActive, startTour, endTour } = useTour();
    const { showHelp, openHelp, closeHelp } = useHelpOverlay();

    // Workspace handlers
    const handleWorkspaceChange = useCallback((workspace: any) => {
        setCurrentWorkspace(workspace);
        addToast(`Switched to workspace: ${workspace.name}`, 'success');
    }, [addToast, setCurrentWorkspace]);

    const handleScenarioLoad = useCallback((scenario: any) => {
        setCurrentScenario(scenario);
        // Apply scenario state to map using functional updater to avoid stale closure
        if (scenario.map_state) {
            setUrlState(prev => ({
                ...prev,
                lat: scenario.map_state.center[0],
                lng: scenario.map_state.center[1],
                zoom: scenario.map_state.zoom,
                layers: scenario.layers || [],
            }));
        }
        addToast(`Loaded scenario: ${scenario.name}`, 'success');
        setIsWorkspaceManagerOpen(false);
    }, [setUrlState, addToast, setIsWorkspaceManagerOpen, setCurrentScenario]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        'h': () => setIsSidebarOpen(prev => !prev),
        'd': () => setIsDashboardOpen(prev => !prev),
        'b': () => setIsDashboardBuilderOpen(prev => !prev),
        'c': () => setIsComparativeAnalysisOpen(prev => !prev),
        'f': () => {
            const input = document.querySelector('.search-input') as HTMLElement;
            input?.focus();
        },
        't': () => setIsDarkMode(prev => !prev),
        'm': () => setIsOfflineManagerOpen(prev => !prev),
        's': () => setIsDataStatusOpen(prev => !prev),
        'w': () => setIsWorkspaceManagerOpen(prev => !prev),
        '?': () => openHelp(),
    });

    return (
        <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
            <SkipLink targetId="main-map" />
            <LiveRegion message={toasts[toasts.length - 1]?.message} />

            <Header
                onSearch={handleSearch}
                onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
                onShareUrl={handleShareUrl}
                onDashboardOpen={() => setIsDashboardOpen(!isDashboardOpen)}
                onDashboardBuilderOpen={() => setIsDashboardBuilderOpen(!isDashboardBuilderOpen)}
                onComparativeAnalysisOpen={() => setIsComparativeAnalysisOpen(!isComparativeAnalysisOpen)}
                onBasemapChange={handleBasemapChange}
                onOpenOfflineManager={() => setIsOfflineManagerOpen(true)}
                onDataStatus={() => setIsDataStatusOpen(true)}
                onExport={handleExport}
                onThemeToggle={() => setIsDarkMode(!isDarkMode)}
                onWorkspaceOpen={() => setIsWorkspaceManagerOpen(true)}
                isDarkMode={isDarkMode}
                currentBasemap={urlState.basemap as string}
                isOnline={isOnline}
                currentWorkspace={currentWorkspace}
            />

            <main id="main-content" className="app-main">
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
                    isLoading={loadingLayers.length > 0}
                />

                <div id="main-map" className="map-view-container">
                    <MapView
                        center={{ lat: urlState.lat, lng: urlState.lng }}
                        zoom={urlState.zoom}
                        layers={urlState.layers}
                        moduleLayerData={moduleLayerData}
                        basemap={urlState.basemap as string}
                        onMapMove={handleMapMove}
                        flyTo={flyTo}
                        onLayerLoading={handleLayerLoading}
                        clickedLocation={clickedLocation}
                        routeData={routeData}
                        isochroneData={isochroneData}
                        activeFilters={activeFilters}
                        collaborationMarkers={collaborationMarkers}
                        onBasemapChange={handleBasemapChange}
                        onGeometryCreated={handleGeometryCreated}
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

            {/* NotificationContainer removed in favor of ToastProvider */}

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

            {/* Workspace Manager */}
            <WorkspaceManager
                isOpen={isWorkspaceManagerOpen}
                onClose={() => setIsWorkspaceManagerOpen(false)}
                onWorkspaceChange={handleWorkspaceChange}
                onScenarioLoad={handleScenarioLoad}
                currentWorkspace={currentWorkspace}
                currentUserId="user-1" // Should come from auth context
            />

            {/* Dashboard Builder */}
            {isDashboardBuilderOpen && (
                <DashboardBuilder
                    onClose={() => setIsDashboardBuilderOpen(false)}
                />
            )}

            {/* Comparative Analysis */}
            {isComparativeAnalysisOpen && (
                <ComparativeAnalysis
                    onClose={() => setIsComparativeAnalysisOpen(false)}
                />
            )}
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
