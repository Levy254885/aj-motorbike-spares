import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    const dismissed = sessionStorage.getItem('aj-install-dismissed');
    if (dismissed) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    const t = window.setTimeout(() => {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isIOS && !standalone) setVisible(true);
    }, 4000);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      clearTimeout(t);
    };
  }, []);

  if (isStandalone || !visible) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') setVisible(false);
      setDeferred(null);
    }
  };

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem('aj-install-dismissed', '1');
  };

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] mx-auto max-w-md rounded-xl border border-amber-200 bg-white p-4 shadow-lg md:left-auto">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-zinc-950">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900">Install A.J Motorbike Spares</p>
          <p className="mt-0.5 text-sm text-zinc-600">
            {isIOS && !deferred
              ? 'Tap Share, then “Add to Home Screen” to install this app.'
              : 'Install this app on your phone or computer for faster access and sale alerts.'}
          </p>
          <div className="mt-3 flex gap-2">
            {deferred && (
              <button type="button" onClick={install} className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-zinc-950">
                Install
              </button>
            )}
            <button type="button" onClick={dismiss} className="rounded-lg border px-3 py-1.5 text-sm text-zinc-600">
              Not now
            </button>
          </div>
        </div>
        <button type="button" onClick={dismiss} className="text-zinc-400 hover:text-zinc-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
