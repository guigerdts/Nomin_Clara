import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { IndemnizacionSection, GATE_WARNING, FOOTNOTE } from '../IndemnizacionSection';
import { NOTICE_ART46, NOTICE_RENOVACIONES } from '../../../lib/indemnizacion';

function renderSection() {
  return render(
    <BrowserRouter>
      <IndemnizacionSection />
    </BrowserRouter>,
  );
}

/** Fills the fijo form (REQ-2 scenario: 60 días restantes → $3.600.000). */
function fillFijoCalc() {
  fireEvent.change(screen.getByLabelText(/salario mensual \(sin auxilio\)/i), {
    target: { value: '1800000' },
  });
  fireEvent.change(screen.getByLabelText(/fecha de inicio del contrato/i), {
    target: { value: '2025-06-01' },
  });
  fireEvent.change(screen.getByLabelText(/fecha de vencimiento pactada/i), {
    target: { value: '2026-02-28' },
  });
  fireEvent.change(screen.getByLabelText(/fecha de despido/i), {
    target: { value: '2026-01-01' },
  });
  fireEvent.click(screen.getByRole('button', { name: /calcular indemnización/i }));
}

beforeEach(() => {
  localStorage.clear();
  cleanup();
});

describe('IndemnizacionSection — defaults', () => {
  it('defaults to "Despido sin justa causa" gate and "fijo" contract type, with footnote', () => {
    renderSection();

    expect(screen.getByRole('radio', { name: /despido sin justa causa/i })).toBeChecked();
    expect(screen.getByRole('radio', { name: /término fijo/i })).toBeChecked();

    // Fijo-specific input visible; obra-specific input absent.
    expect(screen.getByLabelText(/fecha de vencimiento pactada/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/fecha de fin estimada/i)).not.toBeInTheDocument();

    // Static footnote is informational — it must NOT trigger any calculation.
    expect(screen.getByText(FOOTNOTE)).toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: /cálculo de la indemnización/i }),
    ).not.toBeInTheDocument();
  });
});

describe('IndemnizacionSection — termination gate (REQ-1)', () => {
  it.each([
    ['Renuncia', /renuncia/i],
    ['Mutuo acuerdo', /mutuo acuerdo/i],
    ['Despido con justa causa comprobada', /despido con justa causa comprobada/i],
  ])('shows the warning and never calculates for "%s"', (_label, radioName) => {
    renderSection();

    fireEvent.click(screen.getByRole('radio', { name: radioName }));

    // Visible warning explaining there is no Art. 64 CST right in this case.
    expect(screen.getByRole('alert')).toHaveTextContent(GATE_WARNING);

    // Module must NOT be called: no inputs, no button, no result section.
    expect(screen.queryByLabelText(/fecha de despido/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /calcular indemnización/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('region', { name: /cálculo de la indemnización/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Total indemnización')).not.toBeInTheDocument();
  });

  it('clears a previously computed result when the gate changes away from despido', () => {
    renderSection();
    fillFijoCalc();
    expect(
      screen.getByRole('region', { name: /cálculo de la indemnización/i }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /renuncia/i }));

    expect(screen.getByRole('alert')).toHaveTextContent(GATE_WARNING);
    expect(
      screen.queryByRole('region', { name: /cálculo de la indemnización/i }),
    ).not.toBeInTheDocument();
  });
});

describe('IndemnizacionSection — término fijo flow (REQ-2)', () => {
  it('computes 60 días restantes → $3.600.000 and renders concepto, fórmula, cita and total', () => {
    renderSection();
    fillFijoCalc();

    const results = screen.getByRole('region', { name: /cálculo de la indemnización/i });
    expect(within(results).getByText('Indemnización por despido sin justa causa')).toBeInTheDocument();
    expect(within(results).getByText('1.800.000 ÷ 30 × 60')).toBeInTheDocument();
    expect(within(results).getByText('CST Art. 64')).toBeInTheDocument();
    expect(within(results).getByText('Total indemnización')).toBeInTheDocument();
    // Line amount and total are both $3.600.000,00 for this scenario.
    expect(within(results).getAllByText('$3.600.000,00')).toHaveLength(2);
  });

  it('always shows the Art. 46 CST notice for término fijo', () => {
    renderSection();
    fillFijoCalc();

    const results = screen.getByRole('region', { name: /cálculo de la indemnización/i });
    expect(within(results).getByText(NOTICE_ART46.text)).toBeInTheDocument();
    expect(within(results).getByText('CST Art. 46')).toBeInTheDocument();
  });

  it('adds the HR advisory when renewals >= 3, leaving the calculation unaffected', () => {
    renderSection();
    fireEvent.change(screen.getByLabelText(/salario mensual \(sin auxilio\)/i), {
      target: { value: '1800000' },
    });
    fireEvent.change(screen.getByLabelText(/fecha de inicio del contrato/i), {
      target: { value: '2025-06-01' },
    });
    fireEvent.change(screen.getByLabelText(/fecha de vencimiento pactada/i), {
      target: { value: '2026-02-28' },
    });
    fireEvent.change(screen.getByLabelText(/fecha de despido/i), {
      target: { value: '2026-01-01' },
    });
    fireEvent.change(screen.getByLabelText(/renovaciones \(prórrogas\)/i), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: /calcular indemnización/i }));

    const results = screen.getByRole('region', { name: /cálculo de la indemnización/i });
    expect(within(results).getByText(NOTICE_ART46.text)).toBeInTheDocument();
    expect(within(results).getByText(NOTICE_RENOVACIONES.text)).toBeInTheDocument();
    // Calculation unchanged: 60 días → $3.600.000,00 (line + total).
    expect(within(results).getAllByText('$3.600.000,00')).toHaveLength(2);
  });
});

describe('IndemnizacionSection — contract type switch', () => {
  it('shows per-type inputs when the contract type changes', () => {
    renderSection();

    fireEvent.click(screen.getByRole('radio', { name: /obra o labor/i }));
    expect(screen.getByLabelText(/fecha de fin estimada/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/fecha de vencimiento pactada/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/renovaciones \(prórrogas\)/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: /término indefinido/i }));
    expect(screen.queryByLabelText(/fecha de fin estimada/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de inicio del contrato/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/fecha de despido/i)).toBeInTheDocument();
  });
});
