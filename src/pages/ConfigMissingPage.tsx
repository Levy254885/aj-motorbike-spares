import { AlertTriangle, ExternalLink } from 'lucide-react';

export default function ConfigMissingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-500">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Firebase not configured</h1>
            <p className="text-sm text-zinc-400">A.J Motorbike Spares & Accessories</p>
          </div>
        </div>

        <p className="text-sm text-zinc-300 mb-4">
          The app deployed successfully, but environment variables for Firebase are missing.
          Without them the page stays blank or cannot load data.
        </p>

        <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 mb-4 text-sm">
          <p className="font-medium text-amber-400 mb-2">Fix on Vercel (or your host):</p>
          <ol className="list-decimal list-inside space-y-1.5 text-zinc-300">
            <li>Open your Vercel project → Settings → Environment Variables</li>
            <li>Add these (from Firebase Console → Project settings → Your apps):</li>
          </ol>
          <ul className="mt-2 space-y-1 font-mono text-xs text-zinc-400 pl-2">
            <li>VITE_FIREBASE_API_KEY</li>
            <li>VITE_FIREBASE_AUTH_DOMAIN</li>
            <li>VITE_FIREBASE_PROJECT_ID</li>
            <li>VITE_FIREBASE_STORAGE_BUCKET</li>
            <li>VITE_FIREBASE_MESSAGING_SENDER_ID</li>
            <li>VITE_FIREBASE_APP_ID</li>
          </ul>
          <p className="mt-3 text-zinc-400">
            Then <strong className="text-white">Redeploy</strong> the project.
          </p>
        </div>

        <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 mb-4 text-sm text-zinc-300">
          <p className="font-medium text-white mb-1">After env vars are set:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Enable Email/Password in Firebase Authentication</li>
            <li>Create a user in Auth</li>
            <li>
              Create a document in Firestore collection <code className="text-amber-400">users</code> with
              document ID = the Auth UID, and fields:{' '}
              <code className="text-xs">displayName, email, role: "ADMIN", active: true</code>
            </li>
            <li>Deploy Firestore rules from this repo</li>
          </ol>
        </div>

        <p className="text-xs text-zinc-500">
          This system is for <strong className="text-zinc-400">one shop only</strong> — A.J Motorbike Spares &
          Accessories. No multi-branch mode.
        </p>

        <a
          href="https://console.firebase.google.com"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-amber-500 hover:text-amber-400"
        >
          Open Firebase Console <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
}
