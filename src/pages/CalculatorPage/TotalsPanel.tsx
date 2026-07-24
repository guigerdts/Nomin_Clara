import type { BreakdownResult, DeductionsBreakdown, DeductionSplitMode } from '../../lib/types';
import { formatCOP } from '../../lib/rates';
import { calculateNetPay, quincenaShare } from '../../lib/deductions';

const MODE_SUBTITLES: Record<DeductionSplitMode, string> = {
  even: 'Mitad por quincena',
  'second-fortnight': 'Todos los descuentos en la segunda quincena',
  'first-fortnight': 'Todos los descuentos en la primera quincena',
};

interface TotalsPanelProps {
  result: BreakdownResult;
  deductions: DeductionsBreakdown | null;
  splitMode: DeductionSplitMode;
}

export function TotalsPanel({ result, deductions, splitMode }: TotalsPanelProps) {
  const netCalc = deductions ? calculateNetPay(result.grandTotal, deductions, splitMode) : null;

  return (
    <div className="totals">
      {/* ── Devengado ────────────────────────────────── */}
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
        <span><strong>TOTAL DEVENGADO:</strong></span>
        <span className="monetary" id="grand-total"><strong>{formatCOP(result.grandTotal)}</strong></span>
      </div>

      {/* ── Deducciones ──────────────────────────────── */}
      {deductions && netCalc && netCalc.quincenaDeductions > 0 && (
        <>
          <hr className="divider" />
          <h4 style={{ margin: 'var(--space-2) 0 var(--space-1)' }}>Deducciones</h4>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: '0 0 var(--space-2)' }}>
            Modo: {MODE_SUBTITLES[splitMode]}
          </p>
          {deductions.items.map((item, i) => (
            <div className="total-row" key={i}>
              <span>
                {item.label}
                {item.legalRef && (
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                    {' '}({item.legalRef})
                  </span>
                )}
              </span>
              <span className="monetary" style={{ color: 'var(--color-danger)' }}>
                -{formatCOP(quincenaShare(item.amount, splitMode))}
              </span>
            </div>
          ))}

          {/* Total deducciones quincena */}
          <div className="total-row" style={{ fontWeight: 600 }}>
            <span>Total deducciones (quincena):</span>
            <span className="monetary" style={{ color: 'var(--color-danger)' }}>
              -{formatCOP(netCalc.quincenaDeductions)}
            </span>
          </div>
        </>
      )}

      {/* ── Neto a pagar ─────────────────────────────── */}
      {deductions && netCalc && (
        <div
          className="total-row"
          style={{
            marginTop: 'var(--space-2)',
            padding: 'var(--space-2)',
          background: 'var(--color-primary)',
          color: '#fff',
          borderRadius: 'var(--radius-md)',
          }}
        >
          <span style={{ fontSize: '1.1rem' }}><strong>NETO A PAGAR:</strong></span>
          <span className="monetary" id="net-pay" style={{ fontSize: '1.1rem' }}>
            <strong>{formatCOP(netCalc.netPay)}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
