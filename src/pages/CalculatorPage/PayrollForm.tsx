import type { PayrollInput } from '../../lib/types';
import { getTransportAllowance, formatCOP, SMMLV } from '../../lib/rates';

interface PayrollFormProps {
  values: PayrollInput;
  alias: string;
  onAliasChange: (value: string) => void;
  onNumberChange: (field: keyof PayrollInput, value: number) => void;
  onCalculate: () => void;
  warnings: string[];
  salaryError: string;
}

const CONCEPT_FIELDS: {
  key: keyof PayrollInput;
  label: string;
  tip: string;
}[] = [
  {
    key: 'dayOT',
    label: 'Horas extra diurnas',
    tip: 'Horas extra trabajadas entre 6:00am y 7:00pm. Recargo: +25% (CST Art. 179).',
  },
  {
    key: 'nightOT',
    label: 'Horas extra nocturnas',
    tip: 'Horas extra entre 7:00pm y 6:00am. Recargo: +75% (CST Art. 179, Ley 2466).',
  },
  {
    key: 'nightSurcharge',
    label: 'Recargo nocturno (ordinario)',
    tip: 'Horas ORDINARIAS entre 7:00pm y 6:00am (no extra). Recargo: +35% (CST Art. 168).',
  },
  {
    key: 'holidayDayOT',
    label: 'H. extra diurna dom/fest',
    tip: 'Horas extra en domingo/festivo en jornada diurna. Multiplicador: ×2.15 (215%) (CST Art. 179, Ley 2466).',
  },
  {
    key: 'holidayNightOT',
    label: 'H. extra nocturna dom/fest',
    tip: 'Horas extra en domingo/festivo en jornada nocturna. Multiplicador: ×2.65 (265%) (CST Art. 179, Ley 2466).',
  },
  {
    key: 'holidayNightSurcharge',
    label: 'Recargo nocturno + festivo',
    tip: 'Horas ORDINARIAS en domingo/festivo en jornada nocturna (no extra). Recargo combinado: +125% (×2.25) (CST Art. 168, 179).',
  },
  {
    key: 'holidaySurcharge',
    label: 'Recargo dom/fest (ordinario)',
    tip: 'Horas ORDINARIAS trabajadas en domingo o festivo. Recargo: +90% (CST Art. 179).',
  },
];

function Tooltip({ tip }: { tip: string }) {
  return (
    <span className="tooltip-trigger" data-tip={tip}>
      ⓘ
    </span>
  );
}

export function PayrollForm({
  values,
  alias,
  onAliasChange,
  onNumberChange,
  onCalculate,
  warnings,
  salaryError,
}: PayrollFormProps) {
  const transport = getTransportAllowance(values.salary);

  const handleNumberChange = (field: keyof PayrollInput, raw: string) => {
    const parsed = raw === '' ? 0 : parseFloat(raw);
    onNumberChange(field, isNaN(parsed) ? 0 : parsed);
  };

  return (
    <div className="card">
      <h2>Tus datos</h2>
      <form
        id="calc-form"
        noValidate
        onSubmit={e => {
          e.preventDefault();
          onCalculate();
        }}
      >
        {/* Salario */}
        <div className="field-group">
          <label htmlFor="salary">Salario mensual base (COP)</label>
          <input
            type="number"
            id="salary"
            name="salary"
            min={0}
            step={1000}
            placeholder="Ej: 2600000"
            required
            value={values.salary || ''}
            onChange={e => handleNumberChange('salary', e.target.value)}
          />
          {salaryError && (
            <span id="salary-error" className="field-error" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>
              {salaryError}
            </span>
          )}
          <span className="field-hint">
            Tu salario mensual sin incluir auxilio de transporte ni bonificaciones.
          </span>
        </div>

        {/* Alias */}
        <div className="field-group">
          <label htmlFor="alias">Tu nombre o alias</label>
          <input
            type="text"
            id="alias"
            name="alias"
            maxLength={60}
            placeholder="Ej: María López"
            autoComplete="name"
            value={alias}
            onChange={e => onAliasChange(e.target.value)}
          />
          <span className="field-hint">Para identificar tus registros en la comparativa.</span>
        </div>

        {/* Transporte */}
        {values.salary > 0 && (
          <div className="field-group" id="transport-section">
            <label>Auxilio de transporte</label>
            <div className="transport-display">
              <span className={`badge ${transport > 0 ? 'badge-success' : 'badge-muted'}`}>
                {transport > 0 ? 'Aplica' : 'No aplica'}
              </span>
              <span className="monetary">{formatCOP(transport)}</span>
              <span className="field-hint">
                Aplica automáticamente si tu salario ≤ 2 SMMLV ({formatCOP(SMMLV * 2)}).
              </span>
            </div>
          </div>
        )}

        <hr className="divider" />

        <h3>Horas trabajadas en la quincena</h3>
        <p className="field-hint">
          Ingresá las cantidades de cada tipo de hora trabajada en los últimos 15 días.
        </p>

        <div className="hours-grid">
          {CONCEPT_FIELDS.map(field => (
            <div className="field-group" key={field.key}>
              <label htmlFor={field.key}>
                {field.label}
                <Tooltip tip={field.tip} />
              </label>
              <input
                type="number"
                id={field.key}
                name={field.key}
                min={0}
                step={0.5}
                value={(values[field.key] as number) || ''}
                placeholder="0"
                onChange={e => handleNumberChange(field.key, e.target.value)}
              />
            </div>
          ))}
        </div>

        {/* OT Warnings */}
        {warnings.length > 0 && (
          <div id="ot-warning" className="alert alert-warning">
            <strong>⚠️ Límites de horas extra</strong>
            <ul>
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            Calcular
          </button>
        </div>
      </form>
    </div>
  );
}
