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

export interface DeductionsInput {
  includeHealthPension: boolean;
  includeRetefuente: boolean;
  embargoAmount: number;
  loanAmount: number;
  otherDeductions: number;
  otherDeductionsLabel: string;
}

export interface DeductionItem {
  label: string;
  amount: number;
  legalRef?: string;
}

export interface DeductionsBreakdown {
  healthPension: { applies: boolean; health: number; pension: number; total: number };
  solidarityFund: { applies: boolean; percentage: number; amount: number; range: string };
  retefuente: { applies: boolean; baseDepurada: number; amount: number; warningMessage: string };
  otherDeductions: { embargo: number; loan: number; other: number; otherLabel: string; total: number };
  items: DeductionItem[];
  totalDeductions: number;
  netPay: number;
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
  deductionsInput?: DeductionsInput;
  splitMode?: DeductionSplitMode;
  mode?: InputMode;
  scheduleProfile?: ScheduleProfile;
  workedDays?: WorkedDay[];
}

export type DeductionSplitMode = 'even' | 'second-fortnight' | 'first-fortnight';

export type InputMode = 'manual' | 'schedule';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DaySchedule {
  entryTime: string;
  exitTime: string;
  lunchBreakMinutes: number;
}

export interface ScheduleProfile {
  workDays: DayOfWeek[];
  schedules: Partial<Record<DayOfWeek, DaySchedule>>;
}

export interface WorkedDay {
  date: string;
  entryTime: string | null;
  exitTime: string | null;
  lunchBreakMinutes: number | null;
}

export interface ScheduleClassifierInput {
  profile: ScheduleProfile;
  workedDays: WorkedDay[];
  salary: number;
}

export type Theme = 'light' | 'dark';
