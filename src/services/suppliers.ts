import { collection, doc, getDocs, addDoc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Supplier } from '../types';

function requireDb() {
  if (!db) throw new Error('Firestore is not configured');
  return db;
}

export async function listSuppliers(): Promise<Supplier[]> {
  const snap = await getDocs(query(collection(requireDb(), 'suppliers'), orderBy('name'), limit(200)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Supplier));
}

export async function createSupplier(data: { name: string; contactPerson?: string; phone?: string; email?: string; location?: string; notes?: string }) {
  const ref = await addDoc(collection(requireDb(), 'suppliers'), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateSupplier(id: string, data: Partial<Supplier>) {
  await updateDoc(doc(requireDb(), 'suppliers', id), { ...data, updatedAt: new Date().toISOString() });
}
