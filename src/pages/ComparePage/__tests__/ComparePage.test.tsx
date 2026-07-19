import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { ComparePage } from '../ComparePage';

function renderPage() {
  return render(<ComparePage />);
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

const makeRecord = (overrides: Record<string, unknown> = {}) => ({
  id: 'rec-1',
  createdAt: '2026-07-01T00:00:00.000Z',
  alias: 'Test User',
  quincena: '2026-07-01',
  salary: 2600000,
  transportAllowance: 162000,
  inputs: {
    salary: 2600000,
    dayOT: 0,
    nightOT: 0,
    holidayDayOT: 0,
    holidayNightOT: 0,
    nightSurcharge: 0,
    holidaySurcharge: 0,
    holidayNightSurcharge: 0,
  },
  breakdown: [],
  totalCalculated: 1462000,
  totalActual: null,
  totalOT: 0,
  difference: null,
  ...overrides,
});

describe('ComparePage — table rendering', () => {
  it('shows empty state when no records exist', () => {
    renderPage();
    expect(
      screen.getByText(/no hay registros para comparar/i),
    ).toBeInTheDocument();
  });

  it('renders table rows from localStorage records', async () => {
    const records = [
      makeRecord({ id: 'rec-1', alias: 'Alice' }),
      makeRecord({ id: 'rec-2', alias: 'Bob' }),
    ];
    localStorage.setItem('nomina-clara-records', JSON.stringify(records));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
    });
  });

  it('shows "—" for deducciones and neto when record lacks deductionsInput', async () => {
    const record = makeRecord({
      id: 'legacy-1',
      alias: 'Legacy',
    });
    localStorage.setItem('nomina-clara-records', JSON.stringify([record]));

    renderPage();

    await waitFor(() => {
      // The table should show "—" for deducciones and neto
      const emDashElements = screen.getAllByText('—');
      expect(emDashElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('shows computed deductions and neto when record has deductionsInput', async () => {
    const record = makeRecord({
      id: 'ded-1',
      alias: 'WithDed',
      salary: 2600000,
      totalCalculated: 1462000,
      deductionsInput: {
        includeHealthPension: true,
        includeRetefuente: false,
        embargoAmount: 0,
        loanAmount: 0,
        otherDeductions: 0,
        otherDeductionsLabel: '',
      },
      splitMode: 'even',
    });
    localStorage.setItem('nomina-clara-records', JSON.stringify([record]));

    renderPage();

    // The health+pension deduction for 2600000 salary = 8% = 208000 monthly,
    // split even = 104000 per quincena
    await waitFor(() => {
      // Table should show formatted COP values (not em-dashes)
      expect(screen.getByText(/\$1\.462\.000/)).toBeInTheDocument();
      // Should show deduction amount (not "—"")
      expect(screen.getByText(/\$104\.000/)).toBeInTheDocument();
    });
  });

  it('shows mixed records: some with deductions, some without', async () => {
    const records = [
      makeRecord({
        id: 'legacy-1',
        alias: 'Legacy',
        totalCalculated: 1000000,
        deductionsInput: undefined,
        splitMode: undefined,
      }),
      makeRecord({
        id: 'ded-1',
        alias: 'Full',
        salary: 2600000,
        totalCalculated: 1462000,
        deductionsInput: {
          includeHealthPension: true,
          includeRetefuente: false,
          embargoAmount: 0,
          loanAmount: 0,
          otherDeductions: 0,
          otherDeductionsLabel: '',
        },
        splitMode: 'even',
      }),
    ];
    localStorage.setItem('nomina-clara-records', JSON.stringify(records));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Legacy')).toBeInTheDocument();
      expect(screen.getByText('Full')).toBeInTheDocument();
      // Legacy shows "—" for neto
      const emDashElements = screen.getAllByText('—');
      expect(emDashElements.length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('ComparePage — sort toggling', () => {
  it('sorts by alias ascending by default', async () => {
    const records = [
      makeRecord({ id: 'rec-1', alias: 'Zara' }),
      makeRecord({ id: 'rec-2', alias: 'Alice' }),
      makeRecord({ id: 'rec-3', alias: 'Bob' }),
    ];
    localStorage.setItem('nomina-clara-records', JSON.stringify(records));

    renderPage();

    await waitFor(() => {
      const rows = screen.getAllByTestId(/^record-row-/);
      // Default sort is alias asc: Alice, Bob, Zara
      const firstRow = rows[0];
      const firstAlias = firstRow.querySelector('td:first-child');
      expect(firstAlias).toHaveTextContent('Alice');
    });
  });

  it('toggles sort direction when clicking alias header', async () => {
    const records = [
      makeRecord({ id: 'rec-1', alias: 'Zara' }),
      makeRecord({ id: 'rec-2', alias: 'Alice' }),
      makeRecord({ id: 'rec-3', alias: 'Bob' }),
    ];
    localStorage.setItem('nomina-clara-records', JSON.stringify(records));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Click alias header to toggle desc
    const aliasHeader = screen.getByTestId('sort-alias');
    fireEvent.click(aliasHeader);

    // Now should be desc: Zara, Bob, Alice
    const rows = screen.getAllByTestId(/^record-row-/);
    const firstRow = rows[0];
    const firstAlias = firstRow.querySelector('td:first-child');
    expect(firstAlias).toHaveTextContent('Zara');
  });

  it('switches sort field when clicking different column', async () => {
    const records = [
      makeRecord({ id: 'rec-1', alias: 'Alice', quincena: '2026-02-01' }),
      makeRecord({ id: 'rec-2', alias: 'Bob', quincena: '2026-01-01' }),
    ];
    localStorage.setItem('nomina-clara-records', JSON.stringify(records));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Click quincena header to sort by quincena
    const quincenaHeader = screen.getByTestId('sort-quincena');
    fireEvent.click(quincenaHeader);

    // Should sort by quincena asc: 2026-01-01 (Bob), 2026-02-01 (Alice)
    const rows = screen.getAllByTestId(/^record-row-/);
    const firstRow = rows[0];
    const firstAlias = firstRow.querySelector('td:first-child');
    expect(firstAlias).toHaveTextContent('Bob');
  });
});

describe('ComparePage — blank difference', () => {
  it('shows "—" for diferencia when totalActual is null', async () => {
    const record = makeRecord({ id: 'rec-1', alias: 'NoDiff' });
    localStorage.setItem('nomina-clara-records', JSON.stringify([record]));

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('NoDiff')).toBeInTheDocument();
      // diferencia column should show "—"
      const emDashElements = screen.getAllByText('—');
      const diffEmDash = emDashElements[emDashElements.length - 1];
      // Last cell is diferencia
      expect(diffEmDash).toBeInTheDocument();
    });
  });
});
