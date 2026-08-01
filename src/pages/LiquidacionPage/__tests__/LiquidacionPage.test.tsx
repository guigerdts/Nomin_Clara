import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LiquidacionPage } from '../LiquidacionPage';
import { Header } from '../../../components/Header';
import { App } from '../../../App';
import { WARNING_TWO_SEMESTERS, WARNING_NEGATIVE_VACACIONES } from '../../../lib/liquidacion';

function renderPage() {
  return render(
    <BrowserRouter>
      <LiquidacionPage />
    </BrowserRouter>,
  );
}

function fillLiveCalc(start: string, end: string, salary: string, daysTaken: string) {
  fireEvent.change(screen.getByLabelText(/fecha de ingreso/i), { target: { value: start } });
  fireEvent.change(screen.getByLabelText(/fecha de salida/i), { target: { value: end } });
  fireEvent.change(screen.getByLabelText(/salario mensual base/i), { target: { value: salary } });
  fireEvent.change(screen.getByLabelText(/días de vacaciones disfrutadas/i), { target: { value: daysTaken } });
  fireEvent.click(screen.getByRole('button', { name: /calcular liquidación/i }));
}

beforeEach(() => {
  localStorage.clear();
  cleanup();
});

describe('LiquidacionPage — form → calculate → render', () => {
  it('renders the form with the four inputs (fechas, salario, días disfrutados)', () => {
    renderPage();
    expect(screen.getByLabelText(/fecha de ingreso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de salida/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/salario mensual base/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/días de vacaciones disfrutadas/i)).toBeInTheDocument();
  });

  it('shows each concept line with concepto, formula with real inputs, legal citation and exact amount', () => {
    renderPage();
    fillLiveCalc('2026-01-01', '2026-07-31', '2600000', '0');

    const results = screen.getByRole('region', { name: /resultado/i });

    // Summary: commercial day count, semester and intereses rate are visible.
    expect(within(results).getByText('Días trabajados:')).toBeInTheDocument();
    expect(within(results).getByText('210')).toBeInTheDocument();
    expect(within(results).getByText('12%')).toBeInTheDocument();

    // Cesantías — CST Art. 249
    expect(within(results).getByText('Cesantías')).toBeInTheDocument();
    expect(within(results).getByText('(2.600.000 + 249.095) × 210 ÷ 360')).toBeInTheDocument();
    expect(within(results).getByText('CST Art. 249')).toBeInTheDocument();
    expect(within(results).getByText('$1.661.972,08')).toBeInTheDocument();

    // Intereses sobre cesantías — Ley 52 de 1975
    expect(within(results).getByText('Intereses sobre cesantías')).toBeInTheDocument();
    expect(within(results).getByText(/× 12% × 210 ÷ 360/)).toBeInTheDocument();
    expect(within(results).getByText('Ley 52 de 1975')).toBeInTheDocument();
    expect(within(results).getByText('$116.338,05')).toBeInTheDocument();

    // Prima de servicios — CST Art. 306
    expect(within(results).getByText('Prima de servicios')).toBeInTheDocument();
    expect(within(results).getByText('(2.600.000 + 249.095) × 30 ÷ 360')).toBeInTheDocument();
    expect(within(results).getByText('CST Art. 306')).toBeInTheDocument();
    expect(within(results).getByText('$237.424,58')).toBeInTheDocument();

    // Vacaciones — CST Art. 186
    expect(within(results).getByText('Vacaciones')).toBeInTheDocument();
    expect(within(results).getByText('2.600.000 × 210 ÷ 720 − 0')).toBeInTheDocument();
    expect(within(results).getByText('CST Art. 186')).toBeInTheDocument();
    expect(within(results).getByText('$758.333,33')).toBeInTheDocument();

    // Total
    expect(within(results).getByText('Total liquidación')).toBeInTheDocument();
    expect(within(results).getByText('$2.774.068,05')).toBeInTheDocument();
  });

  it('shows the auxilio badge "Aplica" with formatCOP when salary ≤ 2 SMMLV', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/salario mensual base/i), { target: { value: '2600000' } });

    const form = screen.getByRole('form', { name: /datos de la liquidación/i });
    expect(within(form).getByText('Aplica')).toBeInTheDocument();
    expect(within(form).getByText('$249.095')).toBeInTheDocument();
  });

  it('shows the auxilio badge "No aplica" with $0 when salary is above 2 SMMLV', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/salario mensual base/i), { target: { value: '4000000' } });

    const form = screen.getByRole('form', { name: /datos de la liquidación/i });
    expect(within(form).getByText('No aplica')).toBeInTheDocument();
    expect(within(form).getByText('$0')).toBeInTheDocument();
  });

  it('shows both warnings: prior-semester prima note and negative unclamped vacaciones', () => {
    renderPage();
    // 01-ene → 31-jul spans two semesters (prima warning) and 600.000 días
    // disfrutados exceed the accrued vacaciones (negative net, no clamp).
    fillLiveCalc('2026-01-01', '2026-07-31', '1750905', '600000');

    const results = screen.getByRole('region', { name: /resultado/i });
    expect(within(results).getByText(WARNING_TWO_SEMESTERS)).toBeInTheDocument();
    expect(within(results).getByText(WARNING_NEGATIVE_VACACIONES)).toBeInTheDocument();
    // The negative net renders unclamped (510.680,63 − 600.000 = −89.319,38).
    expect(within(results).getByText(/\$-89\.319/)).toBeInTheDocument();
  });
});

describe('LiquidacionPage — fixed worked example card', () => {
  it('is always visible, non-editable, and shows the four pinned values', () => {
    renderPage();

    const example = screen.getByRole('region', { name: /ejemplo resuelto/i });
    expect(example).toBeInTheDocument();

    // Non-editable: no input controls or form inside the example card.
    expect(example.querySelectorAll('input').length).toBe(0);
    expect(example.querySelector('form')).toBeNull();

    // Context: 01-ene-2026 → 31-jul-2026, salario $1.750.905, auxilio $249.095.
    expect(within(example).getByText(/1 enero 2026/)).toBeInTheDocument();
    expect(within(example).getByText(/31 julio 2026/)).toBeInTheDocument();
    expect(within(example).getByText('$1.750.905')).toBeInTheDocument();
    expect(within(example).getByText('$249.095')).toBeInTheDocument();

    // Pinned values per spec.
    expect(within(example).getByText('$1.166.666,67')).toBeInTheDocument();
    expect(within(example).getByText('$81.666,67')).toBeInTheDocument();
    expect(within(example).getByText('$166.666,67')).toBeInTheDocument();
    expect(within(example).getByText('$510.680,63')).toBeInTheDocument();
  });
});

describe('LiquidacionPage — coexistence with IndemnizacionSection', () => {
  it('keeps prestaciones results unchanged and renders the indemnización section below', () => {
    renderPage();
    fillLiveCalc('2026-01-01', '2026-07-31', '2600000', '0');

    // Prestaciones behave exactly as before the section was added.
    const results = screen.getByRole('region', { name: /resultado/i });
    expect(within(results).getByText('Cesantías')).toBeInTheDocument();
    expect(within(results).getByText('Total liquidación')).toBeInTheDocument();
    expect(within(results).getByText('$2.774.068,05')).toBeInTheDocument();

    // Indemnización section renders with its own default gate and form.
    const indemnizacion = screen.getByRole('region', { name: /indemnización por despido/i });
    expect(within(indemnizacion).getByRole('radio', { name: 'Despido sin justa causa' })).toBeChecked();
    expect(within(indemnizacion).getByRole('radio', { name: 'Contrato a término fijo' })).toBeChecked();
    expect(
      within(indemnizacion).getByRole('button', { name: /calcular indemnización/i }),
    ).toBeInTheDocument();

    // No label collision: the prestaciones form inputs keep their own labels.
    expect(screen.getByLabelText(/fecha de ingreso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/salario mensual base/i)).toBeInTheDocument();
  });
});

describe('LiquidacionPage — coexistence with SuspensionSection', () => {
  it('renders the third section below indemnización with its heading and form', () => {
    renderPage();

    const indemnizacion = screen.getByRole('region', { name: /indemnización por despido/i });
    const suspension = screen.getByRole('region', { name: /suspensión del contrato/i });

    // SuspensionSection sits below IndemnizacionSection in the DOM.
    expect(indemnizacion.compareDocumentPosition(suspension) & Node.DOCUMENT_POSITION_FOLLOWING).not.toBe(0);
    expect(
      within(suspension).getByRole('heading', { name: 'Suspensión del contrato de trabajo' }),
    ).toBeInTheDocument();
    expect(
      within(suspension).getByRole('combobox', { name: /causal de la suspensión/i }),
    ).toBeInTheDocument();
  });

  it('keeps prestaciones results and indemnización unchanged with the third section present', () => {
    renderPage();
    fillLiveCalc('2026-01-01', '2026-07-31', '2600000', '0');

    // Prestaciones behave exactly as before SuspensionSection was added.
    const results = screen.getByRole('region', { name: /resultado/i });
    expect(within(results).getByText('Cesantías')).toBeInTheDocument();
    expect(within(results).getByText('Total liquidación')).toBeInTheDocument();
    expect(within(results).getByText('$2.774.068,05')).toBeInTheDocument();

    // Indemnización section renders with its own default gate and form.
    const indemnizacion = screen.getByRole('region', { name: /indemnización por despido/i });
    expect(
      within(indemnizacion).getByRole('radio', { name: 'Despido sin justa causa' }),
    ).toBeChecked();
    expect(
      within(indemnizacion).getByRole('button', { name: /calcular indemnización/i }),
    ).toBeInTheDocument();
  });

  it('has no label collisions across the three sections', () => {
    renderPage();

    // Prestaciones form labels resolve to a single element each.
    expect(screen.getByLabelText(/fecha de ingreso/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/salario mensual base/i)).toBeInTheDocument();

    // Suspension section labels resolve uniquely too.
    expect(screen.getByLabelText(/causal de la suspensión/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de inicio de la suspensión/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de fin de la suspensión/i)).toBeInTheDocument();

    // Indemnización labels stay unique ("del contrato" vs "de la suspensión").
    expect(screen.getByLabelText(/fecha de inicio del contrato/i)).toBeInTheDocument();
  });
});

describe('LiquidacionPage — navigation', () => {
  it('exposes a NavLink "Liquidación" pointing to /liquidacion in the Header', () => {
    render(
      <BrowserRouter>
        <Header />
      </BrowserRouter>,
    );
    const link = screen.getByRole('link', { name: 'Liquidación' });
    expect(link).toHaveAttribute('href', '/liquidacion');
  });

  it('navigates from the Header NavLink to the liquidación page', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: 'Liquidación' }));

    expect(
      await screen.findByRole('heading', { name: 'Liquidación de prestaciones' }),
    ).toBeInTheDocument();
  });
});
