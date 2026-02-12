/**
 * Login Component Tests
 *
 * Sprint 4 - S4.1 (F.2.1): Frontend component tests with Vitest
 * Tests authentication form validation, accessibility, and user interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Login } from '../../modules/Auth/Login';
import { AuthContext } from '../../modules/Auth/AuthContext';

// Mock useAuth hook
const mockLogin = vi.fn();
const mockAuthContext = {
  user: null,
  loading: false,
  login: mockLogin,
  logout: vi.fn(),
  register: vi.fn(),
};

const renderLogin = () => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      <Login />
    </AuthContext.Provider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form with all required fields', () => {
      renderLogin();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render heading and description', () => {
      renderLogin();

      expect(screen.getByText(/sign in to geohub/i)).toBeInTheDocument();
      expect(screen.getByText(/enterprise gis platform/i)).toBeInTheDocument();
    });

    it('should focus email input on mount', () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveFocus();
    });

    it('should have password visibility toggle button', () => {
      renderLogin();

      const toggleButton = screen.getByLabelText(/show password/i);
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('Email Validation', () => {
    it('should show error for empty email on blur', async () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      fireEvent.focus(emailInput);
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should accept valid email address', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'valid@example.com');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });

    it('should clear email error on input change', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);

      // Trigger error
      await user.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });

      // Start typing again - error should clear
      await user.type(emailInput, '@example.com');

      await waitFor(() => {
        expect(screen.queryByText(/please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Password Validation', () => {
    it('should show error for empty password on blur', async () => {
      renderLogin();

      const passwordInput = screen.getByLabelText(/^password$/i);
      fireEvent.focus(passwordInput);
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for password shorter than 8 characters', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'short');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should accept password with 8+ characters', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, 'password123');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.queryByText(/password must be at least 8 characters/i)).not.toBeInTheDocument();
      });
    });

    it('should display password hint text', () => {
      renderLogin();

      expect(screen.getByText(/minimum 8 characters required/i)).toBeInTheDocument();
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility when button is clicked', async () => {
      const user = userEvent.setup();
      renderLogin();

      const passwordInput = screen.getByLabelText(/^password$/i) as HTMLInputElement;
      const toggleButton = screen.getByLabelText(/show password/i);

      // Initially hidden (type="password")
      expect(passwordInput.type).toBe('password');

      // Click to show
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('text');

      // Click to hide again
      await user.click(toggleButton);
      expect(passwordInput.type).toBe('password');
    });

    it('should update aria-label when toggling visibility', async () => {
      const user = userEvent.setup();
      renderLogin();

      const toggleButton = screen.getByLabelText(/show password/i);

      // Initially "Show password"
      expect(toggleButton).toHaveAttribute('aria-label', 'Show password');

      // Click to show - aria-label should change to "Hide password"
      await user.click(toggleButton);
      expect(toggleButton).toHaveAttribute('aria-label', 'Hide password');
    });
  });

  describe('Form Submission', () => {
    it('should call login function with valid credentials', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should not submit with invalid email', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid-email');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should not submit with short password', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should display error message when login fails', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';
      mockLogin.mockRejectedValue(new Error(errorMessage));

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Button should show loading state
      await waitFor(() => {
        expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
      });

      // Button should be disabled during loading
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Accessibility (WCAG 2.1 AA)', () => {
    it('should have proper ARIA attributes on inputs', () => {
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      expect(emailInput).toHaveAttribute('aria-required', 'true');
      expect(passwordInput).toHaveAttribute('aria-required', 'true');
    });

    it('should link error messages to inputs via aria-describedby', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(emailInput).toHaveAttribute('aria-invalid', 'true');
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
      });
    });

    it('should have role="alert" on error messages', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        const errorElement = screen.getByText(/please enter a valid email address/i);
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });

    it('should have role="main" on container', () => {
      const { container } = renderLogin();

      const mainElement = container.querySelector('[role="main"]');
      expect(mainElement).toBeInTheDocument();
    });

    it('should disable submit button when there are validation errors', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'invalid');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should allow form submission via Enter key', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);

      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    it('should allow tabbing between form fields', async () => {
      const user = userEvent.setup();
      renderLogin();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      emailInput.focus();
      expect(emailInput).toHaveFocus();

      await user.tab();
      expect(passwordInput).toHaveFocus();

      await user.tab();
      // Next tab should focus the toggle button

      await user.tab();
      expect(submitButton).toHaveFocus();
    });
  });
});
