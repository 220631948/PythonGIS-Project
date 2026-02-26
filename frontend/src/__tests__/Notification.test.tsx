import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Notification } from '../components/Notification';

describe('Notification Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the message correctly', () => {
    render(<Notification message="Test message" onClose={() => {}} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('calls onClose after duration', () => {
    const onClose = vi.fn();
    render(<Notification message="Test" onClose={onClose} duration={3000} />);

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(3000); // Trigger fade out
      vi.advanceTimersByTime(300);  // Trigger onClose
    });

    expect(onClose).toHaveBeenCalled();
  });

  // UX Improvements Tests (Expected to fail initially)

  it('has correct accessibility roles', () => {
    const { rerender } = render(<Notification message="Error" type="error" onClose={() => {}} />);
    // Check for alert role (errors)
    const errorAlert = screen.getByRole('alert');
    expect(errorAlert).toBeInTheDocument();
    expect(errorAlert).toHaveAttribute('aria-live', 'assertive');

    rerender(<Notification message="Success" type="success" onClose={() => {}} />);
    // Check for status role (success/info)
    const statusAlert = screen.getByRole('status');
    expect(statusAlert).toBeInTheDocument();
    expect(statusAlert).toHaveAttribute('aria-live', 'polite');
  });

  it('has accessible close button', () => {
    render(<Notification message="Test" onClose={() => {}} />);
    const button = screen.getByRole('button', { name: /close/i }); // looser match for now
    expect(button).toHaveAttribute('aria-label', 'Close notification');
  });

  it('pauses timer on hover', () => {
    const onClose = vi.fn();
    render(<Notification message="Test" onClose={onClose} duration={3000} />);

    const notificationText = screen.getByText('Test');
    // Find the container div
    // We assume the container has the 'notification' class or we can find it by traversing up
    // But since we didn't put a role on it yet, we can't easily find it by role.
    // Let's use the text to find the parent.
    // However, in the updated component we plan to add role to the container.
    // For now, let's assume we can interact with the element containing the text.

    // Actually, let's find the container by class name for this test if possible, or just fire event on the text node which should bubble?
    // Mouse enter usually doesn't bubble in the same way, but React handles it.
    // Let's try firing on the text element which is inside the div.

    fireEvent.mouseEnter(notificationText);

    // Advance time past duration
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // Should NOT have closed yet
    expect(onClose).not.toHaveBeenCalled();

    // Mouse leave
    fireEvent.mouseLeave(notificationText);

    // Advance time again
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // NOW it should close
    expect(onClose).toHaveBeenCalled();
  });
});
