import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSale } from '../services/sales';
import { formatCurrency, formatDateTime } from '../lib/utils';
import type { Sale } from '../types';

export default function SaleDetailPage() {
  const { id } = useParams();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    getSale(id)
      .then(setSale)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="h-40 animate-pulse rounded-lg bg-zinc-100" />;
  if (!sale) {
    return (
      <p className="text-zinc-500">
        Sale not found. <Link to="/sales" className="text-amber-600">Back</Link>
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-900">{sale.receiptNumber}</h1>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
        >
          Print
        </button>
      </div>
      <div className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 text-sm">
        <div className="text-center">
          <p className="font-bold text-zinc-900">A.J MOTORBIKE SPARES & ACCESSORIES</p>
          <p className="mt-1 text-xs text-zinc-500">{formatDateTime(sale.createdAt)}</p>
        </div>
        <div className="space-y-1 text-zinc-600">
          <p>Customer: {sale.customerName}</p>
          <p>Cashier: {sale.cashierName}</p>
          <p>
            Payment: {sale.paymentMethod}
            {sale.paymentReference ? ` · ${sale.paymentReference}` : ''}
          </p>
        </div>
        <div className="space-y-2 border-t border-zinc-100 pt-3">
          {sale.items.map((item, i) => (
            <div key={i} className="flex justify-between gap-2">
              <span>
                {item.productName} × {item.quantity}
              </span>
              <span className="tabular-nums">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1 border-t border-zinc-200 pt-3">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(sale.subtotal)}</span>
          </div>
          {sale.discount > 0 && (
            <div className="flex justify-between">
              <span>Discount</span>
              <span className="tabular-nums">-{formatCurrency(sale.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(sale.total)}</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>Gross profit</span>
            <span className="font-semibold tabular-nums">{formatCurrency(sale.profit)}</span>
          </div>
        </div>
        <p className="pt-2 text-center text-xs text-zinc-500">
          Thank you for shopping with A.J Motorbike Spares & Accessories.
        </p>
      </div>
      <Link to="/sales" className="text-sm text-amber-600">
        ← Back to sales
      </Link>
    </div>
  );
}
