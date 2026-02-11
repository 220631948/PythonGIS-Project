/**
 * FeedbackForm Component
 *
 * Submit feedback on urban planning proposals and municipal initiatives
 * with sentiment analysis and tagging
 */

import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Send,
  Tag,
  Smile,
  Frown,
  Meh,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { FeedbackSubmission } from '../../../types/api-2026';

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackSubmission) => Promise<void>;
  proposalId?: string;
  proposalTitle?: string;
}

const SENTIMENT_OPTIONS = [
  {
    id: 'positive',
    label: 'Positive',
    icon: Smile,
    color: '#10b981',
    description: 'I support this proposal'
  },
  {
    id: 'neutral',
    label: 'Neutral',
    icon: Meh,
    color: '#6b7280',
    description: 'I have mixed feelings'
  },
  {
    id: 'negative',
    label: 'Negative',
    icon: Frown,
    color: '#ef4444',
    description: 'I have concerns'
  }
] as const;

const COMMON_TAGS = [
  'accessibility',
  'safety',
  'environment',
  'traffic',
  'cost',
  'timeline',
  'community_impact',
  'design',
  'maintenance'
];

export default function FeedbackForm({
  isOpen,
  onClose,
  onSubmit,
  proposalId = 'default',
  proposalTitle
}: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<FeedbackSubmission>({
    proposal_id: proposalId,
    author_name: '',
    author_email: '',
    feedback_text: '',
    sentiment: undefined,
    tags: []
  });

  const [customTag, setCustomTag] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.feedback_text.trim()) {
      setError('Please enter your feedback');
      return;
    }

    if (formData.feedback_text.length < 10) {
      setError('Feedback must be at least 10 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      setSuccess(true);

      // Reset form after delay
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...(prev.tags || []), tag]
    }));
  };

  const addCustomTag = () => {
    if (customTag.trim() && !formData.tags?.includes(customTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), customTag.trim().toLowerCase().replace(/\s+/g, '_')]
      }));
      setCustomTag('');
    }
  };

  const handleClose = () => {
    setFormData({
      proposal_id: proposalId,
      author_name: '',
      author_email: '',
      feedback_text: '',
      sentiment: undefined,
      tags: []
    });
    setCustomTag('');
    setError(null);
    setSuccess(false);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-form-overlay" onClick={handleClose}>
      <div className="feedback-form-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>
            <MessageSquare size={24} />
            Submit Feedback
          </h2>
          <button onClick={handleClose} className="close-btn" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Proposal Info */}
        {proposalTitle && (
          <div className="proposal-info">
            <span className="info-label">Proposal:</span>
            <span className="info-value">{proposalTitle}</span>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            <span>{error}</span>
            <button onClick={() => setError(null)}><X size={16} /></button>
          </div>
        )}

        {success ? (
          <div className="success-screen">
            <CheckCircle size={64} className="success-icon" />
            <h3>Feedback Submitted!</h3>
            <p>Thank you for your input. Your feedback helps us make better decisions.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            {/* Sentiment */}
            <div className="form-section">
              <label className="section-label">How do you feel about this proposal?</label>
              <div className="sentiment-grid">
                {SENTIMENT_OPTIONS.map(sentiment => {
                  const Icon = sentiment.icon;
                  const isSelected = formData.sentiment === sentiment.id;

                  return (
                    <button
                      key={sentiment.id}
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        sentiment: sentiment.id as 'positive' | 'neutral' | 'negative'
                      }))}
                      className={`sentiment-btn ${isSelected ? 'selected' : ''}`}
                      style={{
                        borderColor: isSelected ? sentiment.color : undefined,
                        background: isSelected ? `${sentiment.color}15` : undefined
                      }}
                    >
                      <Icon
                        size={32}
                        style={{ color: isSelected ? sentiment.color : '#9ca3af' }}
                      />
                      <span className="sentiment-label">{sentiment.label}</span>
                      <span className="sentiment-desc">{sentiment.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Feedback Text */}
            <div className="form-section">
              <label className="section-label">Your Feedback *</label>
              <textarea
                value={formData.feedback_text}
                onChange={e => setFormData(prev => ({ ...prev, feedback_text: e.target.value }))}
                placeholder="Share your thoughts, suggestions, or concerns about this proposal..."
                className="textarea-input"
                rows={6}
                required
                minLength={10}
                maxLength={2000}
              />
              <span className="char-count">{formData.feedback_text.length}/2000</span>
            </div>

            {/* Tags */}
            <div className="form-section">
              <label className="section-label">
                Relevant Topics (Optional)
                <span className="label-hint">Select topics related to your feedback</span>
              </label>

              <div className="tags-grid">
                {COMMON_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`tag-btn ${formData.tags?.includes(tag) ? 'selected' : ''}`}
                  >
                    <Tag size={14} />
                    {tag.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              {/* Custom Tags */}
              <div className="custom-tag-input">
                <input
                  type="text"
                  value={customTag}
                  onChange={e => setCustomTag(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                  placeholder="Add custom tag..."
                  className="text-input"
                  maxLength={30}
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="btn-secondary btn-sm"
                  disabled={!customTag.trim()}
                >
                  Add
                </button>
              </div>

              {/* Selected Tags */}
              {formData.tags && formData.tags.length > 0 && (
                <div className="selected-tags">
                  {formData.tags.map(tag => (
                    <span key={tag} className="selected-tag">
                      {tag.replace(/_/g, ' ')}
                      <button
                        type="button"
                        onClick={() => toggleTag(tag)}
                        aria-label="Remove tag"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Contact Info */}
            <div className="form-section">
              <label className="section-label">
                Contact Information (Optional)
                <span className="label-hint">For follow-up questions</span>
              </label>

              <input
                type="text"
                value={formData.author_name || ''}
                onChange={e => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                placeholder="Your Name"
                className="text-input"
                maxLength={100}
              />

              <input
                type="email"
                value={formData.author_email || ''}
                onChange={e => setFormData(prev => ({ ...prev, author_email: e.target.value }))}
                placeholder="Your Email"
                className="text-input"
              />
            </div>

            {/* Privacy Notice */}
            <div className="privacy-notice">
              <AlertCircle size={16} />
              <p>
                Your feedback will be publicly visible. Contact information is kept private
                and only used by city officials if follow-up is needed.
              </p>
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
                    <span className="spinner-sm" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Submit Feedback
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
