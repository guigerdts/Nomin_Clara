/**
 * indemnizacion.ts
 *
 * Indemnización por despido sin justa causa (CST Art. 64) — pure calculation
 * module. Three contract types: término fijo, término indefinido, obra o labor.
 *
 * Base = monthly salary ONLY. Auxilio de transporte is not salary (Ley 1ª de
 * 1963 Art. 7) and Art. 64 CST orders no inclusion — this module never calls
 * getTransportAllowance (D7).
 *
 * Day-count convention: commercial 30-day months (360-day year), reusing
 * countCommercialDays. Days are NEVER rounded (D6) — exact fractional values
 * flow into the amount; formatCOPExact rounds only for display (D9).
 */

import { SMMLV } from './constants';
import { countCommercialDays } from './liquidacion';
import type {
  ConceptLine,
  IndemnizacionFijoInputs,
  IndemnizacionIndefinidoInputs,
  IndemnizacionInputs,
  IndemnizacionNotice,
  IndemnizacionObraInputs,
  IndemnizacionResult,
} from './types';

const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const INDEFINIDO_LOW_FIRST_YEAR_DAYS = 30;
const INDEFINIDO_LOW_PER_EXTRA_YEAR_DAYS = 20;
const INDEFINIDO_HIGH_FIRST_YEAR_DAYS = 20;
const INDEFINIDO_HIGH_PER_EXTRA_YEAR_DAYS = 15;
const INDEFINIDO_HIGH_SALARY_MULTIPLIER = 10;
const OBRA_MIN_DAYS = 15;

const CONCEPTO = 'Indemnización por despido sin justa causa';
const LEGAL_REF = 'CST Art. 64';

export const WARNING_CONTRATO_VENCIDO =
  'Contrato ya vencido al momento del despido — no corresponde indemnización por despido sin justa causa';

export const WARNING_OBRA_TERMINADA =
  'Obra ya terminada antes del despido — no corresponde indemnización por despido sin justa causa';

export const NOTICE_ART46: IndemnizacionNotice = {
  text: 'Contrato a término fijo inferior a 1 año: máximo 3 prórrogas de igual duración; la 4ª prórroga debe ser de al menos 1 año',
  legalRef: 'CST Art. 46',
};

export const NOTICE_RENOVACIONES: IndemnizacionNotice = {
  text: 'Has renovado el contrato a término fijo 3 o más veces — verifícalo con RR.HH.',
  legalRef: 'CST Art. 46',
};

/**
 * Formats a number for display inside a formula string (es-CO grouping, up to
 * 2 decimals, no currency symbol). Local copy — liquidacion.ts does not export
 * its own (D13).
 */
function formatFormulaNumber(value: number): string {
  return value.toLocaleString('es-CO', { maximumFractionDigits: 2 });
}

/**
 * Builds the single Art. 64 CST result line for a contract type.
 * amount = (salario ÷ 30) × díasEfectivos — exact, never rounded (D6).
 */
function buildLine(salary: number, effectiveDays: number, warning?: string): ConceptLine {
  return {
    concepto: CONCEPTO,
    formula: `${formatFormulaNumber(salary)} ÷ 30 × ${formatFormulaNumber(effectiveDays)}`,
    legalRef: LEGAL_REF,
    amount: (salary / DAYS_PER_MONTH) * effectiveDays,
    warning,
  };
}

/**
 * Término fijo (Art. 64 CST): (salario ÷ 30) × díasRestantes.
 * díasRestantes = commercial days dismissal → planned end. Contract expired
 * before dismissal → 0 with an explanatory warning. Art. 46 CST notice always;
 * HR advisory when renewals >= 3 (D10).
 */
export function calculateIndemnizacionFijo(inputs: IndemnizacionFijoInputs): IndemnizacionResult {
  const { salary, dismissalDate, plannedEnd, renewals } = inputs;
  const days = countCommercialDays(dismissalDate, plannedEnd);
  const expired = days === 0;
  const line = buildLine(salary, days, expired ? WARNING_CONTRATO_VENCIDO : undefined);

  const notices: IndemnizacionNotice[] = [{ ...NOTICE_ART46 }];
  if (renewals >= 3) notices.push({ ...NOTICE_RENOVACIONES });

  return {
    inputs,
    type: 'fijo',
    days,
    effectiveDays: days,
    lines: [line],
    notices,
    total: line.amount,
  };
}

/**
 * Obra o labor (Art. 64 CST): max((salario ÷ 30) × díasRestantes, 15 días).
 * Obra finished before dismissal → 0, floor NOT applied (REQ-4).
 */
export function calculateIndemnizacionObra(inputs: IndemnizacionObraInputs): IndemnizacionResult {
  const { salary, dismissalDate, plannedEnd } = inputs;
  const days = countCommercialDays(dismissalDate, plannedEnd);
  const finished = days === 0;
  const effectiveDays = finished ? 0 : Math.max(days, OBRA_MIN_DAYS);
  const line = buildLine(salary, effectiveDays, finished ? WARNING_OBRA_TERMINADA : undefined);

  return {
    inputs,
    type: 'obra',
    days,
    effectiveDays,
    lines: [line],
    notices: [],
    total: line.amount,
  };
}

/**
 * Término indefinido (Art. 64 CST): scale by salary vs 10 SMMLV (threshold from
 * the SMMLV constant, never hardcoded — D5). Low: 30 + 20×años; high: 20 + 15×años.
 * añosAdicionales = (díasServicio − 360) ÷ 360 (0 when ≤ 360); díasTotal =
 * primerAño + añosAdicionales × díasPorAño; amount = (salario ÷ 30) × díasTotal.
 */
export function calculateIndemnizacionIndefinido(
  inputs: IndemnizacionIndefinidoInputs,
): IndemnizacionResult {
  const { salary, serviceStart, dismissalDate } = inputs;
  const days = countCommercialDays(serviceStart, dismissalDate);
  const threshold = SMMLV * INDEFINIDO_HIGH_SALARY_MULTIPLIER;
  const high = salary >= threshold;

  const fullYearDays = DAYS_PER_MONTH * MONTHS_PER_YEAR;
  const years = days > fullYearDays ? (days - fullYearDays) / fullYearDays : 0;

  const firstYearDays = high
    ? INDEFINIDO_HIGH_FIRST_YEAR_DAYS
    : INDEFINIDO_LOW_FIRST_YEAR_DAYS;
  const perExtraYearDays = high
    ? INDEFINIDO_HIGH_PER_EXTRA_YEAR_DAYS
    : INDEFINIDO_LOW_PER_EXTRA_YEAR_DAYS;
  const effectiveDays = firstYearDays + years * perExtraYearDays;

  const line = buildLine(salary, effectiveDays);

  return {
    inputs,
    type: 'indefinido',
    days,
    effectiveDays,
    years,
    branch: high ? 'high' : 'low',
    threshold,
    lines: [line],
    notices: [],
    total: line.amount,
  };
}

/**
 * Aggregator (D1): dispatches to the per-type helper for the discriminated
 * union. The never-typed default keeps the switch exhaustive at compile time.
 */
export function calculateIndemnizacion(inputs: IndemnizacionInputs): IndemnizacionResult {
  switch (inputs.type) {
    case 'fijo':
      return calculateIndemnizacionFijo(inputs);
    case 'indefinido':
      return calculateIndemnizacionIndefinido(inputs);
    case 'obra':
      return calculateIndemnizacionObra(inputs);
    default: {
      const exhaustive: never = inputs;
      return exhaustive;
    }
  }
}
