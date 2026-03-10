import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LayerToggleButton from '../components/LayerToggleButton';

describe('LayerToggleButton', () => {
  it('renders correctly', () => {
    const layer = { id: 'test-layer', name: 'Test Layer' };
    render(<LayerToggleButton layer={layer} isActive={false} onToggle={() => {}} />);
    expect(screen.getByText('Test Layer')).toBeInTheDocument();
  });

  it('calls onToggle when clicked', () => {
    const layer = { id: 'test-layer', name: 'Test Layer' };
    const onToggle = vi.fn();
    render(<LayerToggleButton layer={layer} isActive={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledWith('test-layer');
  });

  it('has correct aria attributes', () => {
    const layer = { id: 'test-layer', name: 'Test Layer' };
    render(<LayerToggleButton layer={layer} isActive={true} onToggle={() => {}} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });
});
