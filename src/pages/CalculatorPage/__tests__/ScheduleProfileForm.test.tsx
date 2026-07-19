import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScheduleProfileForm } from '../ScheduleProfileForm';
import type { ScheduleProfile } from '../../../lib/types';

const BASE_PROFILE: ScheduleProfile = {
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60,
};

describe('ScheduleProfileForm', () => {
  it('renders with null profile → shows defaults (Mon-Fri, 08:00, 18:00, 60)', () => {
    render(<ScheduleProfileForm profile={null} onChange={() => {}} />);
    expect(screen.getByRole('checkbox', { name: /lun/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /vie/i })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /sáb/i })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /dom/i })).not.toBeChecked();
    expect(screen.getByLabelText('Hora de entrada')).toHaveValue('08:00');
    expect(screen.getByLabelText('Hora de salida')).toHaveValue('18:00');
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

  it('changing time input calls onChange with updated entryTime', () => {
    const handleChange = vi.fn();
    render(<ScheduleProfileForm profile={BASE_PROFILE} onChange={handleChange} />);
    fireEvent.change(screen.getByLabelText('Hora de entrada'), { target: { value: '09:00' } });
    expect(handleChange).toHaveBeenCalledWith(expect.objectContaining({ entryTime: '09:00' }));
  });

  it('shows validation error when exit time is before entry time', () => {
    render(<ScheduleProfileForm profile={{ ...BASE_PROFILE, entryTime: '18:00', exitTime: '08:00' }} onChange={() => {}} />);
    expect(screen.getByText('La hora de salida debe ser posterior a la hora de entrada.')).toBeInTheDocument();
  });
});
