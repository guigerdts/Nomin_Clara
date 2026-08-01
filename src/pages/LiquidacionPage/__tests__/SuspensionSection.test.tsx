import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SuspensionSection, STORAGE_KEY, loadSuspensionStore, buildExcessWarning } from '../SuspensionSection';
import { CAUSALES, STANDARD_CHECKLIST, SPECIAL_CHECKLIST } from '../../../lib/suspension';
import type { SuspensionRecord, SuspensionStore } from '../../../lib/types';

function renderSection() {
  return render(
    <BrowserRouter>
      <SuspensionSection />
    </BrowserRouter>,
  );
}

function selectCausal(value: string) {
  fireEvent.change(screen.getByLabelText(/causal de la suspensión/i), { target: { value } });
}

function fillDates(start: string, end: string) {
  fireEvent.change(screen.getByLabelText(/fecha de inicio de la suspensión/i), {
    target: { value: start },
  });
  fireEvent.change(screen.getByLabelText(/fecha de fin de la suspensión/i), {
    target: { value: end },
  });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /registrar suspensión/i }));
}

/** Reads the persisted store under `nomina-clara-suspensiones` (REQ-4 / D3). */
function storedRecords(): SuspensionRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as SuspensionStore).records : [];
}

beforeEach(() => {
  localStorage.clear();
  cleanup();
});

describe('SuspensionSection — causal selector and educational content (REQ-1/REQ-2)', () => {
  it('exposes exactly 10 selectable causal options (8 Art. 51 + incapacidad + licencia)', () => {
    renderSection();

    const select = screen.getByRole('combobox', { name: /causal de la suspensión/i });
    const options = within(select).getAllByRole('option');
    expect(options).toHaveLength(10);

    // Every CausalMeta maps 1:1 to a selectable option with its kebab-case value.
    for (const causal of CAUSALES) {
      expect(within(select).getByRole('option', { name: causal.label })).toHaveValue(causal.value);
    }
  });

  it('lists the 8 Art. 51 causales in plain language with verbatim citation', () => {
    renderSection();

    const art51 = CAUSALES.filter(c => !c.special);
    expect(art51).toHaveLength(8);
    for (const causal of art51) {
      expect(screen.getAllByText(causal.label).length).toBeGreaterThanOrEqual(1);
    }
    // Citation shown verbatim once per causal (display-only, no calculation).
    // All 10 causales (8 Art. 51 + 2 special) carry the citation in the list.
    expect(screen.getAllByText('CST Art. 51')).toHaveLength(CAUSALES.length);
  });

  it('marks incapacidad médica and licencia as special ("Cuenta como tiempo trabajado")', () => {
    renderSection();

    expect(screen.getAllByText('Cuenta como tiempo trabajado')).toHaveLength(2);
    expect(screen.getAllByText('Incapacidad médica').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Licencia de maternidad o paternidad').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the Art. 53 asymmetric table with CSJ fundamento and exception callout', () => {
    renderSection();

    const section = screen.getByRole('region', { name: /suspensión del contrato/i });
    expect(within(section).getByRole('columnheader', { name: 'Prestación' })).toBeInTheDocument();
    expect(
      within(section).getByRole('columnheader', { name: 'Durante la suspensión' }),
    ).toBeInTheDocument();
    expect(within(section).getByRole('columnheader', { name: 'Fundamento' })).toBeInTheDocument();

    // Salario: no pay during suspension.
    expect(within(section).getByText('No se paga durante la suspensión')).toBeInTheDocument();
    // Cesantías and vacaciones: MAY be deducted from antigüedad.
    expect(within(section).getAllByText('Pueden descontarse de la antigüedad')).toHaveLength(2);
    // Prima e intereses: MUST NOT be deducted — CSJ fundamento cited, not only Art. 53.
    expect(within(section).getByText('No se descuenta')).toBeInTheDocument();
    expect(within(section).getByText('No se descuentan')).toBeInTheDocument();
    expect(within(section).getAllByText('Art. 53 CST + CSJ')).toHaveLength(2);
    expect(
      within(section).getByText(/Corte Suprema de Justicia, Sala Laboral/i),
    ).toBeInTheDocument();

    // Honest nuance note next to the CSJ fundamento.
    expect(within(section).getByText(/criterio histórico dominante/i)).toBeInTheDocument();

    // Exception: incapacidad/licencia count as worked time for ALL prestaciones.
    expect(
      within(section).getByText(/cuentan como tiempo trabajado para TODAS las prestaciones/i),
    ).toBeInTheDocument();
  });
});

describe('SuspensionSection — registry CRUD + persistence (REQ-4)', () => {
  it('adds a period, renders it and persists it under nomina-clara-suspensiones', () => {
    renderSection();
    selectCausal('fuerza-mayor');
    fillDates('2026-01-01', '2026-01-05');
    submit();

    expect(screen.getByText(/Del 1 enero 2026 al 5 enero 2026/)).toBeInTheDocument();
    expect(screen.getByText('5 días')).toBeInTheDocument();

    const records = storedRecords();
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      startDate: '2026-01-01',
      endDate: '2026-01-05',
      causal: 'fuerza-mayor',
    });
  });

  it('rejects an end date before the start date with a validation error and does not persist', () => {
    renderSection();
    selectCausal('fuerza-mayor');
    fillDates('2026-01-10', '2026-01-05');
    submit();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'La fecha fin no puede ser anterior a la fecha inicio.',
    );
    expect(storedRecords()).toHaveLength(0);
    expect(screen.getByText('Todavía no registraste suspensiones.')).toBeInTheDocument();
  });

  it('edits an existing record and replaces the stored one', () => {
    renderSection();
    selectCausal('fuerza-mayor');
    fillDates('2026-01-01', '2026-01-05');
    submit();

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    // Edit mode pre-fills the form with the record's dates.
    expect(screen.getByLabelText(/fecha de inicio de la suspensión/i)).toHaveValue('2026-01-01');
    fireEvent.change(screen.getByLabelText(/fecha de fin de la suspensión/i), {
      target: { value: '2026-01-10' },
    });
    fireEvent.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(screen.getByText(/Del 1 enero 2026 al 10 enero 2026/)).toBeInTheDocument();
    expect(screen.getByText('10 días')).toBeInTheDocument();

    const records = storedRecords();
    expect(records).toHaveLength(1);
    expect(records[0].endDate).toBe('2026-01-10');
  });

  it('deletes a record and removes it from the list and from localStorage', () => {
    renderSection();
    selectCausal('fuerza-mayor');
    fillDates('2026-01-01', '2026-01-05');
    submit();
    expect(storedRecords()).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));

    expect(screen.getByText('Todavía no registraste suspensiones.')).toBeInTheDocument();
    expect(storedRecords()).toHaveLength(0);
  });

  it('loads records persisted under the storage key on mount', () => {
    const seeded: SuspensionStore = {
      version: 1,
      records: [{ id: 'seed-1', startDate: '2026-02-01', endDate: '2026-02-03', causal: 'huelga' }],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));

    renderSection();

    expect(screen.getByText(/Del 1 febrero 2026 al 3 febrero 2026/)).toBeInTheDocument();
    expect(screen.getByText('3 días')).toBeInTheDocument();
    expect(screen.queryByText('Todavía no registraste suspensiones.')).not.toBeInTheDocument();
  });

  it('loadSuspensionStore ignores version mismatches and corrupted JSON (D3)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 99, records: [] }));
    expect(loadSuspensionStore().records).toEqual([]);

    localStorage.setItem(STORAGE_KEY, '{corrupted');
    expect(loadSuspensionStore()).toEqual({ version: 1, records: [] });
  });
});

describe('SuspensionSection — D11 first/reincidencia contract', () => {
  it('renders the Art. 112 field for suspension-disciplinaria', () => {
    renderSection();
    selectCausal('suspension-disciplinaria');

    expect(screen.getByText(/¿Es tu primera suspensión disciplinaria, o ya tuviste otra antes\?/)).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /primera vez/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /reincidencia/i })).toBeInTheDocument();
  });

  it('blocks submit without an explicit first/reincidencia answer and persists nothing', () => {
    renderSection();
    selectCausal('suspension-disciplinaria');
    fillDates('2026-01-01', '2026-01-05');
    submit();

    expect(screen.getByRole('alert')).toHaveTextContent(
      /Respondé si es tu primera suspensión disciplinaria \(Sí o No\)/i,
    );
    expect(storedRecords()).toHaveLength(0);
    expect(screen.getByText('Todavía no registraste suspensiones.')).toBeInTheDocument();
  });

  it.each(
    CAUSALES.filter(c => c.value !== 'suspension-disciplinaria').map(
      c => [c.label, c.value] as [string, string],
    ),
  )('hides the Art. 112 field for "%s"', (_label, value) => {
    renderSection();
    selectCausal(value);

    expect(screen.queryByText(/¿Es tu primera suspensión disciplinaria/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /primera vez/i })).not.toBeInTheDocument();
  });
});

describe('SuspensionSection — Art. 112 excess warning (REQ-6)', () => {
  it('does NOT warn on a first suspension of exactly 8 days', () => {
    renderSection();
    selectCausal('suspension-disciplinaria');
    fireEvent.click(screen.getByRole('radio', { name: /primera vez/i }));
    fillDates('2026-01-01', '2026-01-08');
    submit();

    expect(screen.getByText('8 días')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('warns on a first suspension of 9 days (threshold 8)', () => {
    renderSection();
    selectCausal('suspension-disciplinaria');
    fireEvent.click(screen.getByRole('radio', { name: /primera vez/i }));
    fillDates('2026-01-01', '2026-01-09');
    submit();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/excede el límite de 8 días del Art\. 112 CST/i);
    expect(alert).toHaveTextContent(/la primera suspensión/i);
  });

  it('does NOT warn on a reincidencia of exactly 60 days', () => {
    renderSection();
    selectCausal('suspension-disciplinaria');
    fireEvent.click(screen.getByRole('radio', { name: /reincidencia/i }));
    fillDates('2026-01-01', '2026-03-01');
    submit();

    expect(screen.getByText('60 días')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('warns on a reincidencia of 61 days (threshold 60)', () => {
    renderSection();
    selectCausal('suspension-disciplinaria');
    fireEvent.click(screen.getByRole('radio', { name: /reincidencia/i }));
    fillDates('2026-01-01', '2026-03-02');
    submit();

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/excede el límite de 60 días del Art\. 112 CST/i);
    expect(alert).toHaveTextContent(/reincidencia/i);
  });

  it('never warns for non-disciplinary causales, regardless of duration', () => {
    renderSection();
    selectCausal('fuerza-mayor');
    fillDates('2026-01-01', '2026-06-30');
    submit();

    expect(screen.getByText('181 días')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/excede el límite/i)).not.toBeInTheDocument();
  });
});

describe('SuspensionSection — per-record checklist (REQ-5)', () => {
  it('shows the standard checklist for a standard Art. 51 causal', () => {
    renderSection();
    selectCausal('fuerza-mayor');
    fillDates('2026-01-01', '2026-01-05');
    submit();

    expect(screen.getByText(STANDARD_CHECKLIST)).toBeInTheDocument();
  });

  it('shows the special checklist for incapacidad/licencia (no deduction from ANY prestación)', () => {
    renderSection();
    selectCausal('incapacidad-medica');
    fillDates('2026-01-01', '2026-01-05');
    submit();

    expect(screen.getByText(SPECIAL_CHECKLIST)).toBeInTheDocument();
  });
});

describe('buildExcessWarning (exported helper)', () => {
  const base: SuspensionRecord = {
    id: 'x',
    startDate: '2026-01-01',
    endDate: '2026-01-05',
    causal: 'suspension-disciplinaria',
    isFirstDisciplinary: true,
  };

  it('returns null for a first suspension of exactly 8 days', () => {
    expect(buildExcessWarning({ ...base, endDate: '2026-01-08' })).toBeNull();
  });

  it('returns the 8-day message for a 9-day first suspension', () => {
    expect(buildExcessWarning({ ...base, endDate: '2026-01-09' })).toMatch(/8 días/);
  });

  it('returns null for a reincidencia of exactly 60 days', () => {
    expect(buildExcessWarning({ ...base, isFirstDisciplinary: false, endDate: '2026-03-01' })).toBeNull();
  });

  it('returns the 60-day message for a 61-day reincidencia', () => {
    expect(buildExcessWarning({ ...base, isFirstDisciplinary: false, endDate: '2026-03-02' })).toMatch(
      /60 días/,
    );
  });

  it('returns null for non-disciplinary causales', () => {
    expect(buildExcessWarning({ ...base, causal: 'huelga' })).toBeNull();
  });
});
