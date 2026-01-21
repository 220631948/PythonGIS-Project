import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Monitor, CheckCircle } from 'lucide-react';

// Check if app is installable
export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check for iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // Listen for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      localStorage.setItem('geohub-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!installPrompt) return false;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      return true;
    }
    return false;
  };

  return {
    canInstall: !!installPrompt || isIOS,
    isInstalled,
    isIOS,
    triggerInstall
  };
}

// Install Banner Component
const InstallBanner = ({ onDismiss }) => {
  const { canInstall, isInstalled, isIOS, triggerInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = localStorage.getItem('geohub-install-dismissed');
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('geohub-install-dismissed', Date.now().toString());
    if (onDismiss) onDismiss();
  };

  const handleInstall = async () => {
    const success = await triggerInstall();
    if (success) {
      handleDismiss();
    }
  };

  if (isInstalled || dismissed || !canInstall) return null;

  return (
    <div className="install-banner" role="banner" aria-label="Install app prompt">
      <div className="install-banner-content">
        <div className="install-icon">
          <Smartphone size={24} />
        </div>
        <div className="install-text">
          <h4>Install Cape Town GeoHub</h4>
          <p>Get quick access and offline capabilities</p>
        </div>
      </div>
      <div className="install-actions">
        {isIOS ? (
          <button className="btn-primary" onClick={() => setShowIOSInstructions(true)}>
            How to Install
          </button>
        ) : (
          <button className="btn-primary" onClick={handleInstall}>
            <Download size={16} />
            Install
          </button>
        )}
        <button
          className="btn-secondary"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

// Full Install Modal
const InstallModal = ({ isOpen, onClose }) => {
  const { canInstall, isInstalled, isIOS, triggerInstall } = useInstallPrompt();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  if (!isOpen) return null;

  const handleInstall = async () => {
    const success = await triggerInstall();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="install-modal-title">
      <div className="modal-container install-modal">
        <div className="modal-header">
          <h2 id="install-modal-title">
            <Download size={24} />
            Install App
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-content">
          {isInstalled ? (
            <div className="install-success">
              <CheckCircle size={48} />
              <h3>App Installed!</h3>
              <p>Cape Town GeoHub is now installed on your device.</p>
            </div>
          ) : isIOS || showIOSInstructions ? (
            <div className="ios-instructions">
              <h3>Install on iOS</h3>
              <ol>
                <li>
                  <span className="step-number">1</span>
                  <span>Tap the Share button <span className="icon-inline">↑</span> in Safari</span>
                </li>
                <li>
                  <span className="step-number">2</span>
                  <span>Scroll down and tap "Add to Home Screen"</span>
                </li>
                <li>
                  <span className="step-number">3</span>
                  <span>Tap "Add" to confirm</span>
                </li>
              </ol>
              <div className="ios-note">
                <p>Note: This feature works best in Safari on iOS devices.</p>
              </div>
            </div>
          ) : (
            <div className="install-benefits">
              <h3>Why Install?</h3>
              <ul className="benefits-list">
                <li>
                  <CheckCircle size={18} />
                  <span>Quick access from your home screen</span>
                </li>
                <li>
                  <CheckCircle size={18} />
                  <span>Works offline with cached data</span>
                </li>
                <li>
                  <CheckCircle size={18} />
                  <span>Full-screen experience without browser UI</span>
                </li>
                <li>
                  <CheckCircle size={18} />
                  <span>Faster loading and better performance</span>
                </li>
                <li>
                  <CheckCircle size={18} />
                  <span>Receive notifications about data updates</span>
                </li>
              </ul>

              <div className="install-preview">
                <div className="preview-desktop">
                  <Monitor size={32} />
                  <span>Desktop</span>
                </div>
                <div className="preview-mobile">
                  <Smartphone size={32} />
                  <span>Mobile</span>
                </div>
              </div>

              {canInstall && (
                <button className="btn-primary btn-large" onClick={handleInstall}>
                  <Download size={20} />
                  Install Cape Town GeoHub
                </button>
              )}

              {!canInstall && (
                <div className="install-note">
                  <p>
                    Installation is not available in this browser.
                    Try using Chrome, Edge, or Safari for the best experience.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { InstallBanner, InstallModal };
export default InstallBanner;
