/**
 * deductions.ts
 *
 * Pure functions for payroll deductions on the monthly salary.
 * These are the legally mandated deductions subtracted from the devengado
 * (gross pay) to arrive at the net pay.
 *
 * All functions are monthly-basis. The calling code divides by 2 for
 * quincena (fortnight) display.
 *
 * References:
 *   - Health 4% + Pension 4%: Ley 100/1993
 *   - Fondo Solidaridad Pensional: Art. 27 Ley 100/1993, Art. 8 Ley 797/2003,
 *     Decreto 1833/2016 (tarifa progresiva 1%–2%)
 *   - Retefuente: Art. 383 ET, Art. 206 num. 10 ET (Ley 2277/2022)
 *   - SMMLV 2026: $1.750.905 (Decreto 1469/2025)
 *   - UVT 2026: $52.374 (Res. DIAN 000238/2025)
 */

import type { DeductionsBreakdown, DeductionsInput, DeductionSplitMode } from './types';
import { SMMLV, UVT_2026 } from './constants';

/** Art. 206 num. 10 ET — 25% renta exenta, tope 790 UVT/año */
export const RENTA_EXENTA_ANNUAL_UVT = 790;
export const RENTA_EXENTA_MONTHLY_UVT = RENTA_EXENTA_ANNUAL_UVT / 12;

/** Umbral retefuente: 95 UVT mensuales */
export const RETEFUENTE_THRESHOLD_UVT = 95;

// ─── Helpers ────────────────────────────────────────────────────────────────

function toUVT(amount: number): number {
  return amount / UVT_2026;
}

function fromUVT(uvt: number): number {
  return uvt * UVT_2026;
}

/** Art. 206 num. 10 — 25% exenta mensual con tope */
function rentaExenta25(ingresoNeto: number): number {
  const pct = ingresoNeto * 0.25;
  const cap = fromUVT(RENTA_EXENTA_MONTHLY_UVT);
  return Math.min(pct, cap);
}

/**
 * Returns the per-quincena amount for a deduction given the split mode.
 *
 * @param amount Monthly deduction amount
 * @param mode   Split mode: 'even' → half, 'second-fortnight' → full, 'first-fortnight' → full
 * @returns Amount that applies to the current quincena
 */
export function quincenaShare(amount: number, mode: DeductionSplitMode): number {
  switch (mode) {
    case 'even':
      return amount / 2;
    case 'second-fortnight':
      return amount;
    case 'first-fortnight':
      return amount;
  }
}

// ─── Public Functions ───────────────────────────────────────────────────────

/**
 * 1. Salud (4%) + Pensión (4%) = 8% del salario base.
 * Siempre aplican.
 */
export function calculateHealthPension(monthlySalary: number): {
  applies: boolean;
  health: number;
  pension: number;
  total: number;
} {
  const health = monthlySalary * 0.04;
  const pension = monthlySalary * 0.04;
  return { applies: true, health, pension, total: health + pension };
}

/**
 * 2. Fondo de Solidaridad Pensional (FSP) — Art. 8 Ley 797/2003.
 *
 * Solo aplica cuando monthlySalary ≥ 4 SMMLV.
 * Tarifa progresiva sobre el IBC (salario mensual):
 *
 * | Rango (SMMLV)        | Tarifa |
 * |----------------------|--------|
 * | < 4                  | 0%     |
 * | >= 4  y < 16        | 1.0%   |
 * | >= 16 y < 17        | 1.2%   |
 * | >= 17 y < 18        | 1.4%   |
 * | >= 18 y < 19        | 1.6%   |
 * | >= 19 y < 20        | 1.8%   |
 * | >= 20               | 2.0%   |
 *
 * @param monthlySalary Salario mensual base (IBC)
 * @param smmlv Valor SMMLV vigente (default 2026)
 */
export function calculateSolidarityFund(
  monthlySalary: number,
  smmlv: number = SMMLV,
): {
  applies: boolean;
  percentage: number;
  amount: number;
  range: string;
} {
  const smmlvCount = monthlySalary / smmlv;

  if (smmlvCount < 4) {
    return { applies: false, percentage: 0, amount: 0, range: 'Menos de 4 SMMLV' };
  }

  let percentage: number;
  let range: string;

  if (smmlvCount < 16) {
    percentage = 0.01;
    range = '4 a <16 SMMLV';
  } else if (smmlvCount < 17) {
    percentage = 0.012;
    range = '16 a <17 SMMLV';
  } else if (smmlvCount < 18) {
    percentage = 0.014;
    range = '17 a <18 SMMLV';
  } else if (smmlvCount < 19) {
    percentage = 0.016;
    range = '18 a <19 SMMLV';
  } else if (smmlvCount < 20) {
    percentage = 0.018;
    range = '19 a <20 SMMLV';
  } else {
    percentage = 0.02;
    range = '20+ SMMLV';
  }

  const amount = monthlySalary * percentage;

  return {
    applies: true,
    percentage,
    amount,
    range,
  };
}

/**
 * 3. Retención en la fuente estimada — Art. 383 ET.
 *
 * Depuración simplificada (mensual):
 *   1. Salario bruto mensual
 *   2. - Aportes obligatorios (salud 4% + pensión 4%)
 *   3. = Ingreso neto
 *   4. - Renta exenta del 25% (Art. 206 num. 10, tope 65.83 UVT/mes)
 *   5. = Base gravable depurada
 *   6. Si baseDepurada > 95 UVT → aplicar tabla progresiva Art. 383
 *
 * ADVERTENCIA: Esto es un estimado simplificado. El cálculo real depende de
 * rentas exentas adicionales, deducciones por dependientes, intereses
 * hipotecarios, medicina prepagada, etc. (Arts. 387-388 ET).
 *
 * @param monthlySalary Salario mensual bruto antes de cualquier deducción
 */
export function estimateRetefuente(
  monthlySalary: number,
): {
  applies: boolean;
  baseDepurada: number;
  amount: number;
  warningMessage: string;
} {
  // 1. Aportes obligatorios (salud 4% + pensión 4%)
  const aportes = monthlySalary * 0.08;

  // 2. Ingreso neto
  const ingresoNeto = monthlySalary - aportes;

  // 3. Renta exenta 25% (con tope)
  const exenta = rentaExenta25(ingresoNeto);

  // 4. Base depurada
  const baseDepurada = ingresoNeto - exenta;

  // 5. Umbral: 95 UVT
  const baseUvt = toUVT(baseDepurada);

  if (baseUvt <= RETEFUENTE_THRESHOLD_UVT) {
    return {
      applies: false,
      baseDepurada: 0,
      amount: 0,
      warningMessage: '',
    };
  }

  // 6. Aplicar tabla Art. 383
  let taxUvt = 0;

  if (baseUvt <= 150) {
    // >95 – 150: 19%
    taxUvt = (baseUvt - 95) * 0.19;
  } else if (baseUvt <= 360) {
    // >150 – 360: 28%
    taxUvt = (baseUvt - 150) * 0.28 + 10;
  } else if (baseUvt <= 640) {
    // >360 – 640: 33%
    taxUvt = (baseUvt - 360) * 0.33 + 69;
  } else if (baseUvt <= 945) {
    // >640 – 945: 35%
    taxUvt = (baseUvt - 640) * 0.35 + 162;
  } else if (baseUvt <= 2300) {
    // >945 – 2300: 37%
    taxUvt = (baseUvt - 945) * 0.37 + 268;
  } else {
    // >2300: 39%
    taxUvt = (baseUvt - 2300) * 0.39 + 770;
  }

  const amount = fromUVT(taxUvt);

  return {
    applies: true,
    baseDepurada,
    amount,
    warningMessage:
      'Estimado aproximado — para tu caso real, tu área de nómina depura ' +
      'renta exenta, dependientes, intereses hipotecarios y otros factores ' +
      'que esta calculadora no considera. Verificá con RR.HH.',
  };
}

/**
 * 4. Computes the full DeductionsBreakdown from user input and salary.
 *
 * @param monthlySalary Salario mensual base (IBC)
 * @param input User's deduction preferences/amounts
 * @returns Complete deductions breakdown
 */
export function computeDeductions(
  monthlySalary: number,
  input: DeductionsInput,
): DeductionsBreakdown {
  const items: { label: string; amount: number; legalRef?: string }[] = [];

  // Health + Pension (4%+4%)
  const healthPension = calculateHealthPension(monthlySalary);
  if (!input.includeHealthPension) {
    healthPension.health = 0;
    healthPension.pension = 0;
    healthPension.total = 0;
    healthPension.applies = false;
  }
  if (healthPension.total > 0) {
    items.push({ label: 'Salud (4%)', amount: healthPension.health, legalRef: 'Ley 100/1993' });
    items.push({ label: 'Pensión (4%)', amount: healthPension.pension, legalRef: 'Ley 100/1993' });
  }

  // Solidarity Fund
  const solidarityFund = calculateSolidarityFund(monthlySalary);
  if (solidarityFund.applies && solidarityFund.amount > 0) {
    items.push({
      label: `Fondo Solidaridad Pensional (${(solidarityFund.percentage * 100).toFixed(1)}%)`,
      amount: solidarityFund.amount,
      legalRef: 'Art. 8 Ley 797/2003',
    });
  }

  // Retefuente (optional — user toggles this)
  const retefuente = input.includeRetefuente
    ? estimateRetefuente(monthlySalary)
    : { applies: false, baseDepurada: 0, amount: 0, warningMessage: '' };
  if (retefuente.applies && retefuente.amount > 0) {
    items.push({ label: 'Retención en la fuente', amount: retefuente.amount, legalRef: 'Art. 383 ET' });
  }

  // Other deductions (user-entered amounts)
  const otherEmbargo = Math.max(0, input.embargoAmount || 0);
  const otherLoan = Math.max(0, input.loanAmount || 0);
  const otherLabel = (input.otherDeductionsLabel || '').trim() || 'Otros descuentos';
  const otherAmount = Math.max(0, input.otherDeductions || 0);

  const otherTotal = otherEmbargo + otherLoan + otherAmount;

  if (otherEmbargo > 0) {
    items.push({ label: 'Embargo', amount: otherEmbargo });
  }
  if (otherLoan > 0) {
    items.push({ label: 'Préstamo / Libranza', amount: otherLoan });
  }
  if (otherAmount > 0) {
    items.push({ label: otherLabel, amount: otherAmount });
  }

  const totalDeductions =
    healthPension.total +
    solidarityFund.amount +
    retefuente.amount +
    otherTotal;

  return {
    healthPension: {
      applies: healthPension.applies,
      health: healthPension.health,
      pension: healthPension.pension,
      total: healthPension.total,
    },
    solidarityFund: {
      applies: solidarityFund.applies,
      percentage: solidarityFund.percentage,
      amount: solidarityFund.amount,
      range: solidarityFund.range,
    },
    retefuente: {
      applies: retefuente.applies,
      baseDepurada: retefuente.baseDepurada,
      amount: retefuente.amount,
      warningMessage: retefuente.warningMessage,
    },
    otherDeductions: {
      embargo: otherEmbargo,
      loan: otherLoan,
      other: otherAmount,
      otherLabel,
      total: otherTotal,
    },
    items,
    totalDeductions,
    netPay: 0, // filled by caller who has devengado
  };
}

/**
 * Calculates the fortnight net pay.
 *
 * @param devengado Fortnight gross pay from calculateBreakdown().grandTotal
 * @param deductions DeductionsBreakdown (monthly values)
 * @returns Net pay for the fortnight
 */
export function calculateNetPay(
  devengado: number,
  deductions: DeductionsBreakdown,
  splitMode?: DeductionSplitMode,
): {
  netPay: number;
  quincenaDeductions: number;
  appliedMode: DeductionSplitMode;
} {
  const mode = splitMode ?? 'even';
  const quincenaDeductions = quincenaShare(deductions.totalDeductions, mode);
  const netPay = devengado - quincenaDeductions;
  return { netPay, quincenaDeductions, appliedMode: mode };
}
