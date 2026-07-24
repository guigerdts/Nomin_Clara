import { useRef, useEffect } from 'react';
import type { SavedRecord } from '../../lib/types';
import { formatCOP } from '../../lib/rates';

interface EvolutionChartProps {
  records: SavedRecord[];
  alias: string;
}

function readCSSVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

interface ChartColors {
  barPositive: string;
  barNegative: string;
  label: string;
  gridline: string;
  baseline: string;
}

function getChartColors(): ChartColors {
  return {
    barPositive: readCSSVar('--color-success', '#10b981'),
    barNegative: readCSSVar('--color-danger', '#ef4444'),
    label: readCSSVar('--color-text-muted', '#6b7280'),
    gridline: readCSSVar('--color-border', '#e5e7eb'),
    baseline: readCSSVar('--color-border', '#e5e7eb'),
  };
}

function drawChart(
  canvas: HTMLCanvasElement,
  container: HTMLElement | null,
  records: SavedRecord[],
  maxVal: number,
) {
  const dpr = window.devicePixelRatio || 1;
  const rect = container?.getBoundingClientRect();
  const width = rect?.width || 600;
  const height = 200;

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);

  const colors = getChartColors();
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  // Bars
  const barWidth = Math.min(40, chartW / records.length * 0.7);
  const gap = chartW / records.length;

  records.forEach((rec, i) => {
    const barH = (rec.totalCalculated / maxVal) * chartH;
    const x = padding.left + i * gap + (gap - barWidth) / 2;
    const y = padding.top + chartH - barH;

    const isPositive = rec.difference != null && rec.difference >= 0;
    ctx.fillStyle = isPositive ? colors.barPositive : colors.barNegative;
    ctx.fillRect(x, y, barWidth, barH);

    // X-axis label
    ctx.fillStyle = colors.label;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    const dateLabel = rec.quincena ? rec.quincena.slice(5) : '';
    ctx.fillText(dateLabel, x + barWidth / 2, height - padding.bottom + 15);
  });

  // Baseline
  ctx.strokeStyle = colors.baseline;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding.left, padding.top + chartH);
  ctx.lineTo(width - padding.right, padding.top + chartH);
  ctx.stroke();

  // Y-axis labels
  ctx.fillStyle = colors.label;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(formatCOP(maxVal), padding.left - 5, padding.top + 10);
  ctx.fillText('$0', padding.left - 5, padding.top + chartH + 4);
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
    const container = canvas.parentElement;

    const values = filtered.map(r => r.totalCalculated);
    const maxVal = Math.max(...values) * 1.2;

    drawChart(canvas, container, filtered, maxVal);

    // Resize handler
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        drawChart(canvas, container, filtered, maxVal);
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
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
