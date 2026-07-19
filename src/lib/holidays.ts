/**
 * holidays.ts
 *
 * Colombian holidays for 2026 — used by scheduleClassifier() to detect
 * holiday vs regular days for surcharge classification.
 *
 * ⚠️ Lista específica para el año 2026 — actualizar manualmente cada enero
 * con el calendario oficial del año siguiente. No usar para años distintos
 * a 2026 sin verificar.
 *
 * ⚠️ UPDATE every January when the government publishes the next year's
 * official holiday calendar. Same maintenance pattern as constants.ts.
 *
 * Source verification (2026):
 * - Ley Emiliani (festivos trasladables al lunes siguiente)
 * - Ley 2578/2026 (13 de julio: Virgen de Chiquinquirá, nuevo desde 2026)
 * - Decretos anuales del Ministerio del Interior
 */

export interface Holiday {
  date: string;
  name: string;
  isNewLaw?: true;
}

/**
 * 19 Colombian holidays for 2026.
 *
 * Incluye:
 * - Festivos fijos (1 enero, 1 mayo, 20 julio, 7 agosto, 8 diciembre, 25 diciembre)
 * - Festivos religiosos fijos (Jueves Santo, Viernes Santo, Inmaculada Concepción)
 * - Festivos trasladables por Ley Emiliani (Reyes, San José, Ascensión, etc.)
 * - Festivo nuevo Ley 2578/2026 (13 julio — Virgen de Chiquinquirá)
 */
export const HOLIDAYS_2026: Holiday[] = [
  { date: '2026-01-01', name: 'Año Nuevo' },
  { date: '2026-01-12', name: 'Reyes Magos' },
  { date: '2026-03-23', name: 'San José' },
  { date: '2026-04-02', name: 'Jueves Santo' },
  { date: '2026-04-03', name: 'Viernes Santo' },
  { date: '2026-05-01', name: 'Día del Trabajo' },
  { date: '2026-05-18', name: 'Ascensión del Señor' },
  { date: '2026-06-08', name: 'Corpus Christi' },
  { date: '2026-06-15', name: 'Sagrado Corazón de Jesús' },
  { date: '2026-06-29', name: 'San Pedro y San Pablo' },
  {
    date: '2026-07-13',
    name: 'Virgen de Chiquinquirá',
    isNewLaw: true,
    /* Festivo nuevo desde 2026 (Ley 2578/2026, sancionada 1 junio 2026) —
     * tiene demanda de inconstitucionalidad en curso mas vigente.
     * Verificar en años futuros. */
  },
  { date: '2026-07-20', name: 'Independencia' },
  { date: '2026-08-07', name: 'Batalla de Boyacá' },
  { date: '2026-08-17', name: 'Asunción de la Virgen' },
  { date: '2026-10-12', name: 'Diversidad Étnica y Cultural' },
  { date: '2026-11-02', name: 'Todos los Santos' },
  { date: '2026-11-16', name: 'Independencia de Cartagena' },
  { date: '2026-12-08', name: 'Inmaculada Concepción' },
  { date: '2026-12-25', name: 'Navidad' },
];

function normalizeDate(date: string | Date): string {
  if (typeof date === 'string') {
    // Accept "2026-07-13" or "2026-07-13T..." — extract just the date part
    return date.slice(0, 10);
  }
  // Date object → ISO string, take YYYY-MM-DD part
  const iso = date.toISOString();
  return iso.slice(0, 10);
}

/**
 * Checks if a given date is a Colombian holiday in 2026.
 * Accepts ISO date strings ("2026-07-13") or Date objects.
 */
export function isHoliday(date: string | Date): boolean {
  const normalized = normalizeDate(date);
  if (!normalized) return false;
  return HOLIDAYS_2026.some((h) => h.date === normalized);
}

/**
 * Returns the holiday name if the date is a Colombian holiday in 2026,
 * or null if it's a regular day.
 */
export function getHolidayName(date: string | Date): string | null {
  const normalized = normalizeDate(date);
  if (!normalized) return null;
  const holiday = HOLIDAYS_2026.find((h) => h.date === normalized);
  return holiday?.name ?? null;
}
