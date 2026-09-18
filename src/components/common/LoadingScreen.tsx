export default function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <p className="text-sm text-zinc-400">Loading A.J Motorbike Spares...</p>
      </div>
    </div>
  )
}
