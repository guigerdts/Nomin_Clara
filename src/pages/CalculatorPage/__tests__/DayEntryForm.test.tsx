import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DayEntryForm } from '../DayEntryForm';
import type { ScheduleProfile, WorkedDay } from '../../../lib/types';

const PROFILE: ScheduleProfile = {
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  schedules: {
    monday:    { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    tuesday:   { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    wednesday: { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    thursday:  { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    friday:    { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
  },
};

beforeEach(cleanup);

describe('DayEntryForm', () => {
  it('adding a Monday date creates a row pre-filled from Monday schedule', () => {
    const handleChange = vi.fn();
    render(<DayEntryForm days={[]} profile={PROFILE} onChange={handleChange} />);
    // 2026-07-13 is a Monday
    fireEvent.change(screen.getByLabelText('Fecha del día'), { target: { value: '2026-07-13' } });
    fireEvent.click(screen.getByText('Agregar día'));
    expect(handleChange).toHaveBeenCalledTimes(1);
    const newDays = handleChange.mock.calls[0][0] as WorkedDay[];
    expect(newDays).toHaveLength(1);
    expect(newDays[0]).toEqual({ date: '2026-07-13', entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 });
  });

  it('pre-fills from Saturday schedule when adding a Saturday date', () => {
    const satProfile: ScheduleProfile = {
      workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      schedules: {
        monday:   { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
        tuesday:  { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
        wednesday: { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
        thursday: { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
        friday:   { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
        saturday: { entryTime: '07:00', exitTime: '14:00', lunchBreakMinutes: 0 },
      },
    };
    const handleChange = vi.fn();
    render(<DayEntryForm days={[]} profile={satProfile} onChange={handleChange} />);
    // 2026-07-11 is a Saturday
    fireEvent.change(screen.getByLabelText('Fecha del día'), { target: { value: '2026-07-11' } });
    fireEvent.click(screen.getByText('Agregar día'));
    expect(handleChange).toHaveBeenCalledTimes(1);
    const newDays = handleChange.mock.calls[0][0] as WorkedDay[];
    expect(newDays[0]).toEqual({ date: '2026-07-11', entryTime: '07:00', exitTime: '14:00', lunchBreakMinutes: 0 });
  });

  it('toggling day off disables time inputs and sets null values', () => {
    const handleChange = vi.fn();
    render(<DayEntryForm days={[{ date: '2026-07-13', entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 }]} profile={PROFILE} onChange={handleChange} />);
    fireEvent.click(screen.getByText('Día de descanso'));
    const updated = handleChange.mock.calls[0][0] as WorkedDay[];
    expect(updated[0].entryTime).toBeNull();
    expect(updated[0].exitTime).toBeNull();
    expect(updated[0].lunchBreakMinutes).toBeNull();
  });

  it('toggling day off back on restores from per-day schedule', () => {
    const handleChange = vi.fn();
    render(<DayEntryForm days={[{ date: '2026-07-13', entryTime: null, exitTime: null, lunchBreakMinutes: null }]} profile={PROFILE} onChange={handleChange} />);
    fireEvent.click(screen.getByText('Día de descanso')); // uncheck = restore
    const updated = handleChange.mock.calls[0][0] as WorkedDay[];
    // 2026-07-13 is Monday → Monday schedule is 08:00-18:00+60
    expect(updated[0].entryTime).toBe('08:00');
    expect(updated[0].exitTime).toBe('18:00');
    expect(updated[0].lunchBreakMinutes).toBe(60);
  });

  it('remove button removes the day row', () => {
    const handleChange = vi.fn();
    const days = [
      { date: '2026-07-13', entryTime: '08:00' as string | null, exitTime: '18:00' as string | null, lunchBreakMinutes: 60 as number | null },
      { date: '2026-07-14', entryTime: '08:00' as string | null, exitTime: '18:00' as string | null, lunchBreakMinutes: 60 as number | null },
    ];
    render(<DayEntryForm days={days} profile={PROFILE} onChange={handleChange} />);
    fireEvent.click(screen.getByLabelText(/quitar lun 13/i));
    expect(handleChange.mock.calls[0][0]).toHaveLength(1);
    expect(handleChange.mock.calls[0][0][0].date).toBe('2026-07-14');
  });

  it('summary shows correct counts with mixed days', () => {
    render(<DayEntryForm days={[
      { date: '2026-07-13', entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
      { date: '2026-07-14', entryTime: null, exitTime: null, lunchBreakMinutes: null },
    ]} profile={PROFILE} onChange={() => {}} />);
    expect(screen.getByText(/2 días agregados, 1 con horas trabajadas/)).toBeInTheDocument();
  });

  it('shows empty state when no days', () => {
    render(<DayEntryForm days={[]} profile={PROFILE} onChange={() => {}} />);
    expect(screen.getByText(/todavía no agregaste días/i)).toBeInTheDocument();
  });

  it('does not add duplicate dates', () => {
    const handleChange = vi.fn();
    render(<DayEntryForm days={[{ date: '2026-07-13', entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 }]} profile={PROFILE} onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText('Fecha del día'), { target: { value: '2026-07-13' } });
    fireEvent.click(screen.getByText('Agregar día'));
    expect(handleChange).not.toHaveBeenCalled();
  });
});
