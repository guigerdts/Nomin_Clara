import { useRef, useEffect } from 'react';
import type { SavedRecord } from '../../lib/types';
import { formatCOP } from '../../lib/rates';

interface EvolutionChartProps {
  records: SavedRecord[];
  alias: string;
}

export function EvolutionChart({ records, alias }: EvolutionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const filtered = alias
      ? records.filter(r => r.alias === alias).slice().reverse()
      : records.slice().reverse();

    if (filtered.length < 2) {
      canvas.classList.add('hidden');
      return;
    }

    canvas.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;

    // Tamaño responsive
    const rect = container?.getBoundingClientRect();
    const width = rect?.width || 600;
    const height = 200;

    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 20, right: 20, bottom: 30, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Encontrar valores máximos
    const values = filtered.map(r => r.totalCalculated);
    const maxVal = Math.max(...values) * 1.2;

    // Fondo
    ctx.clearRect(0, 0, width, height);

    // Dibujar barras
    const barWidth = Math.min(40, chartW / filtered.length * 0.7);
    const gap = chartW / filtered.length;

    filtered.forEach((rec, i) => {
      const barH = (rec.totalCalculated / maxVal) * chartH;
      const x = padding.left + i * gap + (gap - barWidth) / 2;
      const y = padding.top + chartH - barH;

      // Color según diferencia
      const isPositive = rec.difference != null && rec.difference >= 0;
      ctx.fillStyle = isPositive ? '#10b981' : '#ef4444';
      ctx.fillRect(x, y, barWidth, barH);

      // Etiqueta del eje X (fecha corta)
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const dateLabel = rec.quincena ? rec.quincena.slice(5) : '';
      ctx.fillText(dateLabel, x + barWidth / 2, height - padding.bottom + 15);
    });

    // Línea base
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top + chartH);
    ctx.lineTo(width - padding.right, padding.top + chartH);
    ctx.stroke();

    // Título del eje Y
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(formatCOP(maxVal), padding.left - 5, padding.top + 10);
    ctx.fillText('$0', padding.left - 5, padding.top + chartH + 4);

    // Handle resize
    const handleResize = () => {
      // Canvas will be re-rendered by React on the next effect cycle
      // We just need to trigger it
    };

    let resizeTimer: ReturnType<typeof setTimeout>;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        // Re-read the canvas and re-draw
        const newRect = container?.getBoundingClientRect();
        const newWidth = newRect?.width || 600;
        canvas.style.width = newWidth + 'px';
        canvas.style.height = height + 'px';
        canvas.width = newWidth * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        const newChartW = newWidth - padding.left - padding.right;
        const newGap = newChartW / filtered.length;
        const newBarWidth = Math.min(40, newChartW / filtered.length * 0.7);

        ctx.clearRect(0, 0, newWidth, height);

        filtered.forEach((rec, i) => {
          const barH = (rec.totalCalculated / maxVal) * chartH;
          const x = padding.left + i * newGap + (newGap - newBarWidth) / 2;
          const y = padding.top + chartH - barH;

          const isPositive = rec.difference != null && rec.difference >= 0;
          ctx.fillStyle = isPositive ? '#10b981' : '#ef4444';
          ctx.fillRect(x, y, newBarWidth, barH);

          ctx.fillStyle = '#6b7280';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          const dateLabel = rec.quincena ? rec.quincena.slice(5) : '';
          ctx.fillText(dateLabel, x + newBarWidth / 2, height - padding.bottom + 15);
        });

        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartH);
        ctx.lineTo(newWidth - padding.right, padding.top + chartH);
        ctx.stroke();

        ctx.fillStyle = '#6b7280';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(formatCOP(maxVal), padding.left - 5, padding.top + 10);
        ctx.fillText('$0', padding.left - 5, padding.top + chartH + 4);
      }, 250);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [records, alias]);

  if (records.length < 2) {
    return null;
  }

  return (
    <div className="chart-wrapper">
      <canvas
        ref={canvasRef}
        id="evolution-chart"
        className={records.length < 2 ? 'hidden' : undefined}
      />
    </div>
  );
}
