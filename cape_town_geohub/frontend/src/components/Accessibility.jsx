import React from 'react';

/**
 * Skip Link Component for keyboard navigation
 * Allows users to skip to main content
 */
export const SkipLink = () => (
  <a href="#main-content" className="skip-link">
    Skip to main content
  </a>
);

/**
 * Screen reader only text
 */
export const VisuallyHidden = ({ children, as: Component = 'span' }) => (
  <Component className="visually-hidden">
    {children}
  </Component>
);

/**
 * Live region for dynamic announcements
 */
export const LiveRegion = ({ message, priority = 'polite' }) => (
  <div
    role="status"
    aria-live={priority}
    aria-atomic="true"
    className="visually-hidden"
  >
    {message}
  </div>
);

/**
 * Focus trap for modals
 */
export const useFocusTrap = (containerRef, isActive) => {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element
    firstElement?.focus();

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, isActive]);
};

/**
 * Keyboard shortcut handler hook
 */
export const useKeyboardShortcuts = (shortcuts) => {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) {
        return;
      }

      for (const shortcut of shortcuts) {
        const { key, ctrl, shift, alt, action } = shortcut;

        if (
          e.key.toLowerCase() === key.toLowerCase() &&
          !!e.ctrlKey === !!ctrl &&
          !!e.shiftKey === !!shift &&
          !!e.altKey === !!alt
        ) {
          e.preventDefault();
          action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

/**
 * Announce message to screen readers
 */
export const announce = (message, priority = 'polite') => {
  const region = document.getElementById('live-region');
  if (region) {
    region.setAttribute('aria-live', priority);
    region.textContent = message;
    // Clear after announcement
    setTimeout(() => {
      region.textContent = '';
    }, 1000);
  }
};

/**
 * Accessible button with loading state
 */
export const AccessibleButton = ({
  children,
  isLoading,
  loadingText = 'Loading...',
  disabled,
  onClick,
  ariaLabel,
  ...props
}) => (
  <button
    onClick={onClick}
    disabled={disabled || isLoading}
    aria-label={ariaLabel}
    aria-busy={isLoading}
    aria-disabled={disabled || isLoading}
    {...props}
  >
    {isLoading ? (
      <>
        <span className="loading-spinner" aria-hidden="true" />
        <VisuallyHidden>{loadingText}</VisuallyHidden>
        {children}
      </>
    ) : (
      children
    )}
  </button>
);

/**
 * Accessible tooltip
 */
export const Tooltip = ({ content, children, id }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div
      className="tooltip-container"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      <div aria-describedby={isVisible ? id : undefined}>
        {children}
      </div>
      {isVisible && (
        <div
          id={id}
          role="tooltip"
          className="tooltip"
        >
          {content}
        </div>
      )}
    </div>
  );
};

/**
 * Accessible modal wrapper
 */
export const AccessibleModal = ({
  isOpen,
  onClose,
  title,
  children,
  ariaDescribedBy
}) => {
  const modalRef = React.useRef(null);
  const previousActiveElement = React.useRef(null);

  useFocusTrap(modalRef, isOpen);

  React.useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={ariaDescribedBy}
        className="modal-container"
      >
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
};

/**
 * High contrast mode detector
 */
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setIsHighContrast(mediaQuery.matches);

    const handler = (e) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isHighContrast;
};

/**
 * Reduced motion detector
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

/**
 * Accessible loading indicator
 */
export const LoadingIndicator = ({
  isLoading,
  message = 'Loading content...',
  size = 'medium'
}) => {
  if (!isLoading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`loading-indicator ${size}`}
    >
      <div className="loading-spinner" aria-hidden="true" />
      <span className="visually-hidden">{message}</span>
    </div>
  );
};

/**
 * Color blind friendly color palette
 */
export const ACCESSIBLE_COLORS = {
  // Wong color-blind safe palette
  good: '#009E73',      // Bluish green
  warning: '#E69F00',   // Orange
  danger: '#D55E00',    // Vermillion
  info: '#0072B2',      // Blue
  neutral: '#999999',   // Gray

  // For data visualization
  categorical: [
    '#0072B2', // Blue
    '#E69F00', // Orange
    '#009E73', // Bluish green
    '#CC79A7', // Reddish purple
    '#F0E442', // Yellow
    '#56B4E9', // Sky blue
    '#D55E00', // Vermillion
  ]
};

/**
 * Form field with accessible error handling
 */
export const AccessibleFormField = ({
  id,
  label,
  type = 'text',
  error,
  required,
  helpText,
  ...props
}) => {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className="form-field">
      <label htmlFor={id}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {required && <VisuallyHidden>(required)</VisuallyHidden>}
      </label>

      <input
        id={id}
        type={type}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={`${error ? errorId : ''} ${helpText ? helpId : ''}`.trim() || undefined}
        {...props}
      />

      {helpText && (
        <span id={helpId} className="help-text">
          {helpText}
        </span>
      )}

      {error && (
        <span id={errorId} className="error-message" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default {
  SkipLink,
  VisuallyHidden,
  LiveRegion,
  useFocusTrap,
  useKeyboardShortcuts,
  announce,
  AccessibleButton,
  Tooltip,
  AccessibleModal,
  useHighContrast,
  useReducedMotion,
  LoadingIndicator,
  ACCESSIBLE_COLORS,
  AccessibleFormField
};
