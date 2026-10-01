export function money(value: number, currency = 'KES') {
  const normalized = (currency || 'KES').trim().toUpperCase();
  const amount = Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (normalized === 'KES' || normalized === 'KSH') return `KES ${amount}`;
  return `${currency} ${amount}`;
}

export function formatCell(header: string, value: unknown, currency = 'KES') {
  if (value == null) return '';
  const isCurrency = /(sale|total|price|amount|discount|tax|profit|paid|change|refund|cash|grand|value)/i.test(header);
  if (isCurrency && typeof value === 'number') return money(value, currency);
  return String(value);
}

export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export function normalizeProduct(row: any) {
  return {
    ...row,
    categoryId: row.categoryId ? Number(row.categoryId) : null,
    purchasePrice: Number(row.purchasePrice || 0),
    sellingPrice: Number(row.sellingPrice || 0),
    stockQuantity: Number(row.stockQuantity || 0),
    lowStockThreshold: Number(row.lowStockThreshold || 0),
    active: Number(row.active ?? 1)
  };
}

export function confirmDelete(message: string) {
  return window.confirm(message);
}
