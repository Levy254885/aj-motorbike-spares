import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App';
import './index.css';
import { initOfflineDb } from './lib/offlineDb';
import { initSyncManager } from './lib/syncManager';

// Initialize offline storage and sync manager immediately
async function initializeApp() {
  try {
    console.log('[App] Initializing offline storage...');
    await initOfflineDb();
    console.log('[App] Offline storage ready');

    console.log('[App] Initializing sync manager...');
    initSyncManager({ maxRetries: 5, retryDelayMs: 3000 });
    console.log('[App] Sync manager ready');
  } catch (err) {
    console.error('[App] Initialization error:', err);
  }

  // Render React app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

// Start app initialization
initializeApp();

// Register service worker for PWA offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.log('[PWA] Service Worker registered successfully', reg);
        // Check for updates periodically
        setInterval(() => {
          reg.update();
        }, 60000); // Check every minute
      })
      .catch((err) => {
        console.error('[PWA] Service Worker registration failed:', err);
      });
  });
}

// Log when app is installed
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('[PWA] Install prompt available');
});

window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed successfully');
});
