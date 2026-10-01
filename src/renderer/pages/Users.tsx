import React, { useEffect, useState } from 'react';
import type { SessionUser } from '../../shared/types';
import { errorMessage, confirmDelete } from '../helpers';
import { CrudPanel } from '../components/ui';

export function UsersPanel({ user, notify }: { user: SessionUser; notify: (message: string) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>({ role: 'cashier', active: 1 });
  const refresh = () => window.aj.listUsers().then(setRows);
  useEffect(() => {
    void refresh();
  }, []);
  async function save() {
    try {
      await window.aj.saveUser({ ...editing, active: Number(editing.active ?? 1) }, user.id);
      setEditing({ role: 'cashier', active: 1 });
      await refresh();
      notify('User saved.');
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  return (
    <CrudPanel
      title="Users"
      form={
        <>
          <label>
            Username
            <input value={editing.username || ''} onChange={(e) => setEditing({ ...editing, username: e.target.value })} />
          </label>
          <label>
            Full name
            <input value={editing.fullName || ''} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} />
          </label>
          <label>
            Password
            <input type="password" value={editing.password || ''} onChange={(e) => setEditing({ ...editing, password: e.target.value })} />
          </label>
          <label>
            PIN
            <input value={editing.pin || ''} onChange={(e) => setEditing({ ...editing, pin: e.target.value })} />
          </label>
          <label>
            Role
            <select value={editing.role || 'cashier'} onChange={(e) => setEditing({ ...editing, role: e.target.value })}>
              <option value="admin">admin</option>
              <option value="cashier">cashier</option>
            </select>
          </label>
          <label>
            Active
            <select value={editing.active ?? 1} onChange={(e) => setEditing({ ...editing, active: Number(e.target.value) })}>
              <option value={1}>Yes</option>
              <option value={0}>No</option>
            </select>
          </label>
          <button className="primary" onClick={save}>
            Save user
          </button>
        </>
      }
      rows={rows}
      onEdit={(row) => setEditing({ ...row, password: '', pin: '' })}
    />
  );
}
