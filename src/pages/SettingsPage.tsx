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

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const onBip = (e: Event) => {
      e.preventDefault();
      window.__ajDeferredInstall = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    if (window.__ajDeferredInstall) setCanPrompt(true);

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
        window.__ajDeferredInstall = null;
        setCanPrompt(false);
        setInstalled(true);
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-bold text-zinc-900">Settings</h1>
      <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <p><span className="text-zinc-500">Business:</span> <strong>A.J Motorbike Spares & Accessories</strong></p>
        <p><span className="text-zinc-500">Mode:</span> Single shop only</p>
        <p><span className="text-zinc-500">Currency:</span> Kenyan Shillings (KSh)</p>
        <p><span className="text-zinc-500">Backend:</span> Firebase Auth + Cloud Firestore</p>
        <p className="border-t pt-2 text-xs text-zinc-400">Receipt numbers use format AJ-000001.</p>
      </div>

      {(installed || canPrompt) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="flex items-center gap-2 font-semibold text-zinc-900">
            <Download className="h-4 w-4 text-amber-600" /> Install app
          </h2>
          {installed ? (
            <p className="mt-2 text-sm text-emerald-700">Installed on this device.</p>
          ) : (
            <button
              type="button"
              onClick={install}
              disabled={installing}
              className="mt-3 w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-60"
            >
              {installing ? 'Installing…' : 'Install'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
