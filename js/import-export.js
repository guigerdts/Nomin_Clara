/**
 * import-export.js — Manejo de archivos JSON (importación/exportación)
 * ===================================================================
 *
 * Proporciona funciones para exportar registros a un archivo .json
 * descargable e importar registros desde archivos de compañeros.
 *
 * Compatible tanto con index.html (calculadora) como con comparar.html (comparativa).
 */

'use strict';

/**
 * Exporta todos los registros a un archivo JSON descargable.
 *
 * @param {string} alias - Nombre del usuario (para el nombre del archivo)
 * @param {string} [filename] - Nombre personalizado (opcional)
 */
function exportToFile(alias, filename) {
  try {
    const data = exportAllData();
    if (data === '[]' || data === 'null') {
      showToast('No hay registros para exportar. Guardá algunos cálculos primero.', 'error');
      return;
    }
    const name = filename || `nomina-clara-${alias || 'datos'}-${today()}.json`;
    downloadBlob(data, name, 'application/json');
    showToast('Datos exportados correctamente.', 'success');
  } catch (err) {
    showToast('Error al exportar: ' + err.message, 'error');
  }
}

/**
 * Importa registros desde un archivo JSON seleccionado por el usuario.
 *
 * @param {File} file - Archivo .json seleccionado
 * @param {Function} [onSuccess] - Callback al importar exitosamente
 */
function importFromFile(file, onSuccess) {
  if (!file) {
    showToast('Seleccione un archivo primero.', 'error');
    return;
  }

  // Validar extensión
  if (!file.name.toLowerCase().endsWith('.json')) {
    showToast('El archivo debe tener extensión .json', 'error');
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      const result = importRecords(e.target.result);
      const msg = `Importación completa: ${result.imported} registro(s) importado(s)` +
        (result.skipped > 0 ? `, ${result.skipped} omitido(s) (duplicados).` : '.');
      showToast(msg, 'success');
      if (onSuccess) onSuccess(result);
    } catch (err) {
      showToast(err.message || 'Error al importar el archivo.', 'error');
    }
  };

  reader.onerror = function () {
    showToast('Error al leer el archivo.', 'error');
  };

  reader.readAsText(file);
}

/**
 * Importa múltiples archivos JSON secuencialmente.
 *
 * @param {FileList} files - Lista de archivos a importar
 * @param {Function} [onProgress] - Callback por cada archivo procesado
 * @param {Function} [onComplete] - Callback al terminar todos
 */
function importMultipleFiles(files, onProgress, onComplete) {
  let total = files.length;
  let processed = 0;
  let totalImported = 0;
  let totalSkipped = 0;
  let errors = [];

  // Procesar archivos uno por uno
  function processNext(index) {
    if (index >= files.length) {
      if (onComplete) {
        onComplete({ total: totalImported, skipped: totalSkipped, errors });
      }
      return;
    }

    const file = files[index];
    const reader = new FileReader();

    reader.onload = function (e) {
      try {
        const result = importRecords(e.target.result);
        totalImported += result.imported;
        totalSkipped += result.skipped;
        if (onProgress) onProgress(index + 1, total, file.name);
      } catch (err) {
        errors.push({ file: file.name, error: err.message });
      }
      processed++;
      processNext(index + 1);
    };

    reader.onerror = function () {
      errors.push({ file: file.name, error: 'Error al leer el archivo.' });
      processed++;
      processNext(index + 1);
    };

    reader.readAsText(file);
  }

  processNext(0);
}

// =============================================================================
// HELPERS
// =============================================================================

/** @returns {string} Fecha actual en formato YYYY-MM-DD */
function today() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Descarga un Blob como archivo.
 * @param {string} content - Contenido del archivo
 * @param {string} filename - Nombre del archivo
 * @param {string} mimeType - Tipo MIME
 */
function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Muestra un toast/notificación temporal.
 * @param {string} message - Mensaje a mostrar
 * @param {'success'|'error'} type - Tipo de notificación
 */
function showToast(message, type) {
  const existing = document.getElementById('toast-container');
  const container = existing || (() => {
    const el = document.createElement('div');
    el.id = 'toast-container';
    el.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 8px;
    `;
    document.body.appendChild(el);
    return el;
  })();

  const toast = document.createElement('div');
  toast.style.cssText = `
    padding: 12px 20px; border-radius: 8px; color: white;
    font-family: sans-serif; font-size: 14px; max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease, fadeOut 0.3s ease 3.5s forwards;
    ${type === 'success'
      ? 'background: #10b981;'
      : 'background: #ef4444;'}
  `;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, 4000);
}
