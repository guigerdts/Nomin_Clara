/**
 * constants.ts
 *
 * Single source of truth for legally-defined constants used across the app.
 * Update these once per year when the Colombian government publishes new values.
 *
 * ===== SMMLV (Salario Mínimo Mensual Legal Vigente) =====
 * 2026: $1.750.905
 * Source: Decreto 1469/2025 (julio 2025)
 *
 * ⚠️ UPDATE every January when the government publishes the new SMMLV.
 * Used for: hourly value, transport allowance threshold (≤ 2 SMMLV),
 * solidarity fund tiers (4+ SMMLV), retefuente base, glossary examples.
 * Every surcharge calculation, transport test, and UI hint depends on this.
 *
 * ===== UVT (Unidad de Valor Tributario) =====
 * 2026: $52.374
 * Source: Res. DIAN 000238/2025
 *
 * Used for: retefuente brackets (UVT-based).
 *
 * ===== Auxilio de Transporte =====
 * 2026: $249.095
 * Source: Decreto 1470/2025 (mismo decreto que fijó el SMMLV 2026)
 *
 * Aplica a salarios ≤ 2 SMMLV. Se paga por cada mes trabajado (el
 * cálculo quincenal lo divide entre 2).
 *
 * ⚠️ UPDATE together with SMMLV at the start of each year.
 */
export const SMMLV = 1_750_905;
export const UVT_2026 = 52_374;
export const TRANSPORT_ALLOWANCE_2026 = 249_095;
