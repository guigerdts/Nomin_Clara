import type { DayOfWeek, ScheduleProfile } from '../../lib/types';
import styles from './ScheduleProfileForm.module.css';

interface ScheduleProfileFormProps {
  profile: ScheduleProfile | null;
  onChange: (profile: ScheduleProfile) => void;
}

const DEFAULT_PROFILE: ScheduleProfile = {
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60,
};

const DAY_LABELS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Lun' }, { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mié' }, { key: 'thursday', label: 'Jue' },
  { key: 'friday', label: 'Vie' }, { key: 'saturday', label: 'Sáb' },
  { key: 'sunday', label: 'Dom' },
];

export function ScheduleProfileForm({ profile, onChange }: ScheduleProfileFormProps) {
  const current = profile ?? DEFAULT_PROFILE;
  const showTimeError = current.entryTime.length > 0 && current.exitTime.length > 0 && current.entryTime >= current.exitTime;

  const toggleDay = (day: DayOfWeek) => {
    const workDays = current.workDays.includes(day)
      ? current.workDays.filter(d => d !== day)
      : [...current.workDays, day];
    if (workDays.length === 0) return;
    onChange({ ...current, workDays });
  };

  return (
    <div className={`card ${styles.profileForm}`}>
      <h2>Perfil semanal</h2>
      <p className={styles.subtitle}>Configurá tu horario base para la clasificación automática de horas.</p>

      <div className={styles.fieldGroup}>
        <label className={styles.label}>Días laborales</label>
        <div className={styles.daysRow} role="group" aria-label="Días laborales">
          {DAY_LABELS.map(({ key, label }) => (
            <label key={key} className={styles.dayCheckbox}>
              <input type="checkbox" checked={current.workDays.includes(key)} onChange={() => toggleDay(key)} />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {(['entryTime', 'exitTime'] as const).map(field => (
        <div key={field} className={styles.fieldGroup}>
          <label className={styles.label} htmlFor={field}>{field === 'entryTime' ? 'Hora de entrada' : 'Hora de salida'}</label>
          <input type="time" id={field} value={current[field]} onChange={e => onChange({ ...current, [field]: e.target.value })} className={styles.timeInput} />
          {field === 'exitTime' && showTimeError && (
            <span className={styles.validationError} role="alert">La hora de salida debe ser posterior a la hora de entrada.</span>
          )}
        </div>
      ))}

      <div className={styles.fieldGroup}>
        <label className={styles.label} htmlFor="lunch-break">Almuerzo (minutos)</label>
        <input type="number" id="lunch-break" min={0} step={15} value={current.lunchBreakMinutes}
          onChange={e => onChange({ ...current, lunchBreakMinutes: e.target.value === '' ? 0 : Math.max(0, parseInt(e.target.value) || 0) })}
          className={styles.lunchInput} />
      </div>
    </div>
  );
}
