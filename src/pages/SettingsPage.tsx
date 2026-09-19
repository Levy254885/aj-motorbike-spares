export default function SettingsPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold text-zinc-900">Settings</h1>
      <div className="space-y-2 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <p><span className="text-zinc-500">Business:</span> <strong>A.J Motorbike Spares & Accessories</strong></p>
        <p><span className="text-zinc-500">Mode:</span> Single shop only</p>
        <p><span className="text-zinc-500">Currency:</span> Kenyan Shillings (KSh)</p>
        <p><span className="text-zinc-500">Backend:</span> Firebase Auth + Cloud Firestore</p>
        <p className="border-t pt-2 text-xs text-zinc-400">Receipt numbers use format AJ-000001.</p>
      </div>
    </div>
  );
}
