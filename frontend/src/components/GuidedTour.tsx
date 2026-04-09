/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, HelpCircle, CheckCircle } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target: string | null;
  position: 'center' | 'top' | 'right' | 'bottom' | 'left';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Cape Town GeoHub',
    content: 'This interactive tour will guide you through the main features of the application. You can skip or restart this tour anytime from the help menu.',
    target: null,
    position: 'center'
  },
  {
    id: 'map',
    title: 'Interactive Map',
    content: 'The main map displays spatial data layers. Use the mouse wheel to zoom, click and drag to pan. Click anywhere to select a location for analysis.',
    target: '.map-container',
    position: 'center'
  },
  {
    id: 'layers',
    title: 'Layer Control',
    content: 'Toggle data layers on/off using the layer panel. You can add various datasets from the City of Cape Town Open Data Portal.',
    target: '.layer-panel',
    position: 'right'
  },
  {
    id: 'search',
    title: 'Search & Geocoding',
    content: 'Use the search bar to find places, addresses, or suburbs in Cape Town. Results will center the map on the found location.',
    target: '.search-autocomplete',
    position: 'bottom'
  },
  {
    id: 'suitability',
    title: 'Site Suitability Analysis',
    content: 'Click on any location to analyze its suitability for development. The analysis considers flood risk, zoning, transport access, and more.',
    target: '.suitability-panel',
    position: 'left'
  },
  {
    id: 'collaboration',
    title: 'Collaboration Tools',
    content: 'Add comments and annotations to specific map locations. Share observations with your team and participate in threaded discussions.',
    target: '[data-tour="collaboration"]',
    position: 'left'
  },
  {
    id: 'export',
    title: 'Export & Print',
    content: 'Export data in various formats (CSV, GeoJSON, Excel) or generate printable maps with legends and scale bars.',
    target: '[data-tour="export"]',
    position: 'left'
  },
  {
    id: 'realtime',
    title: 'Real-Time Data',
    content: 'Access live data feeds including traffic conditions, weather alerts, and public transport status with automatic refresh.',
    target: '[data-tour="realtime"]',
    position: 'left'
  },
  {
    id: 'field',
    title: 'Field Data Capture',
    content: 'Use survey forms to collect field data. Works offline - data will sync automatically when you\'re back online.',
    target: '[data-tour="field"]',
    position: 'left'
  },
  {
    id: 'share',
    title: 'Share Map State',
    content: 'The URL automatically updates with your current map view. Share the URL to let others see exactly what you\'re looking at.',
    target: null,
    position: 'center'
  },
  {
    id: 'complete',
    title: 'Tour Complete!',
    content: 'You\'re all set to explore Cape Town GeoHub. Click the help button anytime to restart this tour or access documentation.',
    target: null,
    position: 'center'
  }
];

interface TourTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

function TourTooltip({ step, stepIndex, totalSteps, onNext, onPrev, onSkip, onComplete }: TourTooltipProps) {
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;

  return (
    <div className={`tour-tooltip ${step.position}`}>
      <button className="close-btn" onClick={onSkip} aria-label="Skip tour" title="Skip tour"><X size={16} /></button>

      <div className="tour-content">
        <h3>{step.title}</h3>
        <p>{step.content}</p>
      </div>

      <div className="tour-footer">
        <div className="step-indicator">
          {stepIndex + 1} / {totalSteps}
        </div>
        <div className="tour-actions">
          {!isFirst && (
            <button onClick={onPrev} className="btn-prev">
              <ChevronLeft size={16} /> Previous
            </button>
          )}
          {isLast ? (
            <button onClick={onComplete} className="btn-complete">
              <CheckCircle size={16} /> Finish
            </button>
          ) : (
            <button onClick={onNext} className="btn-next">
              Next <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      <button className="skip-tour" onClick={onSkip}>Skip tour</button>
    </div>
  );
}

interface HighlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

function TourHighlight({ targetSelector }: { targetSelector: string | null }) {
  const [position, setPosition] = useState<HighlightPosition | null>(null);

  useEffect(() => {
    if (!targetSelector) {
      setPosition(null);
      return;
    }

    const target = document.querySelector(targetSelector);
    if (target) {
      const rect = target.getBoundingClientRect();
      setPosition({
        top: rect.top - 5,
        left: rect.left - 5,
        width: rect.width + 10,
        height: rect.height + 10
      });
    }
  }, [targetSelector]);

  if (!position) return null;

  return (
    <div
      className="tour-highlight"
      style={{
        top: position.top,
        left: position.left,
        width: position.width,
        height: position.height
      }}
    />
  );
}

interface GuidedTourProps {
  isActive: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export default function GuidedTour({ isActive, onComplete, onSkip }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsVisible(true);
      setCurrentStep(0);
    }
  }, [isActive]);

  const handleNext = useCallback(() => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleComplete = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem('tourCompleted', 'true');
    onComplete?.();
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    setIsVisible(false);
    localStorage.setItem('tourSkipped', 'true');
    onSkip?.();
  }, [onSkip]);

  // Keyboard navigation
  useEffect(() => {
    if (!isVisible) return;

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep === TOUR_STEPS.length - 1) {
          handleComplete();
        } else {
          handleNext();
        }
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [isVisible, currentStep, handleNext, handlePrev, handleComplete, handleSkip]);

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  if (!step) return null;

  return (
    <div className="guided-tour-overlay">
      <div className="tour-backdrop" onClick={handleSkip} />

      <TourHighlight targetSelector={step.target} />

      <TourTooltip
        step={step}
        stepIndex={currentStep}
        totalSteps={TOUR_STEPS.length}
        onNext={handleNext}
        onPrev={handlePrev}
        onSkip={handleSkip}
        onComplete={handleComplete}
      />
    </div>
  );
}

// Hook to manage tour state
export function useTour() {
  const [isActive, setIsActive] = useState(false);

  const startTour = useCallback(() => {
    setIsActive(true);
  }, []);

  const endTour = useCallback(() => {
    setIsActive(false);
  }, []);

  // Auto-start tour for first-time users
  useEffect(() => {
    const tourCompleted = localStorage.getItem('tourCompleted');
    const tourSkipped = localStorage.getItem('tourSkipped');

    if (!tourCompleted && !tourSkipped) {
      // Delay start to let app load
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 2000);
      return () => clearTimeout(timer);
    }

    return undefined;
  }, []);

  return { isActive, startTour, endTour };
}

interface HelpButtonProps {
    onClick: () => void;
}

// Help button component
export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button
      className="help-button"
      onClick={onClick}
      title="Start guided tour"
    >
      <HelpCircle size={20} />
    </button>
  );
}
