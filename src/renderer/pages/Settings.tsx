import React, { useEffect, useState } from 'react';
import type { SessionUser, Settings } from '../../shared/types';
import { errorMessage } from '../helpers';

export function SettingsPanel({ user, notify }: { user: SessionUser; notify: (message: string) => void }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  useEffect(() => {
    void window.aj.getSettings().then(setSettings);
  }, []);
  if (!settings) return null;
  async function save() {
    setSettings(await window.aj.saveSettings(settings, user.id));
    notify('Settings saved.');
  }
  return (
    <section className="panel form-grid">
      {Object.entries(settings).map(([key, value]) => (
        <label key={key}>
          {key}
          <input
            type={typeof value === 'number' ? 'number' : 'text'}
            value={String(value)}
            onChange={(e) =>
              setSettings({
                ...settings!,
                [key]:
                  typeof value === 'number'
                    ? Number(e.target.value)
                    : key === 'autoBackup'
                      ? e.target.value === 'true'
                      : e.target.value
              })
            }
          />
        </label>
      ))}
      <button className="primary" onClick={save}>
        Save settings
      </button>
    </section>
  );
}
