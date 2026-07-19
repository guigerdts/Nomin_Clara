import type { PayrollInput, BreakdownEntry, BreakdownResult } from './types';
import { SMMLV, TRANSPORT_ALLOWANCE_2026 } from './constants';

export { SMMLV, TRANSPORT_ALLOWANCE_2026 };

export const RATES = {
  WEEKLY_HOURS: 42,
  DAILY_HOURS: 7,
  DAY_START: 6,
  DAY_END: 19,
  SURCHARGES: {
    NIGHT: 0.35,
    OT_DAY: 0.25,
    OT_NIGHT: 0.75,
    HOLIDAY: 0.90,
    HOLIDAY_NIGHT: 1.25,
    HOLIDAY_OT_DAY: 1.15,
    HOLIDAY_OT_NIGHT: 1.65,
  },
  MULTIPLIERS: {
    NIGHT: 1.35,
    OT_DAY: 1.25,
    OT_NIGHT: 1.75,
    HOLIDAY: 1.90,
    HOLIDAY_NIGHT: 2.25,
    HOLIDAY_OT_DAY: 2.15,
    HOLIDAY_OT_NIGHT: 2.65,
  },
  LIMITS: {
    MAX_OT_PER_DAY: 2,
    MAX_OT_PER_WEEK: 12,
  },
  TRANSPORT_ALLOWANCE_MULTIPLIER: 2,
} as const;

/**
 * Calculates the ordinary hourly value.
 * Formula: (monthly salary / 30 days) / legal daily hours
 */
export function getOrdinaryHourValue(monthlySalary: number): number {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  const dailySalary = monthlySalary / 30;
  return dailySalary / RATES.DAILY_HOURS;
}

/**
 * Determines if the worker qualifies for transport allowance.
 * Rule: If monthly salary ≤ 2 SMMLV, they are entitled.
 */
export function getTransportAllowance(monthlySalary: number): number {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  const threshold = SMMLV * RATES.TRANSPORT_ALLOWANCE_MULTIPLIER;
  return monthlySalary <= threshold ? TRANSPORT_ALLOWANCE_2026 : 0;
}

/**
 * Formats a number as Colombian pesos.
 * Example: 1234567.89 → "$1.234.568"
 */
export function formatCOP(value: number): string {
  if (value == null || isNaN(value)) return '$0';
  return '$' + Math.round(value).toLocaleString('es-CO');
}

/**
 * Formats a percentage value for display, rounding to avoid floating-point artifacts.
 * e.g. `114.99999999999999` → `"115"`  (instead of `"114.99999999999999"`)
 *
 * INTENDED USE: surcharge rates in BreakdownTable (all integer percentages:
 * 25, 35, 75, 90, 115, 125, 165). **Safe because every surchargePct is an
 * integer percentage** — the 0.25, 0.35, etc. in SURCHARGES constants multiply
 * by 100 and round cleanly to whole numbers.
 *
 * DO NOT use this for rates with meaningful decimal places like the solidarity
 * fund tiers (1.2%, 1.4%, etc.) — `Math.round` would discard the fractional
 * part. Those already use `.toFixed(1)` directly.
 */
export function formatPercent(value: number): string {
  return String(Math.round(value));
}

/**
 * Validates that overtime hours do not exceed legal limits.
 * Limits are informative (warning), not blocking.
 */
export function validateOTLimits(
  dayOT: number,
  nightOT: number,
  holidayDayOT: number,
  holidayNightOT: number,
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const totalDay = dayOT || 0;
  const totalNight = nightOT || 0;
  const totalHolidayDay = holidayDayOT || 0;
  const totalHolidayNight = holidayNightOT || 0;
  const totalOT = totalDay + totalNight + totalHolidayDay + totalHolidayNight;

  const QUINCENA_ESTIMATED_WORKDAYS = 10;
  const maxPerCategory = RATES.LIMITS.MAX_OT_PER_DAY * QUINCENA_ESTIMATED_WORKDAYS;

  if (totalDay > maxPerCategory) {
    warnings.push(
      `Has excedido el límite estimado de ${RATES.LIMITS.MAX_OT_PER_DAY} horas extra/día ` +
      `(~${maxPerCategory}h en la quincena) en horas extra diurnas (ingresaste ${totalDay}).`,
    );
  }
  if (totalNight > maxPerCategory) {
    warnings.push(
      `Has excedido el límite estimado de ${RATES.LIMITS.MAX_OT_PER_DAY} horas extra/día ` +
      `(~${maxPerCategory}h en la quincena) en horas extra nocturnas (ingresaste ${totalNight}).`,
    );
  }
  if (totalHolidayDay > maxPerCategory) {
    warnings.push(
      `Has excedido el límite estimado de ${RATES.LIMITS.MAX_OT_PER_DAY} horas extra/día ` +
      `(~${maxPerCategory}h en la quincena) en horas extra diurnas festivas (ingresaste ${totalHolidayDay}).`,
    );
  }
  if (totalHolidayNight > maxPerCategory) {
    warnings.push(
      `Has excedido el límite estimado de ${RATES.LIMITS.MAX_OT_PER_DAY} horas extra/día ` +
      `(~${maxPerCategory}h en la quincena) en horas extra nocturnas festivas (ingresaste ${totalHolidayNight}).`,
    );
  }

  const maxOTQuincena = RATES.LIMITS.MAX_OT_PER_WEEK * 2;
  if (totalOT > maxOTQuincena) {
    warnings.push(
      `Has excedido el límite de ${RATES.LIMITS.MAX_OT_PER_WEEK} horas extra/semana ` +
      `(~${maxOTQuincena}h en la quincena) (total ingresado: ${totalOT} horas).`,
    );
  }

  return { valid: warnings.length === 0, warnings };
}

/**
 * Calculates the complete payroll breakdown for a fortnight.
 * Maintains exact same calculation logic as the original JS.
 */
export function calculateBreakdown(params: PayrollInput): BreakdownResult {
  const {
    salary,
    dayOT = 0,
    nightOT = 0,
    holidayDayOT = 0,
    holidayNightOT = 0,
    nightSurcharge = 0,
    holidaySurcharge = 0,
    holidayNightSurcharge = 0,
  } = params;

  const hourValue = getOrdinaryHourValue(salary);
  const transport = getTransportAllowance(salary);
  const basePay = salary / 2;

  const entries: BreakdownEntry[] = [];

  /**
   * Creates a breakdown entry and returns its contribution to extraTotal.
   * OT hours contribute their full value (not covered by basePay).
   * Ordinary surcharges contribute only the surplus (covered by basePay).
   */
  function makeEntry(
    label: string,
    hours: number,
    multiplier: number,
    surchargePct: number,
    legalRef: string,
    isOT: boolean,
  ): number {
    if (!hours || hours <= 0) return 0;
    const subtotal = hours * hourValue * multiplier;
    const surchargeOnly = hours * hourValue * (multiplier - 1);
    entries.push({
      label,
      hours,
      hourValue,
      surchargePct,
      multiplier,
      subtotal,
      surchargeOnly,
      legalRef,
    });
    return isOT ? subtotal : surchargeOnly;
  }

  let extraTotal = 0;

  // 1. Night surcharge ordinary (+35%)
  extraTotal += makeEntry(
    'Recargo nocturno', nightSurcharge,
    RATES.MULTIPLIERS.NIGHT, RATES.SURCHARGES.NIGHT * 100,
    'CST Art. 168', false,
  );

  // 2. Day overtime (+25%)
  extraTotal += makeEntry(
    'Hora extra diurna', dayOT,
    RATES.MULTIPLIERS.OT_DAY, RATES.SURCHARGES.OT_DAY * 100,
    'CST Art. 179', true,
  );

  // 3. Night overtime (+75%)
  extraTotal += makeEntry(
    'Hora extra nocturna', nightOT,
    RATES.MULTIPLIERS.OT_NIGHT, RATES.SURCHARGES.OT_NIGHT * 100,
    'CST Art. 179, Ley 2466', true,
  );

  // 4. Holiday surcharge ordinary (+90%)
  extraTotal += makeEntry(
    'Recargo dominical/festivo', holidaySurcharge,
    RATES.MULTIPLIERS.HOLIDAY, RATES.SURCHARGES.HOLIDAY * 100,
    'CST Art. 179', false,
  );

  // 5. Night + holiday combined surcharge (+125%, ×2.25)
  extraTotal += makeEntry(
    'Recargo nocturno + festivo', holidayNightSurcharge,
    RATES.MULTIPLIERS.HOLIDAY_NIGHT, RATES.SURCHARGES.HOLIDAY_NIGHT * 100,
    'CST Art. 168, 179', false,
  );

  // 6. Holiday day overtime (+115%, ×2.15)
  extraTotal += makeEntry(
    'Hora extra diurna dom/fest', holidayDayOT,
    RATES.MULTIPLIERS.HOLIDAY_OT_DAY, RATES.SURCHARGES.HOLIDAY_OT_DAY * 100,
    'CST Art. 179, Ley 2466', true,
  );

  // 7. Holiday night overtime (+165%, ×2.65)
  extraTotal += makeEntry(
    'Hora extra nocturna dom/fest', holidayNightOT,
    RATES.MULTIPLIERS.HOLIDAY_OT_NIGHT, RATES.SURCHARGES.HOLIDAY_OT_NIGHT * 100,
    'CST Art. 179, Ley 2466', true,
  );

  const grandTotal = basePay + transport + extraTotal;

  return {
    basePay,
    transport,
    hourValue,
    entries,
    extraTotal,
    grandTotal,
    salary,
    totalOT: dayOT + nightOT + holidayDayOT + holidayNightOT,
    totalSurchargeHours: nightSurcharge + holidaySurcharge + holidayNightSurcharge,
  };
}
