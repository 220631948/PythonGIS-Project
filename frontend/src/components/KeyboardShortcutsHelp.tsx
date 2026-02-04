/**
 * Keyboard shortcuts help overlay component.
 * Shows available keyboard shortcuts when user presses '?' or triggers help.
 */

import React, { useEffect, useState } from 'react';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
}

const shortcuts: KeyboardShortcut[] = [
  // Navigation
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Navigation' },
  { keys: ['Esc'], description: 'Close dialogs/overlays', category: 'Navigation' },
  { keys: ['/', 's'], description: 'Focus search', category: 'Navigation' },
  { keys: ['h'], description: 'Go to home', category: 'Navigation' },
  
  // Map Controls
  { keys: ['+', '='], description: 'Zoom in', category: 'Map' },
  { keys: ['-'], description: 'Zoom out', category: 'Map' },
  { keys: ['f'], description: 'Toggle fullscreen map', category: 'Map' },
  { keys: ['l'], description: 'Toggle layers panel', category: 'Map' },
  { keys: ['m'], description: 'Toggle basemap', category: 'Map' },
  
  // Data & Analysis
  { keys: ['d'], description: 'Open dashboard', category: 'Data' },
  { keys: ['a'], description: 'Open accessibility analysis', category: 'Data' },
  { keys: ['r'], description: 'Refresh data layers', category: 'Data' },
  { keys: ['Ctrl', 'f'], description: 'Find on map', category: 'Data' },
  
  // View
  { keys: ['t'], description: 'Toggle theme (dark/light)', category: 'View' },
  { keys: ['i'], description: 'Toggle info panel', category: 'View' },
  { keys: ['n'], description: 'Toggle notifications', category: 'View' },
];

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Group shortcuts by category
  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 'var(--z-modal-backdrop)',
          animation: 'fade-in 0.2s ease-out',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="card card-elevated animate-scale-in"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          zIndex: 'var(--z-modal)',
          padding: 'var(--space-6)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-between" style={{ marginBottom: 'var(--space-6)' }}>
          <div>
            <h2
              className="font-display"
              style={{
                fontSize: 'var(--text-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                marginBottom: 'var(--space-1)',
              }}
            >
              ⌨️ Keyboard Shortcuts
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
              Speed up your workflow with these shortcuts
            </p>
          </div>
          <button
            className="btn-icon btn-ghost"
            onClick={onClose}
            aria-label="Close"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Shortcuts Grid */}
        <div className="stack-lg">
          {categories.map((category) => (
            <div key={category}>
              <h3
                style={{
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--space-3)',
                }}
              >
                {category}
              </h3>
              <div className="stack-sm">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="flex-between"
                      style={{
                        padding: 'var(--space-2)',
                        borderRadius: 'var(--radius-md)',
                        transition: 'background var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-primary-soft)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--text-sm)',
                          color: 'var(--color-text-primary)',
                        }}
                      >
                        {shortcut.description}
                      </span>
                      <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                        {shortcut.keys.map((key, i) => (
                          <React.Fragment key={i}>
                            {i > 0 && (
                              <span
                                style={{
                                  color: 'var(--color-text-muted)',
                                  fontSize: 'var(--text-xs)',
                                  alignSelf: 'center',
                                }}
                              >
                                +
                              </span>
                            )}
                            <kbd
                              style={{
                                display: 'inline-block',
                                padding: '4px 8px',
                                fontSize: 'var(--text-xs)',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 'var(--font-weight-semibold)',
                                color: 'var(--color-text-primary)',
                                background: 'var(--color-surface-raised)',
                                border: '1px solid var(--color-border)',
                                borderRadius: 'var(--radius-sm)',
                                boxShadow:
                                  '0 1px 0 var(--color-border-strong), inset 0 1px 0 var(--color-surface)',
                                minWidth: '32px',
                                textAlign: 'center',
                              }}
                            >
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="divider-gradient"
          style={{ marginTop: 'var(--space-6)', marginBottom: 'var(--space-4)' }}
        />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
            Press <kbd style={{ padding: '2px 6px', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-sm)' }}>?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </>
  );
};

/**
 * Hook to manage keyboard shortcuts help overlay
 */
export const useKeyboardShortcuts = () => {
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setShowHelp(true);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  return {
    showHelp,
    openHelp: () => setShowHelp(true),
    closeHelp: () => setShowHelp(false),
  };
};

export default KeyboardShortcutsHelp;
