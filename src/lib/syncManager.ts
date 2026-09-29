/**
 * Sync Manager - Handles offline queue syncing when connection is restored
 */

import { db } from './firebase';
import { getSyncQueue, removeSyncQueueItem, updateSyncQueueAttempts, addToSyncQueue } from './offlineDb';
import type { SyncQueueItem } from './offlineDb';

export interface SyncManagerConfig {
  maxRetries: number;
  retryDelayMs: number;
}

const DEFAULT_CONFIG: SyncManagerConfig = {
  maxRetries: 3,
  retryDelayMs: 5000,
};

let syncInProgress = false;
let isOnline = navigator.onLine;

/**
 * Initialize sync manager and listen for online/offline events
 */
export function initSyncManager(config?: Partial<SyncManagerConfig>) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  window.addEventListener('online', () => {
    console.log('[SyncManager] Online detected');
    isOnline = true;
    processSyncQueue(finalConfig);
  });

  window.addEventListener('offline', () => {
    console.log('[SyncManager] Offline detected');
    isOnline = false;
  });

  // Try sync on init if online
  if (isOnline) {
    setTimeout(() => processSyncQueue(finalConfig), 2000);
  }

  console.log('[SyncManager] Initialized with config:', finalConfig);
}

export function isCurrentlyOnline(): boolean {
  return isOnline;
}

/**
 * Process all pending sync queue items
 */
async function processSyncQueue(config: SyncManagerConfig) {
  if (syncInProgress || !isOnline || !db) return;

  syncInProgress = true;
  console.log('[SyncManager] Starting sync process');

  try {
    const queue = await getSyncQueue();
    console.log(`[SyncManager] Processing ${queue.length} items`);

    for (const item of queue) {
      try {
        await syncItem(item, config);
        await removeSyncQueueItem(item.id);
        console.log('[SyncManager] Synced:', item.id);
      } catch (err) {
        console.error('[SyncManager] Sync failed for', item.id, err);
        const newAttempts = item.attempts + 1;

        if (newAttempts >= config.maxRetries) {
          console.warn('[SyncManager] Max retries reached for', item.id);
          await removeSyncQueueItem(item.id);
        } else {
          await updateSyncQueueAttempts(item.id, newAttempts);
        }
      }

      // Delay between items
      await new Promise((r) => setTimeout(r, config.retryDelayMs));
    }

    console.log('[SyncManager] Sync complete');
  } catch (err) {
    console.error('[SyncManager] Queue processing error:', err);
  } finally {
    syncInProgress = false;
  }
}

/**
 * Sync a single queue item to Firebase
 */
async function syncItem(item: SyncQueueItem, _config: SyncManagerConfig): Promise<void> {
  if (!db) throw new Error('Firebase not configured');

  const { type, operation, data } = item;

  console.log(`[SyncManager] Syncing ${type} ${operation}:`, data.id);

  switch (type) {
    case 'sale':
      // Sales are write-only in this system, already handled
      console.log('[SyncManager] Sale already synced locally');
      break;

    case 'product':
      if (operation === 'create') {
        // Already created in Firebase
        console.log('[SyncManager] Product already created');
      } else if (operation === 'update') {
        // Sync update
        const { updateProduct } = await import('../services/products');
        await updateProduct(data.id, data);
      }
      break;

    case 'customer':
      if (operation === 'create') {
        console.log('[SyncManager] Customer already created');
      } else if (operation === 'update') {
        const { updateCustomer } = await import('../services/customers');
        await updateCustomer(data.id, data);
      }
      break;

    case 'supplier':
      if (operation === 'create') {
        console.log('[SyncManager] Supplier already created');
      } else if (operation === 'update') {
        const { updateSupplier } = await import('../services/suppliers');
        await updateSupplier(data.id, data);
      }
      break;

    case 'expense':
      if (operation === 'create') {
        console.log('[SyncManager] Expense already created');
      }
      break;

    case 'purchase':
      if (operation === 'create') {
        console.log('[SyncManager] Purchase already created');
      }
      break;

    default:
      console.warn('[SyncManager] Unknown sync type:', type);
  }
}

/**
 * Manually trigger sync (useful for testing)
 */
export async function triggerSync(config?: Partial<SyncManagerConfig>) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  if (isOnline) {
    await processSyncQueue(finalConfig);
  } else {
    console.warn('[SyncManager] Cannot sync - offline');
  }
}

/**
 * Queue an operation for sync
 */
export async function queueOfflineOperation(
  type: 'sale' | 'product' | 'purchase' | 'expense' | 'customer' | 'supplier',
  operation: 'create' | 'update' | 'delete',
  data: any
): Promise<string> {
  return addToSyncQueue({ type, operation, data });
}
