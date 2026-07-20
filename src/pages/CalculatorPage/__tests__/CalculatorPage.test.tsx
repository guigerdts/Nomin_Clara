import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  it('toggles mode tabs and renders schedule/manual forms', async () => {
    renderPage();

    // Default: manual mode shows the 7-field grid
    expect(screen.getByText(/horas extra diurnas/i)).toBeInTheDocument();

    // Switch to schedule mode
    const scheduleTab = screen.getByRole('button', { name: /horario detallado/i });
    fireEvent.click(scheduleTab);

    await waitFor(() => {
      expect(screen.getByText(/perfil semanal/i)).toBeInTheDocument();
    });

    // Manual fields should not be visible
    expect(screen.queryByText(/horas extra diurnas/i)).not.toBeInTheDocument();

    // Switch back to manual
    const manualTab = screen.getByRole('button', { name: /^manual$/i });
    fireEvent.click(manualTab);

    await waitFor(() => {
      expect(screen.getByText(/horas extra diurnas/i)).toBeInTheDocument();
    });

    // Schedule fields should not be visible
    expect(screen.queryByText(/perfil semanal/i)).not.toBeInTheDocument();
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
      transportAllowance: 249095,
      inputs: { salary: 1300000, dayOT: 2, nightOT: 0, holidayDayOT: 0, holidayNightOT: 0, nightSurcharge: 0, holidaySurcharge: 0, holidayNightSurcharge: 0 },
      breakdown: [],
      totalCalculated: 914571,
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

describe('CalculatorPage — saveRecord with deductions and schedule mode', () => {
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

  it('saves record with schedule mode, deductions, and schedule fields', async () => {
    renderPage();

    // Enter salary to enable calculation
    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '2600000' } });

    // Wait for initial manual calculation
    await waitFor(() => {
      expect(screen.getByText(/desglose de pago/i)).toBeInTheDocument();
    });

    // Switch to schedule mode
    const scheduleTab = screen.getByRole('button', { name: /horario detallado/i });
    fireEvent.click(scheduleTab);

    await waitFor(() => {
      expect(screen.getByText(/perfil semanal/i)).toBeInTheDocument();
    });

    // Add Monday (not in the new Tue-Fri default) to match test expectations
    const monCheckbox = screen.getByLabelText('Lun');
    fireEvent.click(monCheckbox);

    // Trigger scheduleProfile change by toggling "Sáb" day checkbox
    // (this makes onScheduleProfileChange fire, setting scheduleProfile state)
    const satCheckbox = screen.getByLabelText('Sáb');
    fireEvent.click(satCheckbox);

    // Now DayEntryForm should render with the date input
    await waitFor(() => {
      expect(screen.getByLabelText(/fecha del día/i)).toBeInTheDocument();
    });

    // Add a work day
    const dateInput = screen.getByLabelText(/fecha del día/i);
    fireEvent.change(dateInput, { target: { value: '2026-07-13' } });

    const addDayButton = screen.getByRole('button', { name: /agregar día/i });
    fireEvent.click(addDayButton);

    // Wait for classification to trigger calculation
    await waitFor(() => {
      expect(screen.getByText(/desglose de pago/i)).toBeInTheDocument();
    });

    // Configure deductions: health+pension is on by default, splitMode is 'even'
    const healthCheckbox = screen.getByLabelText(/aplicar salud/i) as HTMLInputElement;
    expect(healthCheckbox.checked).toBe(true);

    // Save the record
    const saveButton = screen.getByRole('button', { name: /guardar registro/i });
    fireEvent.click(saveButton);

    // Verify saved record has all fields
    await waitFor(() => {
      const records = JSON.parse(localStorage.getItem('nomina-clara-records') || '[]');
      expect(records.length).toBe(1);
      const saved = records[0];
      expect(saved.deductionsInput).toBeDefined();
      expect(saved.deductionsInput.includeHealthPension).toBe(true);
      expect(saved.splitMode).toBe('even');
      expect(saved.mode).toBe('schedule');
      expect(saved.scheduleProfile).toBeDefined();
      expect(saved.scheduleProfile.workDays).toContain('monday');
      expect(saved.workedDays).toBeDefined();
      expect(saved.workedDays.length).toBe(1);
      expect(saved.workedDays[0].date).toBe('2026-07-13');
      expect(saved.inputs).toBeDefined();
      expect(saved.inputs.salary).toBe(2600000);
    });
  });

  it('loads legacy records without deductionsInput without error', async () => {
    const legacyRecord = {
      id: 'legacy-1',
      createdAt: new Date().toISOString(),
      alias: 'Legacy User',
      quincena: '2026-01-01',
      salary: 1300000,
      transportAllowance: 249095,
      inputs: { salary: 1300000, dayOT: 0, nightOT: 0, holidayDayOT: 0, holidayNightOT: 0, nightSurcharge: 0, holidaySurcharge: 0, holidayNightSurcharge: 0 },
      breakdown: [],
      totalCalculated: 899095,
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
    expect(screen.getByText(/\$899\.095/)).toBeInTheDocument();
  });

  it('loads legacy records without schedule fields without error', async () => {
    // A record with deductionsInput and splitMode but no mode/scheduleProfile/workedDays
    const legacyRecord = {
      id: 'legacy-2',
      createdAt: new Date().toISOString(),
      alias: 'Pre-Schedule User',
      quincena: '2026-06-01',
      salary: 2000000,
      transportAllowance: 249095,
      inputs: { salary: 2000000, dayOT: 0, nightOT: 0, holidayDayOT: 0, holidayNightOT: 0, nightSurcharge: 0, holidaySurcharge: 0, holidayNightSurcharge: 0 },
      breakdown: [],
      totalCalculated: 1574760,
      totalActual: null,
      totalOT: 0,
      difference: null,
      deductionsInput: { includeHealthPension: true, includeRetefuente: false, embargoAmount: 0, loanAmount: 0, otherDeductions: 0, otherDeductionsLabel: '' },
      splitMode: 'even',
    };
    localStorage.setItem('nomina-clara-records', JSON.stringify([legacyRecord]));

    cleanup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/pre-schedule user/i)).toBeInTheDocument();
    });

    // Verify no crashes and the record renders
    expect(screen.getByText(/\$1\.574\.760/)).toBeInTheDocument();
  });
});

describe('CalculatorPage — daily draft quincena', () => {
  it('shows Hoy section in schedule mode with Agregar hoy button', async () => {
    renderPage();

    // Switch to schedule mode
    fireEvent.click(screen.getByRole('button', { name: /horario detallado/i }));

    // Wait for schedule mode to render, then check Hoy section is present
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /agregar hoy/i })).toBeInTheDocument();
    });
  });

  it('adds a day to draft via Agregar hoy button', async () => {
    renderPage();

    // Switch to schedule mode
    fireEvent.click(screen.getByRole('button', { name: /horario detallado/i }));

    await waitFor(() => {
      expect(screen.getByText(/perfil semanal/i)).toBeInTheDocument();
    });

    // Click "Agregar hoy"
    fireEvent.click(screen.getByRole('button', { name: /agregar hoy/i }));

    // Should show the draft progress counter
    await waitFor(() => {
      expect(screen.getByText(/días registrados/i)).toBeInTheDocument();
    });
  });

  it('shows stale draft dialog on mount when old draft exists', async () => {
    // Pre-populate localStorage with an old (stale) draft
    const oldStart = '2026-06-01';
    const oldDraft = {
      id: 'stale-test-1',
      startDate: oldStart,
      endDate: '2026-06-15',
      workedDays: [
        { date: '2026-06-01', entryTime: '08:00', exitTime: '17:00', lunchBreakMinutes: 60 },
      ],
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(`nomina-clara-draft-${oldStart}`, JSON.stringify(oldDraft));

    cleanup();
    renderPage();

    // Should show the stale draft confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/registro sin cerrar/i)).toBeInTheDocument();
    });

    // Both action buttons should be present
    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /descartar/i })).toBeInTheDocument();
  });

  it('discards stale draft on Descartar click', async () => {
    const oldStart = '2026-06-01';
    const oldDraft = {
      id: 'stale-test-2',
      startDate: oldStart,
      endDate: '2026-06-15',
      workedDays: [
        { date: '2026-06-01', entryTime: '08:00', exitTime: '17:00', lunchBreakMinutes: 60 },
      ],
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(`nomina-clara-draft-${oldStart}`, JSON.stringify(oldDraft));

    cleanup();
    renderPage();

    await waitFor(() => {
      expect(screen.getByText(/registro sin cerrar/i)).toBeInTheDocument();
    });

    // Click Descartar
    fireEvent.click(screen.getByRole('button', { name: /descartar/i }));

    // Draft key should be removed from localStorage
    await waitFor(() => {
      const draftKeys = Object.keys(localStorage).filter(k =>
        k.startsWith('nomina-clara-draft-'),
      );
      expect(draftKeys).toHaveLength(0);
    });

    // Dialog should be gone
    expect(screen.queryByText(/registro sin cerrar/i)).not.toBeInTheDocument();
  });

  it('closes draft and creates saved record on Cerrar quincena', async () => {
    renderPage();

    // Enter salary
    const salaryInput = screen.getByLabelText(/salario mensual base/i);
    fireEvent.change(salaryInput, { target: { value: '2600000' } });

    // Wait for manual calculation (auto-triggered)
    await waitFor(() => {
      expect(screen.getByText(/desglose de pago/i)).toBeInTheDocument();
    });

    // Switch to schedule mode
    fireEvent.click(screen.getByRole('button', { name: /horario detallado/i }));

    await waitFor(() => {
      expect(screen.getByText(/perfil semanal/i)).toBeInTheDocument();
    });

    // Click "Agregar hoy" to add a draft day
    fireEvent.click(screen.getByRole('button', { name: /agregar hoy/i }));

    await waitFor(() => {
      expect(screen.getByText(/días registrados/i)).toBeInTheDocument();
    });

    // Click "Cerrar quincena & save"
    fireEvent.click(screen.getByRole('button', { name: /cerrar quincena/i }));

    // Should now have a saved record in localStorage
    await waitFor(() => {
      const records = JSON.parse(
        localStorage.getItem('nomina-clara-records') || '[]',
      );
      expect(records.length).toBe(1);
      expect(records[0].workedDays).toBeDefined();
      expect(records[0].mode).toBe('schedule');
    });

    // Draft key should be removed
    const draftKeys = Object.keys(localStorage).filter(k =>
      k.startsWith('nomina-clara-draft-'),
    );
    expect(draftKeys).toHaveLength(0);
  });
});
