import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CalculatorPage } from '../CalculatorPage';

function renderPage() {
  return render(
    <BrowserRouter>
      <CalculatorPage />
    </BrowserRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  cleanup();
});

describe('CalculatorPage — form → calculate → render', () => {
  it('renders the form with salary input', () => {
    renderPage();
    expect(screen.getByLabelText(/salario mensual base/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/2600000/i)).toBeInTheDocument();
  });

  it('renders all 7 concept inputs', () => {
    renderPage();
    expect(screen.getByLabelText(/horas extra diurnas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/horas extra nocturnas/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recargo nocturno \(ordinario\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/h\. extra diurna dom\/fest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/h\. extra nocturna dom\/fest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recargo nocturno \+ festivo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/recargo dom\/fest \(ordinario\)/i)).toBeInTheDocument();
  });

  it('shows transport section when salary is entered', () => {
    renderPage();
    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '1300000' } });

    // "Auxilio de transporte" appears both in the form label and results table
    const transportElements = screen.getAllByText('Auxilio de transporte');
    expect(transportElements.length).toBeGreaterThanOrEqual(1);
    // The badge should show "Aplica"
    const badgeElements = screen.getAllByText('Aplica');
    expect(badgeElements.length).toBeGreaterThanOrEqual(1);
  });

  it('calculates and shows results when form is submitted with valid salary', async () => {
    renderPage();

    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '1300000' } });

    const dayOTInput = screen.getByLabelText(/horas extra diurnas/i);
    fireEvent.change(dayOTInput, { target: { value: '2' } });

    await waitFor(() => {
      expect(screen.getByText(/desglose de pago/i)).toBeInTheDocument();
      expect(screen.getByText(/total devengado/i)).toBeInTheDocument();
    });

    const monetaryElements = screen.getAllByText(/\$\d+\.\d+/);
    expect(monetaryElements.length).toBeGreaterThan(0);
  });

  it('shows actual pay comparison section in results', async () => {
    renderPage();

    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '1300000' } });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/ej: 1350000/i)).toBeInTheDocument();
    });

    const actualPayInput = screen.getByPlaceholderText(/ej: 1350000/i);
    fireEvent.change(actualPayInput, { target: { value: '1500000' } });

    await waitFor(() => {
      expect(screen.getByText(/te pagaron \$.+ más de/i)).toBeInTheDocument();
    });
  });

  it('shows overtime warnings when limits are exceeded', async () => {
    renderPage();

    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '1300000' } });

    const dayOTInput = screen.getByLabelText(/horas extra diurnas/i);
    fireEvent.change(dayOTInput, { target: { value: '30' } });

    await waitFor(() => {
      expect(screen.getByText(/límites de horas extra/i)).toBeInTheDocument();
    });
  });
});

describe('CalculatorPage — history save/load', () => {
  it('shows empty state when no records exist', () => {
    renderPage();
    expect(screen.getByText(/todavía no hay registros guardados/i)).toBeInTheDocument();
  });

  it('saves a record and persists to localStorage', async () => {
    renderPage();

    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '2600000' } });

    await waitFor(() => {
      expect(screen.getByText(/desglose de pago/i)).toBeInTheDocument();
    });

    // Click save
    const saveButton = screen.getByRole('button', { name: /guardar registro/i });
    fireEvent.click(saveButton);

    // Record should be in localStorage
    await waitFor(() => {
      const records = JSON.parse(localStorage.getItem('nomina-clara-records') || '[]');
      expect(records.length).toBe(1);
      expect(records[0].salary).toBe(2600000);
    });

    // History should no longer show empty state
    expect(screen.queryByText(/todavía no hay registros guardados/i)).not.toBeInTheDocument();
  });

  it('shows saved record details in history table', async () => {
    renderPage();

    // Pre-populate localStorage with a record
    const testRecord = {
      id: 'test-1',
      createdAt: new Date().toISOString(),
      alias: 'Test User',
      quincena: '2026-07-01',
      salary: 1300000,
      transportAllowance: 200000,
      inputs: { salary: 1300000, dayOT: 2, nightOT: 0, holidayDayOT: 0, holidayNightOT: 0, nightSurcharge: 0, holidaySurcharge: 0, holidayNightSurcharge: 0 },
      breakdown: [],
      totalCalculated: 865476,
      totalActual: null,
      totalOT: 2,
      difference: null,
    };
    localStorage.setItem('nomina-clara-records', JSON.stringify([testRecord]));

    // Re-render
    cleanup();
    renderPage();

    // History should show the saved record
    await waitFor(() => {
      expect(screen.getByText(/test user/i)).toBeInTheDocument();
    });

    // The salary should be displayed
    expect(screen.getByText(/\$1\.300\.000/)).toBeInTheDocument();
  });

  it('clears the form when clear button is pressed', async () => {
    renderPage();

    const salaryInput = screen.getByLabelText(/salario mensual base/i) as HTMLInputElement;
    fireEvent.change(salaryInput, { target: { value: '1300000' } });

    await waitFor(() => {
      expect(screen.getByText(/desglose de pago/i)).toBeInTheDocument();
    });

    const clearButton = screen.getByRole('button', { name: /limpiar/i });
    fireEvent.click(clearButton);

    expect(salaryInput.value).toBe('');
  });
});

describe('CalculatorPage — deductions module', () => {
  it('shows Deducciones de ley card when results are displayed', async () => {
    renderPage();

    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '1300000' } });

    await waitFor(() => {
      expect(screen.getByText(/deducciones de ley/i)).toBeInTheDocument();
    });
  });

  it('shows health+pension toggle checked by default', async () => {
    renderPage();
    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '1300000' } });

    await waitFor(() => {
      const checkbox = screen.getByLabelText(/aplicar salud/i) as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });
  });

  it('shows solidarity fund section for salary >= 4 SMMLV', async () => {
    renderPage();
    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    // 4 SMMLV = 7.003.620
    fireEvent.change(salaryInput, { target: { value: '7500000' } });

    await waitFor(() => {
      expect(screen.getByText(/fondo de solidaridad pensional/i)).toBeInTheDocument();
    });
  });

  it('shows NETO A PAGAR with blue background when deductions are active', async () => {
    renderPage();
    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '1300000' } });

    await waitFor(() => {
      // With health+pension on by default, net pay should show
      const netoElements = screen.getAllByText(/neto a pagar/i);
      expect(netoElements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('shows total deducido amount in the breakdown', async () => {
    renderPage();
    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '1300000' } });

    await waitFor(() => {
      expect(screen.getByText(/total deducciones/i)).toBeInTheDocument();
    });
  });
});

describe('CalculatorPage — saveRecord with deductions', () => {
  it('saves record with deductionsInput and splitMode', async () => {
    renderPage();

    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '2600000' } });

    await waitFor(() => {
      expect(screen.getByText(/desglose de pago/i)).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /guardar registro/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      const records = JSON.parse(localStorage.getItem('nomina-clara-records') || '[]');
      expect(records.length).toBe(1);
      const saved = records[0];
      expect(saved.deductionsInput).toBeDefined();
      expect(saved.deductionsInput.includeHealthPension).toBe(true);
      expect(saved.splitMode).toBeDefined();
      expect(saved.splitMode).toBe('even');
    });
  });

  it('loads legacy records without deductionsInput without error', async () => {
    const legacyRecord = {
      id: 'legacy-1',
      createdAt: new Date().toISOString(),
      alias: 'Legacy User',
      quincena: '2026-01-01',
      salary: 1300000,
      transportAllowance: 200000,
      inputs: { salary: 1300000, dayOT: 0, nightOT: 0, holidayDayOT: 0, holidayNightOT: 0, nightSurcharge: 0, holidaySurcharge: 0, holidayNightSurcharge: 0 },
      breakdown: [],
      totalCalculated: 865476,
      totalActual: null,
      totalOT: 0,
      difference: null,
    };
    localStorage.setItem('nomina-clara-records', JSON.stringify([legacyRecord]));

    cleanup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/legacy user/i)).toBeInTheDocument();
    });

    // Verify no crashes — the record renders in history
    expect(screen.getByText(/\$865\.476/)).toBeInTheDocument();
  });
});
