import { useState, useCallback, useMemo } from 'react';
import type { DraftQuincena, WorkedDay } from '../lib/types';

export interface DraftSavePayload {
  workedDays: WorkedDay[];
  startDate: string;
}

export interface UseDraftQuincenaReturn {
  draft: DraftQuincena | null;
  addDay: (day: WorkedDay) => void;
  updateDay: (date: string, updates: Partial<WorkedDay>) => void;
  removeDay: (date: string) => void;
  closeDraft: (onSave: (payload: DraftSavePayload) => void) => void;
  discardDraft: () => void;
  progress: { registered: number; total: number };
  staleDraftInfo: { exists: boolean; startDate: string; endDate: string } | null;
}

/**
 * Computes the fortnight range (start/end ISO dates) for a given date.
 * day ≤ 15 → start 1st, end 15th
 * day > 15 → start 16th, end last day of month
 */
export function getFortnightRange(date: Date): { startDate: string; endDate: string } {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  let startDay: number;
  let endDay: number;

  if (day <= 15) {
    startDay = 1;
    endDay = 15;
  } else {
    startDay = 16;
    endDay = new Date(year, month + 1, 0).getDate(); // last day of month
  }

  const pad = (n: number): string => n.toString().padStart(2, '0');
  return {
    startDate: `${year}-${pad(month + 1)}-${pad(startDay)}`,
    endDate: `${year}-${pad(month + 1)}-${pad(endDay)}`,
  };
}

function daysBetween(start: string, end: string): number {
  const s = new Date(start + 'T12:00:00');
  const e = new Date(end + 'T12:00:00');
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

const DRAFT_PREFIX = 'nomina-clara-draft-';

function findStaleKey(currentStart: string): string | null {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(DRAFT_PREFIX) && !key.endsWith(currentStart)) {
      return key;
    }
  }
  return null;
}

function generateDraftId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Manages a daily draft quincena in localStorage.
 * - Auto-detects stale drafts from previous fortnights on mount.
 * - Provides addDay (upsert), updateDay (partial merge), removeDay, closeDraft, discardDraft.
 * - Persists to localStorage on every mutation (not on keystroke).
 */
export function useDraftQuincena(): UseDraftQuincenaReturn {
  const currentFortnight = useMemo(() => getFortnightRange(new Date()), []);
  const currentKey = useMemo(() => `${DRAFT_PREFIX}${currentFortnight.startDate}`, [currentFortnight]);

  const [draft, setDraft] = useState<DraftQuincena | null>(() => {
    try {
      const raw = localStorage.getItem(currentKey);
      if (raw) {
        return JSON.parse(raw) as DraftQuincena;
      }
    } catch {
      // Corrupted data — ignore
    }
    return null;
  });

  const [staleDraftInfo, setStaleDraftInfo] = useState<{
    exists: boolean;
    startDate: string;
    endDate: string;
  } | null>(() => {
    if (draft) return null; // current draft exists, no stale
    const staleKey = findStaleKey(currentFortnight.startDate);
    if (!staleKey) return null;
    try {
      const raw = localStorage.getItem(staleKey);
      if (raw) {
        const parsed = JSON.parse(raw) as DraftQuincena;
        return { exists: true, startDate: parsed.startDate, endDate: parsed.endDate };
      }
    } catch {
      // Ignore corrupted stale draft
    }
    return null;
  });

  const persist = useCallback(
    (updated: DraftQuincena) => {
      try {
        localStorage.setItem(currentKey, JSON.stringify(updated));
      } catch {
        // Storage quota or unavailable — silently skip
      }
    },
    [currentKey],
  );

  const addDay = useCallback(
    (day: WorkedDay) => {
      setDraft(prev => {
        if (!prev) {
          const now = new Date().toISOString();
          const newDraft: DraftQuincena = {
            id: generateDraftId(),
            startDate: currentFortnight.startDate,
            endDate: currentFortnight.endDate,
            workedDays: [day],
            lastUpdated: now,
          };
          persist(newDraft);
          return newDraft;
        }

        const existingIndex = prev.workedDays.findIndex(d => d.date === day.date);
        const updated: DraftQuincena = {
          ...prev,
          workedDays:
            existingIndex >= 0
              ? prev.workedDays.map((d, i) => (i === existingIndex ? day : d))
              : [...prev.workedDays, day],
          lastUpdated: new Date().toISOString(),
        };
        persist(updated);
        return updated;
      });
    },
    [currentFortnight, persist],
  );

  const updateDay = useCallback(
    (date: string, updates: Partial<WorkedDay>) => {
      setDraft(prev => {
        if (!prev) return prev;
        const updated: DraftQuincena = {
          ...prev,
          workedDays: prev.workedDays.map(d =>
            d.date === date ? { ...d, ...updates } : d,
          ),
          lastUpdated: new Date().toISOString(),
        };
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const removeDay = useCallback(
    (date: string) => {
      setDraft(prev => {
        if (!prev) return prev;
        const updated: DraftQuincena = {
          ...prev,
          workedDays: prev.workedDays.filter(d => d.date !== date),
          lastUpdated: new Date().toISOString(),
        };
        persist(updated);
        return updated;
      });
    },
    [persist],
  );

  const closeDraft = useCallback(
    (onSave: (payload: DraftSavePayload) => void) => {
      // Try current draft first, then stale draft
      let draftToClose: DraftQuincena | null = null;

      if (draft) {
        draftToClose = draft;
      } else {
        const staleKey = findStaleKey(currentFortnight.startDate);
        if (staleKey) {
          try {
            const raw = localStorage.getItem(staleKey);
            if (raw) {
              draftToClose = JSON.parse(raw) as DraftQuincena;
            }
          } catch {
            // Ignore corrupted
          }
        }
      }

      if (!draftToClose) return;

      onSave({ workedDays: draftToClose.workedDays, startDate: draftToClose.startDate });

      // Delete the draft from localStorage
      if (draft) {
        try {
          localStorage.removeItem(currentKey);
        } catch {
          // Ignore
        }
      } else {
        const staleKey = findStaleKey(currentFortnight.startDate);
        if (staleKey) {
          try {
            localStorage.removeItem(staleKey);
          } catch {
            // Ignore
          }
        }
      }

      setDraft(null);
      setStaleDraftInfo(null);
    },
    [draft, currentFortnight, currentKey],
  );

  const discardDraft = useCallback(() => {
    if (draft) {
      try {
        localStorage.removeItem(currentKey);
      } catch {
        // Ignore
      }
      setDraft(null);
      setStaleDraftInfo(null);
      return;
    }

    // Stale draft — find and delete its key
    const staleKey = findStaleKey(currentFortnight.startDate);
    if (staleKey) {
      try {
        localStorage.removeItem(staleKey);
      } catch {
        // Ignore
      }
    }
    setStaleDraftInfo(null);
  }, [draft, currentFortnight, currentKey]);

  const progress = useMemo(() => {
    const registered = draft?.workedDays.length ?? 0;
    const total = draft ? daysBetween(draft.startDate, draft.endDate) : 0;
    return { registered, total };
  }, [draft]);

  return {
    draft,
    addDay,
    updateDay,
    removeDay,
    closeDraft,
    discardDraft,
    progress,
    staleDraftInfo,
  };
}
