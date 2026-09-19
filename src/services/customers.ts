import { collection, doc, getDocs, addDoc, updateDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Customer } from '../types';

function requireDb() {
  if (!db) throw new Error('Firestore is not configured');
  return db;
}

export async function listCustomers(): Promise<Customer[]> {
  const snap = await getDocs(query(collection(requireDb(), 'customers'), orderBy('name'), limit(200)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Customer));
}

export async function createCustomer(data: { name: string; phone?: string; email?: string; location?: string; notes?: string }) {
  const ref = await addDoc(collection(requireDb(), 'customers'), {
    ...data,
    totalSpent: 0,
    transactionCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function updateCustomer(id: string, data: Partial<Customer>) {
  await updateDoc(doc(requireDb(), 'customers', id), { ...data, updatedAt: new Date().toISOString() });
}
