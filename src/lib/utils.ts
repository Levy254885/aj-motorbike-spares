import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Product, StockStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatCurrencyDetailed(amount: number): string {
  return `KSh ${amount.toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getStockStatus(product: Pick<Product, 'quantity' | 'minimumStockLevel'>): StockStatus {
  if (product.quantity <= 0) return 'OUT_OF_STOCK';
  if (product.quantity <= product.minimumStockLevel) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export function getStockStatusColor(status: StockStatus): string {
  switch (status) {
    case 'IN_STOCK':
      return 'bg-emerald-100 text-emerald-800';
    case 'LOW_STOCK':
      return 'bg-amber-100 text-amber-800';
    case 'OUT_OF_STOCK':
      return 'bg-red-100 text-red-800';
  }
}

export function generateSku(prefix = 'AJ'): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}-${num}`;
}

export function generateReceiptNumber(): string {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `RCP-${date}-${rand}`;
}

export function profitPerUnit(buying: number, selling: number): number {
  return selling - buying;
}

export function profitMargin(buying: number, selling: number): number {
  if (selling === 0) return 0;
  return ((selling - buying) / selling) * 100;
}
