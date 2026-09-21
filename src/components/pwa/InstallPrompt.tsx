import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __ajDeferredInstall?: BeforeInstallPromptEvent | null;
  }
}

/**
 * Shows only when the browser can actually install the PWA.
 * One button: Install → opens the native install dialog.
 */
export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      window.__ajDeferredInstall = ev;
      setDeferred(ev);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    if (window.__ajDeferredInstall) {
      setDeferred(window.__ajDeferredInstall);
      setVisible(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  if (!visible || !deferred) return null;

  const install = async () => {
    if (installing) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') {
        setVisible(false);
        window.__ajDeferredInstall = null;
        setDeferred(null);
      }
    } finally {
      setInstalling(false);
    }
  };

  const dismiss = () => {
    setVisible(false);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-md rounded-xl border border-amber-300 bg-white p-4 shadow-2xl md:left-auto">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-zinc-950">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900">Install A.J Motorbike Spares</p>
          <p className="text-sm text-zinc-600">Add this app to your device</p>
        </div>
        <button type="button" onClick={dismiss} className="text-zinc-400" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
      <button
        type="button"
        onClick={install}
        disabled={installing}
        className="mt-3 w-full rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 disabled:opacity-60"
      >
        {installing ? 'Installing…' : 'Install'}
      </button>
    </div>
  );
}
