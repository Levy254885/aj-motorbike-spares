import { BrowserWindow } from 'electron';
import type { Settings } from '../../shared/types.js';

export function buildReceipt(data: { sale: any; items: any[] }, settings: Settings) {
  const width = 42;
  const line = '-'.repeat(width);
  const center = (text: string) => text.padStart(Math.floor((width + text.length) / 2)).padEnd(width);
  const money = (value: number) => formatCurrency(value, settings.currency);
  const rows = [
    center(settings.storeName),
    center(settings.storeAddress),
    center(settings.phone),
    line,
    `Invoice: ${data.sale.invoiceNumber}`,
    `Date: ${new Date(data.sale.createdAt).toLocaleString()}`,
    `Cashier: ${data.sale.cashierName}`,
    data.sale.customerName ? `Customer: ${data.sale.customerName}` : null,
    line,
    ...data.items.flatMap((item) => [
      item.productName,
      `${item.quantity} x ${money(item.unitPrice)} ${money(item.lineTotal).padStart(18)}`
    ]),
    line,
    `Subtotal ${money(data.sale.subtotal).padStart(31)}`,
    `Discount ${money(data.sale.discountTotal).padStart(31)}`,
    `Tax ${money(data.sale.taxTotal).padStart(36)}`,
    `TOTAL ${money(data.sale.grandTotal).padStart(34)}`,
    `Payment ${String(data.sale.paymentMethod).toUpperCase().padStart(32)}`,
    `Paid ${money(data.sale.paidAmount).padStart(35)}`,
    `Change ${money(data.sale.changeAmount).padStart(33)}`,
    line,
    center(settings.receiptFooter),
    '\n'
  ].filter((row) => row != null);
  return rows.join('\n');
}

export async function printReceipt(text: string, printerName?: string) {
  const win = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  const html = `<pre style="font-family: monospace; font-size: 12px; white-space: pre-wrap">${escapeHtml(text)}</pre>`;
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  return new Promise<boolean>((resolve) => {
    win.webContents.print({ silent: Boolean(printerName), deviceName: printerName || undefined }, (success) => {
      win.close();
      resolve(success);
    });
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&', '<': '<', '>': '>', '"': '"', "'": '&#39;' })[char]!);
}

function formatCurrency(value: number, currency: string) {
  const normalized = currency.trim().toUpperCase();
  const amount = Number(value).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (normalized === 'KES' || normalized === 'KSH') return `KES ${amount}`;
  return `${currency} ${amount}`;
}
