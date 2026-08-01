import { useState } from 'react';
import type { FormEvent } from 'react';
import { calculateIndemnizacion } from '../../lib/indemnizacion';
import { formatCOPExact } from '../../lib/liquidacion';
import type { IndemnizacionContractType, IndemnizacionInputs, IndemnizacionResult } from '../../lib/types';
import styles from './IndemnizacionSection.module.css';

type GateOption = 'despido-sin-justa-causa' | 'renuncia' | 'mutuo-acuerdo' | 'despido-con-justa-causa';

/** Termination gate options (REQ-1). Only the first enables Art. 64 CST. */
const GATE_OPTIONS: { value: GateOption; label: string }[] = [
  { value: 'despido-sin-justa-causa', label: 'Despido sin justa causa' },
  { value: 'renuncia', label: 'Renuncia' },
  { value: 'mutuo-acuerdo', label: 'Mutuo acuerdo' },
  { value: 'despido-con-justa-causa', label: 'Despido con justa causa comprobada' },
];

const CONTRACT_OPTIONS: { value: IndemnizacionContractType; label: string }[] = [
  { value: 'fijo', label: 'Contrato a término fijo' },
  { value: 'indefinido', label: 'Contrato a término indefinido' },
  { value: 'obra', label: 'Contrato por obra o labor' },
];

export const GATE_WARNING =
  'La indemnización por despido sin justa causa (CST Art. 64) no aplica en este caso: ' +
  'no corresponde cuando el retiro es por renuncia, mutuo acuerdo o despido con justa causa comprobada.';

export const FOOTNOTE =
  'Si tus ingresos incluyen comisiones o recargos habituales, la Corte Suprema ha reconocido ' +
  'que la base de la indemnización puede calcularse con el promedio de lo devengado en el último ' +
  'año. Esta herramienta no calcula ese ajuste.';

/** Per-type input labels shared across contract types. */
const INPUT_LABELS = {
  salary: 'Salario mensual (sin auxilio)',
  start: 'Fecha de inicio del contrato',
  dismissal: 'Fecha de despido',
} as const;

const INPUT_IDS = {
  salary: 'indemnizacion-salary',
  start: 'indemnizacion-start',
  plannedEnd: 'indemnizacion-planned-end',
  dismissal: 'indemnizacion-dismissal',
  renewals: 'indemnizacion-renewals',
} as const;

export function IndemnizacionSection() {
  const [gate, setGate] = useState<GateOption>('despido-sin-justa-causa');
  const [contractType, setContractType] = useState<IndemnizacionContractType>('fijo');
  const [salary, setSalary] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [plannedEnd, setPlannedEnd] = useState('');
  const [dismissalDate, setDismissalDate] = useState('');
  const [renewals, setRenewals] = useState(0);
  const [result, setResult] = useState<IndemnizacionResult | null>(null);

  const handleGateChange = (option: GateOption) => {
    setGate(option);
    // A non-despido gate has no Art. 64 CST right — drop any stale result.
    setResult(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (gate !== 'despido-sin-justa-causa') return;

    let inputs: IndemnizacionInputs | null = null;
    if (contractType === 'fijo') {
      if (!salary || !startDate || !plannedEnd || !dismissalDate) return;
      inputs = { type: 'fijo', salary, startDate, plannedEnd, dismissalDate, renewals };
    } else if (contractType === 'indefinido') {
      if (!salary || !startDate || !dismissalDate) return;
      inputs = { type: 'indefinido', salary, serviceStart: startDate, dismissalDate };
    } else {
      if (!salary || !startDate || !plannedEnd || !dismissalDate) return;
      inputs = { type: 'obra', salary, startDate, plannedEnd, dismissalDate };
    }

    setResult(calculateIndemnizacion(inputs));
  };

  return (
    <section className={`card ${styles.section}`} aria-label="Indemnización por despido">
      <h2>Indemnización por despido sin justa causa</h2>
      <p className="subtitle">
        Corresponde solo cuando el empleador te despide sin justa causa (CST Art. 64). Elegí el
        motivo del retiro: si no es despido sin justa causa, no hay lugar a esta indemnización.
      </p>

      <fieldset className={styles.gateGroup}>
        <legend className={styles.gateTitle}>Motivo del retiro</legend>
        {GATE_OPTIONS.map(option => (
          <label key={option.value} className={styles.radioOption}>
            <input
              type="radio"
              name="gate"
              value={option.value}
              checked={gate === option.value}
              onChange={() => handleGateChange(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </fieldset>

      {gate !== 'despido-sin-justa-causa' && (
        <p role="alert" className="alert alert-warning">
          {GATE_WARNING}
        </p>
      )}

      {gate === 'despido-sin-justa-causa' && (
        <form noValidate onSubmit={handleSubmit}>
          <fieldset className={styles.gateGroup}>
            <legend className={styles.gateTitle}>Tipo de contrato</legend>
            {CONTRACT_OPTIONS.map(option => (
              <label key={option.value} className={styles.radioOption}>
                <input
                  type="radio"
                  name="contract-type"
                  value={option.value}
                  checked={contractType === option.value}
                  onChange={() => setContractType(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </fieldset>

          <div className="field-group">
            <label htmlFor={INPUT_IDS.salary}>{INPUT_LABELS.salary}</label>
            <input
              type="number"
              id={INPUT_IDS.salary}
              name="salary"
              min={0}
              step={1000}
              placeholder="Ej: 1800000"
              value={salary || ''}
              onChange={e => setSalary(e.target.value === '' ? 0 : parseFloat(e.target.value))}
            />
            <span className="field-hint">Salario mensual sin auxilio de transporte ni bonificaciones.</span>
          </div>

          <div className="field-group">
            <label htmlFor={INPUT_IDS.start}>{INPUT_LABELS.start}</label>
            <input
              type="date"
              id={INPUT_IDS.start}
              name="startDate"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          {contractType !== 'indefinido' && (
            <div className="field-group">
              <label htmlFor={INPUT_IDS.plannedEnd}>
                {contractType === 'obra' ? 'Fecha de fin estimada' : 'Fecha de vencimiento pactada'}
              </label>
              <input
                type="date"
                id={INPUT_IDS.plannedEnd}
                name="plannedEnd"
                value={plannedEnd}
                onChange={e => setPlannedEnd(e.target.value)}
              />
            </div>
          )}

          <div className="field-group">
            <label htmlFor={INPUT_IDS.dismissal}>{INPUT_LABELS.dismissal}</label>
            <input
              type="date"
              id={INPUT_IDS.dismissal}
              name="dismissalDate"
              value={dismissalDate}
              onChange={e => setDismissalDate(e.target.value)}
            />
          </div>

          {contractType === 'fijo' && (
            <div className="field-group">
              <label htmlFor={INPUT_IDS.renewals}>Renovaciones (prórrogas)</label>
              <input
                type="number"
                id={INPUT_IDS.renewals}
                name="renewals"
                min={0}
                step={1}
                placeholder="Ej: 0"
                value={renewals || ''}
                onChange={e =>
                  setRenewals(e.target.value === '' ? 0 : Math.max(0, Math.floor(parseFloat(e.target.value))))
                }
              />
              <span className="field-hint">
                Cuántas veces se prorrogó el contrato antes de este despido.
              </span>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              Calcular indemnización
            </button>
          </div>
        </form>
      )}

      {result && (
        <section className={`card ${styles.results}`} aria-label="Cálculo de la indemnización">
          <h2>Resultado</h2>

          <div>
            {result.lines.map(line => (
              <div key={line.concepto} className={styles.line}>
                <div className={styles.lineHeader}>
                  <strong>{line.concepto}</strong>
                  <span className={`monetary ${styles.amount}`}>{formatCOPExact(line.amount)}</span>
                </div>
                <div className={styles.lineDetails}>
                  <span className={styles.formula}>{line.formula}</span>
                  <span className={styles.cita}>{line.legalRef}</span>
                </div>
                {line.warning && <p className="alert alert-warning">{line.warning}</p>}
              </div>
            ))}
          </div>

          {result.notices.length > 0 && (
            <div className={styles.notices}>
              {result.notices.map(notice => (
                <p key={notice.text} className={`alert alert-warning ${styles.notice}`}>
                  <strong>{notice.text}</strong> <span className={styles.cita}>{notice.legalRef}</span>
                </p>
              ))}
            </div>
          )}

          <div className={styles.totalRow}>
            <strong>Total indemnización</strong>
            <span className={`monetary ${styles.total}`}>{formatCOPExact(result.total)}</span>
          </div>
        </section>
      )}

      <p className={`field-hint ${styles.footnote}`}>{FOOTNOTE}</p>
    </section>
  );
}
