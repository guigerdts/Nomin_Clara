/**
 * suspension.ts
 *
 * Suspensión del contrato de trabajo (CST Arts. 51 y 53) — pure logic module.
 * Educational + tracking only: no peso calculation, no integration with
 * liquidacion.ts (proposal contract).
 *
 * D1: 10 selectable causales (8 de Art. 51 CST + incapacidad + licencia).
 * D2: Art. 112 excess warning — 8 días (primera) / 60 días (reincidencia).
 * D6: inclusive calendar-day duration (NOT commercial 30-day months).
 * D7: `special` flag drives the checklist variant (standard vs special).
 * D8: no clock — dates come only from the record (never new Date()/today).
 * D11: `isFirstDisciplinary?: boolean` stays optional at this layer; the
 *      `?? true` fallback is defensive-only for legacy/migration/test callers.
 *      The UI (PR2) requires an explicit answer for suspension-disciplinaria.
 */

import type { SuspensionCausal, SuspensionRecord } from './types';

export interface CausalMeta {
  value: SuspensionCausal;
  label: string;
  legalRef: string;
  special?: boolean;
}

/** Checklist estándar (REQ-5): asimetría del Art. 53 — verificar con la empresa. */
export const STANDARD_CHECKLIST =
  'Este período NO debería afectar tu prima ni tus intereses sobre cesantías. SÍ puede descontarse de tus vacaciones y cesantías acumuladas — verifica que tu empresa lo esté aplicando así, no al revés.';

/** Checklist especial (REQ-5): incapacidad/licencia — no se descuenta de NINGUNA prestación. */
export const SPECIAL_CHECKLIST =
  'Este período no se descuenta de NINGUNA prestación: cuenta como tiempo trabajado para todas las prestaciones.';

/** Las 10 causales seleccionables (D1): 8 de Art. 51 CST + 2 casos especiales. */
export const CAUSALES: readonly CausalMeta[] = [
  { value: 'fuerza-mayor', label: 'Fuerza mayor o caso fortuito', legalRef: 'CST Art. 51' },
  {
    value: 'muerte-empleador',
    label: 'Muerte o inhabilitación del empleador (personas naturales)',
    legalRef: 'CST Art. 51',
  },
  {
    value: 'suspension-actividades',
    label: 'Suspensión de actividades de la empresa (hasta 120 días)',
    legalRef: 'CST Art. 51',
  },
  { value: 'licencia-acordada', label: 'Licencia o permiso temporal acordado', legalRef: 'CST Art. 51' },
  { value: 'suspension-disciplinaria', label: 'Suspensión disciplinaria', legalRef: 'CST Art. 51' },
  {
    value: 'detencion-preventiva',
    label: 'Detención preventiva del trabajador (hasta 8 días)',
    legalRef: 'CST Art. 51',
  },
  { value: 'arresto-correccional', label: 'Arresto correccional (hasta 8 días)', legalRef: 'CST Art. 51' },
  { value: 'huelga', label: 'Huelga declarada', legalRef: 'CST Art. 51' },
  { value: 'incapacidad-medica', label: 'Incapacidad médica', legalRef: 'CST Art. 51', special: true },
  {
    value: 'licencia-maternidad-paternidad',
    label: 'Licencia de maternidad o paternidad',
    legalRef: 'CST Art. 51',
    special: true,
  },
];

/**
 * Art. 112 CST (D2): 8 días para la primera suspensión disciplinaria;
 * 60 días (2 meses) para la reincidencia. NEVER a single generic threshold.
 */
export function getDisciplinaryThreshold(isFirst: boolean): 8 | 60 {
  return isFirst ? 8 : 60;
}

/**
 * Inclusive calendar days between two ISO dates (D6).
 * Parses at T12:00:00 (liquidacion.ts parseISO trick — avoids timezone day
 * shifts). Same day → 1; invalid dates → 0.
 */
export function getDurationDays(start: string, end: string): number {
  const startMs = new Date(start + 'T12:00:00').getTime();
  const endMs = new Date(end + 'T12:00:00').getTime();
  if (isNaN(startMs) || isNaN(endMs)) return 0;
  return Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Validates a period (REQ-4): both dates ISO-parsable and end >= start.
 * Rejects fecha fin before fecha inicio; the record is not persisted.
 */
export function isValidPeriod(start: string, end: string): boolean {
  const startMs = new Date(start + 'T12:00:00').getTime();
  const endMs = new Date(end + 'T12:00:00').getTime();
  if (isNaN(startMs) || isNaN(endMs)) return false;
  return endMs >= startMs;
}

/**
 * Art. 112 excess warning (REQ-6 / D2): ONLY suspension-disciplinaria.
 * `>` boundary — exactly 8/60 días never warn. `isFirstDisciplinary ?? true`
 * treats incomplete data (legacy/migration/test callers) as first-time (D11).
 */
export function shouldShowExcessWarning(record: SuspensionRecord): boolean {
  if (record.causal !== 'suspension-disciplinaria') return false;
  const threshold = getDisciplinaryThreshold(record.isFirstDisciplinary ?? true);
  return getDurationDays(record.startDate, record.endDate) > threshold;
}

/**
 * Per-record checklist (REQ-5 / D7): standard text for Art. 51 causales;
 * special text (no deduction from ANY prestación) for incapacidad/licencia.
 */
export function buildChecklist(record: SuspensionRecord): string {
  const causal = CAUSALES.find(c => c.value === record.causal);
  return causal?.special ? SPECIAL_CHECKLIST : STANDARD_CHECKLIST;
}
