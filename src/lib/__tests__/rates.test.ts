import { describe, it, expect } from 'vitest';
import {
  calculateBreakdown,
  validateOTLimits,
  formatCOP,
  getOrdinaryHourValue,
  getTransportAllowance,
  SMMLV,
  RATES,
} from '../rates';
import type { PayrollInput } from '../types';

describe('getOrdinaryHourValue', () => {
  it('calculates hourly value from monthly salary', () => {
    // SMMLV / 30 / 7 = 1423500 / 30 / 7 = 6778.57...
    const result = getOrdinaryHourValue(SMMLV);
    expect(result).toBeCloseTo(6778.5714, 1);
  });

  it('returns 0 for zero salary', () => {
    expect(getOrdinaryHourValue(0)).toBe(0);
  });

  it('returns 0 for negative salary', () => {
    expect(getOrdinaryHourValue(-1000)).toBe(0);
  });
});

describe('getTransportAllowance', () => {
  it('returns allowance for salary ≤ 2 SMMLV', () => {
    expect(getTransportAllowance(SMMLV)).toBe(RATES.TRANSPORT_ALLOWANCE_VALUE);
    expect(getTransportAllowance(SMMLV * 2)).toBe(RATES.TRANSPORT_ALLOWANCE_VALUE);
  });

  it('returns 0 for salary > 2 SMMLV', () => {
    expect(getTransportAllowance(SMMLV * 2 + 1)).toBe(0);
  });

  it('returns 0 for zero salary', () => {
    expect(getTransportAllowance(0)).toBe(0);
  });
});

describe('formatCOP', () => {
  it('formats a normal value', () => {
    const result = formatCOP(1234567.89);
    expect(result).toBe('$1.234.568');
  });

  it('formats zero', () => {
    expect(formatCOP(0)).toBe('$0');
  });

  it('handles NaN', () => {
    expect(formatCOP(NaN)).toBe('$0');
  });

  it('handles nullish via NaN', () => {
    // @ts-expect-error — testing runtime edge case
    expect(formatCOP(null)).toBe('$0');
  });

  it('formats small values', () => {
    expect(formatCOP(500)).toBe('$500');
  });

  it('formats large COP values', () => {
    expect(formatCOP(10000000)).toBe('$10.000.000');
  });
});

describe('validateOTLimits', () => {
  it('returns valid when all within limits', () => {
    const result = validateOTLimits(10, 5, 2, 1);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it('returns warning when day OT exceeds daily limit (~20h per category)', () => {
    const result = validateOTLimits(30, 0, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
    expect(result.warnings[0]).toContain('diurnas');
  });

  it('returns warning when night OT exceeds limit', () => {
    const result = validateOTLimits(0, 30, 0, 0);
    expect(result.valid).toBe(false);
    expect(result.warnings[0]).toContain('nocturnas');
  });

  it('returns warning when total exceeds weekly limit (~24h per fortnight)', () => {
    const result = validateOTLimits(10, 10, 5, 5);
    expect(result.valid).toBe(false);
    const weeklyWarnings = result.warnings.filter(w => w.includes('horas extra/semana'));
    expect(weeklyWarnings.length).toBeGreaterThanOrEqual(1);
  });

  it('generates multiple warnings when multiple categories exceed', () => {
    const result = validateOTLimits(30, 30, 0, 0);
    expect(result.warnings.length).toBeGreaterThanOrEqual(2);
  });

  it('handles all zeros as valid', () => {
    expect(validateOTLimits(0, 0, 0, 0).valid).toBe(true);
  });
});

describe('calculateBreakdown', () => {
  const baseInput: PayrollInput = {
    salary: SMMLV,
    dayOT: 0,
    nightOT: 0,
    holidayDayOT: 0,
    holidayNightOT: 0,
    nightSurcharge: 0,
    holidaySurcharge: 0,
    holidayNightSurcharge: 0,
  };

  it('returns base pay only when no extra hours', () => {
    const result = calculateBreakdown(baseInput);
    expect(result.basePay).toBeCloseTo(SMMLV / 2, 0);
    expect(result.transport).toBe(RATES.TRANSPORT_ALLOWANCE_VALUE);
    expect(result.extraTotal).toBe(0);
    expect(result.grandTotal).toBeCloseTo(SMMLV / 2 + RATES.TRANSPORT_ALLOWANCE_VALUE, 0);
    expect(result.entries).toHaveLength(0);
  });

  it('calculates day OT correctly', () => {
    const input = { ...baseInput, dayOT: 10 };
    const result = calculateBreakdown(input);
    const hourValue = getOrdinaryHourValue(SMMLV);
    const expectedSubtotal = 10 * hourValue * RATES.MULTIPLIERS.OT_DAY;

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].label).toBe('Hora extra diurna');
    expect(result.entries[0].subtotal).toBeCloseTo(expectedSubtotal, 0);
    expect(result.extraTotal).toBeCloseTo(expectedSubtotal, 0);
    expect(result.totalOT).toBe(10);
  });

  it('calculates night surcharge as only the surplus (not full value)', () => {
    const input = { ...baseInput, nightSurcharge: 10 };
    const result = calculateBreakdown(input);
    const hourValue = getOrdinaryHourValue(SMMLV);
    const expectedSurchargeOnly = 10 * hourValue * (RATES.MULTIPLIERS.NIGHT - 1);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].label).toBe('Recargo nocturno');
    expect(result.extraTotal).toBeCloseTo(expectedSurchargeOnly, 0);
  });

  it('calculates all 7 concepts when all inputs provided', () => {
    const input: PayrollInput = {
      salary: SMMLV * 3, // above transport threshold
      dayOT: 10,
      nightOT: 5,
      holidayDayOT: 3,
      holidayNightOT: 2,
      nightSurcharge: 8,
      holidaySurcharge: 4,
      holidayNightSurcharge: 2,
    };
    const result = calculateBreakdown(input);

    expect(result.entries).toHaveLength(7);
    expect(result.transport).toBe(0); // above 2 SMMLV
    expect(result.grandTotal).toBeGreaterThan(result.basePay);
  });

  it('calculates grand total as basePay + transport + extraTotal', () => {
    const input: PayrollInput = {
      salary: 2000000,
      dayOT: 8,
      nightOT: 4,
      holidayDayOT: 0,
      holidayNightOT: 0,
      nightSurcharge: 6,
      holidaySurcharge: 0,
      holidayNightSurcharge: 0,
    };
    const result = calculateBreakdown(input);
    expect(result.grandTotal).toBeCloseTo(
      result.basePay + result.transport + result.extraTotal,
      0,
    );
  });

  it('accumulates correct totalOT and totalSurchargeHours', () => {
    const input: PayrollInput = {
      salary: SMMLV,
      dayOT: 10,
      nightOT: 5,
      holidayDayOT: 3,
      holidayNightOT: 2,
      nightSurcharge: 8,
      holidaySurcharge: 4,
      holidayNightSurcharge: 2,
    };
    const result = calculateBreakdown(input);
    expect(result.totalOT).toBe(10 + 5 + 3 + 2);
    expect(result.totalSurchargeHours).toBe(8 + 4 + 2);
  });

  it('sets legal references on each entry', () => {
    const input = { ...baseInput, dayOT: 5 };
    const result = calculateBreakdown(input);
    expect(result.entries[0].legalRef).toBe('CST Art. 179');
  });

  it('zero hours for salary = 0 returns all zeros', () => {
    const input = { ...baseInput, salary: 0 };
    const result = calculateBreakdown(input);
    expect(result.basePay).toBe(0);
    expect(result.hourValue).toBe(0);
    expect(result.transport).toBe(0);
  });
});
