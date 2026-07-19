import type { BreakdownResult } from '../../lib/types';
import { formatCOP } from '../../lib/rates';

interface TotalsPanelProps {
  result: BreakdownResult;
}

export function TotalsPanel({ result }: TotalsPanelProps) {
  return (
    <div className="totals">
      <div className="total-row">
        <span>Salario base (quincena):</span>
        <span className="monetary" id="base-pay">{formatCOP(result.basePay)}</span>
      </div>
      <div className="total-row">
        <span>Auxilio de transporte:</span>
        <span className="monetary" id="transport-display">{formatCOP(result.transport)}</span>
      </div>
      <div className="total-row">
        <span>Total recargos y extras:</span>
        <span className="monetary" id="extra-total">{formatCOP(result.extraTotal)}</span>
      </div>
      <div className="total-row total-grand">
        <span><strong>GRAN TOTAL QUINCENA:</strong></span>
        <span className="monetary" id="grand-total"><strong>{formatCOP(result.grandTotal)}</strong></span>
      </div>
    </div>
  );
}
