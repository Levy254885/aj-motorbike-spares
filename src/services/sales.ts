import {
  collection, doc, getDoc, getDocs, query, orderBy, limit, runTransaction,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Sale, SaleItem, CartItem, PaymentMethod, Product } from '../types';
import { generateReceiptNumber } from '../lib/utils';

function requireDb() {
  if (!db) throw new Error('Firestore is not configured');
  return db;
}

async function nextReceiptNumber(): Promise<string> {
  const database = requireDb();
  const counterRef = doc(database, 'counters', 'receipts');
  const next = await runTransaction(database, async (tx) => {
    const snap = await tx.get(counterRef);
    const value = snap.exists() ? (snap.data().value || 0) + 1 : 1;
    tx.set(counterRef, { value }, { merge: true });
    return value;
  });
  return generateReceiptNumber(next);
}

export async function completeSale(params: {
  items: CartItem[];
  customerId?: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  discount: number;
  notes?: string;
  cashierId: string;
  cashierName: string;
}): Promise<Sale> {
  const { items, customerId, customerName, paymentMethod, paymentReference, discount, notes, cashierId, cashierName } = params;
  if (!items.length) throw new Error('Cart is empty');
  const database = requireDb();
  const receiptNumber = await nextReceiptNumber();

  return runTransaction(database, async (tx) => {
    const saleItems: SaleItem[] = [];
    let subtotal = 0;
    let totalCost = 0;

    for (const cart of items) {
      const productRef = doc(database, 'products', cart.product.id);
      const productSnap = await tx.get(productRef);
      if (!productSnap.exists()) throw new Error(`Product ${cart.product.name} not found`);
      const product = { id: productSnap.id, ...productSnap.data() } as Product;
      if (!product.active) throw new Error(`${product.name} is archived`);
      if (product.quantity < cart.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
      }
      const lineTotal = product.sellingPrice * cart.quantity;
      const lineCost = (product.buyingPrice || 0) * cart.quantity;
      saleItems.push({
        productId: product.id, productName: product.name, sku: product.sku,
        quantity: cart.quantity, unitPrice: product.sellingPrice, buyingPrice: product.buyingPrice || 0,
        lineTotal, lineProfit: lineTotal - lineCost,
      });
      subtotal += lineTotal;
      totalCost += lineCost;
      const newQty = product.quantity - cart.quantity;
      tx.update(productRef, { quantity: newQty, updatedAt: new Date().toISOString() });
      tx.set(doc(collection(database, 'stockMovements')), {
        productId: product.id, productName: product.name, type: 'SALE',
        quantity: cart.quantity, previousQuantity: product.quantity, newQuantity: newQty,
        userId: cashierId, userName: cashierName, reason: `Sale ${receiptNumber}`,
        referenceId: receiptNumber, referenceType: 'sale', createdAt: new Date().toISOString(),
      });
    }

    const total = Math.max(0, subtotal - (discount || 0));
    const saleData: Omit<Sale, 'id'> = {
      receiptNumber, customerId: customerId || undefined,
      customerName: customerName || 'Walk-in Customer', items: saleItems,
      subtotal, discount: discount || 0, tax: 0, total, profit: total - totalCost,
      paymentMethod, paymentReference: paymentReference || undefined, notes: notes || undefined,
      cashierId, cashierName, status: 'COMPLETED', createdAt: new Date().toISOString(),
    };
    const saleRef = doc(collection(database, 'sales'));
    tx.set(saleRef, saleData);
    return { id: saleRef.id, ...saleData } as Sale;
  });
}

export async function listSales(limitCount = 100): Promise<Sale[]> {
  const q = query(collection(requireDb(), 'sales'), orderBy('createdAt', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Sale));
}

export async function getSale(id: string): Promise<Sale | null> {
  const snap = await getDoc(doc(requireDb(), 'sales', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Sale;
}

export async function getTodaySalesStats() {
  const sales = await listSales(500);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const startIso = start.toISOString();
  const today = sales.filter((s) => s.createdAt >= startIso && s.status === 'COMPLETED');
  return {
    revenue: today.reduce((s, x) => s + x.total, 0),
    profit: today.reduce((s, x) => s + x.profit, 0),
    count: today.length,
    sales: today,
  };
}
