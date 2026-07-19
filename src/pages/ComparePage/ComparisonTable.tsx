import { formatCOP } from '../../lib/rates';
import type { DeductionSplitMode } from '../../lib/types';
import styles from './ComparisonTable.module.css';

interface TableRecord {
  id: string;
  alias: string;
  quincena: string;
  devengado: number;
  deducciones: number | null;
  neto: number | null;
  diferencia: number | null;
  splitMode?: DeductionSplitMode;
}

const MODE_BADGES: Record<DeductionSplitMode, string> = {
  even: '',
  'second-fortnight': '2da quincena',
  'first-fortnight': '1ra quincena',
};

type SortField = 'alias' | 'quincena' | 'devengado' | 'deducciones' | 'neto' | 'diferencia';
type SortDir = 'asc' | 'desc';

interface ComparisonTableProps {
  records: TableRecord[];
  sortField: SortField;
  sortDir: SortDir;
  onSort: (field: SortField) => void;
}

const COLUMNS: { key: SortField; label: string }[] = [
  { key: 'alias', label: 'Alias' },
  { key: 'quincena', label: 'Quincena' },
  { key: 'devengado', label: 'Devengado' },
  { key: 'deducciones', label: 'Deducciones' },
  { key: 'neto', label: 'Neto' },
  { key: 'diferencia', label: 'Diferencia' },
];

export function ComparisonTable({ records, sortField, sortDir, onSort }: ComparisonTableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table} data-testid="comparison-table">
        <thead>
          <tr>
            {COLUMNS.map(col => (
              <th
                key={col.key}
                onClick={() => onSort(col.key)}
                className={`${styles.header} ${sortField === col.key ? styles.active : ''}`}
                role="columnheader"
                aria-sort={
                  sortField === col.key
                    ? sortDir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none'
                }
                data-testid={`sort-${col.key}`}
              >
                {col.label}
                {sortField === col.key && (
                  <span className={styles.sortArrow}>
                    {sortDir === 'asc' ? ' ▲' : ' ▼'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map(record => (
            <tr key={record.id} data-testid={`record-row-${record.id}`}>
              <td>{record.alias}</td>
              <td>{record.quincena}</td>
              <td>{formatCOP(record.devengado)}</td>
              <td>
                {record.deducciones !== null
                  ? formatCOP(record.deducciones)
                  : '—'}
                {record.splitMode && record.splitMode !== 'even' && (
                  <span className={styles.modeBadge} title={`Modo: ${MODE_BADGES[record.splitMode]}`}>
                    {MODE_BADGES[record.splitMode]}
                  </span>
                )}
              </td>
              <td>
                {record.neto !== null ? formatCOP(record.neto) : '—'}
              </td>
              <td>
                {record.diferencia !== null
                  ? formatCOP(record.diferencia)
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
