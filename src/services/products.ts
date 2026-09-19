import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy, limit, writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Product } from '../types';
import { getStockStatus } from '../lib/utils';

function requireDb() {
  if (!db) throw new Error('Firestore is not configured');
  return db;
}

export async function listProducts(opts?: { search?: string; status?: string; activeOnly?: boolean }) {
  const database = requireDb();
  const q = query(collection(database, 'products'), where('active', '==', opts?.activeOnly !== false), orderBy('name'), limit(300));
  const snap = await getDocs(q);
  let products = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));
  if (opts?.search?.trim()) {
    const s = opts.search.toLowerCase();
    products = products.filter((p) =>
      p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) ||
      (p.brand || '').toLowerCase().includes(s) ||
      (p.compatibleModels || []).some((m) => m.toLowerCase().includes(s))
    );
  }
  if (opts?.status) {
    products = products.filter((p) => getStockStatus(p.quantity, p.minimumStockLevel) === opts.status);
  }
  return products;
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(requireDb(), 'products', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const database = requireDb();
  const ref = await addDoc(collection(database, 'products'), {
    ...data,
    compatibleModels: data.compatibleModels || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  if (data.quantity > 0) {
    await addDoc(collection(database, 'stockMovements'), {
      productId: ref.id, productName: data.name, type: 'STOCK_RECEIVED',
      quantity: data.quantity, previousQuantity: 0, newQuantity: data.quantity,
      userId: data.createdBy, userName: '', reason: 'Opening stock',
      createdAt: new Date().toISOString(),
    });
  }
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>) {
  await updateDoc(doc(requireDb(), 'products', id), { ...data, updatedAt: new Date().toISOString() });
}

export async function adjustStock(productId: string, newQuantity: number, reason: string, userId: string, userName: string) {
  const database = requireDb();
  const product = await getProduct(productId);
  if (!product) throw new Error('Product not found');
  const previous = product.quantity;
  const batch = writeBatch(database);
  batch.update(doc(database, 'products', productId), { quantity: newQuantity, updatedAt: new Date().toISOString() });
  batch.set(doc(collection(database, 'stockMovements')), {
    productId, productName: product.name, type: 'STOCK_ADJUSTMENT',
    quantity: Math.abs(newQuantity - previous), previousQuantity: previous, newQuantity,
    userId, userName, reason, createdAt: new Date().toISOString(),
  });
  await batch.commit();
}

export async function searchProductsPOS(term: string, max = 40): Promise<Product[]> {
  const products = await listProducts({ activeOnly: true });
  if (!term.trim()) return products.slice(0, max);
  const s = term.toLowerCase();
  return products.filter((p) =>
    p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) ||
    (p.brand || '').toLowerCase().includes(s) ||
    (p.compatibleModels || []).some((m) => m.toLowerCase().includes(s))
  ).slice(0, max);
}

export async function getInventoryStats() {
  const products = await listProducts({ activeOnly: true });
  let totalUnits = 0, costValue = 0, retailValue = 0, lowStock = 0, outOfStock = 0;
  for (const p of products) {
    totalUnits += p.quantity;
    costValue += p.quantity * (p.buyingPrice || 0);
    retailValue += p.quantity * (p.sellingPrice || 0);
    if (p.quantity <= 0) outOfStock++;
    else if (p.quantity <= p.minimumStockLevel) lowStock++;
  }
  return { totalProducts: products.length, totalUnits, costValue, retailValue, potentialProfit: retailValue - costValue, lowStock, outOfStock };
}
