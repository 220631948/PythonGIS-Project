/* eslint-disable react-refresh/only-export-components */
import React, { useEffect, useRef, useState, ReactNode, ElementType } from 'react';

interface SkipLinkProps {
  targetId?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ targetId = 'main-content' }) => (
  <a href={`#${targetId}`} className="skip-link">
    Skip to main content
  </a>
);

/**
 * Screen reader only text
 */
interface VisuallyHiddenProps {
  children: ReactNode;
  as?: ElementType;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ children, as: Component = 'span' }) => (
  <Component className="visually-hidden">
    {children}
  </Component>
);

/**
 * Live region for dynamic announcements
 */
interface LiveRegionProps {
  message: string;
  priority?: 'polite' | 'assertive';
}

export const LiveRegion: React.FC<LiveRegionProps> = ({ message, priority = 'polite' }) => (
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
export const useFocusTrap = (containerRef: React.RefObject<HTMLElement | null>, isActive: boolean) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
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
 * Accepts either:
 * - An object: { 'key': action, ... }
 * - An array: [{ key, ctrl, shift, alt, action }, ...]
 */
interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
}

type ShortcutsMap = Record<string, () => void>;
type ShortcutsInput = ShortcutConfig[] | ShortcutsMap | null | undefined;

export const useKeyboardShortcuts = (shortcuts: ShortcutsInput) => {
  useEffect(() => {
    // Early return if no shortcuts provided
    if (!shortcuts) return;

    // Normalize to array format - must be done inside effect to avoid dependency issues if passed as object literal
    let shortcutList: ShortcutConfig[] = [];

    if (Array.isArray(shortcuts)) {
      shortcutList = shortcuts;
    } else if (typeof shortcuts === 'object') {
      // Convert object format { 'key': action } to array format
      shortcutList = Object.entries(shortcuts).map(([k, action]) => ({
        key: k,
        action,
        ctrl: false,
        shift: false,
        alt: false
      }));
    }

    // If no valid shortcuts, don't add listener
    if (shortcutList.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
        return;
      }

      for (const shortcut of shortcutList) {
        const { key, ctrl, shift, alt, action } = shortcut;

        if (
          key &&
          e.key.toLowerCase() === key.toLowerCase() &&
          !!e.ctrlKey === !!(ctrl) &&
          !!e.shiftKey === !!(shift) &&
          !!e.altKey === !!(alt)
        ) {
          e.preventDefault();
          if (typeof action === 'function') {
            action();
          }
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
export const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
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
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  ariaLabel?: string;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
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
interface TooltipProps {
  content: string;
  children: ReactNode;
  id: string;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children, id }) => {
  const [isVisible, setIsVisible] = useState(false);

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
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  ariaDescribedBy?: string;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  ariaDescribedBy
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
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
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setIsHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return isHighContrast;
};

/**
 * Reduced motion detector
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
};

/**
 * Accessible loading indicator
 */
interface LoadingIndicatorProps {
  isLoading: boolean;
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
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
interface AccessibleFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | null;
  helpText?: string;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
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

const Accessibility = {
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

export default Accessibility;
