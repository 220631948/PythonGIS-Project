import React from 'react';
import { render, screen } from '@testing-library/react';
import { Notification } from '../components/Notification';
import { describe, it, expect } from 'vitest';

describe('Notification Component Accessibility', () => {
  it('should have role="status" for info type', () => {
    render(<Notification message="Info message" type="info" onClose={() => {}} />);
    const notification = screen.getByRole('status');
    expect(notification).toHaveTextContent('Info message');
  });

  it('should have role="alert" for error type', () => {
    render(<Notification message="Error message" type="error" onClose={() => {}} />);
    const notification = screen.getByRole('alert');
    expect(notification).toHaveTextContent('Error message');
  });

  it('should have aria-label on close button', () => {
    render(<Notification message="Test message" onClose={() => {}} />);
    const closeButton = screen.getByRole('button', { name: /close notification/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('should have aria-live attributes', () => {
    render(<Notification message="Live message" type="error" onClose={() => {}} />);
    const notification = screen.getByRole('alert');
    expect(notification).toHaveAttribute('aria-live', 'assertive');
  });
});
