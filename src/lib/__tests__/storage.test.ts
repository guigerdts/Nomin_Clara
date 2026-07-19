import { describe, it, expect, beforeEach } from 'vitest';
import {
  saveRecord,
  getAllRecords,
  getRecord,
  deleteRecord,
  exportAllData,
  importRecords,
  clearAllRecords,
  generateId,
} from '../storage';
import type { SavedRecord } from '../types';

// Mock record factory
function makeMockRecord(overrides: Partial<SavedRecord> = {}): Omit<SavedRecord, 'id' | 'createdAt'> {
  return {
    alias: 'Test User',
    quincena: '2026-07-01',
    salary: 2000000,
    transportAllowance: 0,
    inputs: {
      salary: 2000000,
      dayOT: 0,
      nightOT: 0,
      holidayDayOT: 0,
      holidayNightOT: 0,
      nightSurcharge: 0,
      holidaySurcharge: 0,
      holidayNightSurcharge: 0,
    },
    breakdown: [],
    totalCalculated: 1000000,
    totalActual: null,
    totalOT: 0,
    difference: null,
    ...overrides,
  };
}

beforeEach(() => {
  localStorage.clear();
});

describe('generateId', () => {
  it('generates a non-empty string', () => {
    const id = generateId();
    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('generates unique IDs', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe('saveRecord', () => {
  it('saves a record and returns it with id and createdAt', () => {
    const saved = saveRecord(makeMockRecord());
    expect(saved.id).toBeTruthy();
    expect(saved.createdAt).toBeTruthy();
    expect(saved.alias).toBe('Test User');
  });

  it('prepends new records (newest first)', () => {
    saveRecord(makeMockRecord({ alias: 'First' }));
    saveRecord(makeMockRecord({ alias: 'Second' }));
    const all = getAllRecords();
    expect(all[0].alias).toBe('Second');
    expect(all[1].alias).toBe('First');
  });
});

describe('getAllRecords', () => {
  it('returns empty array when no records', () => {
    expect(getAllRecords()).toEqual([]);
  });

  it('returns all saved records', () => {
    saveRecord(makeMockRecord({ alias: 'A' }));
    saveRecord(makeMockRecord({ alias: 'B' }));
    expect(getAllRecords()).toHaveLength(2);
  });

  it('handles corrupted data gracefully', () => {
    localStorage.setItem('nomina-clara-records', '{invalid json');
    expect(getAllRecords()).toEqual([]);
  });

  it('resets on non-array data', () => {
    localStorage.setItem('nomina-clara-records', '{"not":"an array"}');
    expect(getAllRecords()).toEqual([]);
  });
});

describe('getRecord', () => {
  it('finds a record by id', () => {
    const saved = saveRecord(makeMockRecord());
    const found = getRecord(saved.id);
    expect(found).toBeTruthy();
    expect(found!.id).toBe(saved.id);
  });

  it('returns undefined for non-existent id', () => {
    expect(getRecord('nonexistent')).toBeUndefined();
  });
});

describe('deleteRecord', () => {
  it('removes a record by id', () => {
    const saved = saveRecord(makeMockRecord());
    expect(getAllRecords()).toHaveLength(1);
    deleteRecord(saved.id);
    expect(getAllRecords()).toHaveLength(0);
  });

  it('does nothing when id does not exist', () => {
    saveRecord(makeMockRecord());
    deleteRecord('nonexistent');
    expect(getAllRecords()).toHaveLength(1);
  });
});

describe('exportAllData', () => {
  it('returns "[]" when no records', () => {
    expect(exportAllData()).toBe('[]');
  });

  it('returns formatted JSON string', () => {
    saveRecord(makeMockRecord());
    const exported = exportAllData();
    const parsed = JSON.parse(exported);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed).toHaveLength(1);
  });
});

describe('importRecords', () => {
  it('imports new records', () => {
    const data = JSON.stringify([
      makeMockRecord({ alias: 'Imported' }),
      makeMockRecord({ alias: 'Imported2' }),
    ]);
    const result = importRecords(data);
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
    expect(getAllRecords()).toHaveLength(2);
  });

  it('skips duplicate IDs', () => {
    const saved = saveRecord(makeMockRecord({ alias: 'Original' }));
    const data = JSON.stringify([
      { ...makeMockRecord({ alias: 'Duplicate' }), id: saved.id },
    ]);
    const result = importRecords(data);
    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
  });

  it('assigns IDs to records without them', () => {
    const data = JSON.stringify([
      { ...makeMockRecord({ alias: 'No ID' }), id: undefined },
    ]);
    const result = importRecords(data);
    expect(result.imported).toBe(1);
    const all = getAllRecords();
    expect(all[0].id).toBeTruthy();
  });

  it('throws on invalid JSON', () => {
    expect(() => importRecords('not json')).toThrow('JSON válido');
  });

  it('throws on non-array JSON', () => {
    expect(() => importRecords('"string"')).toThrow('arreglo');
  });
});

describe('clearAllRecords', () => {
  it('removes all records', () => {
    saveRecord(makeMockRecord());
    saveRecord(makeMockRecord());
    clearAllRecords();
    expect(getAllRecords()).toHaveLength(0);
  });

  it('does not error when already empty', () => {
    expect(() => clearAllRecords()).not.toThrow();
  });
});
