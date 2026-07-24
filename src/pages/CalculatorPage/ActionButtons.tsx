import styles from './ActionButtons.module.css';

interface ActionButtonsProps {
  onSave: () => void;
  onExport: () => void;
  onPrint: () => void;
  onClear: () => void;
}

export function ActionButtons({ onSave, onExport, onPrint, onClear }: ActionButtonsProps) {
  return (
    <div className={`${styles.actionsRow} result-actions`}>
      <button type="button" id="save-btn" className="btn btn-primary" onClick={onSave}>
        <span aria-hidden="true">💾</span> Guardar registro
      </button>
      <button type="button" id="export-btn" className="btn btn-secondary" onClick={onExport}>
        <span aria-hidden="true">📤</span> Exportar mis datos
      </button>
      <button type="button" id="print-btn" className="btn btn-secondary" onClick={onPrint}>
        <span aria-hidden="true">🖨️</span> Imprimir
      </button>
      <button type="button" id="clear-btn" className="btn btn-secondary" onClick={onClear}>
        Limpiar
      </button>
    </div>
  );
}
