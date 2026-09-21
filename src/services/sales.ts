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

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

export async function completeSale(params: {
  items: CartItem[];
  customerId?: string;
  customerName: string;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  discount: number;
  notes?: string;
  amountReceived?: number;
  changeGiven?: number;
  cashierId: string;
  cashierName: string;
}): Promise<Sale> {
  const {
    items,
    customerId,
    customerName,
    paymentMethod,
    paymentReference,
    discount,
    notes,
    amountReceived,
    changeGiven,
    cashierId,
    cashierName,
  } = params;
  if (!items.length) throw new Error('Cart is empty');
  const database = requireDb();

  return runTransaction(database, async (tx) => {
    // --- ALL READS FIRST (Firestore rule) ---
    const counterRef = doc(database, 'counters', 'receipts');
    const counterSnap = await tx.get(counterRef);

    // Deduplicate product reads if same product appears twice in cart
    const uniqueIds = [...new Set(items.map((c) => c.product.id))];
    const productSnaps = new Map<
      string,
      { ref: ReturnType<typeof doc>; product: Product }
    >();

    for (const id of uniqueIds) {
      const productRef = doc(database, 'products', id);
      const productSnap = await tx.get(productRef);
      if (!productSnap.exists()) {
        throw new Error(`Product not found (${id})`);
      }
      productSnaps.set(id, {
        ref: productRef,
        product: { id: productSnap.id, ...productSnap.data() } as Product,
      });
    }

    // Validate stock (sum qty if same product multiple lines)
    const qtyNeeded = new Map<string, number>();
    for (const cart of items) {
      qtyNeeded.set(cart.product.id, (qtyNeeded.get(cart.product.id) || 0) + cart.quantity);
    }
    for (const [id, needed] of qtyNeeded) {
      const { product } = productSnaps.get(id)!;
      if (product.active === false) throw new Error(`${product.name} is archived`);
      if ((product.quantity || 0) < needed) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}`);
      }
    }

    // Build sale lines from live product prices
    const saleItems: SaleItem[] = [];
    let subtotal = 0;
    let totalCost = 0;
    for (const cart of items) {
      const { product } = productSnaps.get(cart.product.id)!;
      const lineTotal = product.sellingPrice * cart.quantity;
      const lineCost = (product.buyingPrice || 0) * cart.quantity;
      saleItems.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: cart.quantity,
        unitPrice: product.sellingPrice,
        buyingPrice: product.buyingPrice || 0,
        lineTotal,
        lineProfit: lineTotal - lineCost,
      });
      subtotal += lineTotal;
      totalCost += lineCost;
    }

    const nextCounter = counterSnap.exists() ? (counterSnap.data().value || 0) + 1 : 1;
    const receiptNumber = generateReceiptNumber(nextCounter);
    const total = Math.max(0, subtotal - (discount || 0));
    const now = new Date().toISOString();

    // --- ALL WRITES AFTER READS ---
    tx.set(counterRef, { value: nextCounter }, { merge: true });

    for (const [id, needed] of qtyNeeded) {
      const { ref, product } = productSnaps.get(id)!;
      const newQty = (product.quantity || 0) - needed;
      tx.update(ref, { quantity: newQty, updatedAt: now });
      tx.set(doc(collection(database, 'stockMovements')), {
        productId: product.id,
        productName: product.name,
        type: 'SALE',
        quantity: needed,
        previousQuantity: product.quantity || 0,
        newQuantity: newQty,
        userId: cashierId,
        userName: cashierName,
        reason: `Sale ${receiptNumber}`,
        referenceId: receiptNumber,
        referenceType: 'sale',
        createdAt: now,
      });
    }

    const saleData = stripUndefined({
      receiptNumber,
      customerId: customerId || '',
      customerName: customerName || 'Walk-in Customer',
      items: saleItems,
      subtotal,
      discount: discount || 0,
      tax: 0,
      total,
      profit: total - totalCost,
      paymentMethod,
      paymentReference: paymentReference || '',
      notes: notes || '',
      amountReceived: amountReceived ?? total,
      changeGiven: changeGiven ?? 0,
      cashierId,
      cashierName,
      status: 'COMPLETED',
      createdAt: now,
    });

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
