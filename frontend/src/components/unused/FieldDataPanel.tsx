/**
 * FieldDataPanel - Mobile/field data capture with offline support
 *
 * Provides:
 * - Field survey forms
 * - Data entry with location and photos
 * - Offline sync queue management
 */

import React, { useState, useEffect } from 'react';
import {
  Clipboard, MapPin, Upload, RefreshCw, X, Wifi, WifiOff, List, Plus
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { useOnlineStatus } from '../hooks/useOfflineData';

interface FormFieldConfig {
  id: string;
  field_type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'date' | 'datetime' | 'photo';
  label: string;
  required: boolean;
  help_text?: string;
  options?: string[];
  order: number;
}

interface FormConfig {
  id: string;
  name: string;
  description: string;
  fields: FormFieldConfig[];
  offline_enabled?: boolean;
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
}

interface FieldEntry {
  id?: string;
  form_id: string;
  location: LocationData;
  attributes: Record<string, any>;
  collected_by: string;
  collected_at: string;
  status: string;
  offline_id?: string;
}

interface FieldDataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  clickedLocation: LocationData | null;
  onNotification?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

interface FormFieldProps {
  field: FormFieldConfig;
  value: any;
  onChange: (value: any) => void;
}

function FormField({ field, value, onChange }: FormFieldProps) {
  switch (field.field_type) {
    case 'text':
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.help_text}
          required={field.required}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          placeholder={field.help_text}
          required={field.required}
        />
      );

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        >
          <option value="">Select...</option>
          {field.options?.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );

    case 'multiselect':
      return (
        <div className="multiselect">
          {field.options?.map(opt => (
            <label key={opt} className="checkbox-label">
              <input
                type="checkbox"
                checked={(value || []).includes(opt)}
                onChange={(e) => {
                  const newValue = value || [];
                  if (e.target.checked) {
                    onChange([...newValue, opt]);
                  } else {
                    onChange(newValue.filter((v: string) => v !== opt));
                  }
                }}
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={value || false}
            onChange={(e) => onChange(e.target.checked)}
          />
          {field.label}
        </label>
      );

    case 'date':
      return (
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );

    case 'datetime':
      return (
        <input
          type="datetime-local"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
        />
      );

    case 'photo':
      return (
        <div className="photo-input">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onChange({ file, preview: URL.createObjectURL(file) });
              }
            }}
          />
          {value?.preview && (
            <img src={value.preview} alt="Preview" className="photo-preview" />
          )}
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

interface DataEntryFormProps {
  form: FormConfig;
  location: LocationData;
  onSubmit: (entry: Partial<FieldEntry>) => Promise<void>;
  onCancel: () => void;
}

function DataEntryForm({ form, location, onSubmit, onCancel }: DataEntryFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit({
        form_id: form.id,
        location: {
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy || 10
        },
        attributes: formData,
        collected_by: localStorage.getItem('username') || 'Field User',
        collected_at: new Date().toISOString()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="data-entry-form" onSubmit={handleSubmit}>
      <div className="form-header">
        <h3>{form.name}</h3>
        <p className="form-description">{form.description}</p>
      </div>

      <div className="location-display">
        <MapPin size={16} />
        <span>{location.lat.toFixed(5)}, {location.lng.toFixed(5)}</span>
      </div>

      <div className="form-fields">
        {form.fields
          .sort((a, b) => a.order - b.order)
          .map(field => (
            <div key={field.id} className="form-group">
              {field.field_type !== 'checkbox' && (
                <label>
                  {field.label}
                  {field.required && <span className="required">*</span>}
                </label>
              )}
              <FormField
                field={field}
                value={formData[field.id]}
                onChange={(value) => handleFieldChange(field.id, value)}
              />
              {field.help_text && field.field_type !== 'text' && (
                <span className="help-text">{field.help_text}</span>
              )}
            </div>
          ))}
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </form>
  );
}

interface SyncQueueProps {
  queue: FieldEntry[];
  onSync: () => Promise<void>;
  isSyncing: boolean;
}

function SyncQueue({ queue, onSync, isSyncing }: SyncQueueProps) {
  if (!queue || queue.length === 0) return null;

  return (
    <div className="sync-queue">
      <div className="queue-header">
        <h4>Pending Sync ({queue.length})</h4>
        <button
          onClick={onSync}
          disabled={isSyncing}
          className="btn-sync"
        >
          {isSyncing ? (
            <RefreshCw size={14} className="spin" />
          ) : (
            <Upload size={14} />
          )}
          Sync Now
        </button>
      </div>
      <div className="queue-list">
        {queue.map((item, idx) => (
          <div key={idx} className="queue-item">
            <span className="queue-form">{item.form_id}</span>
            <span className="queue-date">
              {new Date(item.collected_at).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface EntryListProps {
  entries: FieldEntry[];
  onSelect: (entry: FieldEntry) => void;
}

function EntryList({ entries, onSelect }: EntryListProps) {
  if (!entries || entries.length === 0) {
    return (
      <div className="empty-state">
        <Clipboard size={40} />
        <p>No entries collected yet</p>
      </div>
    );
  }

  return (
    <div className="entries-list">
      {entries.map(entry => (
        <div key={entry.id || entry.offline_id} className="entry-card" onClick={() => onSelect(entry)}>
          <div className="entry-header">
            <span className="entry-form">{entry.form_id}</span>
            <span className={`entry-status ${entry.status}`}>{entry.status}</span>
          </div>
          <div className="entry-location">
            <MapPin size={12} />
            {entry.location.lat.toFixed(4)}, {entry.location.lng.toFixed(4)}
          </div>
          <div className="entry-date">
            {new Date(entry.collected_at).toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FieldDataPanel({
  isOpen,
  onClose,
  clickedLocation,
  onNotification
}: FieldDataPanelProps) {
  const [forms, setForms] = useState<FormConfig[]>([]);
  const [entries, setEntries] = useState<FieldEntry[]>([]);
  const [selectedForm, setSelectedForm] = useState<FormConfig | null>(null);
  const [view, setView] = useState<'forms' | 'entry' | 'list'>('forms');
  const [syncQueue, setSyncQueue] = useState<FieldEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (isOpen) {
      loadForms();
      loadEntries();
      loadSyncQueue();
    }
  }, [isOpen]);

  const loadForms = async () => {
    try {
      const data = await apiClient.getFieldForms();
      setForms(data || []);
    } catch (error) {
      console.error('Failed to load forms:', error);
    }
  };

  const loadEntries = async () => {
    try {
      const data = await apiClient.getFieldEntries();
      setEntries(data || []);
    } catch (error) {
      console.error('Failed to load entries:', error);
    }
  };

  const loadSyncQueue = () => {
    const queue = JSON.parse(localStorage.getItem('fieldDataQueue') || '[]');
    setSyncQueue(queue);
  };

  const handleFormSelect = (form: FormConfig) => {
    if (!clickedLocation) {
      onNotification?.('Please click on the map to select a location first', 'warning');
      return;
    }
    setSelectedForm(form);
    setView('entry');
  };

  const handleSubmitEntry = async (entry: Partial<FieldEntry>) => {
    if (isOnline) {
      try {
        await apiClient.submitFieldEntry(entry);
        onNotification?.('Entry submitted successfully', 'success');
        loadEntries();
      } catch {
        // Save to offline queue
        saveToQueue(entry);
        onNotification?.('Saved offline. Will sync when online.', 'warning');
      }
    } else {
      saveToQueue(entry);
      onNotification?.('Saved offline. Will sync when online.', 'info');
    }

    setSelectedForm(null);
    setView('forms');
  };

  const saveToQueue = (entry: Partial<FieldEntry>) => {
    const queue = JSON.parse(localStorage.getItem('fieldDataQueue') || '[]');
    queue.push({ ...entry, offline_id: Date.now().toString() });
    localStorage.setItem('fieldDataQueue', JSON.stringify(queue));
    loadSyncQueue();
  };

  const handleSync = async () => {
    if (!isOnline) {
      onNotification?.('Cannot sync while offline', 'warning');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await apiClient.syncFieldEntries(syncQueue) as { synced: number; failed: number; errors: Array<{ offline_id: string }> };

      if (result.synced > 0) {
        // Clear synced entries from queue
        const failedIds = result.errors.map(e => e.offline_id);
        const remainingQueue = syncQueue.filter(e => e.offline_id != null && failedIds.includes(e.offline_id));
        localStorage.setItem('fieldDataQueue', JSON.stringify(remainingQueue));
        loadSyncQueue();
        loadEntries();

        onNotification?.(
          `Synced ${result.synced} entries. ${result.failed} failed.`,
          result.failed > 0 ? 'warning' : 'success'
        );
      }
    } catch (error: any) {
      onNotification?.('Sync failed: ' + error.message, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="field-data-panel">
      <div className="panel-header">
        <h2><Clipboard size={20} /> Field Data</h2>
        <div className="online-status">
          {isOnline ? (
            <><Wifi size={14} className="online" /> Online</>
          ) : (
            <><WifiOff size={14} className="offline" /> Offline</>
          )}
        </div>
        <button onClick={onClose}><X size={18} /></button>
      </div>

      <SyncQueue
        queue={syncQueue}
        onSync={handleSync}
        isSyncing={isSyncing}
      />

      <div className="tab-bar">
        <button
          className={view === 'forms' ? 'active' : ''}
          onClick={() => setView('forms')}
        >
          <Plus size={14} /> New Entry
        </button>
        <button
          className={view === 'list' ? 'active' : ''}
          onClick={() => setView('list')}
        >
          <List size={14} /> Entries ({entries.length})
        </button>
      </div>

      <div className="panel-content">
        {view === 'forms' && !selectedForm && (
          <div className="forms-list">
            <p className="hint">
              {clickedLocation
                ? `Location: ${clickedLocation.lat.toFixed(4)}, ${clickedLocation.lng.toFixed(4)}`
                : 'Click on the map to select a location'}
            </p>
            {forms.map(form => (
              <div
                key={form.id}
                className="form-card"
                onClick={() => handleFormSelect(form)}
              >
                <h4>{form.name}</h4>
                <p>{form.description}</p>
                <span className="field-count">{form.fields.length} fields</span>
                {form.offline_enabled && (
                  <span className="offline-badge">Offline ready</span>
                )}
              </div>
            ))}
          </div>
        )}

        {view === 'entry' && selectedForm && clickedLocation && (
          <DataEntryForm
            form={selectedForm}
            location={clickedLocation}
            onSubmit={handleSubmitEntry}
            onCancel={() => {
              setSelectedForm(null);
              setView('forms');
            }}
          />
        )}

        {view === 'list' && (
          <EntryList
            entries={entries}
            onSelect={(entry) => console.log('Selected entry:', entry)}
          />
        )}
      </div>
    </div>
  );
}
