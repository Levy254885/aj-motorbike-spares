import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    // Check if prompt was already captured
    if (window.__ajDeferredInstall) {
      setDeferredPrompt(window.__ajDeferredInstall);
      setCanPrompt(true);
    }

    // Capture the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      window.__ajDeferredInstall = event;
      setDeferredPrompt(event);
      setCanPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installation
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setCanPrompt(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt || installing) return;
    
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        setCanPrompt(false);
        setDeferredPrompt(null);
      }
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

      {/* Install App Button */}
      {!installed && canPrompt && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <button
            type="button"
            onClick={handleInstall}
            disabled={installing}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-zinc-950 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="h-5 w-5" />
            {installing ? 'Installing…' : 'Install App'}
          </button>
        </div>
      )}

      {/* Installed Status */}
      {installed && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-center text-sm font-semibold text-green-700">✓ App installed successfully</p>
        </div>
      )}
    </div>
  );
}
