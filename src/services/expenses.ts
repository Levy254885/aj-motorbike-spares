import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Expense } from '../types';

function requireDb() {
  if (!db) throw new Error('Firestore is not configured');
  return db;
}

export async function listExpenses(): Promise<Expense[]> {
  const snap = await getDocs(query(collection(requireDb(), 'expenses'), orderBy('date', 'desc'), limit(200)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
}

export async function createExpense(data: {
  name: string; category: string; amount: number; date: string;
  description?: string; recordedBy: string; recordedByName: string;
}) {
  const ref = await addDoc(collection(requireDb(), 'expenses'), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}
