import { describe, it, expect } from 'vitest';
import { isHoliday, getHolidayName, HOLIDAYS_2026 } from '../holidays';

describe('HOLIDAYS_2026', () => {
  it('contains all 19 Colombian holidays for 2026', () => {
    expect(HOLIDAYS_2026).toHaveLength(19);
  });
});

describe('isHoliday', () => {
  it.each([
    ['2026-01-01', 'Año Nuevo'],
    ['2026-01-12', 'Reyes Magos'],
    ['2026-03-23', 'San José'],
    ['2026-04-02', 'Jueves Santo'],
    ['2026-04-03', 'Viernes Santo'],
    ['2026-05-01', 'Día del Trabajo'],
    ['2026-05-18', 'Ascensión del Señor'],
    ['2026-06-08', 'Corpus Christi'],
    ['2026-06-15', 'Sagrado Corazón de Jesús'],
    ['2026-06-29', 'San Pedro y San Pablo'],
    ['2026-07-13', 'Virgen de Chiquinquirá'],
    ['2026-07-20', 'Independencia'],
    ['2026-08-07', 'Batalla de Boyacá'],
    ['2026-08-17', 'Asunción de la Virgen'],
    ['2026-10-12', 'Diversidad Étnica y Cultural'],
    ['2026-11-02', 'Todos los Santos'],
    ['2026-11-16', 'Independencia de Cartagena'],
    ['2026-12-08', 'Inmaculada Concepción'],
    ['2026-12-25', 'Navidad'],
  ])('returns true for %s (%s)', (date) => {
    expect(isHoliday(date)).toBe(true);
  });

  it('accepts Date objects', () => {
    expect(isHoliday(new Date('2026-07-20T12:00:00'))).toBe(true);
  });

  it('returns false for a regular Monday', () => {
    expect(isHoliday('2026-07-06')).toBe(false);
  });

  it('returns false for February 29 (2026 is not a leap year)', () => {
    expect(isHoliday('2026-02-29')).toBe(false);
  });

  it('returns false for December 26', () => {
    expect(isHoliday('2026-12-26')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isHoliday('')).toBe(false);
  });
});

describe('getHolidayName', () => {
  it.each([
    ['2026-01-01', 'Año Nuevo'],
    ['2026-01-12', 'Reyes Magos'],
    ['2026-07-13', 'Virgen de Chiquinquirá'],
    ['2026-12-25', 'Navidad'],
  ])('returns "%s" for %s', (date, name) => {
    expect(getHolidayName(date)).toBe(name);
  });

  it('accepts Date objects', () => {
    expect(getHolidayName(new Date('2026-07-20T12:00:00'))).toBe('Independencia');
  });

  it('returns null for a non-holiday', () => {
    expect(getHolidayName('2026-07-06')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(getHolidayName('')).toBeNull();
  });
});
