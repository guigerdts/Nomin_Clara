import { describe, it, expect } from 'vitest';
import type { SuspensionCausal, SuspensionRecord } from '../types';
import {
  CAUSALES,
  getDisciplinaryThreshold,
  getDurationDays,
  isValidPeriod,
  shouldShowExcessWarning,
  buildChecklist,
  STANDARD_CHECKLIST,
  SPECIAL_CHECKLIST,
} from '../suspension';

/**
 * suspension.test.ts — PR1 pure-logic slice (spec-driven, all 18 scenarios).
 *
 * Scenario → layer mapping (UI-only scenarios are covered at component layer in PR3):
 *   REQ-1 S1/S2 (8 causales, verbatim citation)  → CAUSALES metadata here + render in PR3
 *   REQ-2 S3 (asymmetric effects)                → STANDARD_CHECKLIST content here + table render in PR3
 *   REQ-2 S4 (CSJ fundamento citation)           → UI table (PR3) — no calculation path
 *   REQ-2 S5 (incapacidad/licencia worked time)  → `special` flag + SPECIAL_CHECKLIST here + UI in PR3
 *   REQ-3 S6/S7 (10 options, special selectable) → CAUSALES metadata here + selector render in PR3
 *   REQ-4 S8/S10/S11 (add/edit/delete persist)   → localStorage UI (PR3); logic layer = validation + duration
 *   REQ-4 S9 (end < start rejected)              → isValidPeriod here + form validation in PR3
 *   REQ-5 S12/S13 (checklist standard/special)   → buildChecklist here + per-record render in PR3
 *   REQ-6 S14–S18 (8/9, 60/61, never for others) → shouldShowExcessWarning here + UI warning in PR3
 */

const ART_51_CAUSALES: SuspensionCausal[] = [
  'fuerza-mayor',
  'muerte-empleador',
  'suspension-actividades',
  'licencia-acordada',
  'suspension-disciplinaria',
  'detencion-preventiva',
  'arresto-correccional',
  'huelga',
];

const SPECIAL_CAUSALES: SuspensionCausal[] = ['incapacidad-medica', 'licencia-maternidad-paternidad'];

const ALL_CAUSALES: SuspensionCausal[] = [...ART_51_CAUSALES, ...SPECIAL_CAUSALES];

/** Default record: first disciplinary suspension of exactly 8 days (01 → 08-ene-2026). */
function record(overrides: Partial<SuspensionRecord> = {}): SuspensionRecord {
  return {
    id: 'r1',
    startDate: '2026-01-01',
    endDate: '2026-01-08',
    causal: 'suspension-disciplinaria',
    ...overrides,
  };
}

describe('CAUSALES metadata (REQ-1 / REQ-2 / REQ-3)', () => {
  it('exposes exactly 10 causales: the 8 of Art. 51 CST plus incapacidad and licencia (REQ-3 S6)', () => {
    expect(CAUSALES).toHaveLength(10);
    const values = CAUSALES.map(c => c.value).sort();
    expect(values).toEqual([...ALL_CAUSALES].sort());
  });

  it('lists the 8 Art. 51 causales with Spanish labels and the verbatim citation CST Art. 51 (REQ-1 S1/S2)', () => {
    for (const value of ART_51_CAUSALES) {
      const entry = CAUSALES.find(c => c.value === value);
      expect(entry).toBeDefined();
      expect(entry!.label.length).toBeGreaterThan(0);
      expect(entry!.legalRef).toBe('CST Art. 51');
    }
  });

  it('marks incapacidad-medica and licencia-maternidad-paternidad as special selectable causales (REQ-2 S5 / REQ-3 S7)', () => {
    for (const value of SPECIAL_CAUSALES) {
      const entry = CAUSALES.find(c => c.value === value);
      expect(entry).toBeDefined();
      expect(entry!.special).toBe(true);
      expect(entry!.legalRef).toBe('CST Art. 51');
    }
    for (const value of ART_51_CAUSALES) {
      expect(CAUSALES.find(c => c.value === value)!.special).toBeUndefined();
    }
  });

  it('encodes the Art. 53 asymmetry in the standard checklist text (REQ-2 S3)', () => {
    expect(STANDARD_CHECKLIST).toContain('prima');
    expect(STANDARD_CHECKLIST).toContain('intereses sobre cesantías');
    expect(STANDARD_CHECKLIST).toContain('vacaciones');
    expect(STANDARD_CHECKLIST).toContain('cesantías acumuladas');
  });
});

describe('getDisciplinaryThreshold (D2)', () => {
  it('returns 8 days for a first disciplinary suspension', () => {
    expect(getDisciplinaryThreshold(true)).toBe(8);
  });

  it('returns 60 days (2 months) for a reincidencia', () => {
    expect(getDisciplinaryThreshold(false)).toBe(60);
  });
});

describe('getDurationDays (D6)', () => {
  it('counts inclusive calendar days: 01-ene → 08-ene-2026 = 8 días', () => {
    expect(getDurationDays('2026-01-01', '2026-01-08')).toBe(8);
  });

  it('counts a single day as 1 (start equals end)', () => {
    expect(getDurationDays('2026-01-08', '2026-01-08')).toBe(1);
  });

  it('counts real calendar days across a month boundary (01-feb → 28-feb-2026 = 28)', () => {
    expect(getDurationDays('2026-02-01', '2026-02-28')).toBe(28);
  });

  it('counts a 60-day reincidencia span exactly (01-mar → 30-abr-2026 = 61)', () => {
    expect(getDurationDays('2026-03-01', '2026-04-30')).toBe(61);
  });

  it('returns 0 for invalid dates (T12:00:00 parse fails)', () => {
    expect(getDurationDays('not-a-date', '2026-01-08')).toBe(0);
    expect(getDurationDays('2026-01-01', '')).toBe(0);
  });
});

describe('isValidPeriod (REQ-4 S9)', () => {
  it('rejects an end date before the start date', () => {
    expect(isValidPeriod('2026-02-01', '2026-01-31')).toBe(false);
  });

  it('accepts equal dates and valid ranges', () => {
    expect(isValidPeriod('2026-01-08', '2026-01-08')).toBe(true);
    expect(isValidPeriod('2026-01-01', '2026-01-08')).toBe(true);
  });

  it('rejects empty or non-ISO dates', () => {
    expect(isValidPeriod('', '2026-01-08')).toBe(false);
    expect(isValidPeriod('not-a-date', '2026-01-08')).toBe(false);
    expect(isValidPeriod('2026-01-01', '')).toBe(false);
  });
});

describe('shouldShowExcessWarning (REQ-6 / D2)', () => {
  it('does NOT warn on a first suspension of exactly 8 days (> boundary, REQ-6 S14)', () => {
    expect(
      shouldShowExcessWarning(record({ isFirstDisciplinary: true, startDate: '2026-01-01', endDate: '2026-01-08' })),
    ).toBe(false);
  });

  it('warns on a first suspension of 9 days (REQ-6 S15)', () => {
    expect(
      shouldShowExcessWarning(record({ isFirstDisciplinary: true, startDate: '2026-01-01', endDate: '2026-01-09' })),
    ).toBe(true);
  });

  it('does NOT warn on a reincidencia of exactly 60 days (> boundary, REQ-6 S16)', () => {
    expect(
      shouldShowExcessWarning(record({ isFirstDisciplinary: false, startDate: '2026-01-01', endDate: '2026-03-01' })),
    ).toBe(false);
  });

  it('warns on a reincidencia of 61 days (REQ-6 S17)', () => {
    expect(
      shouldShowExcessWarning(record({ isFirstDisciplinary: false, startDate: '2026-01-01', endDate: '2026-03-02' })),
    ).toBe(true);
  });

  it('never warns for the other 9 causales, regardless of duration (REQ-6 S18)', () => {
    for (const causal of ALL_CAUSALES.filter(c => c !== 'suspension-disciplinaria')) {
      expect(shouldShowExcessWarning(record({ causal, startDate: '2026-01-01', endDate: '2026-04-01' }))).toBe(false);
    }
  });

  it('treats a missing isFirstDisciplinary as first-time via ?? true (D11 defensive fallback)', () => {
    const incomplete: SuspensionRecord = {
      id: 'legacy',
      startDate: '2026-01-01',
      endDate: '2026-01-09',
      causal: 'suspension-disciplinaria',
    };
    expect(shouldShowExcessWarning(incomplete)).toBe(true);
    const incompleteAtBoundary: SuspensionRecord = {
      id: 'legacy-2',
      startDate: '2026-01-01',
      endDate: '2026-01-08',
      causal: 'suspension-disciplinaria',
    };
    expect(shouldShowExcessWarning(incompleteAtBoundary)).toBe(false);
  });
});

describe('buildChecklist (REQ-5)', () => {
  it('returns the standard text for a standard Art. 51 causal, verbatim from the proposal (REQ-5 S12)', () => {
    const checklist = buildChecklist(record({ causal: 'huelga' }));
    expect(checklist).toBe(STANDARD_CHECKLIST);
    expect(checklist).toBe(
      'Este período NO debería afectar tu prima ni tus intereses sobre cesantías. SÍ puede descontarse de tus vacaciones y cesantías acumuladas — verifica que tu empresa lo esté aplicando así, no al revés.',
    );
  });

  it('returns the special text for incapacidad-medica: no deduction from ANY prestación (REQ-5 S13)', () => {
    const checklist = buildChecklist(record({ causal: 'incapacidad-medica' }));
    expect(checklist).toBe(SPECIAL_CHECKLIST);
    expect(checklist).not.toBe(STANDARD_CHECKLIST);
    expect(checklist).toContain('no se descuenta de NINGUNA prestación');
  });

  it('returns the special text for licencia-maternidad-paternidad (REQ-5 S13)', () => {
    expect(buildChecklist(record({ causal: 'licencia-maternidad-paternidad' }))).toBe(SPECIAL_CHECKLIST);
  });
});
