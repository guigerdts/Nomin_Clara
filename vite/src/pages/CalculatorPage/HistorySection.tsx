import type { SavedRecord } from '../../lib/types';
import { EvolutionChart } from './EvolutionChart';
import { HistoryTable } from './HistoryTable';

interface HistorySectionProps {
  records: SavedRecord[];
  allRecords: SavedRecord[];
  alias: string;
  onDelete: (id: string) => void;
}

export function HistorySection({ records, allRecords, alias, onDelete }: HistorySectionProps) {
  const hasRecords = allRecords.length > 0;

  return (
    <div className="card" id="history-card" style={{ marginTop: 'var(--space-6)' }}>
      <h2>Historial de quincenas</h2>

      {!hasRecords && (
        <div id="history-empty" className="empty-state">
          <p>
            Todavía no hay registros guardados. Calculá tu nómina y guardala para ver el historial.
          </p>
        </div>
      )}

      {hasRecords && (
        <div id="history-table">
          <EvolutionChart records={allRecords} alias={alias} />
          <HistoryTable records={records} onDelete={onDelete} />
        </div>
      )}
    </div>
  );
}
