import type { BreakdownResult, DeductionsBreakdown, DeductionSplitMode } from '../../lib/types';
import { formatCOP } from '../../lib/rates';
import { calculateNetPay } from '../../lib/deductions';
import { BreakdownTable } from './BreakdownTable';
import { TotalsPanel } from './TotalsPanel';
import { ActualPayComparison } from './ActualPayComparison';

interface ResultsCardProps {
  result: BreakdownResult;
  deductions: DeductionsBreakdown | null;
  actualPay: number;
  onActualPayChange: (value: number) => void;
  splitMode: DeductionSplitMode;
}

export function ResultsCard({ result, deductions, actualPay, onActualPayChange, splitMode }: ResultsCardProps) {
  const netCalc = deductions ? calculateNetPay(result.grandTotal, deductions, splitMode) : null;
  const referenceTotal = deductions && netCalc ? netCalc.netPay : result.grandTotal;
  const referenceLabel = deductions && netCalc ? 'Neto a pagar' : 'Total devengado';

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
      <TotalsPanel result={result} deductions={deductions} splitMode={splitMode} />
      <ActualPayComparison
        referenceTotal={referenceTotal}
        referenceLabel={referenceLabel}
        actualPay={actualPay}
        onActualPayChange={onActualPayChange}
      />
    </div>
  );
}
