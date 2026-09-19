import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `KSh ${value.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export function formatDate(date: string | Date, pattern = 'dd MMM yyyy'): string {
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, pattern);
  } catch {
    return String(date);
  }
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, 'dd MMM yyyy, HH:mm');
}

export function getStockStatus(quantity: number, minimum: number): 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (quantity <= 0) return 'OUT_OF_STOCK';
  if (quantity <= minimum) return 'LOW_STOCK';
  return 'HEALTHY';
}

export function stockStatusColor(status: string): string {
  switch (status) {
    case 'HEALTHY':
    case 'IN_STOCK':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'LOW_STOCK':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'OUT_OF_STOCK':
      return 'text-red-700 bg-red-50 border-red-200';
    default:
      return 'text-zinc-600 bg-zinc-50 border-zinc-200';
  }
}

export function generateReceiptNumber(seq: number): string {
  return `AJ-${String(seq).padStart(6, '0')}`;
}

export function profitMargin(cost: number, selling: number): number {
  if (selling <= 0) return 0;
  return ((selling - cost) / selling) * 100;
}
