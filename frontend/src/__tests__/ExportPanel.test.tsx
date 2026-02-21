import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportPanel from '../components/ExportPanel';

// Mock the API client
vi.mock('../lib/api', () => ({
  apiClient: {
    catalog: {
      getDatasets: vi.fn().mockResolvedValue([
        { id: 'dataset1', title: 'Dataset 1' }
      ]),
    },
    export: {
      getPending: vi.fn().mockResolvedValue({ exports: [] }),
      exportData: vi.fn(),
      exportAnalysis: vi.fn(),
      getDownloadUrl: vi.fn(),
    },
  },
}));

describe('ExportPanel Accessibility', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    mapBounds: {},
    activeLayers: [],
  };

  it('has an accessible close button', () => {
    render(<ExportPanel {...defaultProps} />);
    // This expects a button with accessible name "Close export panel" or similar
    // Using regex to be flexible but "Close" is expected
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('has accessible form inputs', async () => {
    render(<ExportPanel {...defaultProps} />);

    // Check "Dataset" label association (Data tab is default)
    // getByLabelText throws if no control is associated with the label
    expect(screen.getByLabelText(/dataset/i)).toHaveValue('');

    // Switch to Analysis tab
    fireEvent.click(screen.getByText('Analysis'));

    // Check "Latitude" label association
    expect(screen.getByLabelText(/latitude/i)).toBeInTheDocument();

    // Switch to Print tab
    fireEvent.click(screen.getByText('Print'));

    // Check "Title" label association
    // Use exact match or regex anchor to avoid matching "Subtitle"
    expect(screen.getByLabelText(/^Title$/i)).toBeInTheDocument();
  });
});
