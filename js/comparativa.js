/**
 * comparativa.js — Lógica de la vista comparativa
 * =================================================
 *
 * Maneja la importación y visualización comparativa en comparar.html.
 * Carga registros del usuario + importados, los agrega por persona,
 * y renderiza tabla y gráfico.
 */

'use strict';

document.addEventListener('DOMContentLoaded', function () {
  // Elementos DOM
  const fileInput = document.getElementById('file-input');
  const importBtn = document.getElementById('import-btn');
  const importFeedback = document.getElementById('import-feedback');
  const comparisionBody = document.getElementById('comparison-body');
  const comparisonEmpty = document.getElementById('comparison-empty');
  const comparisonTable = document.getElementById('comparison-table');
  const comparisonChart = document.getElementById('comparison-chart');
  const sortSelect = document.getElementById('sort-select');
  const printCompareBtn = document.getElementById('print-compare-btn');

  let currentData = [];

  // --- Importar archivos ---
  importBtn.addEventListener('click', function () {
    const files = fileInput.files;
    if (!files || files.length === 0) {
      showToast('Seleccioná uno o más archivos .json primero.', 'error');
      return;
    }

    importFeedback.classList.remove('hidden');
    importFeedback.textContent = `Importando ${files.length} archivo(s)...`;

    importMultipleFiles(files,
      // onProgress
      function (current, total, fileName) {
        importFeedback.textContent = `Procesado ${current}/${total}: ${fileName}`;
      },
      // onComplete
      function (result) {
        const msg = `Importación completa: ${result.total} registro(s) importado(s)` +
          (result.skipped > 0 ? `, ${result.skipped} omitido(s).` : '.');
        importFeedback.textContent = msg;

        if (result.errors.length > 0) {
          const errList = result.errors.map(e => `• ${e.file}: ${e.error}`).join('\n');
          showToast(`Errores en ${result.errors.length} archivo(s):\n${errList}`, 'error');
        }

        // Recargar datos y renderizar
        loadComparisonData();
        setTimeout(() => importFeedback.classList.add('hidden'), 3000);
      }
    );

    // Resetear input para permitir re-importar el mismo archivo
    fileInput.value = '';
  });

  // --- Cargar datos de comparación ---
  function loadComparisonData() {
    const allRecords = getAllRecords();

    if (allRecords.length === 0) {
      comparisonEmpty.classList.remove('hidden');
      comparisonTable.classList.add('hidden');
      comparisonChart.classList.add('hidden');
      currentData = [];
      return;
    }

    comparisonEmpty.classList.add('hidden');

    // Agrupar por alias
    const byPerson = {};
    allRecords.forEach(rec => {
      const name = rec.alias || 'Sin nombre';
      if (!byPerson[name]) {
        byPerson[name] = [];
      }
      byPerson[name].push(rec);
    });

    // Calcular métricas por persona
    currentData = Object.entries(byPerson).map(([name, records]) => {
      const totalOT = records.reduce((sum, r) => sum + (r.totalOT || 0), 0);
      const avgSalary = records.reduce((sum, r) => sum + (r.salary || 0), 0) / records.length;
      const totalCalc = records.reduce((sum, r) => sum + (r.totalCalculated || 0), 0);
      const totalActual = records.reduce((sum, r) => sum + (r.totalActual || 0), 0);
      const recordsWithActual = records.filter(r => r.totalActual != null);
      const count = records.length;

      let avgDifference = null;
      let compliancePct = null;
      if (recordsWithActual.length > 0) {
        const diffSum = recordsWithActual.reduce((sum, r) => sum + ((r.difference || 0)), 0);
        avgDifference = diffSum / recordsWithActual.length;
        const actualSum = recordsWithActual.reduce((sum, r) => sum + (r.totalActual || 0), 0);
        const calcSum = recordsWithActual.reduce((sum, r) => sum + (r.totalCalculated || 0), 0);
        compliancePct = calcSum > 0 ? (actualSum / calcSum) * 100 : null;
      }

      return {
        name,
        records: count,
        avgSalary: Math.round(avgSalary),
        totalOT,
        totalCalculado: Math.round(totalCalc),
        totalPagado: Math.round(totalActual),
        avgDifference: avgDifference !== null ? Math.round(avgDifference) : null,
        compliancePct: compliancePct !== null ? parseFloat(compliancePct.toFixed(1)) : null
      };
    });

    renderTable();
    renderChart();
  }

  // --- Renderizar tabla ---
  function renderTable() {
    const sortBy = sortSelect ? sortSelect.value : 'difference-asc';
    const sorted = sortData(currentData, sortBy);

    comparisionBody.innerHTML = '';
    sorted.forEach(person => {
      const tr = document.createElement('tr');

      // Diferencia: clase de color
      const diffClass = person.avgDifference === null
        ? ''
        : person.avgDifference >= 0
          ? 'text-success'
          : 'text-danger';

      // % cumplimiento
      let complianceDisplay = '-';
      let complianceClass = '';
      if (person.compliancePct !== null) {
        complianceDisplay = person.compliancePct.toFixed(1) + '%';
        complianceClass = person.compliancePct >= 100 ? 'text-success' : 'text-danger';
      }

      tr.innerHTML = `
        <td><strong>${escapeHtml(person.name)}</strong></td>
        <td class="text-right">${person.records}</td>
        <td class="text-right monetary">${formatCOP(person.avgSalary)}</td>
        <td class="text-right">${person.totalOT}</td>
        <td class="text-right monetary">${formatCOP(person.totalCalculado)}</td>
        <td class="text-right monetary">${formatCOP(person.totalPagado)}</td>
        <td class="text-right monetary ${diffClass}">${person.avgDifference !== null ? formatCOP(person.avgDifference) : '-'}</td>
        <td class="text-right ${complianceClass}">${complianceDisplay}</td>
      `;
      comparisionBody.appendChild(tr);
    });

    comparisonTable.classList.remove('hidden');
  }

  // --- Ordenar datos ---
  function sortData(data, sortBy) {
    const sorted = [...data];
    switch (sortBy) {
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'difference-asc':
        sorted.sort((a, b) => (a.avgDifference || 0) - (b.avgDifference || 0));
        break;
      case 'difference-desc':
        sorted.sort((a, b) => (b.avgDifference || 0) - (a.avgDifference || 0));
        break;
      case 'compliance-asc':
        sorted.sort((a, b) => (a.compliancePct || 0) - (b.compliancePct || 0));
        break;
      case 'compliance-desc':
        sorted.sort((a, b) => (b.compliancePct || 0) - (a.compliancePct || 0));
        break;
      default:
        break;
    }
    return sorted;
  }

  // --- Gráfico de barras (Canvas) ---
  function renderChart() {
    if (!comparisonChart || currentData.length === 0) {
      if (comparisonChart) comparisonChart.classList.add('hidden');
      return;
    }

    comparisonChart.classList.remove('hidden');
    const ctx = comparisonChart.getContext('2d');
    const container = comparisonChart.parentElement;
    const dpr = window.devicePixelRatio || 1;

    // Tamaño responsive
    const rect = container.getBoundingClientRect();
    const width = Math.max(rect.width || 600, 300);
    const height = 250;

    comparisonChart.style.width = width + 'px';
    comparisonChart.style.height = height + 'px';
    comparisonChart.width = width * dpr;
    comparisonChart.height = height * dpr;
    ctx.scale(dpr, dpr);

    const padding = { top: 30, right: 30, bottom: 60, left: 70 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    // Encontrar el mayor valor absoluto de diferencia
    const diffs = currentData.map(p => Math.abs(p.avgDifference || 0));
    const maxVal = Math.max(...diffs, 1) * 1.3;

    ctx.clearRect(0, 0, width, height);

    // Fondo
    ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Líneas de guía
    const gridLines = 4;
    ctx.strokeStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#334155' : '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridLines; i++) {
      const y = padding.top + (chartH / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Etiqueta de valor
      const val = maxVal - (maxVal / gridLines) * i;
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(formatCOP(Math.round(val)), padding.left - 8, y + 4);
    }

    // Dibujar barras
    const barWidth = Math.min(50, chartW / currentData.length * 0.6);
    const gap = chartW / currentData.length;

    currentData.forEach((person, i) => {
      const diff = person.avgDifference || 0;
      const absDiff = Math.abs(diff);
      const barH = (absDiff / maxVal) * chartH;
      const x = padding.left + i * gap + (gap - barWidth) / 2;
      const y = diff >= 0
        ? padding.top + chartH - barH
        : padding.top + chartH;

      // Color: verde si diferencia positiva (pagaron más), rojo si negativa (pagaron menos)
      ctx.fillStyle = diff >= 0 ? '#10b981' : '#ef4444';
      ctx.fillRect(x, diff >= 0 ? y : y - barH, barWidth, Math.max(barH, 2));

      // Nombre de la persona (rotado)
      ctx.save();
      ctx.translate(x + barWidth / 2, height - padding.bottom + 10);
      ctx.rotate(0.4);
      ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(escapeHtml(person.name.length > 15 ? person.name.slice(0, 15) + '…' : person.name), 0, 0);
      ctx.restore();
    });

    // Título
    ctx.fillStyle = document.documentElement.getAttribute('data-theme') === 'dark' ? '#94a3b8' : '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Diferencia promedio por persona', width / 2, 15);
  }

  // --- Evento de ordenamiento ---
  if (sortSelect) {
    sortSelect.addEventListener('change', renderTable);
  }

  // --- Imprimir ---
  if (printCompareBtn) {
    printCompareBtn.addEventListener('click', function () {
      window.print();
    });
  }

  // --- Redibujar gráfico en resize ---
  let resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderChart, 250);
  });

  // --- Inicializar ---
  loadComparisonData();

  // Helper: escapar HTML
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
});
