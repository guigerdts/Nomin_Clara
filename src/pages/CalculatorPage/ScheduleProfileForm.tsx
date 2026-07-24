import { useState, useCallback, useMemo } from 'react';
import type { DayOfWeek, DaySchedule, ScheduleProfile } from '../../lib/types';
import styles from './ScheduleProfileForm.module.css';

interface ScheduleProfileFormProps {
  profile: ScheduleProfile | null;
  onChange: (profile: ScheduleProfile) => void;
}

const ALL_DAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mié' },
  { key: 'thursday', label: 'Jue' },
  { key: 'friday', label: 'Vie' },
  { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
];

const FALLBACK_SCHEDULE: DaySchedule = { entryTime: '07:00', exitTime: '17:00', lunchBreakMinutes: 60 };
const SATURDAY_SCHEDULE: DaySchedule = { entryTime: '07:00', exitTime: '14:00', lunchBreakMinutes: 0 };
const SUNDAY_SCHEDULE: DaySchedule = { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 };

const DEFAULT_PROFILE: ScheduleProfile = {
  workDays: ['tuesday', 'wednesday', 'thursday', 'friday'],
  schedules: {
    tuesday:   { entryTime: '07:00', exitTime: '17:00', lunchBreakMinutes: 60 },
    wednesday: { entryTime: '07:00', exitTime: '17:00', lunchBreakMinutes: 60 },
    thursday:  { entryTime: '07:00', exitTime: '17:00', lunchBreakMinutes: 60 },
    friday:    { entryTime: '07:00', exitTime: '17:00', lunchBreakMinutes: 60 },
    saturday:  { entryTime: '07:00', exitTime: '14:00', lunchBreakMinutes: 0 },
  },
};

function defaultScheduleForDay(day: DayOfWeek): DaySchedule {
  if (day === 'saturday') return { ...SATURDAY_SCHEDULE };
  if (day === 'sunday') return { ...SUNDAY_SCHEDULE };
  return { ...FALLBACK_SCHEDULE };
}

const DAY_LABEL_MAP: Record<DayOfWeek, string> = {
  monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié',
  thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom',
};

export function ScheduleProfileForm({ profile, onChange }: ScheduleProfileFormProps) {
  const current = profile ?? DEFAULT_PROFILE;
  const [copySource, setCopySource] = useState<DayOfWeek | ''>('');

  const checkedDays = current.workDays;
  const schedules = current.schedules;

  const allIdentical = useMemo(() => {
    const checked = checkedDays.filter(d => schedules[d]);
    if (checked.length <= 1) return true;
    const first = schedules[checked[0]];
    if (!first) return true;
    return checked.every(d => {
      const s = schedules[d];
      return s && s.entryTime === first.entryTime && s.exitTime === first.exitTime && s.lunchBreakMinutes === first.lunchBreakMinutes;
    });
  }, [checkedDays, schedules]);

  const toggleDay = useCallback((day: DayOfWeek) => {
    const isCurrentlyChecked = checkedDays.includes(day);
    const newWorkDays = isCurrentlyChecked
      ? checkedDays.filter(d => d !== day)
      : [...checkedDays, day];

    if (newWorkDays.length === 0) return;

    if (isCurrentlyChecked) {
      // Keep schedule in state; just remove from workDays
      onChange({ ...current, workDays: newWorkDays });
    } else {
      // Add day with schedule (restore previous or use default)
      const newSchedules = { ...schedules };
      if (!newSchedules[day]) {
        newSchedules[day] = defaultScheduleForDay(day);
      }
      onChange({ workDays: newWorkDays, schedules: newSchedules });
    }
  }, [checkedDays, current, onChange, schedules]);

  const updateDaySchedule = useCallback((day: DayOfWeek, updates: Partial<DaySchedule>) => {
    const prev = schedules[day] ?? FALLBACK_SCHEDULE;
    onChange({
      ...current,
      schedules: { ...schedules, [day]: { ...prev, ...updates } },
    });
  }, [current, onChange, schedules]);

  const updateAllSchedules = useCallback((updates: Partial<DaySchedule>) => {
    const newSchedules = { ...schedules };
    for (const day of checkedDays) {
      const prev = newSchedules[day] ?? FALLBACK_SCHEDULE;
      newSchedules[day] = { ...prev, ...updates };
    }
    onChange({ ...current, schedules: newSchedules });
  }, [checkedDays, current, onChange, schedules]);

  const handleCopySchedule = useCallback((targetDay: DayOfWeek, sourceDay: DayOfWeek) => {
    const source = schedules[sourceDay];
    if (!source) return;
    updateDaySchedule(targetDay, { entryTime: source.entryTime, exitTime: source.exitTime, lunchBreakMinutes: source.lunchBreakMinutes });
    setCopySource('');
  }, [schedules, updateDaySchedule]);

  const showTimeError = (day: DayOfWeek) => {
    const s = schedules[day];
    if (!s) return false;
    return s.entryTime.length > 0 && s.exitTime.length > 0 && s.entryTime >= s.exitTime;
  };

  const renderTimeInputs = (day: DayOfWeek) => {
    const s = schedules[day] ?? FALLBACK_SCHEDULE;
    const err = showTimeError(day);
    const otherDays = checkedDays.filter(d => d !== day && schedules[d]);

    return (
      <div key={day} className={styles.dayScheduleBlock}>
        <span className={styles.dayScheduleLabel}>{DAY_LABEL_MAP[day]}</span>
        <div className={styles.dayScheduleFields}>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabelSm} htmlFor={`entry-${day}`}>Entrada</label>
            <input type="time" id={`entry-${day}`} value={s.entryTime}
              onChange={e => updateDaySchedule(day, { entryTime: e.target.value })}
              className={styles.timeInput} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabelSm} htmlFor={`exit-${day}`}>Salida</label>
            <input type="time" id={`exit-${day}`} value={s.exitTime}
              onChange={e => updateDaySchedule(day, { exitTime: e.target.value })}
              className={styles.timeInput} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabelSm} htmlFor={`lunch-${day}`}>Almuerzo</label>
            <input type="number" id={`lunch-${day}`} min={0} step={15} value={s.lunchBreakMinutes}
              onChange={e => updateDaySchedule(day, { lunchBreakMinutes: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0) })}
              className={styles.lunchInput} />
          </div>
          {otherDays.length > 0 && (
            <div className={styles.copyGroup}>
              <select className={styles.copySelect} value={copySource} onChange={e => {
                const val = e.target.value;
                if (val) handleCopySchedule(day, val as DayOfWeek);
              }}>
                <option value="">Usar mismo horario</option>
                {otherDays.map(d => (
                  <option key={d} value={d}>como {DAY_LABEL_MAP[d]}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        {err && <span className={styles.validationError} role="alert">La hora de salida debe ser posterior a la hora de entrada.</span>}
      </div>
    );
  };

  const renderCollapsedInputs = () => {
    const firstCheckedDay = checkedDays.find(d => schedules[d]);
    const first = firstCheckedDay ? (schedules[firstCheckedDay] ?? FALLBACK_SCHEDULE) : FALLBACK_SCHEDULE;
    const err = firstCheckedDay && showTimeError(firstCheckedDay);

    return (
      <div className={styles.collapsedBlock}>
        <p className={styles.collapsedHint}>Mismo horario todos los días</p>
        <div className={styles.collapsedFields}>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="collapsed-entry">Hora de entrada</label>
            <input type="time" id="collapsed-entry" value={first.entryTime}
              onChange={e => updateAllSchedules({ entryTime: e.target.value })}
              className={styles.timeInput} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="collapsed-exit">Hora de salida</label>
            <input type="time" id="collapsed-exit" value={first.exitTime}
              onChange={e => updateAllSchedules({ exitTime: e.target.value })}
              className={styles.timeInput} />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="collapsed-lunch">Almuerzo (minutos)</label>
            <input type="number" id="collapsed-lunch" min={0} step={15} value={first.lunchBreakMinutes}
              onChange={e => updateAllSchedules({ lunchBreakMinutes: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0) })}
              className={styles.lunchInput} />
          </div>
        </div>
        {err && <span className={styles.validationError} role="alert">La hora de salida debe ser posterior a la hora de entrada.</span>}
      </div>
    );
  };

  return (
    <div className={`card ${styles.profileForm}`}>
      <h2>Perfil semanal</h2>
      <p className={styles.subtitle}>Configurá tu horario base para la clasificación automática de horas.</p>

      <fieldset className={styles.fieldGroup}>
        <legend className={styles.label}>Días laborales</legend>
        <div className={styles.daysRow}>
          {ALL_DAYS.map(({ key, label }) => (
            <label key={key} className={styles.dayCheckbox}>
              <input type="checkbox" checked={checkedDays.includes(key)} onChange={() => toggleDay(key)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {checkedDays.length > 0 && (
        allIdentical ? renderCollapsedInputs() : checkedDays.map(renderTimeInputs)
      )}
    </div>
  );
}
