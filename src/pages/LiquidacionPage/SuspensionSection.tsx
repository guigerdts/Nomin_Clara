import { useState } from 'react';
import type { FormEvent } from 'react';
import {
  CAUSALES,
  buildChecklist,
  getDisciplinaryThreshold,
  getDurationDays,
  isValidPeriod,
  shouldShowExcessWarning,
} from '../../lib/suspension';
import type { SuspensionCausal, SuspensionRecord, SuspensionStore } from '../../lib/types';
import styles from './SuspensionSection.module.css';

/**
 * Suspensión del contrato de trabajo (CST Arts. 51 y 53) — educational +
 * tracking section (REQ-1..6). No peso calculation, no liquidacion.ts
 * integration (proposal contract). Persistence mirrors useDraftQuincena
 * (lazy-load try/catch, persist on mutation) under `nomina-clara-suspensiones`.
 */

/** localStorage persistence key (REQ-4 / D3). */
export const STORAGE_KEY = 'nomina-clara-suspensiones';

/** Loads the store defensively: corrupted JSON or version mismatch → empty (D3). */
export function loadSuspensionStore(): SuspensionStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SuspensionStore;
      if (parsed && parsed.version === 1 && Array.isArray(parsed.records)) return parsed;
    }
  } catch {
    // Corrupted data — ignore
  }
  return { version: 1, records: [] };
}

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const FULL_MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/** Formats an ISO date (YYYY-MM-DD) as "d mes yyyy" (es-CO). */
function formatDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return `${d.getDate()} ${FULL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Art. 112 CST excess warning text for a disciplinary record (REQ-6 / D2).
 * Returns null when the limit is NOT exceeded (exactly 8/60 días never warn).
 */
export function buildExcessWarning(record: SuspensionRecord): string | null {
  if (!shouldShowExcessWarning(record)) return null;
  const threshold = getDisciplinaryThreshold(record.isFirstDisciplinary ?? true);
  const kind = record.isFirstDisciplinary === false ? 'reincidencia' : 'la primera suspensión';
  return `Esta suspensión disciplinaria excede el límite de ${threshold} días del Art. 112 CST (${kind}).`;
}

/**
 * CSJ fundamento for the prima/intereses rows (REQ-2). Verified citation pinned
 * from the product brief: Art. 53 CST list is taxative, so no other concept
 * (including prima de servicios) may be deducted for suspension.
 */
const CSJ_FUNDAMENTO =
  'Corte Suprema de Justicia, Sala Laboral, sentencia del 18 de septiembre de 1980, reiterada ' +
  'en sentencia del 9 de noviembre de 1990 (expediente 3911): el listado del Art. 53 CST ' +
  '(vacaciones, cesantías, jubilación) es taxativo — ningún otro concepto, incluida la prima de ' +
  'servicios, puede descontarse por suspensión.';

/** Honest nuance note next to the Art. 53 table (REQ-2) — informative, not alarming. */
const CSJ_NUANCE =
  'Este es el criterio histórico dominante de la Corte Suprema. Existe debate doctrinal sobre el ' +
  'tema — si tu caso es relevante, confírmalo con RR.HH. o un abogado laboral.';

/** Art. 53 CST exception callout (REQ-2): special causales count as worked time. */
const EXCEPTION_CALLOUT =
  'Excepción: la incapacidad no profesional (hasta 180 días) y la licencia de maternidad o ' +
  'paternidad NO suspenden el cómputo de prestaciones: cuentan como tiempo trabajado para ' +
  'TODAS las prestaciones.';

/** Asymmetric effects of Art. 53 CST per prestación (REQ-2). */
const ASYMMETRIC_ROWS = [
  { concept: 'Salario', effect: 'No se paga durante la suspensión', ref: 'Art. 53 CST' },
  { concept: 'Cesantías', effect: 'Pueden descontarse de la antigüedad', ref: 'Art. 53 CST' },
  { concept: 'Vacaciones', effect: 'Pueden descontarse de la antigüedad', ref: 'Art. 53 CST' },
  { concept: 'Prima de servicios', effect: 'No se descuenta', ref: 'Art. 53 CST + CSJ' },
  { concept: 'Intereses sobre cesantías', effect: 'No se descuentan', ref: 'Art. 53 CST + CSJ' },
];

/** Fuentes oficiales — hrefs verbatim from GlosarioRecargos OFFICIAL_LINKS (D10). */
const OFFICIAL_LINKS = [
  {
    label: 'Código Sustantivo del Trabajo',
    href: 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Codigo/30019323',
  },
  {
    label: 'Ley 2466 de 2025 (texto oficial)',
    href: 'https://www.suin-juriscol.gov.co/viewDocument.asp?id=30055086',
  },
  {
    label: 'Función Pública (versión consolidada)',
    href: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676',
  },
];

const INPUT_IDS = {
  causal: 'suspension-causal',
  start: 'suspension-start',
  end: 'suspension-end',
} as const;

export function SuspensionSection() {
  const [records, setRecords] = useState<SuspensionRecord[]>(() => loadSuspensionStore().records);
  const [causal, setCausal] = useState<SuspensionCausal>('fuerza-mayor');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFirstDisciplinary, setIsFirstDisciplinary] = useState<boolean | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const persist = (next: SuspensionRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, records: next }));
    } catch {
      // Storage quota or unavailable — silently skip
    }
  };

  const handleCausalChange = (value: SuspensionCausal) => {
    setCausal(value);
    // D11: every disciplinary save requires a fresh explicit answer.
    setIsFirstDisciplinary(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError('Completá la fecha de inicio y la fecha de fin.');
      return;
    }
    if (!isValidPeriod(startDate, endDate)) {
      setError('La fecha fin no puede ser anterior a la fecha inicio.');
      return;
    }

    // D11 two-layer contract: the UI REQUIRES an explicit first/reincidencia
    // answer for suspension-disciplinaria — submit is blocked without it.
    let firstDisciplinary: boolean | undefined;
    if (causal === 'suspension-disciplinaria') {
      if (isFirstDisciplinary === null) {
        setError('Respondé si es tu primera suspensión disciplinaria (Sí o No) para poder registrar el período.');
        return;
      }
      firstDisciplinary = isFirstDisciplinary;
    }

    const record: SuspensionRecord = {
      id: editingId ?? generateId(),
      startDate,
      endDate,
      causal,
      ...(firstDisciplinary !== undefined ? { isFirstDisciplinary: firstDisciplinary } : {}),
    };

    setRecords(prev => {
      const exists = prev.some(r => r.id === record.id);
      const next = exists ? prev.map(r => (r.id === record.id ? record : r)) : [...prev, record];
      persist(next);
      return next;
    });

    setEditingId(null);
    setStartDate('');
    setEndDate('');
    setIsFirstDisciplinary(null);
  };

  const startEdit = (record: SuspensionRecord) => {
    setEditingId(record.id);
    setCausal(record.causal);
    setStartDate(record.startDate);
    setEndDate(record.endDate);
    setIsFirstDisciplinary(record.isFirstDisciplinary ?? null);
    setError(null);
  };

  const handleDelete = (id: string) => {
    setRecords(prev => {
      const next = prev.filter(r => r.id !== id);
      persist(next);
      return next;
    });
    if (editingId === id) {
      setEditingId(null);
      setStartDate('');
      setEndDate('');
      setIsFirstDisciplinary(null);
    }
  };

  return (
    <section className={`card ${styles.section}`} aria-label="Suspensión del contrato">
      <h2>Suspensión del contrato de trabajo</h2>
      <p className="subtitle">
        Durante una suspensión (CST Arts. 51 y 53) no se presta el servicio ni se paga el salario,
        pero el contrato sigue vigente y el tiempo cuenta de forma distinta según cada prestación.
        Esta sección te explica las causales y te permite llevar un registro de tus suspensiones.
        Es informativa: no calcula dinero.
      </p>

      <h3>Causales de suspensión (CST Art. 51)</h3>
      <ul className={styles.causalList}>
        {CAUSALES.map(c => (
          <li key={c.value} className={styles.causalItem}>
            <span>{c.label}</span>
            {c.special && (
              <span className={`badge badge-success ${styles.specialBadge}`}>
                Cuenta como tiempo trabajado
              </span>
            )}
            <span className={styles.causalRef}>{c.legalRef}</span>
          </li>
        ))}
      </ul>

      <h3>Efectos sobre tus prestaciones (CST Art. 53)</h3>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Prestación</th>
              <th scope="col">Durante la suspensión</th>
              <th scope="col">Fundamento</th>
            </tr>
          </thead>
          <tbody>
            {ASYMMETRIC_ROWS.map(row => (
              <tr key={row.concept}>
                <td className={styles.concept}>{row.concept}</td>
                <td>{row.effect}</td>
                <td className={styles.cita}>{row.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={styles.csjNote}>{CSJ_FUNDAMENTO}</p>
      <p className={styles.nuanceNote}>{CSJ_NUANCE}</p>
      <p role="note" className={`alert alert-success ${styles.exception}`}>
        {EXCEPTION_CALLOUT}
      </p>

      <h3>Registrá tus suspensiones</h3>
      <form noValidate onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor={INPUT_IDS.causal}>Causal de la suspensión</label>
          <select
            id={INPUT_IDS.causal}
            name="causal"
            value={causal}
            onChange={e => handleCausalChange(e.target.value as SuspensionCausal)}
          >
            {CAUSALES.map(c => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label htmlFor={INPUT_IDS.start}>Fecha de inicio de la suspensión</label>
          <input
            type="date"
            id={INPUT_IDS.start}
            name="startDate"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>

        <div className="field-group">
          <label htmlFor={INPUT_IDS.end}>Fecha de fin de la suspensión</label>
          <input
            type="date"
            id={INPUT_IDS.end}
            name="endDate"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
          <span className="field-hint">El período incluye ambos días (duración en días calendario).</span>
        </div>

        {causal === 'suspension-disciplinaria' && (
          <fieldset className={styles.firstFieldset}>
            <legend className={styles.firstTitle}>
              ¿Es tu primera suspensión disciplinaria, o ya tuviste otra antes?
            </legend>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="first-disciplinary"
                value="true"
                checked={isFirstDisciplinary === true}
                onChange={() => setIsFirstDisciplinary(true)}
              />
              <span>Sí (primera vez)</span>
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="first-disciplinary"
                value="false"
                checked={isFirstDisciplinary === false}
                onChange={() => setIsFirstDisciplinary(false)}
              />
              <span>No (reincidencia)</span>
            </label>
            <span className="field-hint">
              Obligatorio: el límite del Art. 112 CST depende de esta respuesta (8 días la primera
              vez / 60 días en reincidencia).
            </span>
          </fieldset>
        )}

        {error && (
          <p role="alert" className={`alert alert-danger ${styles.formError}`}>
            {error}
          </p>
        )}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Guardar cambios' : 'Registrar suspensión'}
          </button>
          {editingId && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditingId(null);
                setStartDate('');
                setEndDate('');
                setIsFirstDisciplinary(null);
                setError(null);
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      <section className={styles.records} aria-label="Suspensiones registradas">
        <h3>Suspensiones registradas</h3>
        {records.length === 0 ? (
          <p className={styles.empty}>Todavía no registraste suspensiones.</p>
        ) : (
          <ul className={styles.recordList}>
            {records.map(record => {
              const meta = CAUSALES.find(c => c.value === record.causal);
              const duration = getDurationDays(record.startDate, record.endDate);
              const warning = buildExcessWarning(record);
              return (
                <li key={record.id} className={styles.record}>
                  <div className={styles.recordHeader}>
                    <strong>{meta?.label ?? record.causal}</strong>
                    <span className={styles.cita}>{meta?.legalRef ?? ''}</span>
                  </div>
                  <div className={styles.recordMeta}>
                    <span>
                      Del {formatDate(record.startDate)} al {formatDate(record.endDate)}
                    </span>
                    <span>
                      {duration} {duration === 1 ? 'día' : 'días'}
                    </span>
                  </div>
                  <p className={styles.checklist}>{buildChecklist(record)}</p>
                  {warning && (
                    <p role="alert" className={`alert alert-warning ${styles.warning}`}>
                      {warning}
                    </p>
                  )}
                  <div className={styles.recordActions}>
                    <button type="button" className="btn btn-secondary btn-small" onClick={() => startEdit(record)}>
                      Editar
                    </button>
                    <button type="button" className="btn btn-danger btn-small" onClick={() => handleDelete(record.id)}>
                      Eliminar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <footer className={styles.footnote}>
        <p>Esta información es educativa y no constituye asesoría legal.</p>
        <div className={styles.links}>
          <h4>Fuentes oficiales</h4>
          <ul>
            {OFFICIAL_LINKS.map(link => (
              <li key={link.href}>
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </section>
  );
}
