/**
 * Pure file I/O helpers for importing/exporting payroll records.
 * No DOM rendering — returns data for React consumers.
 */

export interface ImportValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Downloads content as a file using a temporary anchor element.
 */
export function downloadBlob(content: string, filename: string, mimeType: string): void {
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
 * Returns today's date in YYYY-MM-DD format.
 */
export function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Reads a File as text, returning a Promise.
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith('.json')) {
      reject(new Error('El archivo debe tener extensión .json'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Error al leer el archivo.'));
    reader.readAsText(file);
  });
}

/**
 * Validates that a JSON string contains a valid array of record objects.
 */
export function validateImportedJSON(jsonString: string): ImportValidationResult {
  const errors: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonString);
  } catch {
    errors.push('El archivo no contiene JSON válido.');
    return { valid: false, errors };
  }

  if (!Array.isArray(parsed)) {
    errors.push('El archivo debe contener un arreglo de registros.');
    return { valid: false, errors };
  }

  for (let i = 0; i < parsed.length; i++) {
    const record = parsed[i];
    if (!record || typeof record !== 'object') {
      errors.push(`El registro #${i + 1} no es un objeto válido.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
