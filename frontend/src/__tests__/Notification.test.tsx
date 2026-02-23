import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Notification } from '../components/Notification';

describe('Notification Component', () => {
  it('renders the message correctly', () => {
    const message = 'Test message';
    render(<Notification message={message} onClose={() => {}} />);
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('applies role="alert" for error type notifications', () => {
    render(<Notification message="Error!" type="error" onClose={() => {}} />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Error!');
  });

  it('applies role="status" for success type notifications', () => {
    render(<Notification message="Success!" type="success" onClose={() => {}} />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('Success!');
  });

  it('applies role="status" for info type notifications', () => {
    render(<Notification message="Info!" type="info" onClose={() => {}} />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent('Info!');
  });

  it('has an accessible name for the close button', () => {
    render(<Notification message="Test" onClose={() => {}} />);
    const closeButton = screen.getByRole('button', { name: /close notification/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<Notification message="Test" onClose={handleClose} />);
    // Just get by role button, we don't care about label here if previous test passed,
    // but if previous failed, this might also fail if we relied on name.
    // Using getByRole('button') is safer for now as we know there is a button.
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
