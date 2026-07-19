import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

export type ToastType = 'success' | 'error';

interface ToastData {
  id: number;
  message: string;
  type: ToastType;
}

let nextId = 0;
let addToastExternal: ((message: string, type: ToastType) => void) | null = null;

/**
 * Portal-based toast notification system.
 * Renders at a fixed position (bottom-right) via createPortal.
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    addToastExternal = addToast;
    return () => { addToastExternal = null; };
  }, [addToast]);

  return createPortal(
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontFamily: 'sans-serif',
            fontSize: '14px',
            maxWidth: '400px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>,
    document.body,
  );
}

/**
 * Imperative toast trigger — works outside React components.
 */
export function showToast(message: string, type: ToastType = 'success') {
  if (addToastExternal) {
    addToastExternal(message, type);
  }
}
