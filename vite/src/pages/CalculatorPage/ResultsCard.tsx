import type { BreakdownResult } from '../../lib/types';
import { formatCOP } from '../../lib/rates';
import { BreakdownTable } from './BreakdownTable';
import { TotalsPanel } from './TotalsPanel';
import { ActualPayComparison } from './ActualPayComparison';

interface ResultsCardProps {
  result: BreakdownResult;
  actualPay: number;
  onActualPayChange: (value: number) => void;
}

export function ResultsCard({ result, actualPay, onActualPayChange }: ResultsCardProps) {
  return (
    <div className="card" id="results-card">
      <h2>Desglose de pago</h2>

      <div className="breakdown-summary">
        <div className="summary-row">
          <span>Valor hora ordinaria:</span>
          <span className="monetary" id="hour-value-display">
            {formatCOP(result.hourValue)}
          </span>
        </div>
      </div>

      <BreakdownTable result={result} />
      <TotalsPanel result={result} />
      <ActualPayComparison
        grandTotal={result.grandTotal}
        actualPay={actualPay}
        onActualPayChange={onActualPayChange}
      />
    </div>
  );
}
