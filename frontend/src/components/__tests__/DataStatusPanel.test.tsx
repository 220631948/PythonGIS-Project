/**
 * Comprehensive tests for DataStatusPanel component
 * 
 * Tests cover:
 * - Component rendering with different states
 * - Loading states
 * - Error handling
 * - Tab switching
 * - Data fetching and display
 * - User interactions
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DataStatusPanel from '../DataStatusPanel';
import { apiClient } from '../../lib/api';

// Mock the API client
vi.mock('../../lib/api', () => ({
  apiClient: {
    getDataSourcesHealth: vi.fn(),
    getRetrievalLog: vi.fn(),
  },
}));

describe('DataStatusPanel', () => {
  const mockHealthData = {
    summary: {
      accessible: 8,
      unavailable: 2,
      health_percentage: 80,
      total_sources: 10,
    },
    sources: {
      transport_routes: {
        accessible: true,
        status: 'ok' as const,
        url: 'https://example.com/transport',
      },
      flood_zones: {
        accessible: false,
        status: 'error' as const,
        url: 'https://example.com/floods',
      },
      biodiversity: {
        accessible: true,
        status: 'ok' as const,
        url: 'https://example.com/biodiversity',
      },
    },
  };

  const mockRetrievalLog = {
    entries: [
      {
        dataset: 'transport_routes',
        timestamp: '2024-01-15T10:30:00Z',
        message: 'Successfully fetched 150 features',
        success: true,
      },
      {
        dataset: 'flood_zones',
        timestamp: '2024-01-15T10:29:00Z',
        message: 'Connection timeout',
        success: false,
      },
      {
        dataset: 'biodiversity',
        timestamp: '2024-01-15T10:28:00Z',
        message: 'Retrieved 45 protected areas',
        success: true,
      },
    ],
    statistics: {
      success_rate: 85.5,
      total_recorded: 150,
      failed: 22,
    },
  };

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default successful API responses
    vi.mocked(apiClient.getDataSourcesHealth).mockResolvedValue(mockHealthData);
    vi.mocked(apiClient.getRetrievalLog).mockResolvedValue(mockRetrievalLog);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      const { container } = render(
        <DataStatusPanel isOpen={false} onClose={defaultProps.onClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render panel when isOpen is true', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('📊 Data Source Status')).toBeInTheDocument();
      });
    });

    it('should render header with title and description', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('📊 Data Source Status')).toBeInTheDocument();
        expect(screen.getByText('Real open data from official sources')).toBeInTheDocument();
      });
    });

    it('should render close button', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /×/i });
        expect(closeButton).toBeInTheDocument();
      });
    });

    it('should render both tabs', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/🟢 Source Health/i)).toBeInTheDocument();
        expect(screen.getByText(/📋 Retrieval Log/i)).toBeInTheDocument();
      });
    });

    it('should render footer with security note', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/🔒 All data from official open data portals/i)).toBeInTheDocument();
      });
    });

    it('should render refresh button in footer', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /🔄 Refresh/i })).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator initially', () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      expect(screen.getByText('Checking data sources...')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    it('should hide loading indicator after data loads', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Checking data sources...')).not.toBeInTheDocument();
      });
    });

    it('should call both API methods when panel opens', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(apiClient.getDataSourcesHealth).toHaveBeenCalledTimes(1);
        expect(apiClient.getRetrievalLog).toHaveBeenCalledWith(20);
      });
    });

    it('should not fetch data when panel is closed', () => {
      render(<DataStatusPanel isOpen={false} onClose={defaultProps.onClose} />);
      
      expect(apiClient.getDataSourcesHealth).not.toHaveBeenCalled();
      expect(apiClient.getRetrievalLog).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      const errorMessage = 'Network connection failed';
      vi.mocked(apiClient.getDataSourcesHealth).mockRejectedValue(new Error(errorMessage));
      
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/⚠️ Error:/i)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument();
      });
    });

    it('should display generic error when error has no message', async () => {
      vi.mocked(apiClient.getDataSourcesHealth).mockRejectedValue({});
      
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to load status/i)).toBeInTheDocument();
      });
    });

    it('should clear previous error on successful reload', async () => {
      // First fail, then succeed
      vi.mocked(apiClient.getDataSourcesHealth)
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(mockHealthData);
      
      const { rerender } = render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/First error/i)).toBeInTheDocument();
      });
      
      // Trigger refresh
      const refreshButton = screen.getByRole('button', { name: /🔄 Refresh/i });
      await userEvent.click(refreshButton);
      
      await waitFor(() => {
        expect(screen.queryByText(/First error/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Health Tab', () => {
    it('should display summary statistics', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('8')).toBeInTheDocument(); // accessible
        expect(screen.getByText('Available')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument(); // unavailable
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
        expect(screen.getByText('80%')).toBeInTheDocument(); // health
        expect(screen.getByText('Health')).toBeInTheDocument();
      });
    });

    it('should display total sources count', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/Data Sources \(10\)/i)).toBeInTheDocument();
      });
    });

    it('should display all data sources', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/transport routes/i)).toBeInTheDocument();
        expect(screen.getByText(/flood zones/i)).toBeInTheDocument();
        expect(screen.getByText(/biodiversity/i)).toBeInTheDocument();
      });
    });

    it('should display correct status badges', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        const okBadges = screen.getAllByText('OK');
        const errorBadges = screen.getAllByText('ERROR');
        expect(okBadges.length).toBeGreaterThan(0);
        expect(errorBadges.length).toBeGreaterThan(0);
      });
    });

    it('should display truncated URLs', async () => {
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/https:\/\/example.com\/transport/i)).toBeInTheDocument();
      });
    });

    it('should use correct color indicators for status', async () => {
      const { container } = render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        // Check for green border (accessible)
        const accessibleElements = container.querySelectorAll('[style*="rgb(16, 185, 129)"]');
        expect(accessibleElements.length).toBeGreaterThan(0);
        
        // Check for red border (unavailable)
        const unavailableElements = container.querySelectorAll('[style*="rgb(239, 68, 68)"]');
        expect(unavailableElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Retrieval Log Tab', () => {
    beforeEach(async () => {
      const user = userEvent.setup();
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Checking data sources...')).not.toBeInTheDocument();
      });
      
      // Switch to log tab
      const logTab = screen.getByRole('button', { name: /📋 Retrieval Log/i });
      await user.click(logTab);
    });

    it('should switch to log tab when clicked', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Success Rate:/i)).toBeInTheDocument();
      });
    });

    it('should display log statistics', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Success Rate:/i)).toBeInTheDocument();
        expect(screen.getByText(/85.5%/i)).toBeInTheDocument();
        expect(screen.getByText(/Total: 150/i)).toBeInTheDocument();
        expect(screen.getByText(/Failed: 22/i)).toBeInTheDocument();
      });
    });

    it('should display all log entries', async () => {
      await waitFor(() => {
        expect(screen.getByText('transport_routes')).toBeInTheDocument();
        expect(screen.getByText('flood_zones')).toBeInTheDocument();
        expect(screen.getByText('biodiversity')).toBeInTheDocument();
      });
    });

    it('should display log entry messages', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Successfully fetched 150 features/i)).toBeInTheDocument();
        expect(screen.getByText(/Connection timeout/i)).toBeInTheDocument();
        expect(screen.getByText(/Retrieved 45 protected areas/i)).toBeInTheDocument();
      });
    });

    it('should format timestamps correctly', async () => {
      await waitFor(() => {
        // Check that timestamps are rendered (format varies by locale)
        const timestamps = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/);
        expect(timestamps.length).toBeGreaterThan(0);
      });
    });

    it('should show empty message when no logs', async () => {
      vi.mocked(apiClient.getRetrievalLog).mockResolvedValue({
        entries: [],
        statistics: {
          success_rate: 0,
          total_recorded: 0,
          failed: 0,
        },
      });
      
      const user = userEvent.setup();
      const { rerender } = render(<DataStatusPanel isOpen={false} onClose={defaultProps.onClose} />);
      rerender(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Checking data sources...')).not.toBeInTheDocument();
      });
      
      const logTab = screen.getByRole('button', { name: /📋 Retrieval Log/i });
      await user.click(logTab);
      
      await waitFor(() => {
        expect(screen.getByText('No retrieval logs yet')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<DataStatusPanel isOpen={true} onClose={onClose} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Checking data sources...')).not.toBeInTheDocument();
      });
      
      const closeButton = screen.getByRole('button', { name: /×/i });
      await user.click(closeButton);
      
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should switch tabs correctly', async () => {
      const user = userEvent.setup();
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Checking data sources...')).not.toBeInTheDocument();
      });
      
      // Initially on health tab
      expect(screen.getByText(/Data Sources \(/i)).toBeInTheDocument();
      
      // Switch to log tab
      const logTab = screen.getByRole('button', { name: /📋 Retrieval Log/i });
      await user.click(logTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Success Rate:/i)).toBeInTheDocument();
      });
      
      // Switch back to health tab
      const healthTab = screen.getByRole('button', { name: /🟢 Source Health/i });
      await user.click(healthTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Data Sources \(/i)).toBeInTheDocument();
      });
    });

    it('should refresh data when refresh button clicked', async () => {
      const user = userEvent.setup();
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Checking data sources...')).not.toBeInTheDocument();
      });
      
      // Clear mock call count
      vi.mocked(apiClient.getDataSourcesHealth).mockClear();
      vi.mocked(apiClient.getRetrievalLog).mockClear();
      
      const refreshButton = screen.getByRole('button', { name: /🔄 Refresh/i });
      await user.click(refreshButton);
      
      expect(screen.getByText('Checking data sources...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(apiClient.getDataSourcesHealth).toHaveBeenCalledTimes(1);
        expect(apiClient.getRetrievalLog).toHaveBeenCalledTimes(1);
      });
    });

    it('should fetch data when panel opens after being closed', async () => {
      const { rerender } = render(<DataStatusPanel isOpen={false} onClose={defaultProps.onClose} />);
      
      expect(apiClient.getDataSourcesHealth).not.toHaveBeenCalled();
      
      rerender(<DataStatusPanel isOpen={true} onClose={defaultProps.onClose} />);
      
      await waitFor(() => {
        expect(apiClient.getDataSourcesHealth).toHaveBeenCalled();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sources object', async () => {
      vi.mocked(apiClient.getDataSourcesHealth).mockResolvedValue({
        summary: {
          accessible: 0,
          unavailable: 0,
          health_percentage: 0,
          total_sources: 0,
        },
        sources: {},
      });
      
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText(/Data Sources \(0\)/i)).toBeInTheDocument();
      });
    });

    it('should handle missing URL in source status', async () => {
      vi.mocked(apiClient.getDataSourcesHealth).mockResolvedValue({
        ...mockHealthData,
        sources: {
          no_url_source: {
            accessible: true,
            status: 'ok',
            url: '',
          },
        },
      });
      
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/no url source/i)).toBeInTheDocument();
      });
    });

    it('should handle pending status', async () => {
      vi.mocked(apiClient.getDataSourcesHealth).mockResolvedValue({
        ...mockHealthData,
        sources: {
          pending_source: {
            accessible: false,
            status: 'pending',
            url: 'https://example.com/pending',
          },
        },
      });
      
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('PENDING')).toBeInTheDocument();
      });
    });

    it('should handle 100% health', async () => {
      vi.mocked(apiClient.getDataSourcesHealth).mockResolvedValue({
        summary: {
          accessible: 10,
          unavailable: 0,
          health_percentage: 100,
          total_sources: 10,
        },
        sources: mockHealthData.sources,
      });
      
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('100%')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument(); // unavailable
      });
    });

    it('should handle very long source names', async () => {
      const longName = 'a_very_long_source_name_that_should_wrap_or_truncate_properly';
      vi.mocked(apiClient.getDataSourcesHealth).mockResolvedValue({
        ...mockHealthData,
        sources: {
          [longName]: {
            accessible: true,
            status: 'ok',
            url: 'https://example.com',
          },
        },
      });
      
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(new RegExp(longName.replace(/_/g, ' ')))).toBeInTheDocument();
      });
    });
  });

  describe('TypeScript Type Safety', () => {
    it('should handle HealthData type correctly', async () => {
      const validHealthData = {
        summary: {
          accessible: 5,
          unavailable: 5,
          health_percentage: 50,
          total_sources: 10,
        },
        sources: {
          test: {
            accessible: true,
            status: 'ok' as const,
            url: 'http://test.com',
          },
        },
      };
      
      vi.mocked(apiClient.getDataSourcesHealth).mockResolvedValue(validHealthData);
      
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('50%')).toBeInTheDocument();
      });
    });

    it('should handle RetrievalLog type correctly', async () => {
      const validLog = {
        entries: [
          {
            dataset: 'test',
            timestamp: new Date().toISOString(),
            message: 'Test message',
            success: true,
          },
        ],
        statistics: {
          success_rate: 100,
          total_recorded: 1,
          failed: 0,
        },
      };
      
      vi.mocked(apiClient.getRetrievalLog).mockResolvedValue(validLog);
      
      const user = userEvent.setup();
      render(<DataStatusPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.queryByText('Checking data sources...')).not.toBeInTheDocument();
      });
      
      const logTab = screen.getByRole('button', { name: /📋 Retrieval Log/i });
      await user.click(logTab);
      
      await waitFor(() => {
        expect(screen.getByText('test')).toBeInTheDocument();
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });
  });
});
