import { formatCOP } from '../../lib/rates';

interface ActualPayComparisonProps {
  grandTotal: number;
  actualPay: number;
  onActualPayChange: (value: number) => void;
}

export function ActualPayComparison({ grandTotal, actualPay, onActualPayChange }: ActualPayComparisonProps) {
  const showDiff = actualPay > 0;
  let diff: number | null = null;
  let diffClass = '';
  let diffText = '';

  if (showDiff) {
    diff = actualPay - grandTotal;

    if (diff >= 0) {
      diffClass = 'alert alert-success';
      if (diff === 0) {
        diffText = 'Coincide exactamente con lo calculado.';
      } else {
        diffText = `Te pagaron ${formatCOP(Math.abs(diff))} más de lo calculado. ¡Vas al día!`;
      }
    } else {
      diffClass = 'alert alert-danger';
      diffText = `Te deben ${formatCOP(Math.abs(diff))}. Tu empleador no te está pagando correctamente.`;
    }
  }

  return (
    <div id="comparison-section">
      <hr className="divider" />
      <h3>¿Cuánto te pagaron realmente?</h3>
      <div className="field-group">
        <input
          type="number"
          id="actual-pay"
          name="actual-pay"
          min={0}
          step={1000}
          placeholder="Ej: 1350000"
          value={actualPay || ''}
          onChange={e => {
            const val = parseFloat(e.target.value);
            onActualPayChange(isNaN(val) ? 0 : val);
          }}
        />
        <span className="field-hint">
          Ingresá lo que aparece en tu comprobante de pago para comparar.
        </span>
      </div>
      {showDiff && (
        <div id="difference-alert" className={diffClass}>
          <span id="difference-amount">{diffText}</span>
        </div>
      )}
    </div>
  );
}
