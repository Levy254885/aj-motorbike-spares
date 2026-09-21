import {
  collection, doc, getDocs, query, orderBy, limit, writeBatch, getDoc,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

function requireDb() {
  if (!db) throw new Error('Firestore is not configured');
  return db;
}

export interface Purchase {
  id: string;
  reference: string;
  supplierId: string;
  supplierName: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    unitCost: number;
    lineTotal: number;
  }[];
  total: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
}

export async function listPurchases(): Promise<Purchase[]> {
  const snap = await getDocs(
    query(collection(requireDb(), 'purchases'), orderBy('createdAt', 'desc'), limit(100))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Purchase));
}

export async function createPurchase(params: {
  supplierId: string;
  supplierName: string;
  items: { productId: string; productName: string; quantity: number; unitCost: number }[];
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  notes?: string;
  recordedBy: string;
  recordedByName: string;
}): Promise<string> {
  const database = requireDb();
  if (!params.items.length) throw new Error('Add at least one item');
  for (const it of params.items) {
    if (it.quantity <= 0) throw new Error('Quantity must be greater than 0');
  }

  const items = params.items.map((it) => ({
    ...it,
    lineTotal: it.quantity * it.unitCost,
  }));
  const total = items.reduce((s, i) => s + i.lineTotal, 0);
  const now = new Date().toISOString();
  const reference = `PO-${Date.now().toString().slice(-8)}`;

  const batch = writeBatch(database);
  const purchaseRef = doc(collection(database, 'purchases'));
  batch.set(purchaseRef, {
    reference,
    supplierId: params.supplierId || '',
    supplierName: params.supplierName || 'Supplier',
    items,
    total,
    paymentStatus: params.paymentStatus,
    notes: params.notes || '',
    recordedBy: params.recordedBy,
    recordedByName: params.recordedByName,
    createdAt: now,
  });

  for (const it of items) {
    const productRef = doc(database, 'products', it.productId);
    const snap = await getDoc(productRef);
    if (!snap.exists()) throw new Error(`Product not found: ${it.productName}`);
    const prev = (snap.data().quantity as number) || 0;
    const newQty = prev + it.quantity;
    batch.update(productRef, {
      quantity: newQty,
      buyingPrice: it.unitCost,
      updatedAt: now,
    });
    const moveRef = doc(collection(database, 'stockMovements'));
    batch.set(moveRef, {
      productId: it.productId,
      productName: it.productName,
      type: 'PURCHASE',
      quantity: it.quantity,
      previousQuantity: prev,
      newQuantity: newQty,
      userId: params.recordedBy,
      userName: params.recordedByName,
      reason: `Purchase ${reference}`,
      referenceId: reference,
      referenceType: 'purchase',
      createdAt: now,
    });
  }

  await batch.commit();
  return purchaseRef.id;
}
