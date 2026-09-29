/**
 * Sync Manager - coordinates Firestore's persistent offline queue.
 * Firestore itself owns the durable write queue; this manager only exposes
 * connection state and asks the SDK to retry when connectivity returns.
 */

import { disableNetwork, enableNetwork } from 'firebase/firestore';
import { db } from './firebase';

let isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
let initialized = false;

export function initSyncManager() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  const handleOnline = async () => {
    isOnline = true;
    if (db) {
      try {
        await enableNetwork(db);
      } catch (error) {
        console.error('[SyncManager] Could not enable Firestore network:', error);
      }
    }
  };

  const handleOffline = async () => {
    isOnline = false;
    // Allow the SDK to use its local cache immediately instead of waiting on
    // network timeouts when the operating system has lost connectivity.
    if (db) {
      try {
        await disableNetwork(db);
      } catch (error) {
        console.error('[SyncManager] Could not disable Firestore network:', error);
      }
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  if (!isOnline) void handleOffline();
}

export function isCurrentlyOnline(): boolean {
  return isOnline;
}

export async function triggerSync(): Promise<void> {
  if (!db || !isOnline) return;
  await enableNetwork(db);
}
