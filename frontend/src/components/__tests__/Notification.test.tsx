import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationContainer from '../Notification';

describe('NotificationContainer', () => {
  const mockOnRemove = vi.fn();

  it('renders notifications correctly', () => {
    const notifications = [
      { id: 1, message: 'Test Info', type: 'info' as const },
      { id: 2, message: 'Test Error', type: 'error' as const },
    ];

    render(<NotificationContainer notifications={notifications} onRemove={mockOnRemove} />);

    expect(screen.getByText('Test Info')).toBeInTheDocument();
    expect(screen.getByText('Test Error')).toBeInTheDocument();
  });

  it('renders error notifications with role="alert" and aria-live="assertive"', () => {
    const notifications = [
      { id: 1, message: 'Critical Error', type: 'error' as const },
    ];

    render(<NotificationContainer notifications={notifications} onRemove={mockOnRemove} />);

    const notification = screen.getByText('Critical Error').closest('.notification');
    expect(notification).toHaveAttribute('role', 'alert');
    expect(notification).toHaveAttribute('aria-live', 'assertive');
  });

  it('renders info/success notifications with role="status" and aria-live="polite"', () => {
    const notifications = [
      { id: 1, message: 'Success Message', type: 'success' as const },
    ];

    render(<NotificationContainer notifications={notifications} onRemove={mockOnRemove} />);

    const notification = screen.getByText('Success Message').closest('.notification');
    expect(notification).toHaveAttribute('role', 'status');
    expect(notification).toHaveAttribute('aria-live', 'polite');
  });

  it('has accessible close button', () => {
    const notifications = [
      { id: 1, message: 'Test Message', type: 'info' as const },
    ];

    render(<NotificationContainer notifications={notifications} onRemove={mockOnRemove} />);

    const closeButton = screen.getByLabelText('Close notification');
    expect(closeButton).toBeInTheDocument();

    fireEvent.click(closeButton);
    expect(mockOnRemove).toHaveBeenCalledWith(1);
  });

  it('hides icons from screen readers', () => {
    const notifications = [
        { id: 1, message: 'Test Icon', type: 'info' as const },
    ];

    const { container } = render(<NotificationContainer notifications={notifications} onRemove={mockOnRemove} />);

    // Find SVGs inside the notification
    const svgs = container.querySelectorAll('svg');
    svgs.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
