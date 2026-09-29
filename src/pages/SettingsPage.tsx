import { useEffect, useState } from 'react';
import { Download, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __ajDeferredInstall?: BeforeInstallPromptEvent | null;
  }
}

export default function SettingsPage() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    // Check if service worker is registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        setSwReady(regs.length > 0);
        console.log('[Settings] Service Worker ready:', regs.length > 0);
      });
    }

    // Listen for install prompt
    const onBip = (e: Event) => {
      console.log('[Settings] beforeinstallprompt event fired');
      e.preventDefault();
      window.__ajDeferredInstall = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    if (window.__ajDeferredInstall) {
      setCanPrompt(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  const install = async () => {
    const ev = window.__ajDeferredInstall;
    if (!ev || installing) return;
    setInstalling(true);
    try {
      await ev.prompt();
      const { outcome } = await ev.userChoice;
      if (outcome === 'accepted') {
        console.log('[Settings] App installed');
        window.__ajDeferredInstall = null;
        setCanPrompt(false);
        setInstalled(true);
      }
    } catch (err) {
      console.error('[Settings] Install error:', err);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h1 className="text-xl font-bold text-zinc-900">Settings</h1>

      {/* App Info */}
      <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <p>
          <span className="text-zinc-500">Business:</span> <strong>A.J Motorbike Spares & Accessories</strong>
        </p>
        <p>
          <span className="text-zinc-500">Mode:</span> Single shop only
        </p>
        <p>
          <span className="text-zinc-500">Currency:</span> Kenyan Shillings (KSh)
        </p>
        <p>
          <span className="text-zinc-500">Backend:</span> Firebase Auth + Cloud Firestore
        </p>
        <p className="border-t pt-2 text-xs text-zinc-400">Receipt numbers use format AJ-000001.</p>
      </div>

      {/* PWA Status */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h2 className="text-sm font-semibold text-zinc-900">Offline Support Status</h2>
        <p className="mt-2 text-xs text-blue-700">
          {swReady ? (
            <span className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Service Worker Active
            </span>
          ) : (
            <span>Loading service worker...</span>
          )}
        </p>
        <p className="mt-1 text-xs text-blue-600">
          {installed ? (
            <span className="flex items-center gap-1 text-emerald-700">
              <CheckCircle className="h-4 w-4" /> App installed and ready offline
            </span>
          ) : (
            <span>Ready to install for offline use</span>
          )}
        </p>
      </div>

      {/* Install Button Section */}
      {swReady && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="flex items-center gap-2 font-semibold text-zinc-900">
            <Download className="h-4 w-4 text-amber-600" /> Install App
          </h2>
          {installed ? (
            <p className="mt-2 text-sm text-emerald-700">
              ✓ App installed on this device. Open from your home screen or app drawer.
            </p>
          ) : canPrompt ? (
            <>
              <p className="mt-2 text-sm text-zinc-600">Install AJ Spares as a standalone app on your device. Works offline once installed.</p>
              <button
                type="button"
                onClick={install}
                disabled={installing}
                className="mt-3 w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {installing ? 'Installing…' : 'Install App'}
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm text-amber-700">
              The install button will appear when your browser is ready. You can also use your browser's menu to install.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
