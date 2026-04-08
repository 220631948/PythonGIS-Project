/**
 * AlertSubscriptionManager Component
 *
 * Manage location-based alert subscriptions
 * Users can subscribe to alerts for specific areas and types
 */

import React, { useState } from 'react';
import {
  Plus,
  MapPin,
  Bell,
  Mail,
  Smartphone,
  Trash2,
  Edit2,
  Clock,
  X
} from 'lucide-react';
import type { Subscription, NotificationSubscription } from '../../types/api-2026';

interface AlertSubscriptionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  onSubscribe: (subscription: NotificationSubscription) => Promise<void>;
  onUnsubscribe: (id: string) => Promise<void>;
  defaultLocation?: { lat: number; lng: number };
}

export default function AlertSubscriptionManager({
  isOpen,
  onClose,
  subscriptions,
  onSubscribe,
  onUnsubscribe,
  defaultLocation
}: AlertSubscriptionManagerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    user_id: 'user_' + Date.now(),
    user_email: '',
    alert_types: [] as string[],
    location: defaultLocation || { lat: -33.9249, lng: 18.4241 },
    radius_meters: 1000,
    channels: ['push'] as string[],
    frequency: 'immediate' as 'immediate' | 'daily' | 'weekly'
  });

  const alertTypes = [
    { id: 'traffic', label: 'Traffic Updates', icon: '🚗' },
    { id: 'safety', label: 'Safety Alerts', icon: '🚨' },
    { id: 'weather', label: 'Weather Warnings', icon: '🌦️' },
    { id: 'construction', label: 'Construction', icon: '🚧' },
    { id: 'events', label: 'Community Events', icon: '📅' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.alert_types.length === 0) {
      setError('Please select at least one alert type');
      return;
    }

    if (formData.channels.length === 0) {
      setError('Please select at least one notification channel');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubscribe(formData as NotificationSubscription);
      setShowAddForm(false);
      setFormData({
        user_id: 'user_' + Date.now(),
        user_email: '',
        alert_types: [],
        location: defaultLocation || { lat: -33.9249, lng: 18.4241 },
        radius_meters: 1000,
        channels: ['push'],
        frequency: 'immediate'
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create subscription');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsubscribe = async (id: string) => {
    if (confirm('Are you sure you want to unsubscribe from these alerts?')) {
      try {
        await onUnsubscribe(id);
      } catch (err: any) {
        setError(err.message || 'Failed to unsubscribe');
      }
    }
  };

  const toggleAlertType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      alert_types: prev.alert_types.includes(type)
        ? prev.alert_types.filter(t => t !== type)
        : [...prev.alert_types, type]
    }));
  };

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="alert-subscription-overlay" onClick={onClose}>
      <div className="alert-subscription-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            <Bell size={24} />
            Alert Subscriptions
          </h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)} aria-label="Dismiss error"><X size={16} /></button>
          </div>
        )}

        {/* Existing Subscriptions */}
        <div className="subscriptions-list">
          <div className="section-header">
            <h3>Active Subscriptions</h3>
            <button
              onClick={() => setShowAddForm(true)}
              className="btn-primary btn-sm"
              disabled={showAddForm}
            >
              <Plus size={16} /> Add New
            </button>
          </div>

          {subscriptions.length === 0 && !showAddForm ? (
            <div className="empty-state">
              <Bell size={48} className="empty-icon" />
              <h4>No active subscriptions</h4>
              <p>Subscribe to alerts for locations that matter to you</p>
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                <Plus size={16} /> Create Subscription
              </button>
            </div>
          ) : (
            <div className="subscription-cards">
              {subscriptions.map(sub => (
                <div key={sub.id} className={`subscription-card ${sub.active ? '' : 'inactive'}`}>
                  <div className="card-header">
                    <div className="location-info">
                      <MapPin size={16} />
                      <span>
                        {sub.location.lat.toFixed(4)}, {sub.location.lng.toFixed(4)}
                      </span>
                      <span className="radius">({sub.radius_meters}m)</span>
                    </div>
                    <button
                      onClick={() => handleUnsubscribe(sub.id)}
                      className="btn-icon btn-danger"
                      title="Unsubscribe"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="card-body">
                    <div className="alert-types-tags">
                      {sub.alert_types.map(type => (
                        <span key={type} className={`tag tag-${type}`}>
                          {type}
                        </span>
                      ))}
                    </div>

                    <div className="subscription-meta">
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>{sub.frequency}</span>
                      </div>
                      <div className="meta-item">
                        {sub.channels.map(ch => (
                          <span key={ch} className="channel-icon">
                            {ch === 'push' && <Smartphone size={14} />}
                            {ch === 'email' && <Mail size={14} />}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Subscription Form */}
        {showAddForm && (
          <div className="add-subscription-form">
            <div className="form-header">
              <h3>New Alert Subscription</h3>
              <button onClick={() => setShowAddForm(false)} className="btn-text">
                Cancel
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Alert Types */}
              <div className="form-group">
                <label>Alert Types *</label>
                <div className="alert-types-grid">
                  {alertTypes.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleAlertType(type.id)}
                      className={`alert-type-btn ${formData.alert_types.includes(type.id) ? 'selected' : ''}`}
                    >
                      <span className="type-icon">{type.icon}</span>
                      <span className="type-label">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="form-group">
                <label>Location *</label>
                <div className="location-inputs">
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.location.lat}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, lat: parseFloat(e.target.value) }
                    }))}
                    placeholder="Latitude"
                    required
                  />
                  <input
                    type="number"
                    step="0.0001"
                    value={formData.location.lng}
                    onChange={e => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, lng: parseFloat(e.target.value) }
                    }))}
                    placeholder="Longitude"
                    required
                  />
                </div>
              </div>

              {/* Radius */}
              <div className="form-group">
                <label>Alert Radius: {formData.radius_meters}m</label>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value={formData.radius_meters}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    radius_meters: parseInt(e.target.value)
                  }))}
                  className="range-input"
                />
                <div className="range-labels">
                  <span>100m</span>
                  <span>5km</span>
                </div>
              </div>

              {/* Notification Channels */}
              <div className="form-group">
                <label>Notification Channels *</label>
                <div className="channels-grid">
                  <button
                    type="button"
                    onClick={() => toggleChannel('push')}
                    className={`channel-btn ${formData.channels.includes('push') ? 'selected' : ''}`}
                  >
                    <Smartphone size={20} />
                    <span>Push</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleChannel('email')}
                    className={`channel-btn ${formData.channels.includes('email') ? 'selected' : ''}`}
                  >
                    <Mail size={20} />
                    <span>Email</span>
                  </button>
                </div>
              </div>

              {/* Email (if email channel selected) */}
              {formData.channels.includes('email') && (
                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    value={formData.user_email}
                    onChange={e => setFormData(prev => ({ ...prev, user_email: e.target.value }))}
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              )}

              {/* Frequency */}
              <div className="form-group">
                <label>Notification Frequency</label>
                <select
                  value={formData.frequency}
                  onChange={e => setFormData(prev => ({
                    ...prev,
                    frequency: e.target.value as 'immediate' | 'daily' | 'weekly'
                  }))}
                  className="select-input"
                >
                  <option value="immediate">Immediate</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Digest</option>
                </select>
              </div>

              {/* Submit */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Subscribe'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
