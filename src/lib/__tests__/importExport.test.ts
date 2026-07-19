import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  today,
  validateImportedJSON,
  downloadBlob,
} from '../importExport';

describe('today', () => {
  it('returns date in YYYY-MM-DD format', () => {
    const result = today();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches current date (year)', () => {
    const result = today();
    const year = new Date().getFullYear().toString();
    expect(result.startsWith(year)).toBe(true);
  });
});

describe('validateImportedJSON', () => {
  it('validates a proper JSON array of objects', () => {
    const json = JSON.stringify([
      { id: '1', alias: 'Test', salary: 2000000 },
      { id: '2', alias: 'Test2', salary: 3000000 },
    ]);
    const result = validateImportedJSON(json);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects invalid JSON string', () => {
    const result = validateImportedJSON('not valid json');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('JSON válido');
  });

  it('rejects non-array JSON', () => {
    const result = validateImportedJSON('{"key": "value"}');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('arreglo');
  });

  it('rejects array with non-object elements', () => {
    const json = JSON.stringify(['string', 42, null]);
    const result = validateImportedJSON(json);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('accepts empty array', () => {
    const result = validateImportedJSON('[]');
    expect(result.valid).toBe(true);
  });
});

describe('downloadBlob', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // jsdom does not implement URL.createObjectURL — mock it
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates an anchor element and triggers click', () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');

    downloadBlob('{"test": true}', 'test.json', 'application/json');

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('appends and removes anchor from body', () => {
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');

    downloadBlob('data', 'file.json', 'application/json');

    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
  });
});
