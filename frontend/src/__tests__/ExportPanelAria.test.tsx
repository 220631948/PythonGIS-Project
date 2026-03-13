import React from 'react';
import { render, screen } from '@testing-library/react';
import ExportPanel from '../components/ExportPanel';

describe('ExportPanel ARIA', () => {
  it('has correct ARIA tab roles and attributes', () => {
    render(<ExportPanel isOpen={true} onClose={() => {}} mapBounds={{}} activeLayers={[]} />);

    // Check tablist
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();

    // Check tabs
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true'); // First tab is default active
    expect(tabs[0]).toHaveAttribute('aria-controls', 'data-panel');
    expect(tabs[0]).toHaveAttribute('id', 'data-tab');

    // Check tabpanel
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('id', 'data-panel');
    expect(tabpanel).toHaveAttribute('aria-labelledby', 'data-tab');
    expect(tabpanel).toHaveAttribute('tabIndex', '0');
  });

  it('close button has aria-label', () => {
    render(<ExportPanel isOpen={true} onClose={() => {}} mapBounds={{}} activeLayers={[]} />);
    const closeBtn = screen.getByLabelText('Close export panel');
    expect(closeBtn).toBeInTheDocument();
  });
});
