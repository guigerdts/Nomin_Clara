import { useState } from 'react';
import type { ScheduleProfile, WorkedDay } from '../../lib/types';
import styles from './DayEntryForm.module.css';

interface DayEntryFormProps {
  days: WorkedDay[];
  profile: ScheduleProfile;
  onChange: (days: WorkedDay[]) => void;
}

const WEEKDAYS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDate(isoDate: string): string {
  const date = new Date(isoDate + 'T12:00:00');
  return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function DayEntryForm({ days, profile, onChange }: DayEntryFormProps) {
  const [newDate, setNewDate] = useState('');

  const addDay = () => {
    if (!newDate || days.some(d => d.date === newDate)) return;
    onChange([
      ...days,
      { date: newDate, entryTime: profile.entryTime, exitTime: profile.exitTime, lunchBreakMinutes: profile.lunchBreakMinutes },
    ]);
    setNewDate('');
  };

  const updateDay = (index: number, updates: Partial<WorkedDay>) => {
    onChange(days.map((d, i) => (i === index ? { ...d, ...updates } : d)));
  };

  const toggleDayOff = (index: number, isOff: boolean) => {
    updateDay(index, isOff
      ? { entryTime: null, exitTime: null, lunchBreakMinutes: null }
      : { entryTime: profile.entryTime, exitTime: profile.exitTime, lunchBreakMinutes: profile.lunchBreakMinutes },
    );
  };

  const workedCount = days.filter(d => d.entryTime !== null).length;

  return (
    <div className={`card ${styles.form}`}>
      <h2>Días trabajados</h2>
      <p className={styles.subtitle}>Agregá los días específicos del período que querés clasificar.</p>

      <div className={styles.addDayRow}>
        <label htmlFor="new-day-date" className={styles.srOnly}>Fecha del día</label>
        <input type="date" id="new-day-date" value={newDate} onChange={e => setNewDate(e.target.value)} className={styles.dateInput} />
        <button type="button" className="btn btn-primary btn-small" onClick={addDay} disabled={!newDate}>Agregar día</button>
      </div>

      {days.length === 0 && (
        <p className={styles.emptyState}>Todavía no agregaste días. Elegí una fecha y presioná "Agregar día".</p>
      )}

      {days.map((day, index) => {
        const isDayOff = day.entryTime === null;
        const hasTimeError = !isDayOff && day.entryTime !== null && day.exitTime !== null &&
          day.entryTime.length > 0 && day.exitTime.length > 0 && day.entryTime >= day.exitTime;

        return (
          <div key={day.date} className={styles.dayRow}>
            <div className={styles.dayRowHeader}>
              <span className={styles.dateLabel}>{formatDate(day.date)}</span>
              <button type="button" className="btn-icon" onClick={() => onChange(days.filter((_, i) => i !== index))} aria-label={`Quitar ${formatDate(day.date)}`}>×</button>
            </div>
            <div className={styles.dayRowFields}>
              {(['entryTime', 'exitTime'] as const).map(field => (
                <div key={field} className={styles.fieldGroup}>
                  <label className={styles.fieldLabel} htmlFor={`day-${index}-${field}`}>
                    {field === 'entryTime' ? 'Entrada' : 'Salida'}
                  </label>
                  <input type="time" id={`day-${index}-${field}`} value={day[field] ?? ''} disabled={isDayOff}
                    onChange={e => updateDay(index, { [field]: e.target.value })} className={styles.timeInput} />
                </div>
              ))}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor={`day-${index}-lunch`}>Almuerzo</label>
                <input type="number" id={`day-${index}-lunch`} min={0} step={15} value={day.lunchBreakMinutes ?? ''} disabled={isDayOff}
                  onChange={e => updateDay(index, { lunchBreakMinutes: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0) })}
                  className={styles.lunchInput} />
              </div>
            </div>
            {hasTimeError && <span className={styles.validationError} role="alert">La salida debe ser posterior a la entrada.</span>}
            <label className={styles.dayOffToggle}>
              <input type="checkbox" checked={isDayOff} onChange={e => toggleDayOff(index, e.target.checked)} />
              <span>Día de descanso</span>
            </label>
          </div>
        );
      })}

      {days.length > 0 && (
        <div className={styles.summary}>
          {days.length} día{days.length !== 1 ? 's' : ''} agregado{days.length !== 1 ? 's' : ''}
          {workedCount > 0 && <>, {workedCount} con horas trabajadas</>}
        </div>
      )}
    </div>
  );
}
