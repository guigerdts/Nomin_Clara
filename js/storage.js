/**
 * storage.js — Persistencia en localStorage para Nómina Clara
 * ===========================================================
 *
 * Maneja todas las operaciones de guardado, lectura, exportación
 * e importación de registros de nómina.
 */

'use strict';

const STORAGE_KEY = 'nomina-clara-records';

/**
 * Genera un ID único para cada registro.
 * @returns {string}
 */
function generateId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${ts}-${rand}`;
}

/**
 * Guarda un registro de nómina en localStorage.
 * El registro se agrega al inicio del arreglo (más reciente primero).
 *
 * @param {Object} record - Registro sin id ni createdAt
 * @returns {Object} El registro guardado con id y createdAt
 */
function saveRecord(record) {
  const records = getAllRecords();
  const saved = {
    ...record,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  records.unshift(saved);
  persist(records);
  return saved;
}

/**
 * Obtiene todos los registros guardados, ordenados del más reciente
 * al más antiguo.
 *
 * @returns {Array}
 */
function getAllRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('storage.js: corrupted data (not an array), resetting.');
      return [];
    }
    return parsed;
  } catch (err) {
    console.warn('storage.js: error reading localStorage, returning empty.', err);
    return [];
  }
}

/**
 * Obtiene un registro por su ID.
 * @param {string} id
 * @returns {Object|undefined}
 */
function getRecord(id) {
  return getAllRecords().find(r => r.id === id);
}

/**
 * Elimina un registro por su ID.
 * @param {string} id
 */
function deleteRecord(id) {
  const records = getAllRecords();
  const filtered = records.filter(r => r.id !== id);
  // Solo persistir si realmente se eliminó algo
  if (filtered.length < records.length) {
    persist(filtered);
  }
}

/**
 * Exporta todos los registros como string JSON formateado.
 * @returns {string}
 */
function exportAllData() {
  return JSON.stringify(getAllRecords(), null, 2);
}

/**
 * Importa registros desde un string JSON.
 * Omite duplicados por ID (no sobrescribe).
 *
 * @param {string} jsonString - JSON con arreglo de registros
 * @returns {{ imported: number, skipped: number }}
 */
function importRecords(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
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
      // Asignar ID si no tiene
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
 * Elimina todos los registros.
 */
function clearAllRecords() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Persiste el arreglo completo en localStorage.
 * @param {Array} records
 */
function persist(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    if (err.name === 'QuotaExceededError' || err.code === 22) {
      throw new Error(
        'No hay suficiente espacio en el almacenamiento local. ' +
        'Intente eliminar registros antiguos.'
      );
    }
    throw err;
  }
}
