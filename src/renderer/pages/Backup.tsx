import React from 'react';
import type { SessionUser } from '../../shared/types';
import { errorMessage } from '../helpers';

export function Backup({ user, notify }: { user: SessionUser; notify: (message: string) => void }) {
  async function doBackup() {
    try {
      const path = await window.aj.createBackup();
      notify(`Backup saved: ${path}`);
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  async function doRestore() {
    if (!window.confirm('Restore will overwrite the current database. Continue?')) return;
    try {
      const path = await window.aj.restoreBackup(user.id);
      if (path) notify(`Restored from ${path}. Restart the app if needed.`);
    } catch (error) {
      notify(errorMessage(error));
    }
  }
  return (
    <section className="panel">
      <h2>Database backup & restore</h2>
      <p className="hint">All data is stored locally in SQLite. Keep regular backups.</p>
      <div className="action-list">
        <button className="primary" onClick={doBackup}>Create backup</button>
        <button onClick={async () => { const p = await window.aj.exportDatabase(); if (p) notify(`Exported to ${p}`); }}>Export database</button>
        <button className="danger" onClick={doRestore}>Restore backup</button>
      </div>
    </section>
  );
}
