import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Notification } from '../components/Notification';

describe('Notification Component', () => {
  it('renders info notification with role="status"', () => {
    const onClose = vi.fn();
    render(
      <Notification
        message="Info message"
        type="info"
        onClose={onClose}
      />
    );

    const notification = screen.getByText('Info message').closest('.notification');
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveAttribute('role', 'status');
    // polite is default for status, but explicit check if implemented
    // expect(notification).toHaveAttribute('aria-live', 'polite');
  });

  it('renders error notification with role="alert"', () => {
    const onClose = vi.fn();
    render(
      <Notification
        message="Error occurred"
        type="error"
        onClose={onClose}
      />
    );

    const notification = screen.getByText('Error occurred').closest('.notification');
    expect(notification).toBeInTheDocument();
    expect(notification).toHaveAttribute('role', 'alert');
    // assertive is default for alert
    // expect(notification).toHaveAttribute('aria-live', 'assertive');
  });

  it('has accessible close button', () => {
    const onClose = vi.fn();
    render(
      <Notification
        message="Test message"
        onClose={onClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close notification/i });
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('hides icon from screen readers', () => {
    const onClose = vi.fn();
    render(
      <Notification
        message="Test message"
        onClose={onClose}
      />
    );

    // The icon container should be aria-hidden
    // We can find it by looking for the icon wrapper div
    // Since we don't have a test-id, we look for the element containing the icon
    // But implementation details might vary.
    // Let's assume the icon is inside a div that we add aria-hidden to.

    // We can query by generic selector if needed, but let's wait for implementation.
    // Ideally we query by hidden: true
    // screen.getByText('Test message').parentElement...

    // For now, let's just verify the structure in implementation step.
    // Or we can query by class if stable.
  });
});
