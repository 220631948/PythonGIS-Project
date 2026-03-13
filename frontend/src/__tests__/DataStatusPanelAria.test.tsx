import React from 'react';
import { render, screen } from '@testing-library/react';
import DataStatusPanel from '../components/DataStatusPanel';

describe('DataStatusPanel ARIA', () => {
  it('has correct ARIA tab roles and attributes', () => {
    render(<DataStatusPanel isOpen={true} onClose={() => {}} />);

    // Check tablist
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();

    // Check tabs
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(2);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true'); // First tab is default active
    expect(tabs[0]).toHaveAttribute('aria-controls', 'health-panel');
    expect(tabs[0]).toHaveAttribute('id', 'health-tab');

    // Check tabpanel
    const tabpanel = screen.getByRole('tabpanel');
    expect(tabpanel).toHaveAttribute('id', 'health-panel');
    expect(tabpanel).toHaveAttribute('aria-labelledby', 'health-tab');
    expect(tabpanel).toHaveAttribute('tabIndex', '0');
  });

  it('close button has aria-label', () => {
    render(<DataStatusPanel isOpen={true} onClose={() => {}} />);
    const closeBtn = screen.getByLabelText('Close status panel');
    expect(closeBtn).toBeInTheDocument();
  });
});
