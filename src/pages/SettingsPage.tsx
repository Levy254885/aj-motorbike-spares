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
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const check = () => setCanPrompt(!!window.__ajDeferredInstall);
    check();
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.__ajDeferredInstall = e as BeforeInstallPromptEvent;
      setCanPrompt(true);
    });
  }, []);

  const install = async () => {
    const ev = window.__ajDeferredInstall;
    if (!ev) {
      setMsg('Use your browser menu: Install app / Add to Home Screen.');
      return;
    }
    await ev.prompt();
    const { outcome } = await ev.userChoice;
    setMsg(outcome === 'accepted' ? 'App installed.' : 'Install cancelled.');
    if (outcome === 'accepted') {
      window.__ajDeferredInstall = null;
      setCanPrompt(false);
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

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <h2 className="flex items-center gap-2 font-semibold text-zinc-900">
          <Download className="h-4 w-4 text-amber-600" /> Install app
        </h2>
        {installed ? (
          <p className="mt-2 text-sm text-emerald-700">This app is already installed on this device.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-zinc-700">
              Install A.J Motorbike Spares on your phone or computer for full-screen use.
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-zinc-600">
              <li><strong>Android / Chrome:</strong> Menu (⋮) → Install app</li>
              <li><strong>iPhone:</strong> Share → Add to Home Screen</li>
              <li><strong>Desktop:</strong> Install icon in the address bar</li>
            </ul>
            <button type="button" onClick={install} className="mt-3 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-zinc-950">
              {canPrompt ? 'Install now' : 'Show install tip'}
            </button>
            {msg && <p className="mt-2 text-sm text-zinc-600">{msg}</p>}
          </>
        )}
      </div>
    </div>
  );
}
