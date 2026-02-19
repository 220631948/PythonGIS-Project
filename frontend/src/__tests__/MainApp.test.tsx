import { render, screen } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import App from '../App';
import React from 'react';

// Mock child components to avoid deep rendering
vi.mock('../components/Header', () => ({ default: () => <div data-testid="header">Header</div> }));
vi.mock('../components/Sidebar', () => ({ default: () => <div data-testid="sidebar">Sidebar</div> }));
vi.mock('../components/MapView', () => ({ default: () => <div data-testid="map-view">MapView</div> }));
vi.mock('../components/Dashboard', () => ({ default: () => <div data-testid="dashboard">Dashboard</div> }));
vi.mock('../components/OfflineDataManager', () => ({ default: () => <div data-testid="offline-manager">OfflineManager</div> }));
vi.mock('../components/DataStatusPanel', () => ({ default: () => <div data-testid="data-status">DataStatus</div> }));
vi.mock('../components/InstallPrompt', () => ({
    InstallBanner: () => <div data-testid="install-banner">InstallBanner</div>,
    InstallModal: () => <div data-testid="install-modal">InstallModal</div>
}));
vi.mock('../components/Accessibility', () => ({
    SkipLink: () => <div data-testid="skip-link">SkipLink</div>,
    LiveRegion: () => <div data-testid="live-region">LiveRegion</div>,
    useKeyboardShortcuts: vi.fn(),
    announce: vi.fn()
}));
vi.mock('../components/GuidedTour', () => ({
    default: () => <div data-testid="guided-tour">GuidedTour</div>,
    useTour: () => ({ isActive: false, startTour: vi.fn(), endTour: vi.fn() }),
    HelpButton: () => <div data-testid="help-button">HelpButton</div>
}));
vi.mock('../components/KeyboardShortcutsHelp', () => ({
    KeyboardShortcutsHelp: () => <div data-testid="shortcuts-help">ShortcutsHelp</div>,
    useKeyboardShortcuts: () => ({ showHelp: false, openHelp: vi.fn(), closeHelp: vi.fn() })
}));
vi.mock('../modules/Tools', () => ({
    useSpatialAnalysis: () => ({ analyzeGeometry: vi.fn() })
}));
vi.mock('../modules/Workspace', () => ({
    WorkspaceManager: () => <div data-testid="workspace-manager">WorkspaceManager</div>
}));
vi.mock('../modules/DashboardBuilder', () => ({
    DashboardBuilder: () => <div data-testid="dashboard-builder">DashboardBuilder</div>
}));
vi.mock('../modules/ComparativeAnalysis', () => ({
    ComparativeAnalysis: () => <div data-testid="comparative-analysis">ComparativeAnalysis</div>
}));

// Mock hooks that have side effects or external dependencies
vi.mock('../hooks/useOfflineData', () => ({
    useOnlineStatus: () => true
}));

// Mock API client
vi.mock('../lib/api', () => ({
    apiClient: {
        getMarkers: vi.fn().mockResolvedValue([])
    }
}));

// Mock matchMedia for useTheme
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

describe('App Integration', () => {
    it('renders without crashing', () => {
        render(<App />);
        expect(screen.getByTestId('header')).toBeTruthy();
        expect(screen.getByTestId('sidebar')).toBeTruthy();
        expect(screen.getByTestId('map-view')).toBeTruthy();
    });

    it('renders providers and main layout', () => {
        render(<App />);
        expect(screen.getByTestId('skip-link')).toBeTruthy();
        expect(screen.getByTestId('install-banner')).toBeTruthy();
    });
});
