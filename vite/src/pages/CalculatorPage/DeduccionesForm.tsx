import { useState } from 'react';
import type { DeductionsInput, DeductionSplitMode } from '../../lib/types';
import { SMMLV_2026, calculateSolidarityFund, calculateHealthPension } from '../../lib/deductions';
import { formatCOP } from '../../lib/rates';
import styles from './DeduccionesForm.module.css';

interface DeduccionesFormProps {
  salary: number;
  values: DeductionsInput;
  onChange: (values: DeductionsInput) => void;
  splitMode: DeductionSplitMode;
  onSplitModeChange: (mode: DeductionSplitMode) => void;
}

const MODE_LABELS: Record<DeductionSplitMode, string> = {
  even: '50/50 — Los descuentos se reparten parejo entre las dos quincenas',
  'second-fortnight': 'Segunda quincena — La primera quincena es un anticipo; todos los descuentos se aplican en la segunda',
  'first-fortnight': 'Primera quincena — Todos los descuentos se aplican en la primera quincena',
};

export function DeduccionesForm({ salary, values, onChange, splitMode, onSplitModeChange }: DeduccionesFormProps) {
  const [retefuenteOpen, setRetefuenteOpen] = useState(false);

  const solidarity = calculateSolidarityFund(salary);
  const hp = calculateHealthPension(salary);

  const updateField = <K extends keyof DeductionsInput>(
    field: K,
    value: DeductionsInput[K],
  ) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <div className={`card ${styles.deducciones}`} id="deducciones-card">
      <h2>Deducciones de ley</h2>
      <p className={styles.subtitle}>
        Deducciones mensuales obligatorias sobre tu salario. Se restan a tu devengado
        para obtener el neto a pagar.
      </p>

      {/* ── Quincena split mode ──────────────────────────── */}
      <div className={styles.splitModeSection}>
        <h3 className={styles.splitModeTitle}>Distribución quincenal de descuentos</h3>
        <p className={styles.hint}>
          Elegí cómo se distribuyen los descuentos entre la primera y segunda quincena del mes.
        </p>

        {(['even', 'second-fortnight', 'first-fortnight'] as DeductionSplitMode[]).map(mode => (
          <label key={mode} className={styles.radioOption}>
            <input
              type="radio"
              name="split-mode"
              value={mode}
              checked={splitMode === mode}
              onChange={() => onSplitModeChange(mode)}
            />
            <span>
              <strong>
                {mode === 'even'
                  ? 'Repartir parejo'
                  : mode === 'second-fortnight'
                    ? 'Aplicar todo en la segunda quincena'
                    : 'Aplicar todo en la primera quincena'}
              </strong>
              <span className={styles.hint}>{MODE_LABELS[mode]}</span>
            </span>
          </label>
        ))}
      </div>

      {/* ── 1. Salud + Pensión ────────────────────────────── */}
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={values.includeHealthPension}
          onChange={e => updateField('includeHealthPension', e.target.checked)}
        />
        <span>
          <strong>Aplicar salud (4%) y pensión (4%)</strong>
          <span className={styles.hint}>
            {salary > 0
              ? `${formatCOP(hp.health)} + ${formatCOP(hp.pension)} = ${formatCOP(hp.total)}/mes`
              : 'Ingresá tu salario para ver el cálculo'}
          </span>
        </span>
      </label>

      {/* ── 2. Fondo Solidaridad Pensional ────────────────── */}
      {salary >= 4 * SMMLV_2026 && solidarity.applies && (
        <div className={styles.infoBlock}>
          <div className={styles.infoBlockHeader}>
            <strong>Fondo de Solidaridad Pensional</strong>
            <span className={styles.badge}>Aplica</span>
          </div>
          <p className={styles.hint}>
            Aporte obligatorio del <strong>{(solidarity.percentage * 100).toFixed(1)}%</strong>{' '}
            (<strong>{formatCOP(solidarity.amount)}/mes</strong>) —{' '}
            {solidarity.range} (Art. 8 Ley 797/2003).
          </p>
          <p className={styles.hint}>
            Se descuenta automáticamente si tu salario supera los 4 SMMLV ($
            {formatCOP(4 * SMMLV_2026)}/mes).
          </p>
        </div>
      )}

      {/* ── 3. Retención en la fuente (estimado) ──────────── */}
      <div className={styles.collapsibleSection}>
        <button
          type="button"
          className={styles.collapsibleToggle}
          onClick={() => setRetefuenteOpen(!retefuenteOpen)}
          aria-expanded={retefuenteOpen}
        >
          <span>Retención en la fuente (estimado)</span>
          <span className={styles.chevron}>{retefuenteOpen ? '▲' : '▼'}</span>
        </button>

        {retefuenteOpen && (
          <div className={styles.collapsibleContent}>
            <div className={styles.alertBox}>
              <strong>⚠️ Estimado aproximado</strong>
              <p>
                El cálculo real depende de rentas exentas adicionales, deducciones
                por dependientes, intereses hipotecarios, medicina prepagada y otros
                factores que esta calculadora no considera. Verificá con RR.HH.
              </p>
            </div>

            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={values.includeRetefuente}
                onChange={e => updateField('includeRetefuente', e.target.checked)}
              />
              <span>
                <strong>Estimar retefuente</strong>
                <span className={styles.hint}>
                  Aplica si tu salario supera ~$7.2M/mes después de depuración
                </span>
              </span>
            </label>
          </div>
        )}
      </div>

      {/* ── 4. Otros descuentos ───────────────────────────── */}
      <div className={styles.otrosSection}>
        <h3>Otros descuentos</h3>
        <p className={styles.hint}>
          Ingresá montos mensuales adicionales que se descuentan de tu nómina.
        </p>

        <div className={styles.otrosGrid}>
          <div className={styles.fieldGroup}>
            <label htmlFor="ded-embargo">Embargo</label>
            <input
              type="number"
              id="ded-embargo"
              min={0}
              step={1000}
              placeholder="0"
              value={values.embargoAmount || ''}
              onChange={e =>
                updateField('embargoAmount', e.target.value === '' ? 0 : parseFloat(e.target.value))
              }
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="ded-loan">Préstamo / Libranza</label>
            <input
              type="number"
              id="ded-loan"
              min={0}
              step={1000}
              placeholder="0"
              value={values.loanAmount || ''}
              onChange={e =>
                updateField('loanAmount', e.target.value === '' ? 0 : parseFloat(e.target.value))
              }
            />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="ded-other-label">Otro descuento</label>
            <input
              type="text"
              id="ded-other-label"
              placeholder="Ej: Aporte sindical"
              maxLength={60}
              value={values.otherDeductionsLabel}
              onChange={e => updateField('otherDeductionsLabel', e.target.value)}
            />
            <input
              type="number"
              id="ded-other-amount"
              min={0}
              step={1000}
              placeholder="0"
              value={values.otherDeductions || ''}
              onChange={e =>
                updateField('otherDeductions', e.target.value === '' ? 0 : parseFloat(e.target.value))
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
