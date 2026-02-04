import { useState, useEffect, useCallback } from 'react';

// Type declarations
export interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  module: string;
  endpoint: string;
  size: string;
  priority: 'high' | 'medium' | 'low';
  isDownloaded?: boolean;
  downloadedAt?: number;
  cachedSize?: number;
}

export interface StorageInfo {
  used: number;
  quota: number;
  percentUsed: string;
}

export interface DownloadProgress {
  [datasetId: string]: number;
}

export interface OperationResult {
  success: boolean;
  error?: string;
  id?: string;
}

export interface OverlayData {
  id: string;
  name: string;
  createdAt: number;
  updatedAt?: number;
  [key: string]: unknown;
}

export interface QueuedAction {
  id: number;
  type: 'SAVE_OVERLAY' | 'ANALYSIS' | string;
  payload?: any;
  endpoint?: string;
  method?: string;
  createdAt: number;
  status: 'pending' | 'completed' | 'failed';
}

export interface UserPreferences {
  wifiOnlyDownload: boolean;
  autoUpdateData: boolean;
  theme: 'light' | 'dark';
  defaultModule: string | null;
  mapStyle: 'light' | 'dark' | 'satellite';
}

const DB_NAME = 'geohub-offline';
const DB_VERSION = 1;
const STORES = {
  datasets: 'datasets',
  overlays: 'overlays',
  queue: 'actionQueue',
  preferences: 'preferences'
};

// IndexedDB wrapper for offline data management
class OfflineDB {
  db: IDBDatabase | null = null;
  ready: Promise<IDBDatabase>;

  constructor() {
    this.ready = this.init();
  }

  async init(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db!);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Datasets store
        if (!db.objectStoreNames.contains(STORES.datasets)) {
          const store = db.createObjectStore(STORES.datasets, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('module', 'module', { unique: false });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }

        // Custom overlays store
        if (!db.objectStoreNames.contains(STORES.overlays)) {
          const store = db.createObjectStore(STORES.overlays, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Action queue for offline sync
        if (!db.objectStoreNames.contains(STORES.queue)) {
          const store = db.createObjectStore(STORES.queue, { keyPath: 'id', autoIncrement: true });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // User preferences
        if (!db.objectStoreNames.contains(STORES.preferences)) {
          db.createObjectStore(STORES.preferences, { keyPath: 'key' });
        }
      };
    });
  }

  async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.ready;
    if (!this.db) throw new Error("Database not initialized");
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async put<T>(storeName: string, value: T): Promise<IDBValidKey> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string | number): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
const offlineDB = new OfflineDB();

// Dataset definitions with metadata
export const AVAILABLE_DATASETS: DatasetInfo[] = [
  {
    id: 'services-layer',
    name: 'Service Access',
    description: 'Informal settlement access to water and electricity',
    module: 'services',
    endpoint: '/api/services/access?simplify=0.0001',
    size: '~2MB',
    priority: 'high'
  },
  {
    id: 'safety-layer',
    name: 'Safety Statistics',
    description: 'Precinct-level crime statistics (aggregated)',
    module: 'safety',
    endpoint: '/api/safety/precincts?simplify=0.001',
    size: '~1MB',
    priority: 'medium'
  },
  {
    id: 'flood-layer',
    name: 'Flood Risk Zones',
    description: 'Flood risk areas by suburb',
    module: 'environment',
    endpoint: '/api/environment/flood-risk?simplify=0.0001',
    size: '~3MB',
    priority: 'medium'
  },
  {
    id: 'zoning-layer',
    name: 'Zoning Summary',
    description: 'Land use zoning classifications',
    module: 'land-use',
    endpoint: '/api/land-use/zoning?simplify=0.001',
    size: '~5MB',
    priority: 'low'
  },
  {
    id: 'waste-layer',
    name: 'Waste Collection',
    description: 'Waste collection areas and facilities',
    module: 'utilities',
    endpoint: '/api/utilities/waste?simplify=0.001',
    size: '~1MB',
    priority: 'low'
  }
];

// Hook for offline status
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(() => typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook for managing offline data
export function useOfflineData() {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({});
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const isOnline = useOnlineStatus();

  // Load downloaded datasets info
  const loadDatasets = useCallback(async () => {
    try {
      const downloaded = await offlineDB.getAll<any>(STORES.datasets);
      const datasetMap = new Map(downloaded.map(d => [d.id, d]));

      const enriched = AVAILABLE_DATASETS.map(ds => ({
        ...ds,
        isDownloaded: datasetMap.has(ds.id),
        downloadedAt: datasetMap.get(ds.id)?.downloadedAt,
        cachedSize: datasetMap.get(ds.id)?.size
      }));

      setDatasets(enriched);
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  }, []);

  // Get storage estimate
  const updateStorageInfo = useCallback(async () => {
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage !== undefined && estimate.quota !== undefined) {
        setStorageInfo({
          used: estimate.usage,
          quota: estimate.quota,
          percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(1)
        });
      }
    }
  }, []);

  useEffect(() => {
    loadDatasets();
    updateStorageInfo();
  }, [loadDatasets, updateStorageInfo]);

  // Download a dataset
  const downloadDataset = useCallback(async (datasetId: string): Promise<OperationResult> => {
    const dataset = AVAILABLE_DATASETS.find(d => d.id === datasetId);
    if (!dataset) return { success: false, error: 'Dataset not found' };

    setDownloadProgress(prev => ({ ...prev, [datasetId]: 0 }));

    try {
      const response = await fetch(dataset.endpoint);
      if (!response.body) throw new Error("Response body is empty");

      const reader = response.body.getReader();
      const contentLength = response.headers.get('Content-Length');

      let receivedLength = 0;
      const chunks: BlobPart[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          receivedLength += value.length;
        }

        if (contentLength) {
          const progress = (receivedLength / parseInt(contentLength)) * 100;
          setDownloadProgress(prev => ({ ...prev, [datasetId]: progress }));
        }
      }

      const blob = new Blob(chunks);
      const text = await blob.text();
      const data = JSON.parse(text);

      await offlineDB.put(STORES.datasets, {
        id: datasetId,
        name: dataset.name,
        module: dataset.module,
        data: data,
        size: blob.size,
        downloadedAt: Date.now(),
        featureCount: data.geojson?.features?.length || 0
      });

      setDownloadProgress(prev => ({ ...prev, [datasetId]: 100 }));
      await loadDatasets();
      await updateStorageInfo();

      return { success: true };
    } catch (error: any) {
      console.error('Download failed:', error);
      setDownloadProgress(prev => ({ ...prev, [datasetId]: -1 }));
      return { success: false, error: error.message };
    }
  }, [loadDatasets, updateStorageInfo]);

  // Delete a cached dataset
  const deleteDataset = useCallback(async (datasetId: string): Promise<OperationResult> => {
    try {
      await offlineDB.delete(STORES.datasets, datasetId);
      await loadDatasets();
      await updateStorageInfo();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [loadDatasets, updateStorageInfo]);

  // Get cached data for a dataset
  const getCachedData = useCallback(async (datasetId: string): Promise<any | null> => {
    try {
      const cached = await offlineDB.get<any>(STORES.datasets, datasetId);
      return cached?.data || null;
    } catch (e) {
      console.error('Error getting cached data:', e);
      return null;
    }
  }, []);

  // Download all high-priority datasets
  const downloadPriorityDatasets = useCallback(async () => {
    const priority = AVAILABLE_DATASETS.filter(d => d.priority === 'high');
    for (const dataset of priority) {
      await downloadDataset(dataset.id);
    }
  }, [downloadDataset]);

  // Clear all cached data
  const clearAllData = useCallback(async (): Promise<OperationResult> => {
    try {
      await offlineDB.clear(STORES.datasets);
      await loadDatasets();
      await updateStorageInfo();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [loadDatasets, updateStorageInfo]);

  return {
    datasets,
    downloadProgress,
    storageInfo,
    isOnline,
    downloadDataset,
    deleteDataset,
    getCachedData,
    downloadPriorityDatasets,
    clearAllData,
    refreshDatasets: loadDatasets
  };
}

// Hook for managing custom overlays
export function useCustomOverlays() {
  const [overlays, setOverlays] = useState<OverlayData[]>([]);

  const loadOverlays = useCallback(async () => {
    try {
      const data = await offlineDB.getAll<OverlayData>(STORES.overlays);
      setOverlays(data);
    } catch (error) {
      console.error('Failed to load overlays:', error);
    }
  }, []);

  useEffect(() => {
    loadOverlays();
  }, [loadOverlays]);

  const saveOverlay = useCallback(async (overlay: Partial<OverlayData>): Promise<OperationResult> => {
    try {
      const id = overlay.id || `overlay-${Date.now()}`;
      await offlineDB.put(STORES.overlays, {
        ...overlay,
        id,
        createdAt: overlay.createdAt || Date.now(),
        updatedAt: Date.now()
      });
      await loadOverlays();
      return { success: true, id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [loadOverlays]);

  const deleteOverlay = useCallback(async (overlayId: string): Promise<OperationResult> => {
    try {
      await offlineDB.delete(STORES.overlays, overlayId);
      await loadOverlays();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [loadOverlays]);

  return { overlays, saveOverlay, deleteOverlay, refreshOverlays: loadOverlays };
}

// Hook for action queue (offline sync)
export function useActionQueue() {
  const [queue, setQueue] = useState<QueuedAction[]>([]);
  const isOnline = useOnlineStatus();

  const loadQueue = useCallback(async () => {
    try {
      const data = await offlineDB.getAll<QueuedAction>(STORES.queue);
      setQueue(data);
    } catch (error) {
      console.error('Failed to load queue:', error);
    }
  }, []);

  const addToQueue = useCallback(async (action: Partial<QueuedAction>) => {
    try {
      await offlineDB.put(STORES.queue, {
        ...action,
        createdAt: Date.now(),
        status: 'pending'
      });
      await loadQueue();
    } catch (error) {
      console.error('Failed to queue action:', error);
    }
  }, [loadQueue]);

  const processQueue = useCallback(async () => {
    try {
      // Fetch directly from DB to avoid dependency on queue state
      const allActions = await offlineDB.getAll<QueuedAction>(STORES.queue);
      const pending = allActions.filter(a => a.status === 'pending');

      if (pending.length === 0) return;

      for (const action of pending) {
        try {
          // Process action based on type
          switch (action.type) {
            case 'SAVE_OVERLAY':
              await fetch('/api/overlays', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(action.payload)
              });
              break;
            case 'ANALYSIS':
              if (action.endpoint) {
                await fetch(action.endpoint, {
                  method: action.method || 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(action.payload)
                });
              }
              break;
            default:
              break;
          }

          await offlineDB.delete(STORES.queue, action.id);
        } catch (error) {
          console.error('Failed to process queued action:', error);
          // Optional: Mark as failed or retry count
        }
      }

      // Update state once after processing
      await loadQueue();
    } catch (error) {
      console.error('Error processing queue:', error);
    }
  }, [loadQueue]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Process queue when coming online
  useEffect(() => {
    if (isOnline) {
      processQueue();
    }
  }, [isOnline, processQueue]);

  return { queue, addToQueue, processQueue, queueLength: queue.length };
}

// User preferences management
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    wifiOnlyDownload: true,
    autoUpdateData: false,
    theme: 'light',
    defaultModule: null,
    mapStyle: 'light'
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      try {
        const prefs = await offlineDB.get<{ key: string, value: UserPreferences }>(STORES.preferences, 'user-prefs');
        if (mounted && prefs) {
          setPreferences(prev => ({ ...prev, ...prefs.value }));
        }
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        if (mounted) {
          setIsLoaded(true);
        }
      }
    };

    loadPreferences();

    return () => {
      mounted = false;
    };
  }, []);

  const updatePreference = useCallback(async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    try {
      await offlineDB.put(STORES.preferences, {
        key: 'user-prefs',
        value: newPrefs
      });
    } catch (error) {
      console.error('Failed to save preference:', error);
    }
  }, [preferences]);

  return { preferences, updatePreference, isLoaded };
}

export default offlineDB;
