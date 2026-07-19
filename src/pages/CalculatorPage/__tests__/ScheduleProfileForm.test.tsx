import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleProfileForm } from '../ScheduleProfileForm';
import type { ScheduleProfile } from '../../../lib/types';

const BASE_PROFILE: ScheduleProfile = {
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  schedules: {
    monday:    { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    tuesday:   { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    wednesday: { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    thursday:  { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    friday:    { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
  },
};

describe('ScheduleProfileForm', () => {
  it('renders with null profile → shows defaults (Mar-Vie, 07:00, 17:00, 60)', () => {
    render(<ScheduleProfileForm profile={null} onChange={() => {}} />);
    // Default: Tue-Fri
    expect(screen.getByRole('checkbox', { name: /mar/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /vie/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /lun/i })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /sáb/i })).not.toBeChecked();
    // Collapsed view since all identical
    expect(screen.getByText(/mismo horario todos los días/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Hora de entrada')).toHaveValue('07:00');
    expect(screen.getByLabelText('Hora de salida')).toHaveValue('17:00');
    expect(screen.getByLabelText('Almuerzo (minutos)')).toHaveValue(60);
  });

  it('changing a checkbox calls onChange with updated workDays', () => {
    const handleChange = vi.fn();
    render(<ScheduleProfileForm profile={BASE_PROFILE} onChange={handleChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /sáb/i }));
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      workDays: expect.arrayContaining(['saturday']),
    }));
  });

  it('changing a time input in collapsed view updates all schedules', () => {
    const handleChange = vi.fn();
    render(<ScheduleProfileForm profile={BASE_PROFILE} onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText('Hora de entrada'), { target: { value: '09:00' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({
      schedules: expect.objectContaining({
        monday: expect.objectContaining({ entryTime: '09:00' }),
      }),
    }));
  });

  it('shows validation error when exit time is before entry time', () => {
    // Profile with one day having inverted times
    const badProfile: ScheduleProfile = {
      workDays: ['monday'],
      schedules: {
        monday: { entryTime: '18:00', exitTime: '08:00', lunchBreakMinutes: 60 },
      },
    };
    render(<ScheduleProfileForm profile={badProfile} onChange={() => {}} />);
    expect(screen.getByText('La hora de salida debe ser posterior a la hora de entrada.')).toBeInTheDocument();
  });

  it('checking saturday shows separate time inputs when schedules differ', () => {
    const handleChange = vi.fn();
    // Friday has different schedule -> per-day view
    const mixedProfile: ScheduleProfile = {
      workDays: ['monday', 'friday'],
      schedules: {
        monday: { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
        friday: { entryTime: '08:00', exitTime: '17:00', lunchBreakMinutes: 60 },
      },
    };
    render(<ScheduleProfileForm profile={mixedProfile} onChange={handleChange} />);
    // Per-day view should show day schedule labels (not just checkbox labels)
    const dayLabels = screen.getAllByText('Lun');
    expect(dayLabels.length).toBeGreaterThanOrEqual(2); // checkbox + schedule label
    // Check that per-day schedule blocks are rendered with Entrada labels
    expect(screen.getAllByLabelText('Entrada').length).toBe(2); // one per day
  });
});
