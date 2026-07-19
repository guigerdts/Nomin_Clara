interface ActionButtonsProps {
  onSave: () => void;
  onExport: () => void;
  onPrint: () => void;
  onClear: () => void;
}

export function ActionButtons({ onSave, onExport, onPrint, onClear }: ActionButtonsProps) {
  return (
    <div className="result-actions" style={{ marginTop: 'var(--space-2)' }}>
      <button type="button" id="save-btn" className="btn btn-primary" onClick={onSave}>
        💾 Guardar registro
      </button>
      <button type="button" id="export-btn" className="btn btn-secondary" onClick={onExport}>
        📤 Exportar mis datos
      </button>
      <button type="button" id="print-btn" className="btn btn-secondary" onClick={onPrint}>
        🖨️ Imprimir
      </button>
      <button type="button" id="clear-btn" className="btn btn-secondary" onClick={onClear}>
        Limpiar
      </button>
    </div>
  );
}
