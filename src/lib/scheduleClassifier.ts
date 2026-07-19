import type { DayOfWeek, PayrollInput, ScheduleClassifierInput, WorkedDay } from './types';
import { isHoliday } from './holidays';

const DAY_START = 6 * 60, DAY_END = 19 * 60, HALF_HOUR = 30, HH = 0.5;
export const DOW: Record<number, DayOfWeek> = { 0: 'sunday', 1: 'monday', 2: 'tuesday', 3: 'wednesday', 4: 'thursday', 5: 'friday', 6: 'saturday' };

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function dayOfWeek(date: string): DayOfWeek {
  return DOW[new Date(date + 'T12:00:00').getDay()];
}

function splitBlocks(entry: number, exit: number): { day: number; night: number } {
  const adj = exit <= entry ? exit + 1440 : exit;
  let day = 0, night = 0;
  for (let t = entry; t < adj; t += HALF_HOUR) {
    const s = t % 1440;
    if (s >= DAY_START && s < DAY_END) day++; else night++;
  }
  return { day, night };
}

function t2(v: number): number { return Math.floor(v * 100) / 100; }

function classifyDay(d: WorkedDay, exp: number, isWorkDay: boolean) {
  if (d.entryTime === null) return { dayOT: 0, nightOT: 0, nightSurcharge: 0, holidaySurcharge: 0, holidayDayOT: 0, holidayNightSurcharge: 0, holidayNightOT: 0 };
  const adjExp = isWorkDay ? exp : 0;

  const dayB = Math.max(0, splitBlocks(toMin(d.entryTime), toMin(d.exitTime!)).day - ((d.lunchBreakMinutes ?? 0) / HALF_HOUR));
  const nightB = splitBlocks(toMin(d.entryTime), toMin(d.exitTime!)).night;
  const dayH = dayB * HH, nightH = nightB * HH;

  const withinDay = Math.min(dayH, adjExp);
  const withinNight = Math.max(0, Math.min(nightH, adjExp - withinDay));
  const dayOT = Math.max(0, dayH - withinDay);
  const nightOT = Math.max(0, nightH - withinNight);

  if (isHoliday(d.date)) {
    return { dayOT: 0, nightOT: 0, nightSurcharge: 0, holidaySurcharge: t2(withinDay), holidayDayOT: t2(dayOT), holidayNightSurcharge: t2(withinNight), holidayNightOT: t2(nightOT) };
  }
  return { dayOT: t2(dayOT), nightOT: t2(nightOT), nightSurcharge: t2(withinNight), holidaySurcharge: 0, holidayDayOT: 0, holidayNightSurcharge: 0, holidayNightOT: 0 };
}

export function scheduleClassifier(input: ScheduleClassifierInput): PayrollInput {
  const { profile, workedDays, salary } = input;
  const wdSet = new Set(profile.workDays);
  const acc = { dayOT: 0, nightOT: 0, nightSurcharge: 0, holidaySurcharge: 0, holidayDayOT: 0, holidayNightSurcharge: 0, holidayNightOT: 0 };

  for (const d of workedDays) {
    const dow = dayOfWeek(d.date);
    const isWorkDay = wdSet.has(dow);
    const daySchedule = profile.schedules[dow];
    let exp = 0;
    if (isWorkDay && daySchedule) {
      exp = (toMin(daySchedule.exitTime) - toMin(daySchedule.entryTime)) / 60 - daySchedule.lunchBreakMinutes / 60;
    }
    const r = classifyDay(d, exp, isWorkDay);
    for (const k of Object.keys(acc) as (keyof typeof acc)[]) acc[k] += r[k];
  }

  return { salary, ...Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, t2(v)])) } as PayrollInput;
}
