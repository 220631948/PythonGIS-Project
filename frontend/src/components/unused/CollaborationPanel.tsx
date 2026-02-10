/**
 * CollaborationPanel - Spatial review and collaboration tools
 *
 * Provides:
 * - Location-based comments and annotations
 * - Shared project markers
 * - Threaded discussions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, MapPin, Plus, Send, X, Trash2 } from 'lucide-react';
import { apiClient } from '../../lib/api';

interface Location {
  lat: number;
  lng: number;
}

interface Reply {
  id: number;
  content: string;
  author: string;
  created_at: string;
  annotation_id: number;
}

interface Annotation {
  id: number;
  title: string;
  content: string;
  annotation_type: string;
  status: string;
  author: string;
  created_at: string;
  location: Location;
  reply_count: number;
  tags?: string[];
}

interface AnnotationTypeConfig {
  value: string;
  label: string;
  color: string;
}

const ANNOTATION_TYPES: AnnotationTypeConfig[] = [
  { value: 'comment', label: 'Comment', color: '#3388ff' },
  { value: 'note', label: 'Note', color: '#33aa33' },
  { value: 'issue', label: 'Issue', color: '#ff3333' },
  { value: 'suggestion', label: 'Suggestion', color: '#ffaa00' },
  { value: 'approval', label: 'Approval', color: '#00aaff' }
];

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

interface AnnotationCardProps {
  annotation: Annotation;
  onSelect: (annotation: Annotation) => void;
  onDelete: (id: number) => void;
  isSelected: boolean;
}

function AnnotationCard({ annotation, onSelect, onDelete, isSelected }: AnnotationCardProps) {
  const typeConfig: AnnotationTypeConfig = ANNOTATION_TYPES.find((t) => t.value === annotation.annotation_type)
    ?? ANNOTATION_TYPES[0]
    ?? { value: 'comment', label: 'Comment', color: '#3388ff' };

  return (
    <div
      className={`annotation-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(annotation)}
      style={{ borderLeftColor: typeConfig.color }}
    >
      <div className="annotation-header">
        <span className="annotation-type" style={{ backgroundColor: typeConfig.color }}>
          {typeConfig.label}
        </span>
        <span className="annotation-status">{annotation.status}</span>
      </div>
      <h4 className="annotation-title">{annotation.title}</h4>
      <p className="annotation-content">{annotation.content.substring(0, 100)}...</p>
      <div className="annotation-footer">
        <span className="annotation-author">{annotation.author}</span>
        <span className="annotation-date">
          {new Date(annotation.created_at).toLocaleDateString()}
        </span>
        {annotation.reply_count > 0 && (
          <span className="annotation-replies">
            <MessageSquare size={12} /> {annotation.reply_count}
          </span>
        )}
      </div>
      <button
        className="delete-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(annotation.id); }}
        title="Delete annotation"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

interface AnnotationDetailProps {
  annotation: Annotation;
  onClose: () => void;
  onUpdate: () => void;
}

function AnnotationDetail({ annotation, onClose, onUpdate }: AnnotationDetailProps) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [newReply, setNewReply] = useState('');
  const [replyAuthor, setReplyAuthor] = useState(localStorage.getItem('username') || 'Anonymous');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReplies = useCallback(async () => {
    try {
      const data = (await apiClient.getAnnotationReplies(annotation.id)) as Reply[];
      setReplies(data);
    } catch (error) {
      console.error('Failed to load replies:', error);
    }
  }, [annotation.id]);

  useEffect(() => {
    loadReplies();
  }, [loadReplies]);

  const handleSubmitReply = async () => {
    if (!newReply.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.createReply(annotation.id, {
        content: newReply,
        author: replyAuthor
      });
      setNewReply('');
      loadReplies();
      localStorage.setItem('username', replyAuthor);
    } catch (error) {
      console.error('Failed to submit reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await apiClient.updateAnnotation(annotation.id, { status: newStatus });
      onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const typeConfig: AnnotationTypeConfig = ANNOTATION_TYPES.find((t) => t.value === annotation.annotation_type)
    ?? ANNOTATION_TYPES[0]
    ?? { value: 'comment', label: 'Comment', color: '#3388ff' };

  return (
    <div className="annotation-detail">
      <div className="detail-header">
        <span className="annotation-type" style={{ backgroundColor: typeConfig.color }}>
          {typeConfig.label}
        </span>
        <button className="close-btn" onClick={onClose}><X size={18} /></button>
      </div>

      <h3>{annotation.title}</h3>
      <p className="detail-content">{annotation.content}</p>

      <div className="detail-meta">
        <span>By {annotation.author}</span>
        <span>{new Date(annotation.created_at).toLocaleString()}</span>
      </div>

      <div className="detail-location">
        <MapPin size={14} />
        <span>{annotation.location.lat.toFixed(5)}, {annotation.location.lng.toFixed(5)}</span>
      </div>

      <div className="status-control">
        <label>Status:</label>
        <select
          value={annotation.status}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="replies-section">
        <h4>Replies ({replies.length})</h4>
        <div className="replies-list">
          {replies.map(reply => (
            <div key={reply.id} className="reply">
              <div className="reply-header">
                <strong>{reply.author}</strong>
                <span>{new Date(reply.created_at).toLocaleString()}</span>
              </div>
              <p>{reply.content}</p>
            </div>
          ))}
        </div>

        <div className="reply-form">
          <input
            type="text"
            placeholder="Your name"
            value={replyAuthor}
            onChange={(e) => setReplyAuthor(e.target.value)}
            className="reply-author-input"
          />
          <textarea
            placeholder="Write a reply..."
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
          />
          <button
            onClick={handleSubmitReply}
            disabled={isSubmitting || !newReply.trim()}
          >
            <Send size={14} /> Reply
          </button>
        </div>
      </div>
    </div>
  );
}

interface CreateAnnotationFormProps {
  location: Location;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

function CreateAnnotationForm({ location, onSubmit, onCancel }: CreateAnnotationFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    annotation_type: 'comment',
    author: localStorage.getItem('username') || 'Anonymous',
    tags: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('username', formData.author);
    onSubmit({
      ...formData,
      location: {
        lat: location.lat,
        lng: location.lng
      }
    });
  };

  return (
    <form className="create-annotation-form" onSubmit={handleSubmit}>
      <h3>New Annotation</h3>
      <p className="location-info">
        <MapPin size={14} /> {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
      </p>

      <div className="form-group">
        <label>Type</label>
        <select
          value={formData.annotation_type}
          onChange={(e) => setFormData({ ...formData, annotation_type: e.target.value })}
        >
          {ANNOTATION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
          placeholder="Brief title"
        />
      </div>

      <div className="form-group">
        <label>Content</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          required
          placeholder="Describe your observation, issue, or suggestion..."
          rows={4}
        />
      </div>

      <div className="form-group">
        <label>Your Name</label>
        <input
          type="text"
          value={formData.author}
          onChange={(e) => setFormData({ ...formData, author: e.target.value })}
          required
          placeholder="Your name"
        />
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary">Create</button>
      </div>
    </form>
  );
}

interface CollaborationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clickedLocation?: Location | null;
  onAnnotationSelect?: (annotation: Annotation) => void;
  mapBounds?: { west: number; south: number; east: number; north: number } | null;
}

export default function CollaborationPanel({
  isOpen,
  onClose,
  clickedLocation,
  onAnnotationSelect,
  mapBounds
}: CollaborationPanelProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState({ type: '', status: '' });
  const [isLoading, setIsLoading] = useState(false);
  const annotationList = annotations;

  const loadAnnotations = useCallback(async () => {
    setIsLoading(true);
    try {
      const bbox = mapBounds ?
        `${mapBounds.west},${mapBounds.south},${mapBounds.east},${mapBounds.north}` :
        null;
      const data = (await apiClient.getAnnotations(
        bbox,
        filter.type || null,
        filter.status || null
      )) as { annotations?: Annotation[] };
      setAnnotations(data.annotations ?? []);
    } catch (error) {
      console.error('Failed to load annotations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [mapBounds, filter]);

  useEffect(() => {
    if (isOpen) {
      loadAnnotations();
    }
  }, [isOpen, loadAnnotations]);

  const handleCreateAnnotation = async (annotationData: any) => {
    try {
      await apiClient.createAnnotation(annotationData);
      setIsCreating(false);
      loadAnnotations();
    } catch (error) {
      console.error('Failed to create annotation:', error);
    }
  };

  const handleDeleteAnnotation = async (id: number) => {
    if (!confirm('Delete this annotation?')) return;
    try {
      await apiClient.deleteAnnotation(id);
      setSelectedAnnotation(null);
      loadAnnotations();
    } catch (error) {
      console.error('Failed to delete annotation:', error);
    }
  };

  const handleSelectAnnotation = (annotation: Annotation) => {
    setSelectedAnnotation(annotation);
    if (onAnnotationSelect) {
      onAnnotationSelect(annotation);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="collaboration-panel">
      <div className="panel-header">
        <h2><MessageSquare size={20} /> Collaboration</h2>
        <button onClick={onClose}><X size={18} /></button>
      </div>

      {isCreating && clickedLocation ? (
        <CreateAnnotationForm
          location={clickedLocation}
          onSubmit={handleCreateAnnotation}
          onCancel={() => setIsCreating(false)}
        />
      ) : selectedAnnotation ? (
        <AnnotationDetail
          annotation={selectedAnnotation}
          onClose={() => setSelectedAnnotation(null)}
          onUpdate={loadAnnotations}
        />
      ) : (
        <>
          <div className="panel-controls">
            <button
              className="btn-primary"
              onClick={() => setIsCreating(true)}
              disabled={!clickedLocation}
              title={!clickedLocation ? "Click on map to select location" : "Create annotation at selected location"}
            >
              <Plus size={16} /> Add Annotation
            </button>
          </div>

          <div className="filter-controls">
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
            >
              <option value="">All Types</option>
              {ANNOTATION_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">All Status</option>
              {STATUS_OPTIONS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div className="annotations-list">
            {isLoading ? (
              <div className="loading">Loading annotations...</div>
            ) : annotations.length === 0 ? (
              <div className="empty-state">
                <MessageSquare size={40} />
                <p>No annotations yet</p>
                <p className="hint">Click on the map and add an annotation</p>
              </div>
            ) : (
              annotationList.map((ann) => {
                const anyAnn = ann as Annotation;
                return (
                  <AnnotationCard
                    key={anyAnn.id}
                    annotation={anyAnn}
                    onSelect={handleSelectAnnotation}
                    onDelete={handleDeleteAnnotation}
                    isSelected={false}
                  />
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
