export interface PayrollInput {
  salary: number;
  alias?: string;
  dayOT: number;
  nightOT: number;
  holidayDayOT: number;
  holidayNightOT: number;
  nightSurcharge: number;
  holidaySurcharge: number;
  holidayNightSurcharge: number;
}

export interface BreakdownEntry {
  label: string;
  hours: number;
  hourValue: number;
  surchargePct: number;
  multiplier: number;
  subtotal: number;
  surchargeOnly: number;
  legalRef: string;
}

export interface BreakdownResult {
  basePay: number;
  transport: number;
  hourValue: number;
  entries: BreakdownEntry[];
  extraTotal: number;
  grandTotal: number;
  salary: number;
  totalOT: number;
  totalSurchargeHours: number;
}

export interface SavedRecord {
  id: string;
  createdAt: string;
  alias: string;
  quincena: string;
  salary: number;
  transportAllowance: number;
  inputs: PayrollInput;
  breakdown: BreakdownEntry[];
  totalCalculated: number;
  totalActual: number | null;
  totalOT: number;
  difference: number | null;
}

export type Theme = 'light' | 'dark';
