import {
  collection, doc, getDoc, getDocs, addDoc, updateDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Product } from '../types';
import { getStockStatus } from '../lib/utils';

function requireDb() {
  if (!db) throw new Error('Firestore is not configured');
  return db;
}

/** Firestore rejects undefined — only keep defined values */
function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

/**
 * Load products without a composite index (where + orderBy).
 * Filter and sort on the client so Firestore does not require a custom index.
 */
export async function listProducts(opts?: { search?: string; status?: string; activeOnly?: boolean }) {
  const database = requireDb();
  const snap = await getDocs(collection(database, 'products'));
  let products = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product));

  if (opts?.activeOnly !== false) {
    products = products.filter((p) => p.active !== false);
  }

  if (opts?.search?.trim()) {
    const s = opts.search.toLowerCase();
    products = products.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(s) ||
        (p.sku || '').toLowerCase().includes(s) ||
        (p.brand || '').toLowerCase().includes(s) ||
        (p.compatibleModels || []).some((m) => m.toLowerCase().includes(s))
    );
  }

  if (opts?.status) {
    products = products.filter(
      (p) => getStockStatus(p.quantity || 0, p.minimumStockLevel || 0) === opts.status
    );
  }

  products.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));
  return products;
}

export async function getProduct(id: string): Promise<Product | null> {
  const snap = await getDoc(doc(requireDb(), 'products', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Product;
}

export async function createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
  const database = requireDb();
  const now = new Date().toISOString();
  const payload = stripUndefined({
    name: data.name,
    sku: data.sku,
    categoryId: data.categoryId || 'Other',
    categoryName: data.categoryName || data.categoryId || 'Other',
    brand: data.brand || '',
    compatibleModels: data.compatibleModels || [],
    description: data.description || '',
    buyingPrice: Number(data.buyingPrice) || 0,
    sellingPrice: Number(data.sellingPrice) || 0,
    quantity: Number(data.quantity) || 0,
    minimumStockLevel: Number(data.minimumStockLevel) || 0,
    supplierId: data.supplierId || '',
    supplierName: data.supplierName || '',
    shelfLocation: data.shelfLocation || '',
    imageUrl: data.imageUrl || '',
    active: data.active !== false,
    createdBy: data.createdBy,
    createdAt: now,
    updatedAt: now,
  });

  const ref = await addDoc(collection(database, 'products'), payload);

  if ((Number(data.quantity) || 0) > 0) {
    await addDoc(collection(database, 'stockMovements'), {
      productId: ref.id,
      productName: data.name,
      type: 'STOCK_RECEIVED',
      quantity: Number(data.quantity) || 0,
      previousQuantity: 0,
      newQuantity: Number(data.quantity) || 0,
      userId: data.createdBy || '',
      userName: '',
      reason: 'Opening stock',
      createdAt: now,
    });
  }
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>) {
  const payload = stripUndefined({
    ...(data as Record<string, unknown>),
    updatedAt: new Date().toISOString(),
  });
  delete payload.id;
  await updateDoc(
    doc(requireDb(), 'products', id),
    payload as { [key: string]: string | number | boolean | string[] | null }
  );
}

export async function adjustStock(
  productId: string,
  newQuantity: number,
  reason: string,
  userId: string,
  userName: string
) {
  const database = requireDb();
  const product = await getProduct(productId);
  if (!product) throw new Error('Product not found');
  const previous = product.quantity;
  const batch = writeBatch(database);
  batch.update(doc(database, 'products', productId), {
    quantity: newQuantity,
    updatedAt: new Date().toISOString(),
  });
  batch.set(doc(collection(database, 'stockMovements')), {
    productId,
    productName: product.name,
    type: 'STOCK_ADJUSTMENT',
    quantity: Math.abs(newQuantity - previous),
    previousQuantity: previous,
    newQuantity,
    userId,
    userName,
    reason,
    createdAt: new Date().toISOString(),
  });
  await batch.commit();
}

export async function searchProductsPOS(term: string, max = 40): Promise<Product[]> {
  const products = await listProducts({ activeOnly: true });
  if (!term.trim()) return products.slice(0, max);
  const s = term.toLowerCase();
  return products
    .filter(
      (p) =>
        (p.name || '').toLowerCase().includes(s) ||
        (p.sku || '').toLowerCase().includes(s) ||
        (p.brand || '').toLowerCase().includes(s) ||
        (p.compatibleModels || []).some((m) => m.toLowerCase().includes(s))
    )
    .slice(0, max);
}

export async function getInventoryStats() {
  const products = await listProducts({ activeOnly: true });
  let totalUnits = 0,
    costValue = 0,
    retailValue = 0,
    lowStock = 0,
    outOfStock = 0;
  for (const p of products) {
    totalUnits += p.quantity || 0;
    costValue += (p.quantity || 0) * (p.buyingPrice || 0);
    retailValue += (p.quantity || 0) * (p.sellingPrice || 0);
    if ((p.quantity || 0) <= 0) outOfStock++;
    else if ((p.quantity || 0) <= (p.minimumStockLevel || 0)) lowStock++;
  }
  return {
    totalProducts: products.length,
    totalUnits,
    costValue,
    retailValue,
    potentialProfit: retailValue - costValue,
    lowStock,
    outOfStock,
  };
}
