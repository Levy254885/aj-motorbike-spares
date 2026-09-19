export default function CustomersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-zinc-900 md:text-2xl">Customers</h1>
      <p className="text-sm text-zinc-500">
        Module scaffold ready. Connect Firebase via .env and implement against the Firestore schema in the README.
      </p>
      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
        Full implementation uses real Firestore operations — see services/ and README for data model.
      </div>
    </div>
  )
}
