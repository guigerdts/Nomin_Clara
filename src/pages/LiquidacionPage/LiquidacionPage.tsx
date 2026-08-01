import { useState } from 'react';
import type { FormEvent } from 'react';
import { SMMLV, formatCOP, getTransportAllowance } from '../../lib/rates';
import { calculateLiquidacion, formatCOPExact } from '../../lib/liquidacion';
import type { LiquidacionResult } from '../../lib/types';
import styles from './LiquidacionPage.module.css';
import { IndemnizacionSection } from './IndemnizacionSection';
import { SuspensionSection } from './SuspensionSection';

const FULL_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Formats an ISO date (YYYY-MM-DD) as "d mes yyyy" (es-CO), e.g. "1 enero 2026". */
function formatFecha(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return `${d.getDate()} ${FULL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Fixed worked example (task 3.4): non-editable card pinned by the spec.
 * 01-ene-2026 → 31-jul-2026, salario $1.750.905 (recibe auxilio: $249.095),
 * cesantías $1.166.666,67 / intereses $81.666,67 / prima $166.666,67 /
 * vacaciones $510.680,63. Computed from the same pure module so the pinned
 * values can never drift from the formulas.
 */
const WORKED_EXAMPLE = calculateLiquidacion({
  startDate: '2026-01-01',
  endDate: '2026-07-31',
  salary: 1_750_905,
  daysTaken: 0,
});

export function LiquidacionPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salary, setSalary] = useState(0);
  const [daysTaken, setDaysTaken] = useState(0);
  const [result, setResult] = useState<LiquidacionResult | null>(null);

  const auxilio = getTransportAllowance(salary);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!startDate || !endDate || salary <= 0) return;
    setResult(calculateLiquidacion({ startDate, endDate, salary, daysTaken }));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Liquidación de prestaciones</h1>
        <p className="subtitle">
          Calculá cesantías, intereses, prima y vacaciones al terminar un contrato. Las
          fórmulas usan meses comerciales de 30 días y cada concepto cita la norma que
          lo respalda.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.column}>
          <form
            className="card"
            aria-label="Datos de la liquidación"
            noValidate
            onSubmit={handleSubmit}
          >
            <h2>Tus datos</h2>

            <div className="field-group">
              <label htmlFor="liquidacion-start">Fecha de ingreso</label>
              <input
                type="date"
                id="liquidacion-start"
                name="startDate"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
              <span className="field-hint">Primer día trabajado del contrato.</span>
            </div>

            <div className="field-group">
              <label htmlFor="liquidacion-end">Fecha de salida</label>
              <input
                type="date"
                id="liquidacion-end"
                name="endDate"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
              <span className="field-hint">Último día trabajado del contrato.</span>
            </div>

            <div className="field-group">
              <label htmlFor="liquidacion-salary">Salario mensual base</label>
              <input
                type="number"
                id="liquidacion-salary"
                name="salary"
                min={0}
                step={1000}
                placeholder="Ej: 1750905"
                value={salary || ''}
                onChange={e => setSalary(e.target.value === '' ? 0 : parseFloat(e.target.value))}
              />
              <span className="field-hint">
                Salario mensual sin auxilio de transporte ni bonificaciones.
              </span>
            </div>

            <div className="field-group">
              <label htmlFor="liquidacion-days-taken">Días de vacaciones disfrutadas</label>
              <input
                type="number"
                id="liquidacion-days-taken"
                name="daysTaken"
                min={0}
                step={1}
                placeholder="Ej: 0"
                value={daysTaken || ''}
                onChange={e =>
                  setDaysTaken(e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value)))
                }
              />
              <span className="field-hint">Días de vacaciones que ya usaste durante el contrato.</span>
            </div>

            <div className="field-group" id="transport-section">
              <label>Auxilio de transporte</label>
              <div className="transport-display">
                <span className={`badge ${auxilio > 0 ? 'badge-success' : 'badge-muted'}`}>
                  {auxilio > 0 ? 'Aplica' : 'No aplica'}
                </span>
                <span className="monetary">{formatCOP(auxilio)}</span>
                <span className="field-hint">
                  Aplica automáticamente si tu salario ≤ 2 SMMLV ({formatCOP(SMMLV * 2)}).
                </span>
              </div>
            </div>

            <hr className="divider" />

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Calcular liquidación
              </button>
            </div>
          </form>

          {result && (
            <section className={`card ${styles.results}`} aria-label="Resultado">
              <h2>Resultado</h2>

              <div className={styles.summary}>
                <p>
                  <span>Días trabajados:</span> <strong>{result.days}</strong>
                </p>
                <p>
                  <span>Días en semestre en curso:</span> <strong>{result.semesterDays}</strong>
                </p>
                <p>
                  <span>Tasa de intereses sobre cesantías:</span>{' '}
                  <strong className={styles.pct}>12%</strong>
                </p>
              </div>

              <div>
                {result.lines.map(line => (
                  <div key={line.concepto} className={styles.line}>
                    <div className={styles.lineHeader}>
                      <strong>{line.concepto}</strong>
                      <span className={`monetary ${styles.amount}`}>
                        {formatCOPExact(line.amount)}
                      </span>
                    </div>
                    <div className={styles.lineDetails}>
                      <span className={styles.formula}>{line.formula}</span>
                      <span className={styles.cita}>{line.legalRef}</span>
                    </div>
                    {line.warning && <p className="alert alert-warning">{line.warning}</p>}
                  </div>
                ))}
              </div>

              <div className={styles.totalRow}>
                <strong>Total liquidación</strong>
                <span className={`monetary ${styles.total}`}>{formatCOPExact(result.total)}</span>
              </div>
            </section>
          )}
        </div>

        <section className={`card ${styles.example}`} aria-label="Ejemplo resuelto">
          <h2>Ejemplo resuelto</h2>
          <p className={styles.exampleIntro}>
            Contrato del <strong>{formatFecha(WORKED_EXAMPLE.inputs.startDate)}</strong> al{' '}
            <strong>{formatFecha(WORKED_EXAMPLE.inputs.endDate)}</strong> con salario de{' '}
            <strong>{formatCOP(WORKED_EXAMPLE.inputs.salary)}</strong>. Ese salario recibe
            auxilio de transporte (<strong>{formatCOP(WORKED_EXAMPLE.auxilio)}</strong>).
          </p>
          <div className={styles.exampleLines}>
            {WORKED_EXAMPLE.lines.map(line => (
              <div key={line.concepto} className={styles.exampleLine}>
                <span className={styles.exampleConcept}>{line.concepto}</span>
                <span className={`monetary ${styles.amount}`}>{formatCOPExact(line.amount)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <IndemnizacionSection />
      <SuspensionSection />
    </div>
  );
}
