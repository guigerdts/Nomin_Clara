import { describe, it, expect } from 'vitest';
import { SMMLV } from '../constants';
import { formatCOPExact } from '../liquidacion';
import type {
  IndemnizacionFijoInputs,
  IndemnizacionIndefinidoInputs,
  IndemnizacionObraInputs,
} from '../types';
import { calculateIndemnizacion } from '../indemnizacion';

const fijoInputs = (overrides: Partial<IndemnizacionFijoInputs> = {}): IndemnizacionFijoInputs => ({
  type: 'fijo',
  salary: 1_800_000,
  startDate: '2025-06-01',
  plannedEnd: '2026-02-28',
  dismissalDate: '2026-01-01',
  renewals: 0,
  ...overrides,
});

const indefinidoInputs = (
  overrides: Partial<IndemnizacionIndefinidoInputs> = {},
): IndemnizacionIndefinidoInputs => ({
  type: 'indefinido',
  salary: SMMLV,
  serviceStart: '2025-01-01',
  dismissalDate: '2026-06-30',
  ...overrides,
});

const obraInputs = (overrides: Partial<IndemnizacionObraInputs> = {}): IndemnizacionObraInputs => ({
  type: 'obra',
  salary: 1_800_000,
  startDate: '2026-01-01',
  plannedEnd: '2026-01-31',
  dismissalDate: '2026-01-01',
  ...overrides,
});

describe('calculateIndemnizacion — término fijo (CST Art. 64)', () => {
  it('computes 60 días restantes (2 meses) → $3.600.000', () => {
    const result = calculateIndemnizacion(fijoInputs());
    expect(result.type).toBe('fijo');
    expect(result.days).toBe(60);
    expect(result.effectiveDays).toBe(60);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toMatchObject({
      concepto: 'Indemnización por despido sin justa causa',
      formula: '1.800.000 ÷ 30 × 60',
      legalRef: 'CST Art. 64',
    });
    expect(result.lines[0].amount).toBeCloseTo(3_600_000, 2);
    expect(result.total).toBeCloseTo(3_600_000, 2);
    expect(formatCOPExact(result.total)).toBe('$3.600.000,00');
  });

  it('returns 0 + "contrato ya vencido" when the contract expired before dismissal', () => {
    const result = calculateIndemnizacion(
      fijoInputs({ plannedEnd: '2026-01-15', dismissalDate: '2026-02-01' }),
    );
    expect(result.days).toBe(0);
    expect(result.effectiveDays).toBe(0);
    expect(result.lines[0].amount).toBe(0);
    expect(result.lines[0].warning).toBe(
      'Contrato ya vencido al momento del despido — no corresponde indemnización por despido sin justa causa',
    );
    expect(result.total).toBe(0);
    expect(formatCOPExact(result.total)).toBe('$0,00');
  });

  it('shows the Art. 46 CST renewal notice for término fijo', () => {
    const result = calculateIndemnizacion(fijoInputs());
    expect(result.notices).toHaveLength(1);
    expect(result.notices[0].legalRef).toBe('CST Art. 46');
    expect(result.notices[0].text).toContain('máximo 3 prórrogas');
  });

  it('adds the HR advisory when renewals >= 3 (calculation unaffected)', () => {
    const result = calculateIndemnizacion(fijoInputs({ renewals: 4 }));
    expect(result.notices.some(n => n.text.includes('verifícalo con RR.HH.'))).toBe(true);
    expect(result.notices.some(n => n.legalRef === 'CST Art. 46')).toBe(true);
    expect(result.total).toBeCloseTo(3_600_000, 2);
  });

  it('does NOT add the HR advisory when renewals < 3', () => {
    const result = calculateIndemnizacion(fijoInputs({ renewals: 2 }));
    expect(result.notices.some(n => n.text.includes('verifícalo con RR.HH.'))).toBe(false);
  });
});

describe('calculateIndemnizacion — obra o labor (CST Art. 64)', () => {
  it('computes 30 días restantes → $1.800.000', () => {
    const result = calculateIndemnizacion(obraInputs());
    expect(result.days).toBe(30);
    expect(result.effectiveDays).toBe(30);
    expect(result.lines[0]).toMatchObject({
      concepto: 'Indemnización por despido sin justa causa',
      formula: '1.800.000 ÷ 30 × 30',
      legalRef: 'CST Art. 64',
    });
    expect(result.lines[0].amount).toBeCloseTo(1_800_000, 2);
    expect(formatCOPExact(result.total)).toBe('$1.800.000,00');
  });

  it('applies the 15-day floor when only 10 days remain → $900.000', () => {
    const result = calculateIndemnizacion(
      obraInputs({ plannedEnd: '2026-01-19', dismissalDate: '2026-01-10' }),
    );
    expect(result.days).toBe(10);
    expect(result.effectiveDays).toBe(15);
    expect(result.lines[0].formula).toBe('1.800.000 ÷ 30 × 15');
    expect(result.lines[0].amount).toBeCloseTo(900_000, 2);
    expect(formatCOPExact(result.total)).toBe('$900.000,00');
  });

  it('returns 0 with the floor NOT applied when the obra finished before dismissal', () => {
    const result = calculateIndemnizacion(
      obraInputs({ plannedEnd: '2026-01-15', dismissalDate: '2026-02-01' }),
    );
    expect(result.days).toBe(0);
    expect(result.effectiveDays).toBe(0); // NOT 15 — the floor must not apply
    expect(result.lines[0].amount).toBe(0);
    expect(result.lines[0].warning).toBe(
      'Obra ya terminada antes del despido — no corresponde indemnización por despido sin justa causa',
    );
    expect(formatCOPExact(result.total)).toBe('$0,00');
  });
});

describe('calculateIndemnizacion — término indefinido (CST Art. 64)', () => {
  it('540 días at 1 SMMLV → low branch, 40 días → $2.334.540', () => {
    const result = calculateIndemnizacion(indefinidoInputs());
    expect(result.days).toBe(540);
    expect(result.branch).toBe('low');
    expect(result.years).toBe(0.5);
    expect(result.effectiveDays).toBe(40);
    expect(result.lines[0]).toMatchObject({
      concepto: 'Indemnización por despido sin justa causa',
      formula: '1.750.905 ÷ 30 × 40',
      legalRef: 'CST Art. 64',
    });
    expect(result.lines[0].amount).toBeCloseTo(2_334_540, 2);
    expect(formatCOPExact(result.total)).toBe('$2.334.540,00');
  });

  it('exactly 360 días (1 año) → 30 días, no fraction → $1.750.905', () => {
    const result = calculateIndemnizacion(
      indefinidoInputs({ serviceStart: '2025-01-01', dismissalDate: '2025-12-31' }),
    );
    expect(result.days).toBe(360);
    expect(result.branch).toBe('low');
    expect(result.years).toBe(0);
    expect(result.effectiveDays).toBe(30);
    expect(result.lines[0].amount).toBeCloseTo(1_750_905, 2);
    expect(formatCOPExact(result.total)).toBe('$1.750.905,00');
  });

  it('salary = 10 SMMLV → high branch, 27,5 días → $16.049.962,50', () => {
    const result = calculateIndemnizacion(indefinidoInputs({ salary: SMMLV * 10 }));
    expect(result.branch).toBe('high');
    expect(result.threshold).toBe(SMMLV * 10);
    expect(result.years).toBe(0.5);
    expect(result.effectiveDays).toBe(27.5);
    expect(result.lines[0].formula).toBe('17.509.050 ÷ 30 × 27,5');
    expect(result.lines[0].amount).toBeCloseTo(16_049_962.5, 2);
    expect(formatCOPExact(result.total)).toBe('$16.049.962,50');
  });

  it('salary just below 10 SMMLV → low branch (boundary)', () => {
    const result = calculateIndemnizacion(indefinidoInputs({ salary: SMMLV * 10 - 1 }));
    expect(result.branch).toBe('low');
    expect(result.effectiveDays).toBe(40);
    // 17.509.049 ÷ 30 × 40 = 23.345.398,67
    expect(result.lines[0].amount).toBeCloseTo(23_345_398.67, 2);
  });
});

describe('calculateIndemnizacion — base and output conventions (REQ-5)', () => {
  it('never adds auxilio de transporte to the base', () => {
    const fijo = calculateIndemnizacion(
      fijoInputs({ salary: SMMLV, plannedEnd: '2026-01-31', dismissalDate: '2026-01-01' }),
    );
    expect(fijo.lines[0].formula).toBe('1.750.905 ÷ 30 × 30');
    expect(fijo.lines[0].amount).toBeCloseTo(1_750_905, 2); // not 2.000.000 (no + auxilio)

    const indefinido = calculateIndemnizacion(
      indefinidoInputs({ serviceStart: '2025-01-01', dismissalDate: '2025-12-31' }),
    );
    expect(indefinido.lines[0].formula).toBe('1.750.905 ÷ 30 × 30');
    expect(indefinido.lines[0].amount).toBeCloseTo(1_750_905, 2);
  });

  it('emits exactly one line per calculation, always CST Art. 64', () => {
    const results = [
      calculateIndemnizacion(fijoInputs()),
      calculateIndemnizacion(indefinidoInputs()),
      calculateIndemnizacion(obraInputs()),
    ];
    for (const result of results) {
      expect(result.lines).toHaveLength(1);
      expect(result.lines[0].legalRef).toBe('CST Art. 64');
      expect(result.lines[0].concepto).toBe('Indemnización por despido sin justa causa');
    }
  });
});
