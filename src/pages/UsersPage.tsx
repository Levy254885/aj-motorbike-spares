export default function UsersPage() {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-bold text-zinc-900">Users & roles</h1>
      <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <p className="text-zinc-600">
          Create staff in Firebase Authentication. On first login their profile is created automatically in Firestore.
        </p>
        <ul className="list-inside list-disc space-y-1 text-zinc-700">
          <li><strong>ADMIN</strong> — full access</li>
          <li><strong>MANAGER</strong> — inventory, purchases, reports</li>
          <li><strong>CASHIER</strong> — POS and sales</li>
          <li><strong>STOREKEEPER</strong> — stock</li>
        </ul>
        <p className="border-t pt-2 text-xs text-zinc-500">
          To change a role: Firestore → users → open their document → set field <code className="rounded bg-zinc-100 px-1">role</code> to ADMIN, MANAGER, CASHIER, or STOREKEEPER.
        </p>
      </div>
    </div>
  );
}
