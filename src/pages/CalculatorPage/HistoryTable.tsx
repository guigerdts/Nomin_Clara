import { useState } from 'react';
import type { SavedRecord } from '../../lib/types';
import { formatCOP } from '../../lib/rates';

interface HistoryTableProps {
  records: SavedRecord[];
  onDelete: (id: string) => void;
}

export function HistoryTable({ records, onDelete }: HistoryTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  if (records.length === 0) return null;

  const confirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="table-wrapper">
      <table className="history-table">
        <thead>
          <tr>
            <th>Quincena</th>
            <th>Nombre</th>
            <th className="text-right">Salario</th>
            <th className="text-right">Calculado</th>
            <th className="text-right">Pagado</th>
            <th className="text-right">Diferencia</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="history-body">
          {records.map(rec => {
            const diff = rec.difference;
            const diffClass = diff === null ? '' : diff >= 0 ? 'text-success' : 'text-danger';
            return (
              <tr key={rec.id}>
                <td>{rec.quincena}</td>
                <td>{rec.alias}</td>
                <td className="text-right monetary">{formatCOP(rec.salary)}</td>
                <td className="text-right monetary">{formatCOP(rec.totalCalculated)}</td>
                <td className="text-right monetary">
                  {rec.totalActual != null ? formatCOP(rec.totalActual) : '-'}
                </td>
                <td className={`text-right monetary ${diffClass}`}>
                  {diff !== null ? formatCOP(diff) : '-'}
                </td>
                <td>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => setDeleteTarget(rec.id)}
                    aria-label={`Eliminar registro de ${rec.alias} (${rec.quincena})`}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Delete confirmation dialog */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{
              background: 'var(--color-surface, #fff)',
              borderRadius: 'var(--radius-xl, 16px)',
              padding: 'var(--space-6, 2rem)',
              maxWidth: '380px',
              width: '90%',
              boxShadow: 'var(--shadow-xl, 0 8px 32px rgba(0,0,0,0.12))',
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3 id="delete-dialog-title" style={{ margin: '0 0 var(--space-2, 0.5rem)', fontSize: '1.125rem' }}>
              ¿Eliminar este registro?
            </h3>
            <p id="delete-dialog-desc" style={{ margin: '0 0 var(--space-4, 1rem)', color: 'var(--color-text-secondary, #666)', fontSize: '0.875rem' }}>
              Esta acción no se puede deshacer. El registro se borrará permanentemente.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeleteTarget(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                autoFocus
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
