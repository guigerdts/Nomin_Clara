import { useRef, useState } from 'react';
import { readFileAsText, validateImportedJSON } from '../../lib/importExport';
import { importRecords } from '../../lib/storage';
import { showToast } from '../../components/Toast';
import styles from './ImportSection.module.css';

interface ImportSectionProps {
  onImportComplete: () => void;
}

export function ImportSection({ onImportComplete }: ImportSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = async (file: File) => {
    try {
      const text = await readFileAsText(file);
      const validation = validateImportedJSON(text);
      if (!validation.valid) {
        showToast(validation.errors.join(', '), 'error');
        return;
      }
      const result = importRecords(text);
      const msg =
        `${result.imported} registro(s) importado(s).` +
        (result.skipped > 0 ? ` ${result.skipped} omitido(s).` : '');
      showToast(msg, 'success');
      onImportComplete();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      showToast(`Error al importar: ${msg}`, 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  return (
    <div
      className={`${styles.container} ${dragging ? styles.dragging : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
      }}
      aria-label="Importar archivo JSON"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className={styles.fileInput}
      />
      <p>
        {dragging
          ? 'Soltá el archivo aquí'
          : 'Hacé clic o arrastrá un archivo .json para importar'}
      </p>
    </div>
  );
}
