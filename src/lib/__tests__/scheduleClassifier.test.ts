import { describe, it, expect } from 'vitest';
import { scheduleClassifier } from '../scheduleClassifier';
import { calculateBreakdown } from '../rates';
import type { ScheduleClassifierInput, ScheduleProfile, WorkedDay } from '../types';

const baseProfile: ScheduleProfile = {
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  schedules: {
    monday:    { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    tuesday:   { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    wednesday: { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    thursday:  { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    friday:    { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
  },
};

function makeInput(days: WorkedDay[], salary = 1_750_905): ScheduleClassifierInput {
  return { profile: baseProfile, workedDays: days, salary };
}

const zero = { dayOT: 0, nightOT: 0, nightSurcharge: 0, holidaySurcharge: 0, holidayDayOT: 0, holidayNightSurcharge: 0, holidayNightOT: 0 };

describe('scheduleClassifier', () => {
  it('regular day — all hours within expected, all 7 fields zero', () => {
    const result = scheduleClassifier(makeInput([
      { date: '2026-07-06', entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    ]));
    expect(result).toMatchObject(zero);
  });

  it('holiday day within expected hours — holidaySurcharge populated', () => {
    // July 20 (Independence Day), 08:00-18:00+60 → 9h all holidaySurcharge
    const result = scheduleClassifier(makeInput([
      { date: '2026-07-20', entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    ]));
    expect(result.holidaySurcharge).toBe(9);
    expect(result.holidayDayOT).toBe(0);
    expect(result.holidayNightOT).toBe(0);
  });

  it('holiday day WITH overtime — Ley 2578/2026 (July 13), 07:00-20:30+30min', () => {
    // 30-min blocks: 24 day + 3 night = 13.5h. Minus 1 lunch block.
    // 23 day + 3 night = 13h. Expected 9h (all from day).
    // holidaySurcharge=9, holidayDayOT=2.5, holidayNightOT=1.5
    const result = scheduleClassifier(makeInput([
      { date: '2026-07-13', entryTime: '07:00', exitTime: '20:30', lunchBreakMinutes: 30 },
    ]));
    expect(result.holidaySurcharge).toBe(9);
    expect(result.holidayDayOT).toBe(2.5);
    expect(result.holidayNightOT).toBe(1.5);
    expect(result.dayOT).toBe(0);
    expect(result.nightOT).toBe(0);
    expect(result.nightSurcharge).toBe(0);
    expect(result.holidayNightSurcharge).toBe(0);
  });

  it('non-work day + holiday — ALL hours are holidayDayOT (caso de referencia validado manualmente)', () => {
    // Profile: Mon-Fri BUT this test uses a profile where Monday is excluded.
    // July 13 2026 (Mon) = holiday (Ley 2578/2026) + day-of-rest per profile.
    // Worked 07:00-17:00+60min → 9h, all day (07:00-17:00 < 19:00 → 0 night).
    // Since Monday is NOT in workDays → adjExp=0 → ALL 9h = holidayDayOT.
    const profileExcludeMon: ScheduleProfile = {
      workDays: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      schedules: {
        tuesday:   { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
        wednesday: { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
        thursday:  { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
        friday:    { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
        saturday:  { entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
      },
    };
    const result = scheduleClassifier({
      profile: profileExcludeMon,
      workedDays: [
        { date: '2026-07-13', entryTime: '07:00', exitTime: '17:00', lunchBreakMinutes: 60 },
      ],
      salary: 2_080_000, // $1.040.000/quincena × 2
    });
    // Day hours only (07:00-17:00), all beyond 0 expected → holidayDayOT
    expect(result.holidaySurcharge).toBe(0);
    expect(result.holidayDayOT).toBe(9);
    expect(result.holidayNightOT).toBe(0);
    expect(result.holidayNightSurcharge).toBe(0);
    expect(result.dayOT).toBe(0);
    expect(result.nightOT).toBe(0);
    expect(result.nightSurcharge).toBe(0);

    // Sanity check: feed into calculateBreakdown and verify monetary result
    // hourValue = (2_080_000 / 30) / 7 ≈ 9,904.7619
    // holidayDayOT subtotal = 9h × 9,904.7619 × 2.15 ≈ 191,657.14
    const breakdown = calculateBreakdown(result);
    const holidayDayOTEntry = breakdown.entries.find(e => e.label === 'Hora extra diurna dom/fest');
    expect(holidayDayOTEntry).toBeDefined();
    expect(holidayDayOTEntry!.hours).toBe(9);
    expect(holidayDayOTEntry!.multiplier).toBe(2.15);
    expect(holidayDayOTEntry!.subtotal).toBeCloseTo(191_657.14, 0);
  });

  it('partial hour — 30-min entry correctly classified', () => {
    const result = scheduleClassifier(makeInput([
      { date: '2026-07-06', entryTime: '08:00', exitTime: '08:30', lunchBreakMinutes: 0 },
    ]));
    expect(result).toMatchObject(zero);
  });

  it('day off — all 7 fields zero', () => {
    const result = scheduleClassifier(makeInput([
      { date: '2026-07-06', entryTime: null, exitTime: null, lunchBreakMinutes: null },
    ]));
    expect(result).toMatchObject(zero);
  });

  it('mixed day/night shift — spanning 19:00 boundary', () => {
    // Mon 2026-07-06, 14:00-22:00+30min. Expected: 9h.
    // 10 day + 6 night blocks, -1 lunch = 9 day + 6 night = 7.5h.
    // Night within expected: 6 blocks = 3h → nightSurcharge
    const result = scheduleClassifier(makeInput([
      { date: '2026-07-06', entryTime: '14:00', exitTime: '22:00', lunchBreakMinutes: 30 },
    ]));
    expect(result.nightSurcharge).toBe(3);
    expect(result.dayOT).toBe(0);
    expect(result.nightOT).toBe(0);
    expect(result.holidaySurcharge).toBe(0);
  });

  it('overtime on regular day — 11h vs 9h expected', () => {
    // 07:00-19:00+60min. 24 day blocks - 2 lunch = 22 = 11h.
    // Expected 9h: 18 blocks. Day OT: 4 blocks = 2h
    const result = scheduleClassifier(makeInput([
      { date: '2026-07-06', entryTime: '07:00', exitTime: '19:00', lunchBreakMinutes: 60 },
    ]));
    expect(result.dayOT).toBe(2);
    expect(result.nightSurcharge).toBe(0);
    expect(result.nightOT).toBe(0);
  });

  it('multi-day aggregation — 2 regular + 1 holiday day summed', () => {
    // Mon 07-06: 08:00-18:00+60 = 9h → zero
    // Tue 07-07: 07:00-19:00+60 = 11h → 2h dayOT
    // Jul 20 (holiday): 08:00-18:00+60 = 9h → 9h holidaySurcharge
    const result = scheduleClassifier(makeInput([
      { date: '2026-07-06', entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
      { date: '2026-07-07', entryTime: '07:00', exitTime: '19:00', lunchBreakMinutes: 60 },
      { date: '2026-07-20', entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60 },
    ]));
    expect(result.dayOT).toBe(2);
    expect(result.holidaySurcharge).toBe(9);
    expect(result.nightSurcharge).toBe(0);
    expect(result.nightOT).toBe(0);
    expect(result.holidayDayOT).toBe(0);
    expect(result.holidayNightSurcharge).toBe(0);
    expect(result.holidayNightOT).toBe(0);
  });

describe('per-day schedule (mixed)', () => {
  const mixedProfile: ScheduleProfile = {
    workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    schedules: {
      monday:    { entryTime: '07:00', exitTime: '17:00', lunchBreakMinutes: 60 },
      tuesday:   { entryTime: '07:00', exitTime: '17:00', lunchBreakMinutes: 60 },
      wednesday: { entryTime: '07:00', exitTime: '17:00', lunchBreakMinutes: 60 },
      thursday:  { entryTime: '07:00', exitTime: '17:00', lunchBreakMinutes: 60 },
      friday:    { entryTime: '07:00', exitTime: '17:00', lunchBreakMinutes: 60 },
      saturday:  { entryTime: '07:00', exitTime: '14:00', lunchBreakMinutes: 0 },
    },
  };

  it('Saturday 07:00-16:00+0min = 9h worked vs 7h expected → 2h dayOT', () => {
    const result = scheduleClassifier({
      profile: mixedProfile,
      workedDays: [{ date: '2026-07-11', entryTime: '07:00', exitTime: '16:00', lunchBreakMinutes: 0 }],
      salary: 1_750_905,
    });
    expect(result.dayOT).toBe(2);
    expect(result.nightOT).toBe(0);
  });

  it('Monday 07:00-18:00+60min = 10h vs 9h expected → 1h dayOT', () => {
    const result = scheduleClassifier({
      profile: mixedProfile,
      workedDays: [{ date: '2026-07-06', entryTime: '07:00', exitTime: '18:00', lunchBreakMinutes: 60 }],
      salary: 1_750_905,
    });
    expect(result.dayOT).toBe(1);
    expect(result.nightOT).toBe(0);
  });

  it('Saturday exactly at expected 7h → 0 OT', () => {
    // 07:00-14:00+0min = 7h worked == 7h expected
    const result = scheduleClassifier({
      profile: mixedProfile,
      workedDays: [{ date: '2026-07-11', entryTime: '07:00', exitTime: '14:00', lunchBreakMinutes: 0 }],
      salary: 1_750_905,
    });
    expect(result.dayOT).toBe(0);
    expect(result.nightOT).toBe(0);
  });
});
});
