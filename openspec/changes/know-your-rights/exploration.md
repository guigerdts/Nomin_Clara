## Exploration: "Know Your Rights" (Glosario expansion)

### Current State

**What `GlosarioRecargos.tsx` does today:**

A single `details/summary` collapsible card rendered at the bottom of `CalculatorPage.tsx` (line 307), always visible regardless of calculation state. It explains the 7 surcharge types via:

1. **A summary table** with columns: Concepto, Recargo, Valor × hora, Ref. legal
2. **An expandable detail section** ("Ver explicación detallada de cada uno") with per-concept cards containing: title, plain-language description, worked example with current SMMLV, and legal citation

**Component architecture:**
- `src/components/GlosarioRecargos.tsx` — pure presentational component, no props, no state beyond internal `useMemo` for the concept array
- `src/components/GlosarioRecargos.module.css` — self-contained CSS Module (197 lines), uses global CSS custom properties for all tokens
- The component uses `SMMLV` from `lib/constants.ts` and `getOrdinaryHourValue()`, `formatCOP()`, `formatPercent()` from `lib/rates.ts`
- Every concept has the structure: `nombreSencillo`, `titulo`, `descripcion`, `porcentaje`, `formula`, `citaLegal`, `ejemplo`, `ejemploValor`

**Styling details:**
- Wraps in `<div className={`card ${styles.glossary}`}>` — reuses the global `.card` class
- Table-based layout, responsive for mobile (<640px collapses table to card-like blocks)
- Teal/blue accent via `--color-primary` for the percentage badges
- Legal citations in muted secondary text, `--font-size-xs`
- Expandable details use `details`/`summary` HTML elements (zero JS)
- No external link usage — all citations are plain text references

**Existing tone/language:**
- Voseo direct address ("aplicá", "trabajás", "asegurate", "tenés")
- Simple explanations first, legal citation appended at the end
- Examples grounded in current SMMLV with real COP values
- Educational but not patronising — explains the "why" not just the "what"

### What Needs to Be Added

**Three new sections** with the same informational pattern but different formats:

1. **"Your mandatory rest day and compensatory day"** (Descanso obligatorio y día compensatorio)
   - Best as a prose section (not a table) — explains concepts, conditions, and legal distinctions
   - Covers: weekly rest right (Art. 172-176), compensatory day when forced to work, occasional vs habitual Sunday/holiday work (Art. 179-180 + Ley 2466/2025)
   
2. **"Maximum legal working hours"** (Jornada máxima legal)
   - Mix of table (limits) and prose (explanations, exceptions, consequences)
   - Covers: 42h/week cap (Art. 161), overtime limits (Decreto 2352/1965 Art. 22), special authorization requirement
   
3. **"How to claim if something doesn't add up"** (Cómo reclamar si algo no cuadra)
   - Step-by-step procedural guide: written complaint → Ministry of Labor → lawsuit
   - Links to official contact channels

**All three need:**
- Plain-language explanation first → legal citation appended
- `target="_blank" rel="noopener noreferrer"` links for all official URLs
- The same voseo tone and educational approach

### Architecture Approach

**Recommendation: Expand the existing component rather than creating siblings.**

Rationale:
- `GlosarioRecargos` already renders in the right place — no routing changes needed
- Expanding it keeps all labor-rights educational content in one place
- The existing `details/summary` pattern can nest new sections as additional `<details>` blocks inside the main `<div className="content">` block
- Adding a second top-level `details/summary` would let the original 7 surcharges stay open independently from the new rights content
- Zero impact on routing (`CalculatorPage.tsx`), types, or calculation logic

**Proposed component restructure:**

```
<card.glossary>
  <details.surcharges>   ← existing, rename from generic .details
    <summary>¿Qué significa cada recargo?</summary>
    <content> (existing table + detalle expandible) </content>
  </details>

  <details.knowYourRights>   ← NEW
    <summary>Conocé tus derechos laborales</summary>
    <content>
      <Section 1: Descanso obligatorio>  ← new prose section
      <Section 2: Jornada máxima>        ← new mixed table/prose
      <Section 3: Cómo reclamar>         ← new step-by-step
      <Official links footer>            ← new links section
    </content>
  </details>
</card.glossary>
```

This follows the same pattern: `details > summary > div.content`, keeping all content lazy-loaded (no JS needed, native HTML accordion).

**CSS approach:**
- Reuse existing `GlosarioRecargos.module.css` classes where applicable (`.details`, `.summary`, `.heading`, `.content`, `.intro`, `.citaLegal` styles)
- Add new section-specific styles (prose sections, step lists, link blocks) in the same module
- Keep the new styles prefixed/named to avoid confusion (e.g., `.rightsSection`, `.stepList`, `.stepItem`, `.externalLink`)

### Content Outline with Legal References

#### Section 1: Tu descanso obligatorio y día compensatorio

| Concept | Detail | Legal Ref |
|---------|--------|-----------|
| Weekly rest right | Every worker has one paid rest day per week (typically Sunday or Monday depending on sector) | CST Arts. 172-176 |
| Compensatory day | If forced to work the rest day, worker earns a compensatory day (an EXTRA day off, not the regular rest day) | CST Art. 175 |
| Occasional Sunday/holiday work | Ad-hoc, not part of regular schedule → surcharge + compensatory day | CST Art. 179 |
| Habitual Sunday/holiday work | Regular Sunday/holiday work as part of the job → special rules under Ley 2466/2025 | CST Art. 179-180, Ley 2466/2025 |

#### Section 2: Jornada máxima legal

| Concept | Detail | Legal Ref |
|---------|--------|-----------|
| Maximum weekly hours | 42 hours/week | CST Art. 161 (mod. Ley 2101/2021, Ley 2466/2025) |
| Full effect date | Fully in effect since July 2026 | Ley 2466/2025 |
| Overtime daily limit | Max 2 overtime hours per day | Decreto 2352/1965, Art. 22 |
| Overtime weekly limit | Max 12 overtime hours per week | Decreto 2352/1965, Art. 22 |
| Exceeding limits | Requires special authorization from Ministry of Labor | Decreto 2352/1965, Art. 22 |

#### Section 3: Cómo reclamar si algo no cuadra

1. **Written complaint to HR/payroll** — create paper trail
2. **Ministry of Labor Labor Inspection** (link)
3. **Labor lawsuit** (ordinary labor jurisdiction)

#### Official Links

| Label | URL | Purpose |
|-------|-----|---------|
| Código Sustantivo del Trabajo (CST completo) | https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Codigo/30019323 | Complete labor code |
| Ley 2466/2025 | https://www.suin-juriscol.gov.co/viewDocument.asp?id=30055086 | Recent reform modifying CST |
| Función Pública (consolidated CST, easier to navigate) | https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676 | Readable consolidated version |

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Link rot** | Official Colombian government URLs (SUIN-Juriscol, Función Pública) may change or go offline over time | Links are mandatory per user requirement; add a disclaimer that links were verified at time of writing; users can find current CST via search if links break |
| **Legal accuracy** | The app itself is informational, not legal advice — misinterpretation risk | The existing footer already has a legal disclaimer; ensure these new sections reference it or have their own "this is educational, not legal advice" note |
| **Outdated legal info** | Laws may be further modified after 2026 | Links point to the official source documents which always contain the current text. Cite article numbers specifically so updates are easy to verify |
| **Component complexity** | Adding three prose-heavy sections alongside the table could make the component file long | Keep concerns separated with clear section constants; extract sections into sub-components if >300 lines total |
| **Mobile layout** | Prose sections with links and step lists need responsive treatment | Use existing responsive breakpoints from the CSS module (639px mobile); step lists should work as vertical lists on all sizes |

### Ready for Proposal

**Yes** — the approach is clear: expand the existing `GlosarioRecargos` component with a second collapsible section containing the three new rights topics. No routing, types, calculation logic, or test changes needed — purely a UI/content expansion of an existing component with no dependencies beyond the component and its CSS module.

Key decisions for the proposal phase:
1. Whether to keep the new sections in the same file or extract them into `GlosarioRecargos` + sibling `DerechosLaborales` sub-components
2. Whether the new sections share the existing `details` open/close state or have independent toggles
3. Whether to expand the existing `conceptos`-style data structure or write prose directly as JSX
