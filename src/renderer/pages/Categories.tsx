import React, { useEffect, useState } from 'react';
import type { Category, SessionUser } from '../../shared/types';
import { errorMessage, confirmDelete } from '../helpers';
import { CrudPanel } from '../components/ui';

export function Categories({ user, notify }: { user: SessionUser; notify: (message: string) => void }) {
  const [rows, setRows] = useState<Category[]>([]);
  const [editing, setEditing] = useState<any>({});
  const refresh = () => window.aj.listCategories().then(setRows);
  useEffect(() => {
    void refresh();
  }, []);
  async function save() {
    try {
      await window.aj.saveCategory({ ...editing, active: Number(editing.active ?? 1) }, user.id);
      setEditing({});
      await refresh();
      notify('Category saved.');
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  return (
    <CrudPanel
      title="Category Management"
      form={
        <>
          <label>
            Name
            <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          </label>
          <label>
            Description
            <input value={editing.description || ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
          </label>
          <button className="primary" onClick={save}>
            Save category
          </button>
        </>
      }
      rows={rows}
      onEdit={setEditing}
      onDelete={async (row) => {
        if (confirmDelete('Delete category?')) {
          try {
            await window.aj.deleteCategory(row.id, user.id);
            await refresh();
          } catch (error) {
            notify(errorMessage(error));
          }
        }
      }}
    />
  );
}
