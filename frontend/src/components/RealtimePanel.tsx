import React, { useState, useEffect, useCallback } from 'react';
import {
  Radio, RefreshCw, Clock, X, AlertTriangle,
  CheckCircle, Activity, CloudRain, Car, Train, Wind, LucideIcon
} from 'lucide-react';
import { apiClient } from '../lib/api';

/*
 * RealtimePanel - Live data feeds with refresh controls
 *
 * Provides:
 * - Real-time data feed display
 * - Auto-refresh with timestamps
 * - Manual refresh controls
 */

const FEED_ICONS: Record<string, LucideIcon> = {
  traffic_status: Car,
  weather_alerts: CloudRain,
  service_disruptions: AlertTriangle,
  public_transport: Train,
  air_quality: Wind
};

interface Feed {
  id: string;
  name: string;
  description: string;
  active: boolean;
  refresh_interval_seconds: number;
  is_stale?: boolean;
}

interface FeedStatusData {
  active_feeds: number;
  total_feeds: number;
  feeds: Feed[];
}

interface FeedData {
  _feed_info?: { last_updated: string };
  features?: any[];
  current?: any;
  alerts?: any[];
  disruptions?: any[];
  services?: any[];
  stations?: any[];
  [key: string]: any;
}

interface FeedCardProps {
  feed: Feed;
  data: FeedData | undefined;
  onRefresh: (id: string, force?: boolean) => void;
  isRefreshing: boolean;
}

const FeedCard: React.FC<FeedCardProps> = ({ feed, data, onRefresh, isRefreshing }) => {
  const Icon = FEED_ICONS[feed.id] || Activity;
  const lastUpdated = data?._feed_info?.last_updated;
  const ageSeconds = lastUpdated
    ? Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000)
    : null;

  return (
    <div className={`feed-card ${!feed.active ? 'inactive' : ''}`}>
      <div className="feed-header">
        <Icon size={20} />
        <h4>{feed.name}</h4>
        <button
          className="refresh-btn"
          onClick={() => onRefresh(feed.id)}
          disabled={isRefreshing || !feed.active}
        >
          <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
        </button>
      </div>

      <p className="feed-description">{feed.description}</p>

      {data && (
        <div className="feed-data">
          {feed.id === 'traffic_status' && data.features && (
            <div className="traffic-summary">
              {data.features.slice(0, 3).map((f: any, i: number) => (
                <div key={i} className={`traffic-item ${f.properties.condition}`}>
                  <span className="route-name">{f.properties.route_name}</span>
                  <span className="condition">{f.properties.condition}</span>
                  <span className="speed">{f.properties.speed_kmh} km/h</span>
                </div>
              ))}
            </div>
          )}

          {feed.id === 'weather_alerts' && (
            <div className="weather-summary">
              <div className="current-weather">
                <span className="temp">{data.current?.temperature_c}°C</span>
                <span className="conditions">{data.current?.conditions}</span>
                <span className="wind">Wind: {data.current?.wind_speed_kmh} km/h</span>
              </div>
              {data.alerts && data.alerts.length > 0 && (
                <div className="alerts">
                  {data.alerts.map((alert: any, i: number) => (
                    <div key={i} className={`alert ${alert.severity}`}>
                      <AlertTriangle size={14} />
                      <span>{alert.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {feed.id === 'service_disruptions' && (
            <div className="disruptions-summary">
              {data.disruptions && data.disruptions.length > 0 ? (
                data.disruptions.map((d: any, i: number) => (
                  <div key={i} className="disruption-item">
                    <span className="service">{d.service}</span>
                    <span className="type">{d.type}</span>
                  </div>
                ))
              ) : (
                <div className="no-disruptions">
                  <CheckCircle size={16} />
                  <span>No active disruptions</span>
                </div>
              )}
            </div>
          )}

          {feed.id === 'public_transport' && data.services && (
            <div className="transport-summary">
              {data.services.slice(0, 4).map((s: any, i: number) => (
                <div key={i} className={`service-item ${s.status}`}>
                  <span className="line-name">{s.line_name}</span>
                  <span className="status-badge">{s.status}</span>
                  {s.delay_minutes > 0 && (
                    <span className="delay">+{s.delay_minutes}min</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {feed.id === 'air_quality' && data.stations && (
            <div className="aqi-summary">
              {data.stations.map((s: any, i: number) => (
                <div key={i} className={`aqi-item ${s.quality_level}`}>
                  <span className="station-name">{s.station_name}</span>
                  <span className="aqi-value">AQI: {s.aqi}</span>
                  <span className="quality">{s.quality_level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="feed-footer">
        <span className="last-updated">
          <Clock size={12} />
          {ageSeconds !== null ? (
            ageSeconds < 60
              ? 'Just now'
              : ageSeconds < 3600
                ? `${Math.floor(ageSeconds / 60)}m ago`
                : `${Math.floor(ageSeconds / 3600)}h ago`
          ) : 'Not loaded'}
        </span>
        <span className="refresh-interval">
          Refreshes every {feed.refresh_interval_seconds / 60}min
        </span>
      </div>
    </div>
  );
};

const FeedStatus: React.FC<{ status: FeedStatusData | null }> = ({ status }) => {
  if (!status) return null;

  return (
    <div className="feed-status-bar">
      <span className="status-item">
        <Activity size={14} />
        {status.active_feeds}/{status.total_feeds} active
      </span>
      {status.feeds?.filter(f => f.is_stale).length > 0 && (
        <span className="status-item warning">
          <AlertTriangle size={14} />
          {status.feeds.filter(f => f.is_stale).length} stale
        </span>
      )}
    </div>
  );
};

interface RealtimePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function RealtimePanel({ isOpen, onClose, onNotification }: RealtimePanelProps) {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [feedData, setFeedData] = useState<Record<string, FeedData>>({});
  const [status, setStatus] = useState<FeedStatusData | null>(null);
  const [refreshingFeeds, setRefreshingFeeds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadFeeds = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getRealtimeFeeds();
      setFeeds(data.feeds || []);
    } catch (error) {
      console.error('Failed to load feeds:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadFeedData = useCallback(async (feedId: string, forceRefresh = false) => {
    setRefreshingFeeds(prev => new Set([...prev, feedId]));
    try {
      const data = await apiClient.getRealtimeFeed(feedId, forceRefresh);
      setFeedData(prev => ({ ...prev, [feedId]: data }));
    } catch (error) {
      console.error(`Failed to load feed ${feedId}:`, error);
    } finally {
      setRefreshingFeeds(prev => {
        const next = new Set(prev);
        next.delete(feedId);
        return next;
      });
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const data = await apiClient.getRealtimeStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  }, []);

  const refreshAllFeeds = useCallback(async () => {
    for (const feed of feeds.filter(f => f.active)) {
      await loadFeedData(feed.id, true);
    }
    loadStatus();
    onNotification?.('All feeds refreshed', 'success');
  }, [feeds, loadFeedData, loadStatus, onNotification]);

  useEffect(() => {
    if (isOpen) {
      loadFeeds();
      loadStatus();
    }
  }, [isOpen, loadFeeds, loadStatus]);

  useEffect(() => {
    if (isOpen && feeds.length > 0) {
      feeds.filter(f => f.active).forEach(feed => {
        loadFeedData(feed.id);
      });
    }
  }, [isOpen, feeds, loadFeedData]);

  // Auto-refresh timer
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;

    const interval = setInterval(() => {
      feeds.filter(f => f.active).forEach(feed => {
        const data = feedData[feed.id];
        if (data?._feed_info?.last_updated) {
          const age = (Date.now() - new Date(data._feed_info.last_updated).getTime()) / 1000;
          if (age > feed.refresh_interval_seconds) {
            loadFeedData(feed.id, true);
          }
        }
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, feeds, feedData, loadFeedData]);

  if (!isOpen) return null;

  return (
    <div className="realtime-panel">
      <div className="panel-header">
        <h2><Radio size={20} /> Real-Time Data</h2>
        <button onClick={onClose}><X size={18} /></button>
      </div>

      <div className="panel-controls">
        <button
          className="btn-refresh-all"
          onClick={refreshAllFeeds}
          disabled={refreshingFeeds.size > 0}
        >
          <RefreshCw size={14} /> Refresh All
        </button>
        <label className="auto-refresh-toggle">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh
        </label>
      </div>

      <FeedStatus status={status} />

      <div className="feeds-list">
        {isLoading ? (
          <div className="loading">Loading feeds...</div>
        ) : feeds.length === 0 ? (
          <div className="empty-state">
            <Radio size={40} />
            <p>No feeds available</p>
          </div>
        ) : (
          feeds.map(feed => (
            <FeedCard
              key={feed.id}
              feed={feed}
              data={feedData[feed.id]}
              onRefresh={loadFeedData}
              isRefreshing={refreshingFeeds.has(feed.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
