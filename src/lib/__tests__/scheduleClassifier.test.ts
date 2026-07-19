import { describe, it, expect } from 'vitest';
import { scheduleClassifier } from '../scheduleClassifier';
import type { ScheduleClassifierInput, ScheduleProfile, WorkedDay } from '../types';

const baseProfile: ScheduleProfile = {
  workDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  entryTime: '08:00', exitTime: '18:00', lunchBreakMinutes: 60,
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
});
