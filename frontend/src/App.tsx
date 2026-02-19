import { useState, useCallback, useEffect } from 'react';
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
import { ToastProvider, useToast } from './components/Common';
import { useOnlineStatus } from './hooks/useOfflineData';
import './App.css';

// Hooks
import { useTheme } from './hooks/useTheme';
import { useUIState } from './hooks/useUIState';
import { useCollaborationMarkers } from './hooks/useCollaborationMarkers';
import { useWorkspaceState } from './hooks/useWorkspaceState';
import { useMapLogic } from './hooks/useMapLogic';

// Phase 5: Spatial Analysis
import { useSpatialAnalysis } from './modules/Tools';

// Workspace Management
import { WorkspaceManager } from './modules/Workspace';

// Dashboard Builder & Comparative Analysis
import { DashboardBuilder } from './modules/DashboardBuilder';
import { ComparativeAnalysis } from './modules/ComparativeAnalysis';

function MainApp() {
    // 1. Theme State
    const [isDarkMode, setIsDarkMode] = useTheme();

    // 2. UI State
    const ui = useUIState();

    // 3. Common Services
    const isOnline = useOnlineStatus();
    const { addToast, toasts } = useToast();

    // 4. Feature Hooks
    const { isActive: isTourActive, startTour, endTour } = useTour();
    const { showHelp, openHelp, closeHelp } = useHelpOverlay();

    // 5. Data & Logic Hooks
    const [metadata] = useState<any>({});
    const [isDataLoading] = useState(false); // Will be connected to data hooks later

    // Collaboration Markers
    const [collaborationMarkers] = useCollaborationMarkers(isOnline);

    // Workspace State
    const {
        currentWorkspace,
        setCurrentWorkspace,
        setCurrentScenario
    } = useWorkspaceState();

    // Spatial Analysis
    const { analyzeGeometry } = useSpatialAnalysis();

    // Map Logic
    const {
        urlState,
        setUrlState,
        loadingLayers,
        handleLayerLoading,
        flyTo,
        clickedLocation,
        moduleLayerData,
        routeData,
        isochroneData,
        activeFilters,
        handleLayerToggle,
        handleBasemapChange,
        handleMapMove,
        handleSearch,
        handleModuleLayerUpdate,
        handleGeometryCreated
    } = useMapLogic(analyzeGeometry);

    // Handlers
    const handleShareUrl = () => {
        navigator.clipboard.writeText(window.location.href);
        addToast('Map link copied to clipboard!', 'success');
    };

    const handleExport = () => {
        addToast('Preparing export...', 'info');
        // Logic for export modal/panel can be added here
    };

    const handleWorkspaceChange = useCallback((workspace: any) => {
        setCurrentWorkspace(workspace);
        addToast(`Switched to workspace: ${workspace.name}`, 'success');
    }, [setCurrentWorkspace, addToast]);

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
        ui.setIsWorkspaceManagerOpen(false);
    }, [setCurrentScenario, setUrlState, addToast, ui]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        'h': () => ui.setIsSidebarOpen(prev => !prev),
        'd': () => ui.setIsDashboardOpen(prev => !prev),
        'b': () => ui.setIsDashboardBuilderOpen(prev => !prev),
        'c': () => ui.setIsComparativeAnalysisOpen(prev => !prev),
        'f': () => {
            const input = document.querySelector('.search-input') as HTMLElement;
            input?.focus();
        },
        't': () => setIsDarkMode(prev => !prev),
        'm': () => ui.setIsOfflineManagerOpen(prev => !prev),
        's': () => ui.setIsDataStatusOpen(prev => !prev),
        'w': () => ui.setIsWorkspaceManagerOpen(prev => !prev),
        '?': () => openHelp(),
    });

    return (
        <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
            <SkipLink targetId="main-map" />
            <LiveRegion message={toasts[toasts.length - 1]?.message} />

            <Header
                onSearch={handleSearch}
                onMenuToggle={() => ui.setIsSidebarOpen(!ui.isSidebarOpen)}
                isSidebarOpen={ui.isSidebarOpen}
                onShareUrl={handleShareUrl}
                onDashboardOpen={() => ui.setIsDashboardOpen(!ui.isDashboardOpen)}
                onDashboardBuilderOpen={() => ui.setIsDashboardBuilderOpen(!ui.isDashboardBuilderOpen)}
                onComparativeAnalysisOpen={() => ui.setIsComparativeAnalysisOpen(!ui.isComparativeAnalysisOpen)}
                onBasemapChange={handleBasemapChange}
                onOpenOfflineManager={() => ui.setIsOfflineManagerOpen(true)}
                onDataStatus={() => ui.setIsDataStatusOpen(true)}
                onExport={handleExport}
                onThemeToggle={() => setIsDarkMode(!isDarkMode)}
                onWorkspaceOpen={() => ui.setIsWorkspaceManagerOpen(true)}
                isDarkMode={isDarkMode}
                currentBasemap={urlState.basemap as string}
                isOnline={isOnline}
                currentWorkspace={currentWorkspace}
            />

            <main id="main-content" className="app-main">
                <Sidebar
                    isOpen={ui.isSidebarOpen}
                    onClose={() => ui.setIsSidebarOpen(false)}
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

            {ui.isDashboardOpen && (
                <Dashboard
                    isOpen={ui.isDashboardOpen}
                    onClose={() => ui.setIsDashboardOpen(false)}
                />
            )}

            {ui.isOfflineManagerOpen && (
                <OfflineDataManager isOpen={true} onClose={() => ui.setIsOfflineManagerOpen(false)} />
            )}

            <DataStatusPanel
                isOpen={ui.isDataStatusOpen}
                onClose={() => ui.setIsDataStatusOpen(false)}
            />

            {/* Note: ToastContainer is handled by ToastProvider in App component */}

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
            <InstallModal isOpen={ui.isInstallModalOpen} onClose={() => ui.setIsInstallModalOpen(false)} />

            {/* Workspace Manager */}
            <WorkspaceManager
                isOpen={ui.isWorkspaceManagerOpen}
                onClose={() => ui.setIsWorkspaceManagerOpen(false)}
                onWorkspaceChange={handleWorkspaceChange}
                onScenarioLoad={handleScenarioLoad}
                currentWorkspace={currentWorkspace}
                currentUserId="user-1" // Should come from auth context
            />

            {/* Dashboard Builder */}
            {ui.isDashboardBuilderOpen && (
                <DashboardBuilder
                    onClose={() => ui.setIsDashboardBuilderOpen(false)}
                />
            )}

            {/* Comparative Analysis */}
            {ui.isComparativeAnalysisOpen && (
                <ComparativeAnalysis
                    onClose={() => ui.setIsComparativeAnalysisOpen(false)}
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
