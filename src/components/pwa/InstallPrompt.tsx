import { useEffect, useState } from 'react';
import { Download, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface Window {
    __ajDeferredInstall?: BeforeInstallPromptEvent | null;
  }
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      const ev = e as BeforeInstallPromptEvent;
      window.__ajDeferredInstall = ev;
      setDeferred(ev);
    };
    window.addEventListener('beforeinstallprompt', onBip);
    if (window.__ajDeferredInstall) setDeferred(window.__ajDeferredInstall);

    const dismissed = localStorage.getItem('aj-install-dismissed');
    const dismissedAt = dismissed ? Number(dismissed) : 0;
    const week = 7 * 24 * 60 * 60 * 1000;
    if (!dismissedAt || Date.now() - dismissedAt > week) {
      const t = window.setTimeout(() => setVisible(true), 2500);
      return () => {
        window.removeEventListener('beforeinstallprompt', onBip);
        clearTimeout(t);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  if (isStandalone || !visible) return null;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isAndroid = /android/i.test(navigator.userAgent);

  const install = async () => {
    const ev = deferred || window.__ajDeferredInstall;
    if (ev) {
      await ev.prompt();
      const choice = await ev.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
        window.__ajDeferredInstall = null;
        setDeferred(null);
      }
      return;
    }
    setShowHelp(true);
  };

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem('aj-install-dismissed', String(Date.now()));
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-md rounded-xl border border-amber-300 bg-white p-4 shadow-2xl md:left-auto">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-zinc-950">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900">Install A.J Motorbike Spares</p>
          <p className="mt-0.5 text-sm text-zinc-600">
            {isIOS
              ? 'Add this app to your Home Screen for full-screen use and faster access.'
              : 'Install the app on this device for offline access and a full-screen experience.'}
          </p>
          {showHelp && (
            <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-700">
              {isIOS ? (
                <ol className="list-decimal space-y-1 pl-4">
                  <li>Tap the Share button</li>
                  <li>Scroll and tap <strong>Add to Home Screen</strong></li>
                  <li>Tap <strong>Add</strong></li>
                </ol>
              ) : isAndroid ? (
                <ol className="list-decimal space-y-1 pl-4">
                  <li>Tap the browser menu (⋮)</li>
                  <li>Tap <strong>Install app</strong> or <strong>Add to Home screen</strong></li>
                </ol>
              ) : (
                <ol className="list-decimal space-y-1 pl-4">
                  <li>Look for the install icon in the address bar</li>
                  <li>Or open browser menu → <strong>Install A.J Motorbike Spares</strong></li>
                </ol>
              )}
            </div>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={install} className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-950">
              {deferred ? 'Install' : 'How to install'}
            </button>
            <button type="button" onClick={dismiss} className="rounded-lg border px-3 py-1.5 text-sm text-zinc-600">
              Not now
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="text-zinc-400 hover:text-zinc-600" aria-label="Close">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
