import { describe, it, expect } from 'vitest';
import {
  calculateHealthPension,
  calculateSolidarityFund,
  estimateRetefuente,
  computeDeductions,
  calculateNetPay,
  quincenaShare,
  SMMLV_2026,
  UVT_2026,
} from '../deductions';
import type { DeductionsInput } from '../types';

// ─── calculateHealthPension ────────────────────────────────────────────────

describe('calculateHealthPension', () => {
  it('calculates 4% health + 4% pension = 8% total', () => {
    const result = calculateHealthPension(2_600_000);
    expect(result.health).toBe(104_000);   // 2.6M × 0.04
    expect(result.pension).toBe(104_000);  // 2.6M × 0.04
    expect(result.total).toBe(208_000);    // 2.6M × 0.08
    expect(result.applies).toBe(true);
  });

  it('works with salario minimo', () => {
    const result = calculateHealthPension(SMMLV_2026);
    expect(result.total).toBe(SMMLV_2026 * 0.08);
  });

  it('works with zero salary', () => {
    const result = calculateHealthPension(0);
    expect(result.health).toBe(0);
    expect(result.pension).toBe(0);
    expect(result.total).toBe(0);
  });
});

// ─── calculateSolidarityFund ──────────────────────────────────────────────

describe('calculateSolidarityFund', () => {
  const smmlv = SMMLV_2026; // 1.750.905

  it('returns 0% for salary < 4 SMMLV', () => {
    const result = calculateSolidarityFund(3_000_000, smmlv);
    expect(result.applies).toBe(false);
    expect(result.percentage).toBe(0);
    expect(result.amount).toBe(0);
    expect(result.range).toBe('Menos de 4 SMMLV');
  });

  it('returns 1% for 4–16 SMMLV (boundary at exactly 4)', () => {
    const salary = smmlv * 4; // 7.003.620
    const result = calculateSolidarityFund(salary, smmlv);
    expect(result.applies).toBe(true);
    expect(result.percentage).toBe(0.01);
    expect(result.amount).toBeCloseTo(salary * 0.01);
    expect(result.range).toBe('4 a <16 SMMLV');
  });

  it('returns 1% for 4–16 SMMLV (mid-range)', () => {
    const salary = smmlv * 10; // 17.509.050
    const result = calculateSolidarityFund(salary, smmlv);
    expect(result.applies).toBe(true);
    expect(result.percentage).toBe(0.01);
    expect(result.amount).toBeCloseTo(salary * 0.01);
  });

  it('returns 1.2% for exactly 16 SMMLV (boundary — inclusive of >=16)', () => {
    const salary = smmlv * 16; // 28.014.480
    const result = calculateSolidarityFund(salary, smmlv);
    expect(result.applies).toBe(true);
    expect(result.percentage).toBe(0.012);
    expect(result.range).toBe('16 a <17 SMMLV');
  });

  it('returns 1.2% for 16–17 SMMLV', () => {
    const salary = smmlv * 16.5;
    const result = calculateSolidarityFund(salary, smmlv);
    expect(result.percentage).toBe(0.012);
    expect(result.range).toBe('16 a <17 SMMLV');
  });

  it('returns 1.4% for 17–18 SMMLV', () => {
    const salary = smmlv * 17.5;
    const result = calculateSolidarityFund(salary, smmlv);
    expect(result.percentage).toBe(0.014);
    expect(result.range).toBe('17 a <18 SMMLV');
  });

  it('returns 1.6% for 18–19 SMMLV', () => {
    const salary = smmlv * 18.5;
    const result = calculateSolidarityFund(salary, smmlv);
    expect(result.percentage).toBe(0.016);
    expect(result.range).toBe('18 a <19 SMMLV');
  });

  it('returns 1.8% for 19–20 SMMLV', () => {
    const salary = smmlv * 19.5;
    const result = calculateSolidarityFund(salary, smmlv);
    expect(result.percentage).toBe(0.018);
    expect(result.range).toBe('19 a <20 SMMLV');
  });

  it('returns 2% for 20+ SMMLV', () => {
    const salary = smmlv * 25;
    const result = calculateSolidarityFund(salary, smmlv);
    expect(result.percentage).toBe(0.02);
    expect(result.range).toBe('20+ SMMLV');
  });

  it('uses default SMMLV when not specified', () => {
    const salary = 10_000_000;
    const result = calculateSolidarityFund(salary);
    // 10M / 1.750.905 ≈ 5.71 SMMLV → 1%
    expect(result.applies).toBe(true);
    expect(result.percentage).toBe(0.01);
  });

  it('handles very large salaries correctly', () => {
    const salary = smmlv * 50; // 87.545.250
    const result = calculateSolidarityFund(salary, smmlv);
    expect(result.percentage).toBe(0.02);
    expect(result.amount).toBe(salary * 0.02);
  });
});

// ─── estimateRetefuente ────────────────────────────────────────────────────

describe('estimateRetefuente', () => {
  it('returns 0 for salary below minimum threshold (<= 95 UVT after depuracion)', () => {
    // SMMLV: 1.750.905 → neto after aportes: 1.610.832.6 → 25% exenta: ~402.708
    // base: ~1.208.124 → UVT: ~23.07 → under 95
    const result = estimateRetefuente(SMMLV_2026);
    expect(result.applies).toBe(false);
    expect(result.amount).toBe(0);
    expect(result.baseDepurada).toBe(0);
  });

  it('returns 0 for salary around $4.5M (still under threshold)', () => {
    // ~$4.5M → neto ~4.14M → exenta 25%: ~1.035M → base ~3.105M → UVT ~59.3 → under 95
    const result = estimateRetefuente(4_500_000);
    expect(result.applies).toBe(false);
    expect(result.amount).toBe(0);
  });

  it('starts applying retefuente around $7.5M+', () => {
    // 7.500.000 → neto 6.900.000 → exenta 25% = ~1.725.000 (capped at 3.447.955... no cap)
    // base: 6.900.000 - 1.725.000 = 5.175.000 → UVT: 98.8 → just over 95
    const result = estimateRetefuente(7_500_000);
    expect(result.applies).toBe(true);
    expect(result.amount).toBeGreaterThan(0);
    expect(result.warningMessage).toBeTruthy();
  });

  it('applies 19% bracket (>95–150 UVT)', () => {
    // 10.000.000 → neto 9.200.000 → exenta 25%: 2.300.000 (under cap)
    // base: 6.900.000 → UVT: 131.7 → >95, ≤150 → 19%
    const result = estimateRetefuente(10_000_000);
    expect(result.applies).toBe(true);
    expect(result.amount).toBeGreaterThan(0);
    // Verify it's in 19% range
    const expectedBaseUvt = 131.74;
    const expectedTaxUvt = (expectedBaseUvt - 95) * 0.19;
    const expectedTax = Math.round(expectedTaxUvt * UVT_2026);
    expect(result.amount).toBeCloseTo(expectedTax, -4); // within ~10k
  });

  it('applies 28% bracket (>150–360 UVT)', () => {
    // 15.000.000 → neto 13.800.000 → exenta 25%: 3.447.955 → (capped)
    // base: 13.800.000 - 3.447.955 = 10.352.045 → UVT: 197.65 → >150, ≤360 → 28%
    const result = estimateRetefuente(15_000_000);
    expect(result.applies).toBe(true);
    const baseUvt = result.baseDepurada / UVT_2026;
    expect(baseUvt).toBeGreaterThan(150);
    expect(baseUvt).toBeLessThanOrEqual(360);
    // (197.65 - 150) * 0.28 + 10 = 13.342 + 10 = 23.342 UVT
    const expected = Math.round(((197.65 - 150) * 0.28 + 10) * UVT_2026);
    expect(result.amount).toBeCloseTo(expected, -5);
  });

  it('applies 33% bracket (>360–640 UVT)', () => {
    // 30.000.000 → neto 27.600.000 → exenta 25%: 3.447.955 (capped)
    // base: 24.152.045 → UVT: 461.1 → >360, ≤640
    const result = estimateRetefuente(30_000_000);
    expect(result.applies).toBe(true);
    const baseUvt = result.baseDepurada / UVT_2026;
    expect(baseUvt).toBeGreaterThan(360);
    expect(baseUvt).toBeLessThanOrEqual(640);
  });

  it('includes the warning message when retefuente applies', () => {
    const result = estimateRetefuente(10_000_000);
    expect(result.warningMessage).toContain('Estimado aproximado');
    expect(result.warningMessage).toContain('RR.HH');
  });

  it('returns empty warning when retefuente does not apply', () => {
    const result = estimateRetefuente(SMMLV_2026);
    expect(result.warningMessage).toBe('');
  });
});

// ─── computeDeductions ─────────────────────────────────────────────────────

describe('computeDeductions', () => {
  const defaultInput: DeductionsInput = {
    includeHealthPension: true,
    includeRetefuente: false,
    embargoAmount: 0,
    loanAmount: 0,
    otherDeductions: 0,
    otherDeductionsLabel: '',
  };

  it('includes health+pension by default', () => {
    const result = computeDeductions(2_600_000, defaultInput);
    expect(result.healthPension.applies).toBe(true);
    expect(result.healthPension.total).toBe(208_000);
    expect(result.items.some(i => i.label === 'Salud (4%)')).toBe(true);
    expect(result.items.some(i => i.label === 'Pensión (4%)')).toBe(true);
  });

  it('excludes health+pension when toggled off', () => {
    const input: DeductionsInput = { ...defaultInput, includeHealthPension: false };
    const result = computeDeductions(2_600_000, input);
    expect(result.healthPension.applies).toBe(false);
    expect(result.healthPension.total).toBe(0);
    expect(result.items.some(i => i.label === 'Salud (4%)')).toBe(false);
  });

  it('excludes solidarity fund for salary < 4 SMMLV', () => {
    const result = computeDeductions(3_000_000, defaultInput);
    expect(result.solidarityFund.applies).toBe(false);
    expect(result.solidarityFund.amount).toBe(0);
  });

  it('includes solidarity fund for salary >= 4 SMMLV', () => {
    const result = computeDeductions(10_000_000, defaultInput);
    expect(result.solidarityFund.applies).toBe(true);
    expect(result.solidarityFund.percentage).toBe(0.01);
    expect(result.solidarityFund.amount).toBe(10_000_000 * 0.01);
    expect(result.items.some(i => i.label.includes('Fondo Solidaridad'))).toBe(true);
  });

  it('includes retefuente when toggled on and salary exceeds threshold', () => {
    const input: DeductionsInput = { ...defaultInput, includeRetefuente: true };
    const result = computeDeductions(10_000_000, input);
    expect(result.retefuente.applies).toBe(true);
    expect(result.retefuente.amount).toBeGreaterThan(0);
    expect(result.items.some(i => i.label === 'Retención en la fuente')).toBe(true);
  });

  it('does not include retefuente when toggled on but salary too low', () => {
    const input: DeductionsInput = { ...defaultInput, includeRetefuente: true };
    const result = computeDeductions(SMMLV_2026, input);
    expect(result.retefuente.applies).toBe(false);
    expect(result.retefuente.amount).toBe(0);
    expect(result.items.some(i => i.label === 'Retención en la fuente')).toBe(false);
  });

  it('excludes retefuente when toggled off', () => {
    const result = computeDeductions(10_000_000, defaultInput);
    expect(result.retefuente.applies).toBe(false);
    expect(result.retefuente.amount).toBe(0);
  });

  it('includes other deductions when provided', () => {
    const input: DeductionsInput = {
      ...defaultInput,
      embargoAmount: 500_000,
      loanAmount: 200_000,
      otherDeductions: 100_000,
      otherDeductionsLabel: 'Aporte sindical',
    };
    const result = computeDeductions(5_000_000, input);
    expect(result.otherDeductions.embargo).toBe(500_000);
    expect(result.otherDeductions.loan).toBe(200_000);
    expect(result.otherDeductions.other).toBe(100_000);
    expect(result.otherDeductions.otherLabel).toBe('Aporte sindical');
    expect(result.otherDeductions.total).toBe(800_000);
    expect(result.items.some(i => i.label === 'Embargo')).toBe(true);
    expect(result.items.some(i => i.label === 'Préstamo / Libranza')).toBe(true);
    expect(result.items.some(i => i.label === 'Aporte sindical')).toBe(true);
  });

  it('clamps negative deduction values to 0', () => {
    const input: DeductionsInput = {
      ...defaultInput,
      embargoAmount: -500,
      loanAmount: -200,
      otherDeductions: -100,
    };
    const result = computeDeductions(5_000_000, input);
    expect(result.otherDeductions.embargo).toBe(0);
    expect(result.otherDeductions.loan).toBe(0);
    expect(result.otherDeductions.other).toBe(0);
    expect(result.otherDeductions.total).toBe(0);
  });

  it('aggregates totalDeductions correctly', () => {
    const input: DeductionsInput = {
      includeHealthPension: true,
      includeRetefuente: true,
      embargoAmount: 300_000,
      loanAmount: 100_000,
      otherDeductions: 50_000,
      otherDeductionsLabel: '',
    };
    const result = computeDeductions(10_000_000, input);
    // health: 800k, solidarity: 100k, retefuente: >0, other: 450k
    expect(result.totalDeductions).toBeGreaterThan(result.healthPension.total + result.solidarityFund.amount + result.retefuente.amount + 450_000 - 1);
    expect(result.totalDeductions).toBeLessThan(result.healthPension.total + result.solidarityFund.amount + result.retefuente.amount + 450_000 + 1);
  });

  it('shows correct item count for full deductions', () => {
    const input: DeductionsInput = {
      includeHealthPension: true,
      includeRetefuente: true,
      embargoAmount: 300_000,
      loanAmount: 0,
      otherDeductions: 0,
      otherDeductionsLabel: '',
    };
    const result = computeDeductions(10_000_000, input);
    // health(2) + solidarity(1) + retefuente(1) + embargo(1) = 5 items
    expect(result.items.length).toBe(5);
    const labels = result.items.map(i => i.label);
    expect(labels).toContain('Salud (4%)');
    expect(labels).toContain('Pensión (4%)');
  });
});

// ─── quincenaShare ─────────────────────────────────────────────────────────

describe('quincenaShare', () => {
  it('returns half for even mode', () => {
    expect(quincenaShare(1000, 'even')).toBe(500);
  });

  it('returns full amount for second-fortnight mode', () => {
    expect(quincenaShare(1000, 'second-fortnight')).toBe(1000);
  });

  it('returns full amount for first-fortnight mode', () => {
    expect(quincenaShare(1000, 'first-fortnight')).toBe(1000);
  });
});

// ─── calculateNetPay ───────────────────────────────────────────────────────

describe('calculateNetPay', () => {
  it('subtracts half of monthly deductions from devengado (no splitMode — defaults to even)', () => {
    const deductions = computeDeductions(2_600_000, {
      includeHealthPension: true,
      includeRetefuente: false,
      embargoAmount: 0,
      loanAmount: 0,
      otherDeductions: 0,
      otherDeductionsLabel: '',
    });
    // monthly deductions: 208.000 (health+pension)
    // quincena deductions: 104.000
    const devengado = 1_500_000;
    const result = calculateNetPay(devengado, deductions);
    expect(result.quincenaDeductions).toBe(104_000);
    expect(result.netPay).toBe(1_500_000 - 104_000);
    expect(result.appliedMode).toBe('even');
  });

  it('returns devengado unchanged when no deductions apply', () => {
    const deductions = computeDeductions(1_000_000, {
      includeHealthPension: false,
      includeRetefuente: false,
      embargoAmount: 0,
      loanAmount: 0,
      otherDeductions: 0,
      otherDeductionsLabel: '',
    });
    const devengado = 500_000;
    const result = calculateNetPay(devengado, deductions);
    expect(result.quincenaDeductions).toBe(0);
    expect(result.netPay).toBe(devengado);
  });

  it('splits deductions evenly in even mode', () => {
    const deductions = computeDeductions(2_600_000, {
      includeHealthPension: true,
      includeRetefuente: false,
      embargoAmount: 0,
      loanAmount: 0,
      otherDeductions: 0,
      otherDeductionsLabel: '',
    });
    const result = calculateNetPay(1_500_000, deductions, 'even');
    expect(result.quincenaDeductions).toBe(104_000);
    expect(result.netPay).toBe(1_396_000);
    expect(result.appliedMode).toBe('even');
  });

  it('applies full deductions in second-fortnight mode', () => {
    const deductions = computeDeductions(2_600_000, {
      includeHealthPension: true,
      includeRetefuente: false,
      embargoAmount: 0,
      loanAmount: 0,
      otherDeductions: 0,
      otherDeductionsLabel: '',
    });
    const result = calculateNetPay(1_500_000, deductions, 'second-fortnight');
    expect(result.quincenaDeductions).toBe(208_000);
    expect(result.netPay).toBe(1_292_000);
    expect(result.appliedMode).toBe('second-fortnight');
  });

  it('applies full deductions in first-fortnight mode', () => {
    const deductions = computeDeductions(2_600_000, {
      includeHealthPension: true,
      includeRetefuente: false,
      embargoAmount: 0,
      loanAmount: 0,
      otherDeductions: 0,
      otherDeductionsLabel: '',
    });
    const result = calculateNetPay(1_500_000, deductions, 'first-fortnight');
    expect(result.quincenaDeductions).toBe(208_000);
    expect(result.netPay).toBe(1_292_000);
    expect(result.appliedMode).toBe('first-fortnight');
  });

  it('defaults to even mode when no splitMode provided', () => {
    const deductions = computeDeductions(2_600_000, {
      includeHealthPension: true,
      includeRetefuente: false,
      embargoAmount: 0,
      loanAmount: 0,
      otherDeductions: 0,
      otherDeductionsLabel: '',
    });
    const result = calculateNetPay(1_500_000, deductions);
    expect(result.quincenaDeductions).toBe(104_000);
    expect(result.appliedMode).toBe('even');
  });

  it('returns zero quincena deductions when total is 0, even in second-fortnight mode', () => {
    const deductions = computeDeductions(1_000_000, {
      includeHealthPension: false,
      includeRetefuente: false,
      embargoAmount: 0,
      loanAmount: 0,
      otherDeductions: 0,
      otherDeductionsLabel: '',
    });
    const result = calculateNetPay(500_000, deductions, 'second-fortnight');
    expect(result.quincenaDeductions).toBe(0);
    expect(result.netPay).toBe(500_000);
    expect(result.appliedMode).toBe('second-fortnight');
  });
});
