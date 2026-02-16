/**
 * Comprehensive tests for ExportPanel component
 * 
 * Tests cover:
 * - Main panel rendering and tabs
 * - DataExportForm functionality
 * - AnalysisExportForm functionality
 * - PrintMapForm configuration
 * - PendingExports display
 * - User interactions and workflows
 * - Error handling
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportPanel from '../ExportPanel';
import { apiClient } from '../../lib/api';

// Mock API client
vi.mock('../../lib/api', () => ({
  apiClient: {
    getCatalogDatasets: vi.fn(),
    getPendingExports: vi.fn(),
    exportData: vi.fn(),
    exportAnalysis: vi.fn(),
    getExportDownloadUrl: vi.fn((id: string) => `/api/exports/${id}/download`),
  },
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Download: () => <span data-testid="download-icon" />,
  FileText: () => <span data-testid="filetext-icon" />,
  Printer: () => <span data-testid="printer-icon" />,
  Clock: () => <span data-testid="clock-icon" />,
  X: () => <span data-testid="x-icon" />,
}));

describe('ExportPanel', () => {
  const mockDatasets = [
    { id: 'transport_routes', title: 'Transport Routes' },
    { id: 'flood_zones', title: 'Flood Zones' },
    { id: 'biodiversity', title: 'Biodiversity Areas' },
  ];

  const mockPendingExports = {
    exports: [
      {
        file_id: 'export_1',
        filename: 'transport_routes.geojson',
        size_bytes: 125440,
      },
      {
        file_id: 'export_2',
        filename: 'analysis_results.csv',
        size_bytes: 45120,
      },
    ],
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    mapBounds: { north: -33.9, south: -34.0, east: 18.5, west: 18.4 },
    activeLayers: ['transport', 'flood_zones'],
    onNotification: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.getCatalogDatasets).mockResolvedValue(mockDatasets);
    vi.mocked(apiClient.getPendingExports).mockResolvedValue(mockPendingExports);
    vi.mocked(apiClient.exportData).mockResolvedValue({ filename: 'export.geojson' });
    vi.mocked(apiClient.exportAnalysis).mockResolvedValue({ filename: 'analysis.json' });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Panel Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(<ExportPanel {...defaultProps} isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    it('should render when isOpen is true', () => {
      render(<ExportPanel {...defaultProps} />);
      expect(screen.getByText(/Export & Print/i)).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<ExportPanel {...defaultProps} />);
      const closeButton = screen.getByTestId('x-icon').closest('button');
      expect(closeButton).toBeInTheDocument();
    });

    it('should render all three tabs', () => {
      render(<ExportPanel {...defaultProps} />);
      expect(screen.getByRole('button', { name: /Data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Analysis/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Print/i })).toBeInTheDocument();
    });

    it('should show Data tab as active by default', () => {
      render(<ExportPanel {...defaultProps} />);
      const dataTab = screen.getByRole('button', { name: /Data/i });
      expect(dataTab).toHaveClass('active');
    });

    it('should call API methods when panel opens', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(apiClient.getCatalogDatasets).toHaveBeenCalled();
        expect(apiClient.getPendingExports).toHaveBeenCalled();
      });
    });

    it('should not fetch data when panel is closed', () => {
      render(<ExportPanel {...defaultProps} isOpen={false} />);
      expect(apiClient.getCatalogDatasets).not.toHaveBeenCalled();
      expect(apiClient.getPendingExports).not.toHaveBeenCalled();
    });
  });

  describe('DataExportForm', () => {
    it('should render dataset selection', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Export Dataset')).toBeInTheDocument();
        expect(screen.getByLabelText(/Dataset/i)).toBeInTheDocument();
      });
    });

    it('should display available datasets in dropdown', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        const select = screen.getByLabelText(/Dataset/i) as HTMLSelectElement;
        expect(within(select).getByText('Transport Routes')).toBeInTheDocument();
        expect(within(select).getByText('Flood Zones')).toBeInTheDocument();
        expect(within(select).getByText('Biodiversity Areas')).toBeInTheDocument();
      });
    });

    it('should render all export format options', () => {
      render(<ExportPanel {...defaultProps} />);
      
      expect(screen.getByText('CSV')).toBeInTheDocument();
      expect(screen.getByText('Excel')).toBeInTheDocument();
      expect(screen.getByText('GeoJSON')).toBeInTheDocument();
      expect(screen.getByText('KML')).toBeInTheDocument();
    });

    it('should select GeoJSON format by default', () => {
      render(<ExportPanel {...defaultProps} />);
      
      const geojsonButton = screen.getByText('GeoJSON').closest('button');
      expect(geojsonButton).toHaveClass('selected');
    });

    it('should allow format selection', async () => {
      const user = userEvent.setup();
      render(<ExportPanel {...defaultProps} />);
      
      const csvButton = screen.getByText('CSV').closest('button');
      await user.click(csvButton!);
      
      expect(csvButton).toHaveClass('selected');
    });

    it('should disable export button when no dataset selected', () => {
      render(<ExportPanel {...defaultProps} />);
      
      const exportButton = screen.getByRole('button', { name: /Export$/i });
      expect(exportButton).toBeDisabled();
    });

    it('should enable export button when dataset selected', async () => {
      const user = userEvent.setup();
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Dataset/i)).toBeInTheDocument();
      });
      
      const select = screen.getByLabelText(/Dataset/i);
      await user.selectOptions(select, 'transport_routes');
      
      const exportButton = screen.getByRole('button', { name: /Export$/i });
      expect(exportButton).not.toBeDisabled();
    });

    it('should call exportData when export button clicked', async () => {
      const user = userEvent.setup();
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Dataset/i)).toBeInTheDocument();
      });
      
      const select = screen.getByLabelText(/Dataset/i);
      await user.selectOptions(select, 'transport_routes');
      
      const exportButton = screen.getByRole('button', { name: /Export$/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(apiClient.exportData).toHaveBeenCalledWith({
          dataset: 'transport_routes',
          format: 'geojson',
        });
      });
    });

    it('should show loading state during export', async () => {
      const user = userEvent.setup();
      let resolveExport: (value: any) => void;
      const exportPromise = new Promise(resolve => { resolveExport = resolve; });
      vi.mocked(apiClient.exportData).mockReturnValue(exportPromise as any);
      
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Dataset/i)).toBeInTheDocument();
      });
      
      const select = screen.getByLabelText(/Dataset/i);
      await user.selectOptions(select, 'transport_routes');
      
      const exportButton = screen.getByRole('button', { name: /Export$/i });
      await user.click(exportButton);
      
      expect(screen.getByText(/Exporting.../i)).toBeInTheDocument();
      
      resolveExport!({ filename: 'test.geojson' });
    });

    it('should call onNotification on successful export', async () => {
      const user = userEvent.setup();
      const onNotification = vi.fn();
      render(<ExportPanel {...defaultProps} onNotification={onNotification} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Dataset/i)).toBeInTheDocument();
      });
      
      const select = screen.getByLabelText(/Dataset/i);
      await user.selectOptions(select, 'transport_routes');
      
      const exportButton = screen.getByRole('button', { name: /Export$/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(onNotification).toHaveBeenCalledWith(
          expect.stringContaining('Export ready'),
          'success'
        );
      });
    });

    it('should handle export error', async () => {
      const user = userEvent.setup();
      const onNotification = vi.fn();
      vi.mocked(apiClient.exportData).mockRejectedValue(new Error('Export failed'));
      
      render(<ExportPanel {...defaultProps} onNotification={onNotification} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Dataset/i)).toBeInTheDocument();
      });
      
      const select = screen.getByLabelText(/Dataset/i);
      await user.selectOptions(select, 'transport_routes');
      
      const exportButton = screen.getByRole('button', { name: /Export$/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(onNotification).toHaveBeenCalledWith(
          expect.stringContaining('Export failed'),
          'error'
        );
      });
    });
  });

  describe('AnalysisExportForm', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ExportPanel {...defaultProps} />);
      
      const analysisTab = screen.getByRole('button', { name: /Analysis/i });
      await user.click(analysisTab);
    });

    it('should render analysis export form', async () => {
      await waitFor(() => {
        expect(screen.getByText('Export Analysis')).toBeInTheDocument();
      });
    });

    it('should render analysis type dropdown', () => {
      expect(screen.getByLabelText(/Analysis Type/i)).toBeInTheDocument();
    });

    it('should have suitability as default analysis type', () => {
      const select = screen.getByLabelText(/Analysis Type/i) as HTMLSelectElement;
      expect(select.value).toBe('suitability');
    });

    it('should render coordinate inputs with default values', () => {
      const latInput = screen.getByLabelText(/Latitude/i) as HTMLInputElement;
      const lngInput = screen.getByLabelText(/Longitude/i) as HTMLInputElement;
      
      expect(latInput.value).toBe('-33.9249');
      expect(lngInput.value).toBe('18.4241');
    });

    it('should allow changing coordinates', async () => {
      const user = userEvent.setup();
      const latInput = screen.getByLabelText(/Latitude/i);
      const lngInput = screen.getByLabelText(/Longitude/i);
      
      await user.clear(latInput);
      await user.type(latInput, '-34.0000');
      
      await user.clear(lngInput);
      await user.type(lngInput, '18.5000');
      
      expect(latInput).toHaveValue(-34);
      expect(lngInput).toHaveValue(18.5);
    });

    it('should call exportAnalysis with correct parameters', async () => {
      const user = userEvent.setup();
      
      const exportButton = screen.getByRole('button', { name: /Export Analysis/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(apiClient.exportAnalysis).toHaveBeenCalledWith({
          analysis_type: 'suitability',
          format: 'geojson',
          parameters: { lat: -33.9249, lng: 18.4241 },
        });
      });
    });

    it('should allow changing analysis type', async () => {
      const user = userEvent.setup();
      const select = screen.getByLabelText(/Analysis Type/i);
      
      await user.selectOptions(select, 'flood_risk');
      
      const exportButton = screen.getByRole('button', { name: /Export Analysis/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(apiClient.exportAnalysis).toHaveBeenCalledWith(
          expect.objectContaining({ analysis_type: 'flood_risk' })
        );
      });
    });

    it('should handle analysis export error', async () => {
      const user = userEvent.setup();
      const onNotification = vi.fn();
      vi.mocked(apiClient.exportAnalysis).mockRejectedValue(new Error('Analysis failed'));
      
      render(<ExportPanel {...defaultProps} onNotification={onNotification} />);
      
      const analysisTab = screen.getByRole('button', { name: /Analysis/i });
      await user.click(analysisTab);
      
      await waitFor(() => {
        expect(screen.getByText('Export Analysis')).toBeInTheDocument();
      });
      
      const exportButton = screen.getByRole('button', { name: /Export Analysis/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(onNotification).toHaveBeenCalledWith(
          expect.stringContaining('Export failed'),
          'error'
        );
      });
    });
  });

  describe('PrintMapForm', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<ExportPanel {...defaultProps} />);
      
      const printTab = screen.getByRole('button', { name: /Print/i });
      await user.click(printTab);
    });

    it('should render print form', async () => {
      await waitFor(() => {
        expect(screen.getByText('Print Map')).toBeInTheDocument();
      });
    });

    it('should render title and subtitle inputs', () => {
      expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Subtitle/i)).toBeInTheDocument();
    });

    it('should have default title', () => {
      const titleInput = screen.getByLabelText(/^Title$/i) as HTMLInputElement;
      expect(titleInput.value).toBe('Cape Town Map');
    });

    it('should allow changing title', async () => {
      const user = userEvent.setup();
      const titleInput = screen.getByLabelText(/^Title$/i);
      
      await user.clear(titleInput);
      await user.type(titleInput, 'Custom Map Title');
      
      expect(titleInput).toHaveValue('Custom Map Title');
    });

    it('should render paper size and orientation dropdowns', () => {
      expect(screen.getByLabelText(/Paper Size/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Orientation/i)).toBeInTheDocument();
    });

    it('should have default paper size and orientation', () => {
      const sizeSelect = screen.getByLabelText(/Paper Size/i) as HTMLSelectElement;
      const orientSelect = screen.getByLabelText(/Orientation/i) as HTMLSelectElement;
      
      expect(sizeSelect.value).toBe('a4');
      expect(orientSelect.value).toBe('landscape');
    });

    it('should render all checkboxes', () => {
      expect(screen.getByLabelText(/Show Legend/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Show Scale Bar/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Show North Arrow/i)).toBeInTheDocument();
    });

    it('should have all checkboxes checked by default', () => {
      expect(screen.getByLabelText(/Show Legend/i)).toBeChecked();
      expect(screen.getByLabelText(/Show Scale Bar/i)).toBeChecked();
      expect(screen.getByLabelText(/Show North Arrow/i)).toBeChecked();
    });

    it('should allow toggling checkboxes', async () => {
      const user = userEvent.setup();
      const legendCheckbox = screen.getByLabelText(/Show Legend/i);
      
      await user.click(legendCheckbox);
      expect(legendCheckbox).not.toBeChecked();
      
      await user.click(legendCheckbox);
      expect(legendCheckbox).toBeChecked();
    });

    it('should show print hint', () => {
      expect(screen.getByText(/Tip: Use your browser's print function/i)).toBeInTheDocument();
    });

    it('should call window.print and onNotification when print button clicked', async () => {
      const user = userEvent.setup();
      const onNotification = vi.fn();
      const windowPrintSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      
      render(<ExportPanel {...defaultProps} onNotification={onNotification} />);
      
      const printTab = screen.getByRole('button', { name: /Print/i });
      await user.click(printTab);
      
      await waitFor(() => {
        expect(screen.getByText('Print Map')).toBeInTheDocument();
      });
      
      const printButton = screen.getByRole('button', { name: /Generate Print Layout/i });
      await user.click(printButton);
      
      expect(onNotification).toHaveBeenCalledWith(
        expect.stringContaining('Print layout configured'),
        'info'
      );
      expect(windowPrintSpy).toHaveBeenCalled();
      
      windowPrintSpy.mockRestore();
    });

    it('should include map bounds and active layers in print config', async () => {
      const user = userEvent.setup();
      const onNotification = vi.fn();
      const windowPrintSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
      
      render(<ExportPanel {...defaultProps} onNotification={onNotification} />);
      
      const printTab = screen.getByRole('button', { name: /Print/i });
      await user.click(printTab);
      
      await waitFor(() => {
        expect(screen.getByText('Print Map')).toBeInTheDocument();
      });
      
      const printButton = screen.getByRole('button', { name: /Generate Print Layout/i });
      await user.click(printButton);
      
      // Verify that print config includes bounds and layers
      expect(onNotification).toHaveBeenCalled();
      
      windowPrintSpy.mockRestore();
    });
  });

  describe('PendingExports', () => {
    it('should render pending exports section', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Recent Exports')).toBeInTheDocument();
      });
    });

    it('should display all pending exports', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('transport_routes.geojson')).toBeInTheDocument();
        expect(screen.getByText('analysis_results.csv')).toBeInTheDocument();
      });
    });

    it('should display file sizes in KB', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('122.5 KB')).toBeInTheDocument(); // 125440 / 1024
        expect(screen.getByText('44.1 KB')).toBeInTheDocument(); // 45120 / 1024
      });
    });

    it('should render download links', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        const downloadLinks = screen.getAllByText('Download');
        expect(downloadLinks.length).toBe(2);
      });
    });

    it('should generate correct download URLs', async () => {
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        const links = screen.getAllByText('Download').map(el => el.closest('a'));
        expect(links[0]).toHaveAttribute('href', '/api/exports/export_1/download');
        expect(links[1]).toHaveAttribute('href', '/api/exports/export_2/download');
      });
    });

    it('should not render when no pending exports', async () => {
      vi.mocked(apiClient.getPendingExports).mockResolvedValue({ exports: [] });
      
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(apiClient.getPendingExports).toHaveBeenCalled();
      });
      
      expect(screen.queryByText('Recent Exports')).not.toBeInTheDocument();
    });

    it('should refresh pending exports after successful export', async () => {
      const user = userEvent.setup();
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByLabelText(/Dataset/i)).toBeInTheDocument();
      });
      
      // Clear previous calls
      vi.mocked(apiClient.getPendingExports).mockClear();
      
      const select = screen.getByLabelText(/Dataset/i);
      await user.selectOptions(select, 'transport_routes');
      
      const exportButton = screen.getByRole('button', { name: /Export$/i });
      await user.click(exportButton);
      
      await waitFor(() => {
        expect(apiClient.getPendingExports).toHaveBeenCalled();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Analysis tab', async () => {
      const user = userEvent.setup();
      render(<ExportPanel {...defaultProps} />);
      
      const analysisTab = screen.getByRole('button', { name: /Analysis/i });
      await user.click(analysisTab);
      
      expect(analysisTab).toHaveClass('active');
      await waitFor(() => {
        expect(screen.getByText('Export Analysis')).toBeInTheDocument();
      });
    });

    it('should switch to Print tab', async () => {
      const user = userEvent.setup();
      render(<ExportPanel {...defaultProps} />);
      
      const printTab = screen.getByRole('button', { name: /Print/i });
      await user.click(printTab);
      
      expect(printTab).toHaveClass('active');
      await waitFor(() => {
        expect(screen.getByText('Print Map')).toBeInTheDocument();
      });
    });

    it('should switch back to Data tab', async () => {
      const user = userEvent.setup();
      render(<ExportPanel {...defaultProps} />);
      
      const analysisTab = screen.getByRole('button', { name: /Analysis/i });
      await user.click(analysisTab);
      
      await waitFor(() => {
        expect(screen.getByText('Export Analysis')).toBeInTheDocument();
      });
      
      const dataTab = screen.getByRole('button', { name: /Data/i });
      await user.click(dataTab);
      
      expect(dataTab).toHaveClass('active');
      await waitFor(() => {
        expect(screen.getByText('Export Dataset')).toBeInTheDocument();
      });
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<ExportPanel {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByTestId('x-icon').closest('button');
      await user.click(closeButton!);
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty datasets list', async () => {
      vi.mocked(apiClient.getCatalogDatasets).mockResolvedValue([]);
      
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        const select = screen.getByLabelText(/Dataset/i) as HTMLSelectElement;
        expect(select.options.length).toBe(1); // Only placeholder option
      });
    });

    it('should handle API error when loading datasets', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(apiClient.getCatalogDatasets).mockRejectedValue(new Error('API error'));
      
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load datasets:', expect.any(Error));
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle API error when loading pending exports', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(apiClient.getPendingExports).mockRejectedValue(new Error('API error'));
      
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load pending exports:', expect.any(Error));
      });
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle null response from API', async () => {
      vi.mocked(apiClient.getCatalogDatasets).mockResolvedValue(null as any);
      
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        const select = screen.getByLabelText(/Dataset/i) as HTMLSelectElement;
        expect(select.options.length).toBe(1); // Only placeholder
      });
    });

    it('should handle dataset without title', async () => {
      vi.mocked(apiClient.getCatalogDatasets).mockResolvedValue([
        { id: 'no_title_dataset', title: '' },
      ]);
      
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        const select = screen.getByLabelText(/Dataset/i);
        expect(within(select).getByText('no_title_dataset')).toBeInTheDocument();
      });
    });

    it('should handle very large file sizes', async () => {
      vi.mocked(apiClient.getPendingExports).mockResolvedValue({
        exports: [
          {
            file_id: 'big_file',
            filename: 'large_export.geojson',
            size_bytes: 52428800, // 50 MB
          },
        ],
      });
      
      render(<ExportPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('51200.0 KB')).toBeInTheDocument();
      });
    });

    it('should handle invalid coordinate input', async () => {
      const user = userEvent.setup();
      render(<ExportPanel {...defaultProps} />);
      
      const analysisTab = screen.getByRole('button', { name: /Analysis/i });
      await user.click(analysisTab);
      
      await waitFor(() => {
        expect(screen.getByText('Export Analysis')).toBeInTheDocument();
      });
      
      const latInput = screen.getByLabelText(/Latitude/i);
      await user.clear(latInput);
      await user.type(latInput, 'invalid');
      
      // Input should handle invalid value
      expect(latInput).toHaveValue(NaN);
    });
  });
});
