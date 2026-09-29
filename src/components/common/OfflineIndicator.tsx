import { useEffect, useState, ReactNode } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { isCurrentlyOnline } from '../lib/syncManager';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(isCurrentlyOnline());

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 shadow-md">
      <WifiOff className="h-4 w-4" />
      <span>Working offline - changes will sync when online</span>
    </div>
  );
}

export function OnlineBadge() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(isCurrentlyOnline());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="flex items-center gap-1">
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-emerald-600" />
          <span className="text-xs text-emerald-600">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-amber-600" />
          <span className="text-xs text-amber-600">Offline</span>
        </>
      )}
    </div>
  );
}
