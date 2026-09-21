import { useEffect, useRef } from 'react';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatCurrency } from '../../lib/utils';

async function ensurePermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function showSaleNotification(title: string, body: string) {
  if (Notification.permission !== 'granted') return;
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SHOW_SALE_NOTIFICATION',
      title,
      body,
    });
    return;
  }
  try {
    new Notification(title, { body, icon: '/favicon.svg', tag: 'aj-sale' });
  } catch {
    /* ignore */
  }
}

/** Listens for new sales and notifies this device when the app is open/installed. */
export default function SaleNotifications() {
  const { user, appUser } = useAuth();
  const ready = useRef(false);
  const seen = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user || !db) return;

    ensurePermission().then((ok) => {
      if (ok) console.info('[AJ] Notification permission granted');
    });

    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'), limit(5));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!ready.current) {
          snap.docs.forEach((d) => seen.current.add(d.id));
          ready.current = true;
          return;
        }
        snap.docChanges().forEach((change) => {
          if (change.type !== 'added') return;
          if (seen.current.has(change.doc.id)) return;
          seen.current.add(change.doc.id);
          const data = change.doc.data();
          const title = `Sale ${data.receiptNumber || ''}`;
          const body = `${data.customerName || 'Customer'} · ${formatCurrency(data.total || 0)} · ${data.paymentMethod || ''}`;
          showSaleNotification(title, body);
        });
      },
      (err) => console.warn('[AJ] sales listener', err)
    );

    return () => unsub();
  }, [user, appUser?.uid]);

  return null;
}
