/**
 * Offline-first IndexedDB wrapper
 * Stores sales, products, and sync queue locally
 */

const DB_NAME = 'aj-spares-db';
const DB_VERSION = 1;

interface OfflineData {
  sales: any[];
  products: any[];
  customers: any[];
  suppliers: any[];
  expenses: any[];
  syncQueue: SyncQueueItem[];
}

interface SyncQueueItem {
  id: string;
  type: 'sale' | 'product' | 'purchase' | 'expense' | 'customer' | 'supplier';
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  attempts: number;
}

let db: IDBDatabase | null = null;

export async function initOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('[OfflineDB] Error opening database:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      console.log('[OfflineDB] Database opened successfully');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      console.log('[OfflineDB] Upgrading database schema');

      // Create object stores
      const stores = ['sales', 'products', 'customers', 'suppliers', 'expenses', 'syncQueue'];
      for (const store of stores) {
        if (!database.objectStoreNames.contains(store)) {
          database.createObjectStore(store, { keyPath: 'id', autoIncrement: false });
        }
      }
    };
  });
}

function getDb(): IDBDatabase {
  if (!db) throw new Error('OfflineDB not initialized');
  return db;
}

/**
 * Save data to IndexedDB store
 */
export async function saveToOffline<T extends { id: string }>(
  storeName: keyof OfflineData,
  item: T
): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction([storeName as string], 'readwrite');
    const store = tx.objectStore(storeName as string);
    const request = store.put(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log(`[OfflineDB] Saved to ${storeName}:`, item.id);
      resolve();
    };
  });
}

/**
 * Get data from IndexedDB store
 */
export async function getFromOffline<T>(
  storeName: keyof OfflineData,
  id: string
): Promise<T | null> {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction([storeName as string], 'readonly');
    const store = tx.objectStore(storeName as string);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

/**
 * Get all data from store
 */
export async function getAllFromOffline<T>(
  storeName: keyof OfflineData
): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction([storeName as string], 'readonly');
    const store = tx.objectStore(storeName as string);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

/**
 * Delete from IndexedDB store
 */
export async function deleteFromOffline(
  storeName: keyof OfflineData,
  id: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction([storeName as string], 'readwrite');
    const store = tx.objectStore(storeName as string);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log(`[OfflineDB] Deleted from ${storeName}:`, id);
      resolve();
    };
  });
}

/**
 * Queue an operation for sync when online
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'attempts'>): Promise<string> {
  const id = `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const queueItem: SyncQueueItem = {
    ...item,
    id,
    timestamp: Date.now(),
    attempts: 0,
  };

  await saveToOffline('syncQueue', queueItem as any);
  console.log(`[SyncQueue] Added operation:`, queueItem);
  return id;
}

/**
 * Get pending sync operations
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  const items = await getAllFromOffline<SyncQueueItem>('syncQueue');
  return items.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Remove item from sync queue
 */
export async function removeSyncQueueItem(id: string): Promise<void> {
  await deleteFromOffline('syncQueue', id);
  console.log('[SyncQueue] Removed item:', id);
}

/**
 * Update sync queue item attempts
 */
export async function updateSyncQueueAttempts(id: string, attempts: number): Promise<void> {
  const item = await getFromOffline<SyncQueueItem>('syncQueue', id);
  if (item) {
    await saveToOffline('syncQueue', { ...item, attempts });
  }
}

/**
 * Clear all offline data (for testing/debugging)
 */
export async function clearOfflineDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDb();
    const tx = database.transaction(
      ['sales', 'products', 'customers', 'suppliers', 'expenses', 'syncQueue'],
      'readwrite'
    );

    let completed = 0;
    const stores = ['sales', 'products', 'customers', 'suppliers', 'expenses', 'syncQueue'];

    for (const storeName of stores) {
      const store = tx.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        completed++;
        if (completed === stores.length) {
          console.log('[OfflineDB] All data cleared');
          resolve();
        }
      };
    }
  });
}
