/**
 * IssueReporter Component
 *
 * Report community issues (potholes, streetlights, water leaks, etc.)
 * with photo upload and geolocation tagging
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  X,
  MapPin,
  Camera,
  Upload,
  AlertCircle,
  CheckCircle,
  Loader,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import type { IssueReport } from '../../../types/api-2026';

interface IssueReporterProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (issue: IssueReport) => Promise<any>;
  onUploadPhoto?: (issueId: string, file: File) => Promise<void>;
  defaultLocation?: { lat: number; lng: number };
}

const ISSUE_CATEGORIES = [
  { id: 'pothole', label: 'Pothole', icon: '🕳️', description: 'Road damage or holes' },
  { id: 'streetlight', label: 'Street Light', icon: '💡', description: 'Broken or non-functional lights' },
  { id: 'water_leak', label: 'Water Leak', icon: '💧', description: 'Water pipe leaks or bursts' },
  { id: 'illegal_dumping', label: 'Illegal Dumping', icon: '🗑️', description: 'Unauthorized waste disposal' },
  { id: 'other', label: 'Other', icon: '📋', description: 'Other community issues' }
] as const;

const SEVERITY_LEVELS = [
  { id: 'low', label: 'Low', color: '#10b981', description: 'Minor inconvenience' },
  { id: 'medium', label: 'Medium', color: '#f59e0b', description: 'Moderate issue' },
  { id: 'high', label: 'High', color: '#ef4444', description: 'Urgent attention needed' },
  { id: 'critical', label: 'Critical', color: '#dc2626', description: 'Emergency situation' }
] as const;

export default function IssueReporter({
  isOpen,
  onClose,
  onSubmit,
  onUploadPhoto,
  defaultLocation
}: IssueReporterProps) {
  const [step, setStep] = useState<'form' | 'photos' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedIssue, setSubmittedIssue] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  // Form data
  const [formData, setFormData] = useState<IssueReport>({
    title: '',
    description: '',
    category: 'pothole',
    location: defaultLocation || { lat: -33.9249, lng: 18.4241 },
    severity: 'medium',
    reporter_name: '',
    reporter_email: '',
    reporter_phone: ''
  });

  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }));
        setUseCurrentLocation(true);
        setLocationLoading(false);
        setError(null);
      },
      (err) => {
        setError('Failed to get your location: ' + err.message);
        setLocationLoading(false);
      }
    );
  }, []);

  // Handle photo selection
  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length + photoFiles.length > 5) {
      setError('Maximum 5 photos allowed');
      return;
    }

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        setError('Only image files are allowed');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    setPhotoFiles(prev => [...prev, ...validFiles]);
    setError(null);
  }, [photoFiles.length]);

  // Remove photo
  const removePhoto = useCallback((index: number) => {
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please describe the issue');
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit issue report
      const result = await onSubmit(formData);
      setSubmittedIssue(result);

      // Upload photos if any
      if (photoFiles.length > 0 && onUploadPhoto && result.id) {
        setStep('photos');

        for (let i = 0; i < photoFiles.length; i++) {
          try {
            await onUploadPhoto(result.id, photoFiles[i]);
          } catch (err) {
            console.error('Failed to upload photo:', err);
          }
        }
      }

      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Failed to submit issue report');
      setIsSubmitting(false);
    }
  };

  // Reset and close
  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      category: 'pothole',
      location: defaultLocation || { lat: -33.9249, lng: 18.4241 },
      severity: 'medium',
      reporter_name: '',
      reporter_email: '',
      reporter_phone: ''
    });
    setPhotoFiles([]);
    setPhotoPreviews([]);
    setStep('form');
    setError(null);
    setIsSubmitting(false);
    setSubmittedIssue(null);
    setUseCurrentLocation(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="issue-reporter-overlay" onClick={handleClose}>
      <div className="issue-reporter-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            <AlertCircle size={24} />
            {step === 'form' && 'Report an Issue'}
            {step === 'photos' && 'Uploading Photos...'}
            {step === 'success' && 'Issue Reported'}
          </h2>
          <button onClick={handleClose} className="close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {/* Content */}
        <div className="modal-content">
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="issue-form">
              {/* Category Selection */}
              <div className="form-section">
                <label className="section-label">Issue Category *</label>
                <div className="category-grid">
                  {ISSUE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                      className={`category-btn ${formData.category === cat.id ? 'selected' : ''}`}
                    >
                      <span className="category-icon">{cat.icon}</span>
                      <div className="category-info">
                        <span className="category-label">{cat.label}</span>
                        <span className="category-desc">{cat.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="form-section">
                <label className="section-label">Issue Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                  className="text-input"
                  required
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div className="form-section">
                <label className="section-label">Detailed Description *</label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide more details about the issue..."
                  className="textarea-input"
                  rows={4}
                  required
                  maxLength={1000}
                />
                <span className="char-count">{formData.description.length}/1000</span>
              </div>

              {/* Severity */}
              <div className="form-section">
                <label className="section-label">Severity Level</label>
                <div className="severity-grid">
                  {SEVERITY_LEVELS.map(level => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, severity: level.id }))}
                      className={`severity-btn ${formData.severity === level.id ? 'selected' : ''}`}
                      style={{
                        borderColor: formData.severity === level.id ? level.color : undefined,
                        background: formData.severity === level.id ? `${level.color}15` : undefined
                      }}
                    >
                      <div
                        className="severity-indicator"
                        style={{ backgroundColor: level.color }}
                      />
                      <div className="severity-info">
                        <span className="severity-label">{level.label}</span>
                        <span className="severity-desc">{level.description}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="form-section">
                <label className="section-label">Location *</label>
                <div className="location-section">
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="btn-secondary location-btn"
                  >
                    {locationLoading ? (
                      <Loader size={16} className="spinner" />
                    ) : (
                      <MapPin size={16} />
                    )}
                    {useCurrentLocation ? 'Using Current Location' : 'Use My Location'}
                  </button>

                  <div className="location-inputs">
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.location.lat}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          location: { ...prev.location, lat: parseFloat(e.target.value) || 0 }
                        }));
                        setUseCurrentLocation(false);
                      }}
                      placeholder="Latitude"
                      className="text-input"
                      required
                    />
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.location.lng}
                      onChange={e => {
                        setFormData(prev => ({
                          ...prev,
                          location: { ...prev.location, lng: parseFloat(e.target.value) || 0 }
                        }));
                        setUseCurrentLocation(false);
                      }}
                      placeholder="Longitude"
                      className="text-input"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="form-section">
                <label className="section-label">
                  Photos (Optional)
                  <span className="label-hint">Up to 5 photos, max 10MB each</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />

                {photoPreviews.length > 0 && (
                  <div className="photo-previews">
                    {photoPreviews.map((preview, idx) => (
                      <div key={idx} className="photo-preview">
                        <img src={preview} alt={`Preview ${idx + 1}`} />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="remove-photo-btn"
                          aria-label="Remove photo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {photoFiles.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-secondary upload-btn"
                  >
                    <Camera size={16} />
                    Add Photos ({photoFiles.length}/5)
                  </button>
                )}
              </div>

              {/* Contact Information (Optional) */}
              <div className="form-section">
                <label className="section-label">
                  Contact Information (Optional)
                  <span className="label-hint">For updates on your report</span>
                </label>

                <input
                  type="text"
                  value={formData.reporter_name || ''}
                  onChange={e => setFormData(prev => ({ ...prev, reporter_name: e.target.value }))}
                  placeholder="Your Name"
                  className="text-input"
                />

                <input
                  type="email"
                  value={formData.reporter_email || ''}
                  onChange={e => setFormData(prev => ({ ...prev, reporter_email: e.target.value }))}
                  placeholder="Your Email"
                  className="text-input"
                />

                <input
                  type="tel"
                  value={formData.reporter_phone || ''}
                  onChange={e => setFormData(prev => ({ ...prev, reporter_phone: e.target.value }))}
                  placeholder="Your Phone Number"
                  className="text-input"
                />
              </div>

              {/* Submit */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleClose}
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
                  {isSubmitting ? (
                    <>
                      <Loader size={16} className="spinner" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {step === 'photos' && (
            <div className="upload-progress">
              <Loader size={48} className="spinner large" />
              <h3>Uploading Photos...</h3>
              <p>Please wait while we upload your photos</p>
            </div>
          )}

          {step === 'success' && (
            <div className="success-screen">
              <CheckCircle size={64} className="success-icon" />
              <h3>Issue Reported Successfully!</h3>

              {submittedIssue && (
                <div className="reference-box">
                  <p className="reference-label">Reference Number</p>
                  <p className="reference-number">{submittedIssue.reference_number}</p>
                  <p className="reference-hint">
                    Save this number to track your report status
                  </p>
                </div>
              )}

              <p className="success-message">
                Thank you for helping improve our community! We'll review your report
                and take appropriate action.
              </p>

              <button onClick={handleClose} className="btn-primary">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
