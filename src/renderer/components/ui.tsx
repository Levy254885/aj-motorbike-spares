import React from 'react';
import { formatCell } from '../helpers';

export function Table({ rows, action, currency }: { rows: any[]; action?: (row: any) => React.ReactNode; currency?: string }) {
  if (!rows.length) return <div className="empty">No records</div>;
  const headers = Object.keys(rows[0]).slice(0, 8);
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
            {action && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index}>
              {headers.map((header) => (
                <td key={header}>{formatCell(header, row[header], currency)}</td>
              ))}
              {action && <td className="actions">{action(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function CrudPanel({
  title,
  form,
  rows,
  onEdit,
  onDelete
}: {
  title: string;
  form: React.ReactNode;
  rows: any[];
  onEdit: (row: any) => void;
  onDelete?: (row: any) => void;
}) {
  return (
    <section>
      <div className="panel">
        <h2>{title}</h2>
        <div className="form-grid">{form}</div>
      </div>
      <div className="panel">
        <Table
          rows={rows}
          action={(row) => (
            <>
              <button onClick={() => onEdit(row)}>Edit</button>
              {onDelete && (
                <button className="danger" onClick={() => onDelete(row)}>
                  Delete
                </button>
              )}
            </>
          )}
        />
      </div>
    </section>
  );
}
