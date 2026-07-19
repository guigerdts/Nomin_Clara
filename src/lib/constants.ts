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
 */
export const SMMLV = 1_750_905;
export const UVT_2026 = 52_374;
