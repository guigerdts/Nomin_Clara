import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDraftQuincena, getFortnightRange } from '../useDraftQuincena';
import type { DraftQuincena, WorkedDay } from '../../lib/types';

beforeEach(() => {
  localStorage.clear();
});

// ── Pure function: getFortnightRange ──────────────────────────────────────

describe('getFortnightRange', () => {
  it('returns day 1-15 for first half of month', () => {
    const result = getFortnightRange(new Date(2026, 6, 1)); // July 1, 2026
    expect(result.startDate).toBe('2026-07-01');
    expect(result.endDate).toBe('2026-07-15');
  });

  it('returns day 1-15 for day 15 (boundary)', () => {
    const result = getFortnightRange(new Date(2026, 6, 15)); // July 15, 2026
    expect(result.startDate).toBe('2026-07-01');
    expect(result.endDate).toBe('2026-07-15');
  });

  it('returns day 16-last for second half of month', () => {
    const result = getFortnightRange(new Date(2026, 6, 20)); // July 20, 2026
    expect(result.startDate).toBe('2026-07-16');
    expect(result.endDate).toBe('2026-07-31');
  });

  it('handles day 16 (boundary)', () => {
    const result = getFortnightRange(new Date(2026, 6, 16)); // July 16, 2026
    expect(result.startDate).toBe('2026-07-16');
    expect(result.endDate).toBe('2026-07-31');
  });

  it('handles February non-leap (first half)', () => {
    const result = getFortnightRange(new Date(2025, 1, 10)); // Feb 10, 2025
    expect(result.startDate).toBe('2025-02-01');
    expect(result.endDate).toBe('2025-02-15');
  });

  it('handles February non-leap (second half)', () => {
    const result = getFortnightRange(new Date(2025, 1, 20)); // Feb 20, 2025
    expect(result.startDate).toBe('2025-02-16');
    expect(result.endDate).toBe('2025-02-28');
  });

  it('handles February leap year (second half)', () => {
    const result = getFortnightRange(new Date(2024, 1, 20)); // Feb 20, 2024
    expect(result.startDate).toBe('2024-02-16');
    expect(result.endDate).toBe('2024-02-29');
  });

  it('handles 31-day month (January)', () => {
    const result = getFortnightRange(new Date(2026, 0, 20)); // Jan 20, 2026
    expect(result.startDate).toBe('2026-01-16');
    expect(result.endDate).toBe('2026-01-31');
  });

  it('handles 30-day month (April)', () => {
    const result = getFortnightRange(new Date(2026, 3, 20)); // Apr 20, 2026
    expect(result.startDate).toBe('2026-04-16');
    expect(result.endDate).toBe('2026-04-30');
  });
});

// ── Hook: useDraftQuincena ───────────────────────────────────────────────

describe('useDraftQuincena', () => {
  it('returns empty state when no draft exists', () => {
    const { result } = renderHook(() => useDraftQuincena());
    expect(result.current.draft).toBeNull();
    expect(result.current.progress.registered).toBe(0);
    expect(result.current.progress.total).toBe(0);
    expect(result.current.staleDraftInfo).toBeNull();
  });

  it('addDay: new date appends to workedDays', () => {
    const { result } = renderHook(() => useDraftQuincena());

    act(() => {
      result.current.addDay({
        date: '2026-07-01',
        entryTime: '08:00',
        exitTime: '17:00',
        lunchBreakMinutes: 60,
      });
    });

    expect(result.current.draft).not.toBeNull();
    expect(result.current.draft!.workedDays).toHaveLength(1);
    expect(result.current.draft!.workedDays[0].date).toBe('2026-07-01');
    expect(result.current.progress.registered).toBe(1);
  });

  it('addDay: existing date updates instead of duplicating', () => {
    const { result } = renderHook(() => useDraftQuincena());

    act(() => {
      result.current.addDay({
        date: '2026-07-01',
        entryTime: '08:00',
        exitTime: '17:00',
        lunchBreakMinutes: 60,
      });
    });

    act(() => {
      result.current.addDay({
        date: '2026-07-01',
        entryTime: '09:00',
        exitTime: '18:00',
        lunchBreakMinutes: 30,
      });
    });

    expect(result.current.draft!.workedDays).toHaveLength(1);
    expect(result.current.draft!.workedDays[0].entryTime).toBe('09:00');
    expect(result.current.draft!.workedDays[0].exitTime).toBe('18:00');
    expect(result.current.draft!.workedDays[0].lunchBreakMinutes).toBe(30);
  });

  it('addDay: appends different dates', () => {
    const { result } = renderHook(() => useDraftQuincena());

    act(() => {
      result.current.addDay({ date: '2026-07-01', entryTime: '08:00', exitTime: '17:00', lunchBreakMinutes: 60 });
    });
    act(() => {
      result.current.addDay({ date: '2026-07-02', entryTime: '09:00', exitTime: '18:00', lunchBreakMinutes: 30 });
    });

    expect(result.current.draft!.workedDays).toHaveLength(2);
  });

  it('updateDay: partial merge on existing entry', () => {
    const { result } = renderHook(() => useDraftQuincena());

    act(() => {
      result.current.addDay({ date: '2026-07-01', entryTime: '08:00', exitTime: '17:00', lunchBreakMinutes: 60 });
    });

    act(() => {
      result.current.updateDay('2026-07-01', { exitTime: '18:30' });
    });

    expect(result.current.draft!.workedDays[0].entryTime).toBe('08:00');
    expect(result.current.draft!.workedDays[0].exitTime).toBe('18:30');
    expect(result.current.draft!.workedDays[0].lunchBreakMinutes).toBe(60);
  });

  it('removeDay: filters out matching date', () => {
    const { result } = renderHook(() => useDraftQuincena());

    act(() => {
      result.current.addDay({ date: '2026-07-01', entryTime: '08:00', exitTime: '17:00', lunchBreakMinutes: 60 });
    });
    act(() => {
      result.current.addDay({ date: '2026-07-02', entryTime: '09:00', exitTime: '18:00', lunchBreakMinutes: 30 });
    });

    act(() => {
      result.current.removeDay('2026-07-01');
    });

    expect(result.current.draft!.workedDays).toHaveLength(1);
    expect(result.current.draft!.workedDays[0].date).toBe('2026-07-02');
  });

  it('persists to localStorage on add', () => {
    const { result } = renderHook(() => useDraftQuincena());

    act(() => {
      result.current.addDay({ date: '2026-07-01', entryTime: '08:00', exitTime: '17:00', lunchBreakMinutes: 60 });
    });

    // Find the draft key in localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith('nomina-clara-draft-'));
    expect(keys.length).toBe(1);
    const stored = JSON.parse(localStorage.getItem(keys[0])!) as DraftQuincena;
    expect(stored.workedDays).toHaveLength(1);
    expect(stored.workedDays[0].date).toBe('2026-07-01');
  });

  it('closeDraft: calls onSave with payload and deletes key', () => {
    const { result } = renderHook(() => useDraftQuincena());
    const onSave = vi.fn();

    act(() => {
      result.current.addDay({ date: '2026-07-01', entryTime: '08:00', exitTime: '17:00', lunchBreakMinutes: 60 });
    });

    const draftBeforeClose = result.current.draft;

    act(() => {
      result.current.closeDraft(onSave);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      workedDays: draftBeforeClose!.workedDays,
      startDate: draftBeforeClose!.startDate,
    });

    // Key should be deleted
    const keys = Object.keys(localStorage).filter(k => k.startsWith('nomina-clara-draft-'));
    expect(keys).toHaveLength(0);

    // State should be null
    expect(result.current.draft).toBeNull();
  });

  it('discardDraft: deletes key and clears state', () => {
    const { result } = renderHook(() => useDraftQuincena());

    act(() => {
      result.current.addDay({ date: '2026-07-01', entryTime: '08:00', exitTime: '17:00', lunchBreakMinutes: 60 });
    });

    act(() => {
      result.current.discardDraft();
    });

    const keys = Object.keys(localStorage).filter(k => k.startsWith('nomina-clara-draft-'));
    expect(keys).toHaveLength(0);
    expect(result.current.draft).toBeNull();
  });

  it('staleDraftInfo: detects stale draft on mount', () => {
    // Pre-populate localStorage with a draft from an OLD fortnight
    const oldStart = '2026-06-01';
    const oldEnd = '2026-06-15';
    const oldDraft: DraftQuincena = {
      id: 'stale-1',
      startDate: oldStart,
      endDate: oldEnd,
      workedDays: [{ date: '2026-06-01', entryTime: '08:00', exitTime: '17:00', lunchBreakMinutes: 60 }],
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(`nomina-clara-draft-${oldStart}`, JSON.stringify(oldDraft));

    const { result } = renderHook(() => useDraftQuincena());

    // Should detect stale draft, not load it as current
    expect(result.current.draft).toBeNull();
    expect(result.current.staleDraftInfo).not.toBeNull();
    expect(result.current.staleDraftInfo!.exists).toBe(true);
    expect(result.current.staleDraftInfo!.startDate).toBe(oldStart);
    expect(result.current.staleDraftInfo!.endDate).toBe(oldEnd);
  });

  it('staleDraftInfo: null when current draft exists', () => {
    // Pre-populate localStorage with a draft matching current fortnight
    // We can't know the exact current fortnight, so we add a day first (creates current draft)
    // then render a new hook instance that will find it
    const { result: first } = renderHook(() => useDraftQuincena());

    act(() => {
      first.current.addDay({ date: '2026-07-01', entryTime: '08:00', exitTime: '17:00', lunchBreakMinutes: 60 });
    });

    // Verify that no stale info is set by reading current draft key
    // Re-render a new instance
    const { result: second } = renderHook(() => useDraftQuincena());

    expect(second.current.staleDraftInfo).toBeNull();
  });
});
