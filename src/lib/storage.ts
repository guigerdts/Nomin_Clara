import type { SavedRecord } from './types';

const STORAGE_KEY = 'nomina-clara-records';

/**
 * Generates a unique ID for each record.
 */
export function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rand}`;
}

/**
 * Saves a payroll record to localStorage.
 * The record is prepended to the array (newest first).
 */
export function saveRecord(
  record: Omit<SavedRecord, 'id' | 'createdAt'>,
): SavedRecord {
  const records = getAllRecords();
  const saved: SavedRecord = {
    ...record,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  records.unshift(saved);
  persist(records);
  return saved;
}

/**
 * Gets all saved records, newest first.
 */
export function getAllRecords(): SavedRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('storage.ts: corrupted data (not an array), resetting.');
      return [];
    }
    return parsed as SavedRecord[];
  } catch (err) {
    console.warn('storage.ts: error reading localStorage, returning empty.', err);
    return [];
  }
}

/**
 * Gets a record by its ID.
 */
export function getRecord(id: string): SavedRecord | undefined {
  return getAllRecords().find(r => r.id === id);
}

/**
 * Deletes a record by its ID.
 */
export function deleteRecord(id: string): void {
  const records = getAllRecords();
  const filtered = records.filter(r => r.id !== id);
  if (filtered.length < records.length) {
    persist(filtered);
  }
}

/**
 * Exports all records as a formatted JSON string.
 */
export function exportAllData(): string {
  return JSON.stringify(getAllRecords(), null, 2);
}

/**
 * Imports records from a JSON string.
 * Skips duplicates by ID (does not overwrite).
 */
export function importRecords(jsonString: string): { imported: number; skipped: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('El archivo no contiene JSON válido.');
  }
  if (!Array.isArray(parsed)) {
    throw new Error('El archivo debe contener un arreglo de registros.');
  }

  const existing = getAllRecords();
  const existingIds = new Set(existing.map(r => r.id));
  let imported = 0;
  let skipped = 0;

  for (const record of parsed) {
    if (!record.id) {
      record.id = generateId();
    }
    if (existingIds.has(record.id)) {
      skipped++;
      continue;
    }
    existing.push(record);
    existingIds.add(record.id);
    imported++;
  }

  persist(existing);
  return { imported, skipped };
}

/**
 * Clears all records from localStorage.
 */
export function clearAllRecords(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Persists the full records array to localStorage.
 */
function persist(records: SavedRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err: unknown) {
    const quotaError =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || (err as DOMException & { code?: number }).code === 22);
    if (quotaError) {
      throw new Error(
        'No hay suficiente espacio en el almacenamiento local. ' +
        'Intente eliminar registros antiguos.',
      );
    }
    throw err;
  }
}
