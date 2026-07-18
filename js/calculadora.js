/**
 * calculadora.js — Controlador de la calculadora de nómina
 * =========================================================
 *
 * Maneja el formulario, la validación, el renderizado de resultados
 * y la interacción con el usuario en index.html.
 */

'use strict';

/** Escapa HTML para prevenir XSS en innerHTML */
function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function () {
  // --- Elementos del DOM ---
  const form = document.getElementById('calc-form');
  const salaryInput = document.getElementById('salary');
  const aliasInput = document.getElementById('alias');
  const transportSection = document.getElementById('transport-section');
  const transportStatus = document.getElementById('transport-status');
  const transportAmount = document.getElementById('transport-amount');

  // Inputs de horas
  const dayOTInput = document.getElementById('day-ot');
  const nightOTInput = document.getElementById('night-ot');
  const holidayDayOTInput = document.getElementById('holiday-day-ot');
  const holidayNightOTInput = document.getElementById('holiday-night-ot');
  const nightSurchargeInput = document.getElementById('night-surcharge');
  const holidaySurchargeInput = document.getElementById('holiday-surcharge');

  // Resultados
  const resultsCard = document.getElementById('results-card');
  const breakdownBody = document.getElementById('breakdown-body');
  const basePayDisplay = document.getElementById('base-pay');
  const transportDisplay = document.getElementById('transport-display');
  const transportLabel = document.getElementById('transport-label');
  const extraTotalDisplay = document.getElementById('extra-total');
  const grandTotalDisplay = document.getElementById('grand-total');

  // Comparación
  const actualPayInput = document.getElementById('actual-pay');
  const comparisonSection = document.getElementById('comparison-section');
  const differenceAlert = document.getElementById('difference-alert');
  const differenceAmount = document.getElementById('difference-amount');

  // OT Warnings
  const otWarning = document.getElementById('ot-warning');
  const otWarningList = document.getElementById('ot-warning-list');

  // Botones
  const clearBtn = document.getElementById('clear-btn');

  // Historial
  const historyBody = document.getElementById('history-body');
  const historyEmpty = document.getElementById('history-empty');
  const historyTable = document.getElementById('history-table');
  const evolutionCanvas = document.getElementById('evolution-chart');

  // --- Utilidades de renderizado ---

  /** Renderiza el auxilio de transporte en la UI */
  function updateTransportDisplay(salary) {
    const allowance = getTransportAllowance(salary);
    if (salary > 0) {
      transportSection.classList.remove('hidden');
      transportAmount.textContent = formatCOP(allowance);
      if (allowance > 0) {
        transportStatus.textContent = 'Aplica';
        transportStatus.className = 'badge badge-success';
      } else {
        transportStatus.textContent = 'No aplica';
        transportStatus.className = 'badge badge-muted';
      }
    } else {
      transportSection.classList.add('hidden');
    }
  }

  /** Valida y actualiza límites de horas extra */
  function updateOTWarnings() {
    const dayOT = parseFloat(dayOTInput.value) || 0;
    const nightOT = parseFloat(nightOTInput.value) || 0;
    const holidayDayOT = parseFloat(holidayDayOTInput.value) || 0;
    const holidayNightOT = parseFloat(holidayNightOTInput.value) || 0;

    const result = validateOTLimits(dayOT, nightOT, holidayDayOT, holidayNightOT);

    if (!result.valid) {
      otWarningList.innerHTML = result.warnings.map(w => `<li>${w}</li>`).join('');
      otWarning.classList.remove('hidden');
    } else {
      otWarning.classList.add('hidden');
    }
  }

  /** Renderiza la tabla de desglose */
  function renderBreakdown(breakdown) {
    const { basePay, transport, hourValue, entries, extraTotal, grandTotal, salary } = breakdown;

    // Limpiar tabla
    breakdownBody.innerHTML = '';

    // Fila: salario base quincena
    addBreakdownRow({
      label: 'Salario base (quincena)',
      hours: '-',
      hourValue: formatCOP(hourValue),
      surchargePct: '-',
      subtotal: formatCOP(basePay),
      isBase: true
    });

    // Filas de conceptos
    entries.forEach(entry => {
      addBreakdownRow({
        label: entry.label,
        hours: entry.hours,
        hourValue: formatCOP(entry.hourValue),
        surchargePct: `+${entry.surchargePct}%`,
        subtotal: formatCOP(entry.subtotal),
        surchargeOnly: formatCOP(entry.surchargeOnly),
        legalRef: entry.legalRef,
        isBase: false
      });
    });

    // Fila: auxilio de transporte (si aplica)
    if (transport > 0) {
      addBreakdownRow({
        label: 'Auxilio de transporte',
        hours: '-',
        hourValue: '-',
        surchargePct: '-',
        subtotal: formatCOP(transport),
        isBase: true
      });
    }

    // Totales
    document.getElementById('hour-value-display').textContent = formatCOP(hourValue);
    basePayDisplay.textContent = formatCOP(basePay);
    transportDisplay.textContent = formatCOP(transport);
    transportLabel.textContent = transport > 0 ? formatCOP(transport) : '$0';
    extraTotalDisplay.textContent = formatCOP(extraTotal);
    grandTotalDisplay.textContent = formatCOP(grandTotal);

    // Mostrar resultados
    resultsCard.classList.remove('hidden');
    comparisonSection.classList.remove('hidden');

    // Actualizar comparación
    updateComparison(grandTotal);
  }

  /** Agrega una fila a la tabla de desglose */
  function addBreakdownRow(data) {
    const tr = document.createElement('tr');
    if (data.isBase) {
      tr.className = 'breakdown-base';
    }
    tr.innerHTML = `
      <td>${data.label}${data.legalRef ? `<span class="legal-ref"> (${data.legalRef})</span>` : ''}</td>
      <td class="text-right">${data.hours}</td>
      <td class="text-right monetary">${data.hourValue}</td>
      <td class="text-right">${data.surchargePct}</td>
      <td class="text-right monetary">${data.subtotal}</td>
    `;
    breakdownBody.appendChild(tr);
  }

  /** Actualiza la alerta de comparación con el pago real */
  function updateComparison(calculatedTotal) {
    const actualPay = parseFloat(actualPayInput.value);

    if (actualPay != null && !isNaN(actualPay) && actualPay > 0) {
      const diff = actualPay - calculatedTotal;

      if (diff >= 0) {
        differenceAlert.className = 'alert alert-success';
        if (diff === 0) {
          differenceAmount.textContent = 'Coincide exactamente con lo calculado.';
        } else {
          differenceAmount.textContent =
            `Te pagaron ${formatCOP(Math.abs(diff))} más de lo calculado. ¡Vas al día!`;
        }
      } else {
        differenceAlert.className = 'alert alert-danger';
        differenceAmount.textContent =
          `Te deben ${formatCOP(Math.abs(diff))}. Tu empleador no te está pagando correctamente.`;
      }
      differenceAlert.classList.remove('hidden');
    } else {
      differenceAlert.classList.add('hidden');
    }
  }

  /** Obtiene valores del formulario */
  function getFormValues() {
    return {
      salary: parseFloat(salaryInput.value) || 0,
      alias: aliasInput.value.trim(),
      dayOT: parseFloat(dayOTInput.value) || 0,
      nightOT: parseFloat(nightOTInput.value) || 0,
      holidayDayOT: parseFloat(holidayDayOTInput.value) || 0,
      holidayNightOT: parseFloat(holidayNightOTInput.value) || 0,
      nightSurcharge: parseFloat(nightSurchargeInput.value) || 0,
      holidaySurcharge: parseFloat(holidaySurchargeInput.value) || 0
    };
  }

  /** Calcula y renderiza */
  function calculate() {
    const values = getFormValues();

    if (values.salary <= 0) {
      resultsCard.classList.add('hidden');
      document.getElementById('salary-error') &&
        (document.getElementById('salary-error').textContent = 'El salario debe ser mayor a $0');
      return;
    }

    const breakdown = calculateBreakdown(values);
    renderBreakdown(breakdown);
    updateOTWarnings();
  }

  /** Guarda el registro actual */
  function saveCurrentRecord() {
    const values = getFormValues();
    if (values.salary <= 0) {
      alert('Ingrese un salario válido antes de guardar.');
      return;
    }

    const breakdown = calculateBreakdown(values);
    const actualPay = parseFloat(actualPayInput.value) || null;

    // Obtener la quincena actual (primera o segunda mitad del mes)
    const now = new Date();
    const day = now.getDate();
    let quincenaStart;
    if (day <= 15) {
      quincenaStart = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      quincenaStart = new Date(now.getFullYear(), now.getMonth(), 16);
    }

    const record = {
      alias: values.alias || 'Sin nombre',
      quincena: quincenaStart.toISOString().split('T')[0],
      salary: values.salary,
      transportAllowance: breakdown.transport,
      inputs: {
        dayOT: values.dayOT,
        nightOT: values.nightOT,
        holidayDayOT: values.holidayDayOT,
        holidayNightOT: values.holidayNightOT,
        nightSurcharge: values.nightSurcharge,
        holidaySurcharge: values.holidaySurcharge
      },
      breakdown: breakdown.entries,
      totalCalculated: breakdown.grandTotal,
      totalActual: actualPay,
      totalOT: breakdown.totalOT,
      difference: actualPay !== null ? actualPay - breakdown.grandTotal : null
    };

    try {
      const saved = saveRecord(record);
      renderHistory();
      alert(`Registro guardado (${saved.id.slice(0, 8)}...)`);
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    }
  }

  /** Renderiza el historial de registros */
  function renderHistory() {
    const records = getAllRecords();
    const alias = aliasInput.value.trim();

    if (records.length === 0) {
      historyEmpty.classList.remove('hidden');
      historyTable.classList.add('hidden');
      if (evolutionCanvas) evolutionCanvas.classList.add('hidden');
      return;
    }

    historyEmpty.classList.add('hidden');
    historyTable.classList.remove('hidden');

    // Mostrar últimos 10 registros (del alias actual o todos)
    const displayRecords = alias
      ? records.filter(r => r.alias === alias).slice(0, 10)
      : records.slice(0, 10);

    historyBody.innerHTML = '';
    displayRecords.forEach(rec => {
      const tr = document.createElement('tr');
      const diff = rec.difference;
      const diffClass = diff === null ? '' : diff >= 0 ? 'text-success' : 'text-danger';
      tr.innerHTML = `
        <td>${escapeHtml(rec.quincena)}</td>
        <td>${escapeHtml(rec.alias)}</td>
        <td class="text-right monetary">${formatCOP(rec.salary)}</td>
        <td class="text-right monetary">${formatCOP(rec.totalCalculated)}</td>
        <td class="text-right monetary">${rec.totalActual != null ? formatCOP(rec.totalActual) : '-'}</td>
        <td class="text-right monetary ${diffClass}">${diff !== null ? formatCOP(diff) : '-'}</td>
        <td><button class="btn btn-small btn-danger" data-del-id="${escapeHtml(rec.id)}">✕</button></td>
      `;
      historyBody.appendChild(tr);
    });

    // Botones de eliminar
    document.querySelectorAll('[data-del-id]').forEach(btn => {
      btn.addEventListener('click', function () {
        if (confirm('¿Eliminar este registro?')) {
          deleteRecord(this.dataset.delId);
          renderHistory();
          renderEvolutionChart();
        }
      });
    });

    // Renderizar gráfico de evolución
    renderEvolutionChart();
  }

  /** Renderiza el gráfico de evolución (Canvas) */
  function renderEvolutionChart() {
    if (!evolutionCanvas) return;

    const records = getAllRecords();
    const alias = aliasInput.value.trim();
    const filtered = alias
      ? records.filter(r => r.alias === alias).reverse()
      : records.slice().reverse();

    if (filtered.length < 2) {
      evolutionCanvas.classList.add('hidden');
      return;
    }

    evolutionCanvas.classList.remove('hidden');
    const ctx = evolutionCanvas.getContext('2d');
    const container = evolutionCanvas.parentElement;
    const dpr = window.devicePixelRatio || 1;

    // Tamaño responsive
    const rect = container.getBoundingClientRect();
    const width = rect.width || 600;
    const height = 200;

    evolutionCanvas.style.width = width + 'px';
    evolutionCanvas.style.height = height + 'px';
    evolutionCanvas.width = width * dpr;
    evolutionCanvas.height = height * dpr;
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
  }

  /** Limpia el formulario */
  function resetForm() {
    form.reset();
    resultsCard.classList.add('hidden');
    comparisonSection.classList.add('hidden');
    otWarning.classList.add('hidden');
    transportSection.classList.add('hidden');
  }

  // --- Eventos ---

  // Recalcular en tiempo real al cambiar cualquier input
  form.addEventListener('input', function () {
    const salary = parseFloat(salaryInput.value) || 0;
    updateTransportDisplay(salary);
    if (salary > 0) {
      calculate();
    } else {
      resultsCard.classList.add('hidden');
    }
  });

  // Comparación con pago real
  actualPayInput.addEventListener('input', function () {
    const values = getFormValues();
    if (values.salary > 0) {
      const breakdown = calculateBreakdown(values);
      updateComparison(breakdown.grandTotal);
    }
  });

  // Guardar registro
  document.getElementById('save-btn').addEventListener('click', saveCurrentRecord);

  // Limpiar formulario
  clearBtn.addEventListener('click', resetForm);

  // Exportar datos
  document.getElementById('export-btn').addEventListener('click', function () {
    try {
      const data = exportAllData();
      const alias = aliasInput.value.trim() || 'sin-alias';
      const date = new Date().toISOString().split('T')[0];
      downloadJSON(data, `nomina-clara-${alias}-${date}.json`);
    } catch (err) {
      alert('Error al exportar: ' + err.message);
    }
  });

  // Imprimir
  document.getElementById('print-btn').addEventListener('click', function () {
    window.print();
  });

  // Redimensionar canvas al cambiar tamaño de ventana
  if (evolutionCanvas) {
    let resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderEvolutionChart, 250);
    });
  }

  // --- Inicialización ---
  renderHistory();

  // Si hay URL params pre-cargados (opcional)
  console.log('Nómina Clara — calculadora lista.');
});

/**
 * Descarga un string como archivo JSON.
 * @param {string} data - Contenido JSON
 * @param {string} filename - Nombre del archivo
 */
function downloadJSON(data, filename) {
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
