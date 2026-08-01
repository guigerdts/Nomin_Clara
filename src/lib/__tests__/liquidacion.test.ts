import { describe, it, expect } from 'vitest';
import { TRANSPORT_ALLOWANCE_2026 } from '../constants';
import type { LiquidacionInputs } from '../types';
import {
  countCommercialDays,
  detectSemester,
  semesterOverlapDays,
  formatCOPExact,
  calculateCesantias,
  calculateIntereses,
  calculatePrima,
  calculateVacaciones,
  calculateLiquidacion,
} from '../liquidacion';

describe('countCommercialDays', () => {
  it('counts 7 full months as 210 days (01-ene → 31-jul-2026)', () => {
    expect(countCommercialDays('2026-01-01', '2026-07-31')).toBe(210);
  });

  it('counts one full month as 30 days with inclusive boundaries (01-ene → 31-ene)', () => {
    expect(countCommercialDays('2026-01-01', '2026-01-31')).toBe(30);
  });

  it('returns 0 when start equals end', () => {
    expect(countCommercialDays('2026-07-31', '2026-07-31')).toBe(0);
  });

  it('counts a partial start month as its actual days (15-ene → 31-jul = 6×30 + 17 = 197)', () => {
    expect(countCommercialDays('2026-01-15', '2026-07-31')).toBe(197);
  });
});

describe('detectSemester', () => {
  it('returns 1 for end dates in January through June', () => {
    expect(detectSemester('2026-06-30')).toBe(1);
  });

  it('returns 2 for end dates in July through December', () => {
    expect(detectSemester('2026-12-31')).toBe(2);
  });
});

describe('semesterOverlapDays', () => {
  it('returns 180 for a full first semester (01-ene → 30-jun)', () => {
    expect(semesterOverlapDays('2026-01-01', '2026-06-30')).toBe(180);
  });

  it('returns 180 for a full second semester (01-ene → 31-dic, overlap = jul-dic)', () => {
    expect(semesterOverlapDays('2026-01-01', '2026-12-31')).toBe(180);
  });

  it('returns 30 for a period ending in the first month of semester 2 (01-ene → 31-jul)', () => {
    expect(semesterOverlapDays('2026-01-01', '2026-07-31')).toBe(30);
  });
});

describe('formatCOPExact', () => {
  it('formats with es-CO thousands separators and 2 decimals', () => {
    expect(formatCOPExact(1_166_666.6667)).toBe('$1.166.666,67');
  });

  it('rounds half-cent values to 2 decimals ($510.680,63)', () => {
    expect(formatCOPExact(510_680.625)).toBe('$510.680,63');
  });

  it('formats zero with two decimals', () => {
    expect(formatCOPExact(0)).toBe('$0,00');
  });
});

describe('calculateCesantias', () => {
  it('computes (salario + auxilio) × días ÷ 360 → $1.166.666,67', () => {
    // (1.750.905 + 249.095) × 210 ÷ 360 = 2.000.000 × 210 ÷ 360
    expect(calculateCesantias(1_750_905, 249_095, 210)).toBeCloseTo(1_166_666.67, 2);
  });

  it('returns 0 when salary is 0', () => {
    expect(calculateCesantias(0, 0, 210)).toBe(0);
  });
});

describe('calculateIntereses', () => {
  it('computes cesantías × 12% × (días ÷ 360) → $81.666,67', () => {
    expect(calculateIntereses(1_166_666.6667, 210)).toBeCloseTo(81_666.67, 2);
  });

  it('returns 0 when days are 0', () => {
    expect(calculateIntereses(1_000_000, 0)).toBe(0);
  });
});

describe('calculatePrima', () => {
  it('computes (salario + auxilio) × días del semestre ÷ 360 → $166.666,67', () => {
    // 2.000.000 × 30 ÷ 360 (semestre jul-dic, overlap jul = 1 mes comercial)
    expect(calculatePrima(1_750_905, 249_095, 30)).toBeCloseTo(166_666.67, 2);
  });

  it('returns $1.000.000 for a full 180-day semester', () => {
    expect(calculatePrima(1_750_905, 249_095, 180)).toBeCloseTo(1_000_000, 2);
  });

  it('returns 0 when no days overlap the end-date semester', () => {
    expect(calculatePrima(2_000_000, 249_095, 0)).toBe(0);
  });
});

describe('calculateVacaciones', () => {
  it('computes (salario sin auxilio) × días ÷ 720 − disfrutados → $510.680,63', () => {
    // Raw amount is exactly 510.680,625; the pinned $510.680,63 is the
    // display value after formatCOPExact rounding (pinned separately below).
    expect(calculateVacaciones(1_750_905, 210, 0)).toBeCloseTo(510_680.625, 2);
    expect(formatCOPExact(calculateVacaciones(1_750_905, 210, 0))).toBe('$510.680,63');
  });

  it('does NOT clamp a negative net when días disfrutados exceed accrued days', () => {
    const result = calculateVacaciones(1_750_905, 210, 600_000);
    expect(result).toBeLessThan(0);
    expect(result).toBeCloseTo(510_680.625 - 600_000, 2);
  });
});

describe('calculateLiquidacion', () => {
  const workedExample: LiquidacionInputs = {
    startDate: '2026-01-01',
    endDate: '2026-07-31',
    salary: 1_750_905,
    daysTaken: 0,
  };

  it('derives auxilio automatically via getTransportAllowance and sets Aplica', () => {
    const result = calculateLiquidacion(workedExample);
    expect(result.auxilio).toBe(TRANSPORT_ALLOWANCE_2026); // 249.095
    expect(result.appliesTransport).toBe(true);
  });

  it('sets No aplica (auxilio 0) for salary above 2 SMMLV', () => {
    const result = calculateLiquidacion({ ...workedExample, salary: 4_000_000 });
    expect(result.auxilio).toBe(0);
    expect(result.appliesTransport).toBe(false);
    // The formula reflects the real inputs, including the zero auxilio.
    expect(result.lines[0].formula).toBe('(4.000.000 + 0) × 210 ÷ 360');
  });

  it('aggregates days, semester and 4 concept lines for the worked example', () => {
    const result = calculateLiquidacion(workedExample);
    expect(result.days).toBe(210);
    expect(result.semester).toBe(2);
    expect(result.semesterDays).toBe(30);

    expect(result.lines).toHaveLength(4);
    expect(result.lines[0]).toMatchObject({
      concepto: 'Cesantías',
      formula: '(1.750.905 + 249.095) × 210 ÷ 360',
      legalRef: 'CST Art. 249',
    });
    expect(result.lines[0].amount).toBeCloseTo(1_166_666.67, 2);

    expect(result.lines[1]).toMatchObject({
      concepto: 'Intereses sobre cesantías',
      formula: '1.166.666,67 × 12% × 210 ÷ 360',
      legalRef: 'Ley 52 de 1975',
    });
    expect(result.lines[1].amount).toBeCloseTo(81_666.67, 2);

    expect(result.lines[2]).toMatchObject({
      concepto: 'Prima de servicios',
      formula: '(1.750.905 + 249.095) × 30 ÷ 360',
      legalRef: 'CST Art. 306',
    });
    expect(result.lines[2].amount).toBeCloseTo(166_666.67, 2);

    expect(result.lines[3]).toMatchObject({
      concepto: 'Vacaciones',
      formula: '1.750.905 × 210 ÷ 720 − 0',
      legalRef: 'CST Art. 186',
    });
    // Raw amount is exactly 510.680,625; display rounds to the pinned $510.680,63.
    expect(result.lines[3].amount).toBeCloseTo(510_680.625, 2);
    expect(formatCOPExact(result.lines[3].amount)).toBe('$510.680,63');
  });

  it('counts only ene-jun days for a period ending 30-jun (180-day semester prima)', () => {
    const result = calculateLiquidacion({ ...workedExample, endDate: '2026-06-30' });
    expect(result.semester).toBe(1);
    expect(result.semesterDays).toBe(180);
    const prima = result.lines.find(line => line.concepto === 'Prima de servicios');
    expect(prima!.amount).toBeCloseTo(1_000_000, 2);
  });

  it('warns when the period spans two semesters (prima = current semester only)', () => {
    const result = calculateLiquidacion(workedExample);
    const prima = result.lines.find(line => line.concepto === 'Prima de servicios');
    expect(prima).toBeDefined();
    expect(prima!.warning).toBe(
      'Esto es solo la prima del semestre en curso — si el semestre anterior no se pagó, agrégalo aparte',
    );
  });

  it('warns neutrally when vacaciones net is negative', () => {
    const result = calculateLiquidacion({ ...workedExample, daysTaken: 600_000 });
    const vacaciones = result.lines.find(line => line.concepto === 'Vacaciones');
    expect(vacaciones).toBeDefined();
    expect(vacaciones!.amount).toBeLessThan(0);
    expect(vacaciones!.warning).toBe(
      'Tomaste más vacaciones de las que tenías acumuladas — esto puede generar un descuento en tu liquidación, verifícalo con RR.HH.',
    );
  });

  it('totals the four concept lines', () => {
    const result = calculateLiquidacion(workedExample);
    const sum = result.lines.reduce((acc, line) => acc + line.amount, 0);
    expect(result.total).toBeCloseTo(sum, 2);
  });
});
