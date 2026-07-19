import { useState, useEffect, useCallback } from 'react';
import type { SavedRecord, DeductionSplitMode } from '../../lib/types';
import { getAllRecords } from '../../lib/storage';
import { computeDeductions, calculateNetPay } from '../../lib/deductions';
import { ImportSection } from './ImportSection';
import { ComparisonTable } from './ComparisonTable';
import { ComparisonChart } from './ComparisonChart';
import styles from './ComparePage.module.css';

export interface TableRecord {
  id: string;
  alias: string;
  quincena: string;
  devengado: number;
  deducciones: number | null;
  neto: number | null;
  diferencia: number | null;
  splitMode?: DeductionSplitMode;
}

export type SortField = 'alias' | 'quincena' | 'devengado' | 'deducciones' | 'neto' | 'diferencia';
export type SortDir = 'asc' | 'desc';

function computeRecordNeto(record: SavedRecord): Pick<TableRecord, 'devengado' | 'deducciones' | 'neto'> {
  const devengado = record.totalCalculated;

  if (!record.deductionsInput || !record.splitMode) {
    return { devengado, deducciones: null, neto: null };
  }

  const deductions = computeDeductions(record.salary, record.deductionsInput);
  const { netPay, quincenaDeductions } = calculateNetPay(devengado, deductions, record.splitMode);
  return { devengado, deducciones: quincenaDeductions, neto: netPay };
}

export function ComparePage() {
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [sortField, setSortField] = useState<SortField>('alias');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const loadRecords = useCallback(() => {
    setRecords(getAllRecords());
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const tableRecords: TableRecord[] = records.map(record => {
    const computed = computeRecordNeto(record);
    return {
      id: record.id,
      alias: record.alias,
      quincena: record.quincena,
      ...computed,
      diferencia: record.difference,
      splitMode: record.splitMode ?? undefined,
    };
  });

  const handleSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
        return prev;
      }
      setSortDir('asc');
      return field;
    });
  }, []);

  const sortedRecords = [...tableRecords].sort((a, b) => {
    let cmp = 0;
    switch (sortField) {
      case 'alias':
      case 'quincena':
        cmp = a[sortField].localeCompare(b[sortField]);
        break;
      case 'devengado':
      case 'deducciones':
      case 'neto':
      case 'diferencia': {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal == null && bVal == null) cmp = 0;
        else if (aVal == null) cmp = 1;
        else if (bVal == null) cmp = -1;
        else cmp = aVal - bVal;
        break;
      }
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  return (
    <div>
      <div className="page-header">
        <h1>Comparar Registros</h1>
        <p className="subtitle">
          Compará registros de nómina guardados e importados.
        </p>
      </div>

      <ImportSection onImportComplete={loadRecords} />

      {sortedRecords.length === 0 ? (
        <p className={styles.emptyState}>
          No hay registros para comparar. Guardá o importá registros primero.
        </p>
      ) : (
        <>
          <ComparisonTable
            records={sortedRecords}
            sortField={sortField}
            sortDir={sortDir}
            onSort={handleSort}
          />
          <ComparisonChart records={sortedRecords} />
        </>
      )}
    </div>
  );
}
