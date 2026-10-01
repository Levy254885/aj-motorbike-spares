import React, { useEffect, useState } from 'react';
import type { Category, Product, SessionUser } from '../../shared/types';
import { errorMessage, normalizeProduct, confirmDelete } from '../helpers';
import { Table, CrudPanel } from '../components/ui';

function ProductForm({
  value,
  setValue,
  categories,
  onSave
}: {
  value: any;
  setValue: (v: any) => void;
  categories: Category[];
  onSave: () => void;
}) {
  return (
    <>
      <label>
        Name
        <input value={value.name || ''} onChange={(e) => setValue({ ...value, name: e.target.value })} />
      </label>
      <label>
        SKU
        <input value={value.sku || ''} onChange={(e) => setValue({ ...value, sku: e.target.value })} />
      </label>
      <label>
        Barcode
        <input value={value.barcode || ''} onChange={(e) => setValue({ ...value, barcode: e.target.value })} />
      </label>
      <label>
        Category
        <select value={value.categoryId ?? ''} onChange={(e) => setValue({ ...value, categoryId: e.target.value ? Number(e.target.value) : null })}>
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Buy price
        <input type="number" value={value.purchasePrice ?? 0} onChange={(e) => setValue({ ...value, purchasePrice: Number(e.target.value) })} />
      </label>
      <label>
        Sell price
        <input type="number" value={value.sellingPrice ?? 0} onChange={(e) => setValue({ ...value, sellingPrice: Number(e.target.value) })} />
      </label>
      <label>
        Stock
        <input type="number" value={value.stockQuantity ?? 0} onChange={(e) => setValue({ ...value, stockQuantity: Number(e.target.value) })} />
      </label>
      <label>
        Low threshold
        <input
          type="number"
          value={value.lowStockThreshold ?? 5}
          onChange={(e) => setValue({ ...value, lowStockThreshold: Number(e.target.value) })}
        />
      </label>
      <button className="primary" onClick={onSave}>
        Save product
      </button>
    </>
  );
}


export function Products({ user, notify }: { user: SessionUser; notify: (message: string) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<any>({});
  const refresh = () =>
    Promise.all([window.aj.listProducts('', true).then(setProducts), window.aj.listCategories().then(setCategories)]);
  useEffect(() => {
    void refresh();
  }, []);
  async function save() {
    try {
      await window.aj.saveProduct(normalizeProduct(editing), user.id);
      setEditing({});
      await refresh();
      notify('Product saved.');
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  return (
    <CrudPanel
      title="Product Management"
      form={<ProductForm value={editing} setValue={setEditing} categories={categories} onSave={save} />}
      rows={products}
      onEdit={setEditing}
      onDelete={async (row) => {
        if (confirmDelete('Deactivate product?')) {
          await window.aj.deleteProduct(row.id, user.id);
          await refresh();
        }
      }}
    />
  );
}
