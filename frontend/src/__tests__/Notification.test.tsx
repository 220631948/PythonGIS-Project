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
    render(<Notification message="Test Message" onClose={() => {}} />);
    expect(screen.getByText('Test Message')).toBeInTheDocument();
  });

  it('renders with correct accessibility roles', () => {
    const { rerender } = render(<Notification message="Info" type="info" onClose={() => {}} />);

    // Info notifications should have role="status" and aria-live="polite"
    const infoNotification = screen.getByText('Info').closest('.notification');
    expect(infoNotification).toHaveAttribute('role', 'status');
    expect(infoNotification).toHaveAttribute('aria-live', 'polite');

    rerender(<Notification message="Error" type="error" onClose={() => {}} />);

    // Error notifications should have role="alert" and aria-live="assertive"
    const errorNotification = screen.getByText('Error').closest('.notification');
    expect(errorNotification).toHaveAttribute('role', 'alert');
    expect(errorNotification).toHaveAttribute('aria-live', 'assertive');
  });

  it('has an accessible close button', () => {
    render(<Notification message="Test" onClose={() => {}} />);
    const closeButton = screen.getByRole('button');
    expect(closeButton).toHaveAttribute('aria-label', 'Close notification');
  });

  it('pauses auto-dismiss on hover', () => {
    const handleClose = vi.fn();
    render(<Notification message="Test" duration={3000} onClose={handleClose} />);

    const notification = screen.getByText('Test').closest('.notification');
    if (!notification) throw new Error('Notification not found');

    // Advance 2s (total 3s)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Hover to pause
    fireEvent.mouseEnter(notification);

    // Advance another 2s (total 4s elapsed if not paused)
    act(() => {
      vi.advanceTimersByTime(2000);
    });

    // Should NOT have closed yet because we are hovering
    expect(handleClose).not.toHaveBeenCalled();

    // Leave to resume
    fireEvent.mouseLeave(notification);

    // Advance remaining time (need > 1s more since we paused at 2s, but let's give it full duration)
    // Actually, implementation usually clears timeout on enter and restarts full duration on leave,
    // or resumes remaining. Simplest UX pattern is often "restart full duration on leave" or "pause".
    // Let's assume we want to restart or just ensure it closes eventually.
    // If we just restart the timer on leave, we expect it to close after another 3000s + animation time.

    act(() => {
      vi.advanceTimersByTime(3500); // 3000 duration + 300 animation buffer
    });

    expect(handleClose).toHaveBeenCalled();
  });
});
