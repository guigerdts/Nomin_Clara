/**
 * liquidacion.ts
 *
 * Liquidación básica (prestaciones sociales) — pure calculation module.
 * Cesantías (CST Art. 249), intereses sobre cesantías (Ley 52 de 1975),
 * prima de servicios (CST Art. 306), vacaciones (CST Art. 186).
 *
 * Day-count convention (spec audit note): commercial 30-day months EVERYWHERE
 * (360-day year). Full month = 30 days; a partial month counts its actual
 * elapsed days; NEVER round a partial month up. The ÷360 and ÷720 divisors are
 * only consistent under this assumption, and the semester split must sum to
 * the total (180 + 30 = 210).
 */

import { getTransportAllowance } from './rates';
import type { LiquidacionInputs, ConceptLine, LiquidacionResult } from './types';

const CESANTIAS_RATE = 1 / 360;
const INTERESES_RATE = 0.12;
const VACACIONES_RATE = 1 / 720;

export const WARNING_TWO_SEMESTERS =
  'Esto es solo la prima del semestre en curso — si el semestre anterior no se pagó, agrégalo aparte';

export const WARNING_NEGATIVE_VACACIONES =
  'Tomaste más vacaciones de las que tenías acumuladas — esto puede generar un descuento en tu liquidación, verifícalo con RR.HH.';

/**
 * Parses an ISO date (YYYY-MM-DD) at local noon.
 * PayrollForm trick — avoids timezone shifts corrupting the day.
 */
function parseISO(iso: string): Date {
  return new Date(iso + 'T12:00:00');
}

/** Actual number of calendar days in a month (0-indexed month). */
function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Counts días trabajados commercially: full months × 30 plus the actual
 * elapsed days of any partial month. Boundaries inclusive.
 *
 * Pinned by spec: 01-ene→31-jul-2026 = 210 (7×30); 01-ene→31-ene = 30;
 * start === end = 0; 15-ene→31-jul = 6×30 + 17 = 197.
 */
export function countCommercialDays(start: string, end: string): number {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  return countCommercialDaysBetween(startDate, endDate);
}

function countCommercialDaysBetween(start: Date, end: Date): number {
  // start === end → 0 (spec). start > end → 0 (defensive guard).
  if (end.getTime() < start.getTime()) return 0;
  if (end.getTime() === start.getTime()) return 0;

  const sameMonth =
    start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();

  if (sameMonth) {
    // Full month (30) only when the whole month is covered: day 1 → last day.
    if (start.getDate() === 1 && end.getDate() === daysInMonth(start.getFullYear(), start.getMonth())) {
      return 30;
    }
    return end.getDate() - start.getDate() + 1;
  }

  let total = 0;

  // Full months strictly between the start month and the end month.
  const fullMonths =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) - 1;
  total += fullMonths * 30;

  // Start month: 30 when it starts on day 1 (period spans past it), else the
  // actual days from start day through the end of the month (partial month).
  if (start.getDate() === 1) {
    total += 30;
  } else {
    total += daysInMonth(start.getFullYear(), start.getMonth()) - start.getDate() + 1;
  }

  // End month: 30 when it ends on the last day of the month, else the actual
  // days from day 1 through the end day (partial month).
  if (end.getDate() === daysInMonth(end.getFullYear(), end.getMonth())) {
    total += 30;
  } else {
    total += end.getDate();
  }

  return total;
}

/**
 * Detects the semester (from the END date): months 1–6 → 1, 7–12 → 2.
 */
export function detectSemester(endDate: string): 1 | 2 {
  const month = parseISO(endDate).getMonth() + 1;
  return month <= 6 ? 1 : 2;
}

/**
 * Days worked inside the semester containing the END date, clamped to the
 * semester start (01-ene / 01-jul of the end date's year). Clamping avoids
 * double counting and keeps 180 + 30 = 210 for the worked example.
 */
export function semesterOverlapDays(start: string, end: string): number {
  const endDate = parseISO(end);
  const semester = detectSemester(end);
  const semesterStartMonth = semester === 1 ? 0 : 6; // 0-indexed: ene = 0, jul = 6
  const semesterStart = new Date(endDate.getFullYear(), semesterStartMonth, 1);
  const startDate = parseISO(start);
  const effectiveStart = startDate.getTime() > semesterStart.getTime() ? startDate : semesterStart;
  return countCommercialDaysBetween(effectiveStart, endDate);
}

/**
 * Formats a value as Colombian pesos with cents (es-CO locale, 2 decimals).
 * The existing formatCOP rounds to whole pesos ($510.681 ≠ spec's pinned
 * $510.680,63), so liquidación needs an exact-cents formatter.
 */
export function formatCOPExact(value: number): string {
  if (value == null || isNaN(value)) return '$0,00';
  return (
    '$' +
    value.toLocaleString('es-CO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/**
 * Formats a number for display inside a formula string (es-CO grouping,
 * up to 2 decimals, no currency symbol). Shows the user's real inputs.
 */
function formatFormulaNumber(value: number): string {
  return value.toLocaleString('es-CO', { maximumFractionDigits: 2 });
}

/**
 * Cesantías (CST Art. 249): (salario + auxilio) × días ÷ 360.
 * A 360-day commercial year — consistent with the day-count convention.
 */
export function calculateCesantias(salary: number, auxilio: number, days: number): number {
  return (salary + auxilio) * days * CESANTIAS_RATE;
}

/**
 * Intereses sobre cesantías (Ley 52 de 1975): cesantías × 12% × (días ÷ 360).
 */
export function calculateIntereses(cesantias: number, days: number): number {
  return cesantias * INTERESES_RATE * days * CESANTIAS_RATE;
}

/**
 * Prima de servicios (CST Art. 306): (salario + auxilio) × días del semestre
 * en curso ÷ 360. The semester day count comes from semesterOverlapDays.
 */
export function calculatePrima(salary: number, auxilio: number, semesterDays: number): number {
  return (salary + auxilio) * semesterDays * CESANTIAS_RATE;
}

/**
 * Vacaciones (CST Art. 186): (salario SIN auxilio) × días ÷ 720 − días disfrutados.
 * Negative nets are NOT clamped — the employer may deduct the excess at final
 * liquidation (valid exception to Art. 149 CST); the UI shows a neutral warning.
 */
export function calculateVacaciones(salary: number, days: number, daysTaken: number): number {
  return salary * days * VACACIONES_RATE - daysTaken;
}

/**
 * Aggregates the four prestaciones for a contract period.
 * Auxilio is auto-derived via getTransportAllowance (salary ≤ 2 SMMLV);
 * it enters the cesantías and prima bases, never vacations.
 */
export function calculateLiquidacion(inputs: LiquidacionInputs): LiquidacionResult {
  const { startDate, endDate, salary, daysTaken } = inputs;

  const auxilio = getTransportAllowance(salary);
  const appliesTransport = auxilio > 0;

  const days = countCommercialDays(startDate, endDate);
  const semester = detectSemester(endDate);
  const semesterDays = semesterOverlapDays(startDate, endDate);

  const cesantias = calculateCesantias(salary, auxilio, days);
  const intereses = calculateIntereses(cesantias, days);
  const prima = calculatePrima(salary, auxilio, semesterDays);
  const vacaciones = calculateVacaciones(salary, days, daysTaken);

  // Warn when the period spans two semesters: the prima shown covers only the
  // semester containing the end date; a prior unpaid semester must be added apart.
  const spansTwoSemesters = detectSemester(startDate) !== semester;

  const lines: ConceptLine[] = [
    {
      concepto: 'Cesantías',
      formula: `(${formatFormulaNumber(salary)} + ${formatFormulaNumber(auxilio)}) × ${days} ÷ 360`,
      legalRef: 'CST Art. 249',
      amount: cesantias,
    },
    {
      concepto: 'Intereses sobre cesantías',
      formula: `${formatFormulaNumber(cesantias)} × 12% × ${days} ÷ 360`,
      legalRef: 'Ley 52 de 1975',
      amount: intereses,
    },
    {
      concepto: 'Prima de servicios',
      formula: `(${formatFormulaNumber(salary)} + ${formatFormulaNumber(auxilio)}) × ${semesterDays} ÷ 360`,
      legalRef: 'CST Art. 306',
      amount: prima,
      warning: spansTwoSemesters ? WARNING_TWO_SEMESTERS : undefined,
    },
    {
      concepto: 'Vacaciones',
      formula: `${formatFormulaNumber(salary)} × ${days} ÷ 720 − ${formatFormulaNumber(daysTaken)}`,
      legalRef: 'CST Art. 186',
      amount: vacaciones,
      warning: vacaciones < 0 ? WARNING_NEGATIVE_VACACIONES : undefined,
    },
  ];

  const total = lines.reduce((acc, line) => acc + line.amount, 0);

  return {
    inputs,
    auxilio,
    appliesTransport,
    days,
    semester,
    semesterDays,
    lines,
    total,
  };
}
