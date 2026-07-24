import { useRef, useEffect } from 'react';
import styles from './ComparisonChart.module.css';

interface ChartRecord {
  id: string;
  alias: string;
  devengado: number;
  neto: number | null;
}

interface ComparisonChartProps {
  records: ChartRecord[];
}

const MARGIN = { top: 24, right: 20, bottom: 60, left: 80 };
const BAR_GAP = 4;

function readCSSVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

interface ChartColors {
  devengado: string;
  neto: string;
  bg: string;
  label: string;
  gridline: string;
  text: string;
}

function getChartColors(): ChartColors {
  return {
    devengado: readCSSVar('--color-primary', '#3b82f6'),
    neto: readCSSVar('--color-success', '#10b981') + '99', // 60% opacity
    bg: readCSSVar('--color-surface-hover', '#f8f9fa'),
    label: readCSSVar('--color-text-secondary', '#666'),
    gridline: readCSSVar('--color-border', '#e0e0e0'),
    text: readCSSVar('--color-text', '#333'),
  };
}

function drawChart(canvas: HTMLCanvasElement, records: ChartRecord[]) {
  const ctx = canvas.getContext('2d');
  if (!ctx || records.length === 0) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = rect.height;
  const chartW = width - MARGIN.left - MARGIN.right;
  const chartH = height - MARGIN.top - MARGIN.bottom;

  // Find max value
  const maxVal = Math.max(
    ...records.map(r => Math.max(r.devengado, r.neto ?? 0)),
    1,
  );
  const scaleY = (val: number) => chartH - (val / maxVal) * chartH;

  const colors = getChartColors();

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // Y-axis grid and labels
  ctx.fillStyle = colors.label;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const val = (maxVal / 4) * i;
    const y = MARGIN.top + chartH - (chartH / 4) * i;
    ctx.fillText(`$${(val / 1000).toFixed(0)}k`, MARGIN.left - 8, y + 4);

    ctx.strokeStyle = colors.gridline;
    ctx.beginPath();
    ctx.moveTo(MARGIN.left, y);
    ctx.lineTo(width - MARGIN.right, y);
    ctx.stroke();
  }

  // Bars
  const barWidth = Math.min((chartW / records.length) - BAR_GAP, 40);
  const barGap = (chartW - barWidth * records.length) / (records.length + 1);

  records.forEach((record, i) => {
    const x = MARGIN.left + barGap + i * (barWidth + barGap);
    const devY = scaleY(record.devengado);
    const barH = chartH - devY;

    // Devengado bar
    ctx.fillStyle = colors.devengado;
    ctx.fillRect(x, devY, barWidth, barH);

    // Neto overlay (when available)
    if (record.neto !== null) {
      const netY = scaleY(record.neto);
      const netH = chartH - netY;
      ctx.fillStyle = colors.neto;
      ctx.fillRect(x + barWidth * 0.25, netY, barWidth * 0.5, netH);
    }

    // X-axis label
    ctx.fillStyle = colors.label;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    const label = record.alias.length > 12
      ? record.alias.slice(0, 12) + '…'
      : record.alias;
    ctx.fillText(label, x + barWidth / 2, height - MARGIN.bottom + 20);
  });

  // Legend
  ctx.fillStyle = colors.devengado;
  ctx.fillRect(width - MARGIN.right - 120, MARGIN.top + 4, 12, 12);
  ctx.fillStyle = colors.text;
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Devengado', width - MARGIN.right - 104, MARGIN.top + 14);

  ctx.fillStyle = colors.neto;
  ctx.fillRect(width - MARGIN.right - 120, MARGIN.top + 22, 12, 12);
  ctx.fillStyle = colors.text;
  ctx.fillText('Neto', width - MARGIN.right - 104, MARGIN.top + 32);
}

export function ComparisonChart({ records }: ComparisonChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || records.length === 0) return;

    drawChart(canvas, records);

    // Resize handler
    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        drawChart(canvas, records);
      }, 250);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [records]);

  if (records.length === 0) {
    return <div className={styles.empty}>No hay datos para mostrar en el gráfico.</div>;
  }

  return (
    <div className={styles.wrapper}>
      <h3 className={styles.title}>Comparativa visual</h3>
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}
