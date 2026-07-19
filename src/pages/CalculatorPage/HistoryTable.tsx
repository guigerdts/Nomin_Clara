import type { SavedRecord } from '../../lib/types';
import { formatCOP } from '../../lib/rates';

interface HistoryTableProps {
  records: SavedRecord[];
  onDelete: (id: string) => void;
}

export function HistoryTable({ records, onDelete }: HistoryTableProps) {
  if (records.length === 0) return null;

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
                    onClick={() => {
                      if (confirm('¿Eliminar este registro?')) {
                        onDelete(rec.id);
                      }
                    }}
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
