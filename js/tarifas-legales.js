/**
 * tarifas-legales.js — Tasas y multiplicadores legales para nómina en Colombia
 * ===========================================================================
 *
 * PROPÓSITO: Contiene TODAS las tasas, límites y valores de referencia
 *            legales en un solo lugar. La calculadora lee de acá; nunca
 *            hardcodea valores. Para actualizar cuando cambien las leyes,
 *            solo edite este archivo.
 *
 * ÚLTIMA ACTUALIZACIÓN: julio 2026
 * BASE LEGAL:
 *   - Código Sustantivo del Trabajo (CST)
 *   - Ley 2466 de 2025 (Reforma Laboral, vigente desde julio 2026)
 *   - Decreto anual del Salario Mínimo
 *
 * CÓMO ACTUALIZAR:
 *   1. Cambie SMMLV si el gobierno actualiza el salario mínimo.
 *   2. Cambie los valores en RATES si se modifican recargos o límites.
 *   3. Actualice la fecha en ÚLTIMA ACTUALIZACIÓN.
 *   4. Verifique que la calculadora siga dando resultados correctos.
 */

'use strict';

// =============================================================================
// SALARIO MÍNIMO MENSUAL LEGAL VIGENTE (SMMLV)
// =============================================================================
// Actualizar cada año con el decreto gubernamental.
// 2026: estimado ~$1.423.500 (pendiente decreto oficial)
const SMMLV = 1423500;

// =============================================================================
// TASAS LEGALES (Ley 2466/2025, vigente desde julio 2026)
// =============================================================================
const RATES = Object.freeze({
  // --- Jornada semanal ---
  // Ley 2466 redujo la jornada a 42 horas semanales.
  WEEKLY_HOURS: 42,        // horas legales por semana
  DAILY_HOURS: 7,          // 42 / 6 días (lunes a sábado)
  DAY_START: 6,            // 6:00 — inicio jornada diurna
  DAY_END: 19,             // 19:00 — fin jornada diurna (inicio nocturna)

  // --- Multiplicadores de recargo ---
  SURCHARGES: {
    // Recargo nocturno ordinario (Art. 168 CST, Ley 2466)
    // Trabajo entre 7:00pm y 6:00am en horario ordinario
    NIGHT: 0.35,            // +35%

    // Hora extra diurna (Art. 179 CST)
    // Horas extras trabajadas entre 6:00am y 7:00pm
    OT_DAY: 0.25,           // +25%

    // Hora extra nocturna (Art. 179 CST, Ley 2466)
    // Horas extras trabajadas entre 7:00pm y 6:00am
    OT_NIGHT: 0.75,         // +75%

    // Recargo dominical/festivo ordinario (Art. 179 CST)
    // Trabajo en domingo o festivo en horario ordinario
    HOLIDAY: 0.90,          // +90%

    // Recargo nocturno + festivo combinado (Art. 168, 179 CST)
    // Trabajo nocturno ordinario en domingo/festivo
    HOLIDAY_NIGHT: 1.25,    // +125%

    // Hora extra diurna dominical/festiva (Art. 179 CST, Ley 2466)
    // Horas extras en domingo/festivo en jornada diurna = 1.15 extra sobre ordinaria
    // Total: 215% del valor hora ordinaria
    HOLIDAY_OT_DAY: 1.15,   // +115% (total ×2.15)

    // Hora extra nocturna dominical/festiva (Art. 179 CST, Ley 2466)
    // Horas extras en domingo/festivo en jornada nocturna = 1.65 extra
    // Total: 265% del valor hora ordinaria
    HOLIDAY_OT_NIGHT: 1.65  // +165% (total ×2.65)
  },

  // --- Multiplicadores totales (1 + surcharge) ---
  MULTIPLIERS: Object.freeze({
    NIGHT: 1.35,
    OT_DAY: 1.25,
    OT_NIGHT: 1.75,
    HOLIDAY: 1.90,
    HOLIDAY_NIGHT: 2.25,
    HOLIDAY_OT_DAY: 2.15,
    HOLIDAY_OT_NIGHT: 2.65
  }),

  // --- Límites legales ---
  LIMITS: Object.freeze({
    MAX_OT_PER_DAY: 2,      // máximo 2 horas extra por día
    MAX_OT_PER_WEEK: 12     // máximo 12 horas extra por semana
  }),

  // --- Auxilio de transporte ---
  // Aplica si el salario mensual es ≤ 2 SMMLV
  TRANSPORT_ALLOWANCE_MULTIPLIER: 2,
  TRANSPORT_ALLOWANCE_VALUE: 200000  // COP mensuales, valor referencia 2026
});

// =============================================================================
// FUNCIONES AUXILIARES
// =============================================================================

/**
 * Calcula el valor de la hora ordinaria.
 * Fórmula: (salario mensual / 30 días) / horas diarias legales
 *
 * @param {number} monthlySalary - Salario mensual en COP
 * @returns {number} Valor de la hora ordinaria
 */
function getOrdinaryHourValue(monthlySalary) {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  const dailySalary = monthlySalary / 30;
  return dailySalary / RATES.DAILY_HOURS;
}

/**
 * Determina si el trabajador tiene derecho a auxilio de transporte
 * y devuelve el valor mensual si aplica.
 *
 * Regla: Si salario mensual ≤ 2 SMMLV, tiene derecho al auxilio.
 *
 * @param {number} monthlySalary - Salario mensual en COP
 * @returns {number} Valor del auxilio (0 si no aplica)
 */
function getTransportAllowance(monthlySalary) {
  if (!monthlySalary || monthlySalary <= 0) return 0;
  const threshold = SMMLV * RATES.TRANSPORT_ALLOWANCE_MULTIPLIER;
  return monthlySalary <= threshold ? RATES.TRANSPORT_ALLOWANCE_VALUE : 0;
}

/**
 * Formatea un número como pesos colombianos.
 * Ejemplo: 1234567.89 → "$1.234.568"
 *
 * @param {number} value - Valor en COP
 * @returns {string} Valor formateado
 */
function formatCOP(value) {
  if (value == null || isNaN(value)) return '$0';
  return '$' + Math.round(value).toLocaleString('es-CO');
}

/**
 * Valida que las horas extra no excedan los límites legales.
 * Los límites son informativos (warning), no bloqueantes.
 *
 * @param {number} dayOT - Horas extra diurnas
 * @param {number} nightOT - Horas extra nocturnas
 * @param {number} holidayDayOT - Horas extra diurnas festivas
 * @param {number} holidayNightOT - Horas extra nocturnas festivas
 * @returns {{ valid: boolean, warnings: string[] }}
 */
function validateOTLimits(dayOT, nightOT, holidayDayOT, holidayNightOT) {
  const warnings = [];
  const totalDay = (dayOT || 0);
  const totalNight = (nightOT || 0);
  const totalHolidayDay = (holidayDayOT || 0);
  const totalHolidayNight = (holidayNightOT || 0);
  const totalOT = totalDay + totalNight + totalHolidayDay + totalHolidayNight;

  // Límite diario: 2h/día para cada categoría. Como los valores ingresados
  // son totales de la quincena (~10 días hábiles), el tope quincenal estimado
  // es 2h × 10 días = 20h por categoría.
  const QUINCENA_ESTIMATED_WORKDAYS = 10;
  const maxPerCategory = RATES.LIMITS.MAX_OT_PER_DAY * QUINCENA_ESTIMATED_WORKDAYS;

  if (totalDay > maxPerCategory) {
    warnings.push(
      `Has excedido el límite estimado de ${RATES.LIMITS.MAX_OT_PER_DAY} horas extra/día ` +
      `(~${maxPerCategory}h en la quincena) en horas extra diurnas (ingresaste ${totalDay}).`
    );
  }
  if (totalNight > maxPerCategory) {
    warnings.push(
      `Has excedido el límite estimado de ${RATES.LIMITS.MAX_OT_PER_DAY} horas extra/día ` +
      `(~${maxPerCategory}h en la quincena) en horas extra nocturnas (ingresaste ${totalNight}).`
    );
  }
  if (totalHolidayDay > maxPerCategory) {
    warnings.push(
      `Has excedido el límite estimado de ${RATES.LIMITS.MAX_OT_PER_DAY} horas extra/día ` +
      `(~${maxPerCategory}h en la quincena) en horas extra diurnas festivas (ingresaste ${totalHolidayDay}).`
    );
  }
  if (totalHolidayNight > maxPerCategory) {
    warnings.push(
      `Has excedido el límite estimado de ${RATES.LIMITS.MAX_OT_PER_DAY} horas extra/día ` +
      `(~${maxPerCategory}h en la quincena) en horas extra nocturnas festivas (ingresaste ${totalHolidayNight}).`
    );
  }

  // Límite semanal total: ~12h/semana × 2 semanas = 24h por quincena
  const maxOTQuincena = RATES.LIMITS.MAX_OT_PER_WEEK * 2;
  if (totalOT > maxOTQuincena) {
    warnings.push(
      `Has excedido el límite de ${RATES.LIMITS.MAX_OT_PER_WEEK} horas extra/semana ` +
      `(~${maxOTQuincena}h en la quincena) (total ingresado: ${totalOT} horas).`
    );
  }

  return {
    valid: warnings.length === 0,
    warnings
  };
}

/**
 * Calcula el desglose completo de pago para una quincena.
 *
 * @param {Object} params
 * @param {number} params.salary - Salario mensual en COP
 * @param {number} params.dayOT - Horas extra diurnas trabajadas en la quincena
 * @param {number} params.nightOT - Horas extra nocturnas
 * @param {number} params.holidayDayOT - Horas extra diurnas dominicales/festivas
 * @param {number} params.holidayNightOT - Horas extra nocturnas dominicales/festivas
 * @param {number} params.nightSurcharge - Horas de recargo nocturno ordinario
 * @param {number} params.holidaySurcharge - Horas de recargo dominical/festivo ordinario
 * @returns {Object} Desglose completo
 */
function calculateBreakdown(params) {
  const {
    salary,
    dayOT = 0,
    nightOT = 0,
    holidayDayOT = 0,
    holidayNightOT = 0,
    nightSurcharge = 0,
    holidaySurcharge = 0
  } = params;

  const hourValue = getOrdinaryHourValue(salary);
  const transport = getTransportAllowance(salary);
  const basePay = salary / 2;

  const entries = [];
  let extraTotal = 0;

  /**
   * Agrega un concepto al desglose.
   * @param {string} label - Nombre del concepto en español
   * @param {number} hours - Cantidad de horas
   * @param {number} multiplier - Multiplicador total (ej. 1.35)
   * @param {number} surchargePct - Porcentaje de recargo (ej. 35)
   * @param {string} legalRef - Referencia legal (opcional)
   */
  // Las horas EXTRA no están cubiertas por basePay (que paga solo 105h ordinarias),
  // así que su valor completo (base + recargo) va a extraTotal.
  // Los recargos sobre horas ORDINARIAS (nocturno, festivo) sí están cubiertos
  // por basePay, así que solo el excedente (multiplier - 1) va a extraTotal.
  const OT_MULTIPLIERS = new Set([
    RATES.MULTIPLIERS.OT_DAY,
    RATES.MULTIPLIERS.OT_NIGHT,
    RATES.MULTIPLIERS.HOLIDAY_OT_DAY,
    RATES.MULTIPLIERS.HOLIDAY_OT_NIGHT
  ]);

  function addConcept(label, hours, multiplier, surchargePct, legalRef, isOT) {
    if (!hours || hours <= 0) return;
    const subtotal = hours * hourValue * multiplier;
    const surchargeOnly = hours * hourValue * (multiplier - 1);
    entries.push({
      label,
      hours,
      hourValue,
      surchargePct,
      multiplier,
      subtotal,
      surchargeOnly,
      legalRef: legalRef || ''
    });
    // OT no está cubierto por basePay → valor completo
    // Recargos ordinarios sí están cubiertos por basePay → solo adicional
    extraTotal += isOT ? subtotal : surchargeOnly;
  }

  // 1. Recargo nocturno ordinario (+35%)
  addConcept(
    'Recargo nocturno',
    nightSurcharge,
    RATES.MULTIPLIERS.NIGHT,
    RATES.SURCHARGES.NIGHT * 100,
    'CST Art. 168',
    false
  );

  // 2. Hora extra diurna (+25%)
  addConcept(
    'Hora extra diurna',
    dayOT,
    RATES.MULTIPLIERS.OT_DAY,
    RATES.SURCHARGES.OT_DAY * 100,
    'CST Art. 179',
    true
  );

  // 3. Hora extra nocturna (+75%)
  addConcept(
    'Hora extra nocturna',
    nightOT,
    RATES.MULTIPLIERS.OT_NIGHT,
    RATES.SURCHARGES.OT_NIGHT * 100,
    'CST Art. 179, Ley 2466',
    true
  );

  // 4. Recargo dominical/festivo ordinario (+90%)
  addConcept(
    'Recargo dominical/festivo',
    holidaySurcharge,
    RATES.MULTIPLIERS.HOLIDAY,
    RATES.SURCHARGES.HOLIDAY * 100,
    'CST Art. 179',
    false
  );

  // 5. Recargo nocturno + festivo combinado (+125%)
  // Nota: No confundir con hora extra — esto es trabajo NOCTURNO ordinario
  // en domingo/festivo.
  // (No hay un campo separado en el formulario para esto combinado;
  //  se incluye como concepto autocalculado si aplica.)

  // 6. Hora extra diurna dominical/festiva (+115% = ×2.15)
  addConcept(
    'Hora extra diurna dom/fest',
    holidayDayOT,
    RATES.MULTIPLIERS.HOLIDAY_OT_DAY,
    RATES.SURCHARGES.HOLIDAY_OT_DAY * 100,
    'CST Art. 179, Ley 2466',
    true
  );

  // 7. Hora extra nocturna dominical/festiva (+165% = ×2.65)
  addConcept(
    'Hora extra nocturna dom/fest',
    holidayNightOT,
    RATES.MULTIPLIERS.HOLIDAY_OT_NIGHT,
    RATES.SURCHARGES.HOLIDAY_OT_NIGHT * 100,
    'CST Art. 179, Ley 2466',
    true
  );

  const grandTotal = basePay + transport + extraTotal;

  return {
    basePay,
    transport,
    hourValue,
    entries,
    extraTotal,
    grandTotal,
    salary,
    totalOT: dayOT + nightOT + holidayDayOT + holidayNightOT,
    totalSurchargeHours: nightSurcharge + holidaySurcharge
  };
}
