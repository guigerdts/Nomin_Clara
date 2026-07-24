import type { PayrollInput, InputMode, ScheduleProfile, WorkedDay } from '../../lib/types';
import { getTransportAllowance, formatCOP, SMMLV } from '../../lib/rates';
import { ScheduleProfileForm } from './ScheduleProfileForm';
import { DayEntryForm } from './DayEntryForm';
import { useDraftQuincena } from '../../hooks/useDraftQuincena';
import type { DraftSavePayload } from '../../hooks/useDraftQuincena';
import { dayOfWeek } from '../../lib/scheduleClassifier';
import styles from './PayrollForm.module.css';

interface PayrollFormProps {
  values: PayrollInput;
  alias: string;
  onAliasChange: (value: string) => void;
  onNumberChange: (field: keyof PayrollInput, value: number) => void;
  onCalculate: () => void;
  warnings: string[];
  salaryError: string;
  inputMode?: InputMode;
  onInputModeChange?: (mode: InputMode) => void;
  scheduleProfile?: ScheduleProfile | null;
  onScheduleProfileChange?: (profile: ScheduleProfile) => void;
  workedDays?: WorkedDay[];
  onWorkedDaysChange?: (days: WorkedDay[]) => void;
  onCloseFortnight?: (payload: DraftSavePayload) => void;
}

const CONCEPT_FIELDS: {
  key: keyof PayrollInput;
  label: string;
  tip: string;
}[] = [
  {
    key: 'dayOT',
    label: 'Horas extra diurnas',
    tip: 'Horas extra trabajadas entre 6:00am y 7:00pm. Recargo: +25% (CST Art. 179).',
  },
  {
    key: 'nightOT',
    label: 'Horas extra nocturnas',
    tip: 'Horas extra entre 7:00pm y 6:00am. Recargo: +75% (CST Art. 179, Ley 2466).',
  },
  {
    key: 'nightSurcharge',
    label: 'Recargo nocturno (ordinario)',
    tip: 'Horas ORDINARIAS entre 7:00pm y 6:00am (no extra). Recargo: +35% (CST Art. 168).',
  },
  {
    key: 'holidayDayOT',
    label: 'H. extra diurna dom/fest',
    tip: 'Horas extra en domingo/festivo en jornada diurna. Multiplicador: ×2.15 (215%) (CST Art. 179, Ley 2466).',
  },
  {
    key: 'holidayNightOT',
    label: 'H. extra nocturna dom/fest',
    tip: 'Horas extra en domingo/festivo en jornada nocturna. Multiplicador: ×2.65 (265%) (CST Art. 179, Ley 2466).',
  },
  {
    key: 'holidayNightSurcharge',
    label: 'Recargo nocturno + festivo',
    tip: 'Horas ORDINARIAS en domingo/festivo en jornada nocturna (no extra). Recargo combinado: +125% (×2.25) (CST Art. 168, 179).',
  },
  {
    key: 'holidaySurcharge',
    label: 'Recargo dom/fest (ordinario)',
    tip: 'Horas ORDINARIAS trabajadas en domingo o festivo. Recargo: +90% (CST Art. 179).',
  },
];

function Tooltip({ tip }: { tip: string }) {
  return (
    <span className="tooltip-trigger" data-tip={tip} tabIndex={0} role="tooltip" aria-label={tip}>
      ⓘ
    </span>
  );
}

const FULL_MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function formatDateDisplay(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return `${d.getDate()} ${FULL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatDateShort(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
}

function formatDateRange(start: string, end: string): string {
  return `${formatDateDisplay(start)} al ${formatDateDisplay(end)}`;
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PayrollForm({
  values,
  alias,
  onAliasChange,
  onNumberChange,
  onCalculate,
  warnings,
  salaryError,
  inputMode = 'manual',
  onInputModeChange,
  scheduleProfile,
  onScheduleProfileChange,
  workedDays,
  onWorkedDaysChange,
  onCloseFortnight,
}: PayrollFormProps) {
  const transport = getTransportAllowance(values.salary);
  const {
    draft,
    addDay,
    updateDay,
    removeDay,
    closeDraft,
    discardDraft,
    progress,
    staleDraftInfo,
  } = useDraftQuincena();

  const handleNumberChange = (field: keyof PayrollInput, raw: string) => {
    const parsed = raw === '' ? 0 : parseFloat(raw);
    onNumberChange(field, isNaN(parsed) ? 0 : parsed);
  };

  const handleAddToday = () => {
    const today = todayISO();
    const dow = dayOfWeek(today);
    const daySchedule = scheduleProfile?.schedules[dow];
    addDay({
      date: today,
      entryTime: daySchedule?.entryTime ?? '08:00',
      exitTime: daySchedule?.exitTime ?? '17:00',
      lunchBreakMinutes: daySchedule?.lunchBreakMinutes ?? 60,
    });
  };

  const handleCloseFortnightClick = () => {
    closeDraft(payload => onCloseFortnight?.(payload));
  };

  const handleStaleClose = () => {
    closeDraft(payload => onCloseFortnight?.(payload));
  };

  const handleStaleDiscard = () => {
    discardDraft();
  };

  return (
    <div className="card">
      <h2>Tus datos</h2>

      {/* Mode toggle */}
      {onInputModeChange && (
        <div className={styles.modeToggle}>
          <button
            type="button"
            className={`${styles.modeBtn} ${inputMode === 'manual' ? styles.modeBtnActive : ''}`}
            onClick={() => onInputModeChange('manual')}
          >
            Manual
          </button>
          <button
            type="button"
            className={`${styles.modeBtn} ${inputMode === 'schedule' ? styles.modeBtnActive : ''}`}
            onClick={() => onInputModeChange('schedule')}
          >
            Horario Detallado
          </button>
        </div>
      )}

      {/* Stale draft dialog — shown on mount regardless of mode */}
      {staleDraftInfo?.exists && (
        <div className={styles.staleOverlay}>
          <div className={styles.staleDialog}>
            <p className={styles.staleText}>
              Tienes un registro sin cerrar del {formatDateRange(staleDraftInfo.startDate, staleDraftInfo.endDate)}.
              {' '}¿Querés cerrarlo ahora o descartarlo?
            </p>
            <div className={styles.staleDialogBtns}>
              <button type="button" className="btn btn-primary" onClick={handleStaleClose}>
                Cerrar
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleStaleDiscard}>
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hoy section — schedule mode only */}
      {inputMode === 'schedule' && (
        <div className={styles.hoySection}>
          <div className={styles.hoyHeader}>
            <span className={styles.hoyTitle}>📅 Hoy, {formatDateDisplay(todayISO())}</span>
            <button
              type="button"
              className="btn btn-primary btn-small"
              onClick={handleAddToday}
              disabled={!!staleDraftInfo?.exists}
            >
              Agregar hoy
            </button>
          </div>
          <p className={styles.hoySubtext}>
            Registrá tus horas del día a día. Al final de la quincena, cerrás y se guarda automáticamente.
          </p>
          {draft && draft.workedDays.length > 0 && (
            <p className={styles.hoyProgress}>
              Días registrados: {progress.registered}/{progress.total}
            </p>
          )}
          {draft && draft.workedDays.length > 0 && (
            <div className={styles.hoyDayList}>
              {draft.workedDays.map(day => (
                <div key={day.date} className={styles.hoyDayRow}>
                  <span className={styles.hoyDayDate}>{formatDateShort(day.date)}</span>
                  <div className={styles.hoyDayFields}>
                    <div className={styles.fieldGroup}>
                      <label className={styles.hoyFieldLabel} htmlFor={`draft-entry-${day.date}`}>Entrada</label>
                      <input
                        type="time"
                        id={`draft-entry-${day.date}`}
                        value={day.entryTime ?? ''}
                        className={styles.hoyTimeInput}
                        onChange={e => updateDay(day.date, { entryTime: e.target.value || null })}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.hoyFieldLabel} htmlFor={`draft-exit-${day.date}`}>Salida</label>
                      <input
                        type="time"
                        id={`draft-exit-${day.date}`}
                        value={day.exitTime ?? ''}
                        className={styles.hoyTimeInput}
                        onChange={e => updateDay(day.date, { exitTime: e.target.value || null })}
                      />
                    </div>
                    <div className={styles.fieldGroup}>
                      <label className={styles.hoyFieldLabel} htmlFor={`draft-lunch-${day.date}`}>Almuerzo</label>
                      <input
                        type="number"
                        id={`draft-lunch-${day.date}`}
                        min={0}
                        step={15}
                        value={day.lunchBreakMinutes ?? ''}
                        className={styles.hoyLunchInput}
                        onChange={e => updateDay(day.date, { lunchBreakMinutes: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0) })}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => removeDay(day.date)}
                    aria-label={`Quitar ${formatDateShort(day.date)}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {draft && draft.workedDays.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCloseFortnightClick}
              style={{ marginTop: '0.75rem', width: '100%' }}
            >
              Cerrar quincena &amp; save
            </button>
          )}
        </div>
      )}

      <form
        id="calc-form"
        noValidate
        onSubmit={e => {
          e.preventDefault();
          onCalculate();
        }}
      >
        {/* Salario */}
        <div className="field-group">
          <label htmlFor="salary">Salario mensual base (COP)</label>
          <input
            type="number"
            id="salary"
            name="salary"
            min={0}
            step={1000}
            placeholder="Ej: 2600000"
            required
            value={values.salary || ''}
            onChange={e => handleNumberChange('salary', e.target.value)}
          />
          {salaryError && (
            <span id="salary-error" className="field-error" style={{ color: 'var(--color-danger)', fontSize: 'var(--font-size-xs)' }}>
              {salaryError}
            </span>
          )}
          <span className="field-hint">
            Tu salario mensual sin incluir auxilio de transporte ni bonificaciones.
          </span>
        </div>

        {/* Alias */}
        <div className="field-group">
          <label htmlFor="alias">Tu nombre o alias</label>
          <input
            type="text"
            id="alias"
            name="alias"
            maxLength={60}
            placeholder="Ej: María López"
            autoComplete="name"
            value={alias}
            onChange={e => onAliasChange(e.target.value)}
          />
          <span className="field-hint">Para identificar tus registros en la comparativa.</span>
        </div>

        {/* Transporte */}
        {values.salary > 0 && (
          <div className="field-group" id="transport-section">
            <label>Auxilio de transporte</label>
            <div className="transport-display">
              <span className={`badge ${transport > 0 ? 'badge-success' : 'badge-muted'}`}>
                {transport > 0 ? 'Aplica' : 'No aplica'}
              </span>
              <span className="monetary">{formatCOP(transport)}</span>
              <span className="field-hint">
                Aplica automáticamente si tu salario ≤ 2 SMMLV ({formatCOP(SMMLV * 2)}).
              </span>
            </div>
          </div>
        )}

        <hr className="divider" />

        {inputMode === 'manual' ? (
          <>
            <h3>Horas trabajadas en la quincena</h3>
            <p className="field-hint">
              Ingresá las cantidades de cada tipo de hora trabajada en los últimos 15 días.
            </p>

            <div className="hours-grid">
              {CONCEPT_FIELDS.map(field => (
                <div className="field-group" key={field.key}>
                  <label htmlFor={field.key}>
                    {field.label}
                    <Tooltip tip={field.tip} />
                  </label>
                  <input
                    type="number"
                    id={field.key}
                    name={field.key}
                    min={0}
                    step={0.5}
                    value={(values[field.key] as number) || ''}
                    placeholder="0"
                    onChange={e => handleNumberChange(field.key, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {onScheduleProfileChange && (
              <ScheduleProfileForm
                profile={scheduleProfile ?? null}
                onChange={onScheduleProfileChange}
              />
            )}
            {scheduleProfile && onWorkedDaysChange && (
              <DayEntryForm
                days={workedDays ?? []}
                profile={scheduleProfile}
                onChange={onWorkedDaysChange}
              />
            )}
          </>
        )}

        {/* OT Warnings (manual mode only) */}
        {inputMode === 'manual' && warnings.length > 0 && (
          <div id="ot-warning" className="alert alert-warning">
            <strong>⚠️ Límites de horas extra</strong>
            <ul>
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {inputMode === 'schedule' ? 'Clasificar y Calcular' : 'Calcular'}
          </button>
        </div>
      </form>
    </div>
  );
}
