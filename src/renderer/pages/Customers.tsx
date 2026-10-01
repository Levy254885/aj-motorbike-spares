import React, { useEffect, useState } from 'react';
import type { Customer, SessionUser } from '../../shared/types';
import { errorMessage, confirmDelete } from '../helpers';
import { Table } from '../components/ui';

export function CustomersPanel({ user, notify }: { user: SessionUser; notify: (message: string) => void }) {
  const [rows, setRows] = useState<Customer[]>([]);
  const [editing, setEditing] = useState<any>({});
  const [search, setSearch] = useState('');
  const refresh = () => window.aj.listCustomers(search).then(setRows);
  useEffect(() => {
    void refresh();
  }, [search]);
  async function save() {
    try {
      await window.aj.saveCustomer(editing, user.id);
      setEditing({});
      await refresh();
      notify('Customer saved.');
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  return (
    <section>
      <div className="panel form-grid">
        <input className="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers" />
        <label>
          Name
          <input value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
        </label>
        <label>
          Phone
          <input value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
        </label>
        <label>
          Email
          <input value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
        </label>
        <label>
          Notes
          <input value={editing.notes || ''} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
        </label>
        <button className="primary" onClick={save}>
          Save customer
        </button>
      </div>
      <div className="panel">
        <Table rows={rows} action={(row) => <button onClick={() => setEditing(row)}>Edit</button>} />
      </div>
    </section>
  );
}
