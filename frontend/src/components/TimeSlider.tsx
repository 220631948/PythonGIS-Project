import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Settings, Calendar } from 'lucide-react';
import '../styles/TimeSlider.css';

/**
 * TimeSlider - Temporal animation controls for time-enabled datasets
 *
 * Features:
 * - Play/pause animation
 * - Adjustable playback speed
 * - Date range selection
 * - Frame stepping
 * - Cumulative/snapshot mode
 */

interface TimeSliderProps {
  dataset: string | null;
  timeField?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  onTimeChange?: (params: TimeChangeParams) => void;
  onFrameChange?: (frame: any) => void;
  isLoading?: boolean;
}

interface TimeChangeParams {
  currentTime: string;
  startDate: string;
  endDate: string;
  interval: string;
  cumulative: boolean;
}

// Helper to safely new Date()
const safeDate = (d: Date | string | undefined): Date => {
  if (d instanceof Date) return d;
  if (!d) return new Date();
  return new Date(d);
};

export default function TimeSlider({
  dataset,
  timeField,
  minDate,
  maxDate,
  onTimeChange,
  onFrameChange,
  isLoading = false
}: TimeSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  void dataset;
  void timeField;
  void onFrameChange;
  
  // Initialize state with safe dates
  const [currentTime, setCurrentTime] = useState(safeDate(minDate));
  const [startDate, setStartDate] = useState(safeDate(minDate));
  const [endDate, setEndDate] = useState(safeDate(maxDate));
  
  const [speed, setSpeed] = useState(1000); // milliseconds per frame
  const [interval, setInterval] = useState('day'); // hour, day, week, month
  const [cumulative, setCumulative] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const animationRef = useRef<number | null>(null);
  const sliderRef = useRef<HTMLInputElement>(null);

  // Calculate slider position (0-100)
  const sliderPosition = useCallback(() => {
    if (!startDate || !endDate) return 0;
    const total = endDate.getTime() - startDate.getTime();
    if (total <= 0) return 0;
    const current = currentTime.getTime() - startDate.getTime();
    return Math.max(0, Math.min(100, (current / total) * 100));
  }, [currentTime, startDate, endDate]);

  // Get interval duration in milliseconds
  const getIntervalMs = useCallback(() => {
    const intervals: Record<string, number> = {
      hour: 3600000,
      day: 86400000,
      week: 604800000,
      month: 2592000000
    };
    return intervals[interval] || 86400000;
  }, [interval]);

  // Notify parent of time change
  useEffect(() => {
    if (onTimeChange) {
      onTimeChange({
        currentTime: currentTime.toISOString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        interval,
        cumulative
      });
    }
  }, [currentTime, startDate, endDate, interval, cumulative, onTimeChange]);

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = window.setInterval(() => {
        setCurrentTime(prev => {
          const next = new Date(prev.getTime() + getIntervalMs());
          if (next >= endDate) {
            setIsPlaying(false);
            return endDate;
          }
          return next;
        });
      }, speed);
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, speed, endDate, getIntervalMs]);

  // Handle slider drag
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const total = endDate.getTime() - startDate.getTime();
    const newTime = new Date(startDate.getTime() + (total * value / 100));
    setCurrentTime(newTime);
    setIsPlaying(false);
  };

  // Step forward/backward
  const stepForward = () => {
    setCurrentTime(prev => {
      const next = new Date(prev.getTime() + getIntervalMs());
      return next <= endDate ? next : endDate;
    });
  };

  const stepBackward = () => {
    setCurrentTime(prev => {
      const next = new Date(prev.getTime() - getIntervalMs());
      return next >= startDate ? next : startDate;
    });
  };

  // Reset to start
  const resetToStart = () => {
    setCurrentTime(startDate);
    setIsPlaying(false);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    if (!date) return '';
    const options: any = { // Using any as specific Intl types can be verbose
      hour: { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' },
      day: { day: 'numeric', month: 'short', year: 'numeric' },
      week: { day: 'numeric', month: 'short', year: 'numeric' },
      month: { month: 'long', year: 'numeric' }
    };
    return date.toLocaleDateString('en-ZA', options[interval] || options.day);
  };

  return (
    <div className="time-slider">
      <div className="time-slider-header">
        <div className="time-display">
          <Calendar size={16} />
          <span className="current-time">{formatDate(currentTime)}</span>
        </div>
        <button
          className={`settings-btn ${showSettings ? 'active' : ''}`}
          onClick={() => setShowSettings(!showSettings)}
          aria-label="Toggle time settings"
        >
          <Settings size={16} />
        </button>
      </div>

      {showSettings && (
        <div className="time-settings">
          <div className="setting-row">
            <label>Interval</label>
            <select
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            >
              <option value="hour">Hourly</option>
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
          <div className="setting-row">
            <label>Speed</label>
            <select
              value={speed}
              onChange={(e) => setSpeed(parseInt(e.target.value))}
            >
              <option value="2000">Slow (2s)</option>
              <option value="1000">Normal (1s)</option>
              <option value="500">Fast (0.5s)</option>
              <option value="250">Very Fast (0.25s)</option>
            </select>
          </div>
          <div className="setting-row">
            <label>Mode</label>
            <div className="toggle-group">
              <button
                className={!cumulative ? 'active' : ''}
                onClick={() => setCumulative(false)}
              >
                Snapshot
              </button>
              <button
                className={cumulative ? 'active' : ''}
                onClick={() => setCumulative(true)}
              >
                Cumulative
              </button>
            </div>
          </div>
          <div className="setting-row">
            <label>Start Date</label>
            <input
              type="date"
              value={startDate.toISOString().split('T')[0]}
              onChange={(e) => setStartDate(new Date(e.target.value))}
            />
          </div>
          <div className="setting-row">
            <label>End Date</label>
            <input
              type="date"
              value={endDate.toISOString().split('T')[0]}
              onChange={(e) => setEndDate(new Date(e.target.value))}
            />
          </div>
        </div>
      )}

      <div className="time-slider-track">
        <span className="track-label start">{formatDate(startDate)}</span>
        <div className="slider-container">
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={sliderPosition()}
            onChange={handleSliderChange}
            className="time-range"
            disabled={isLoading}
          />
          <div
            className="slider-progress"
            style={{ width: `${sliderPosition()}%` }}
          />
        </div>
        <span className="track-label end">{formatDate(endDate)}</span>
      </div>

      <div className="time-controls">
        <button
          className="control-btn"
          onClick={resetToStart}
          title="Reset to start"
        >
          <SkipBack size={18} />
        </button>
        <button
          className="control-btn"
          onClick={stepBackward}
          title="Step backward"
        >
          <SkipBack size={16} />
        </button>
        <button
          className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause' : 'Play'}
          disabled={isLoading}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          className="control-btn"
          onClick={stepForward}
          title="Step forward"
        >
          <SkipForward size={16} />
        </button>
        <button
          className="control-btn"
          onClick={() => setCurrentTime(endDate)}
          title="Go to end"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
          <span>Loading frame...</span>
        </div>
      )}
    </div>
  );
}
