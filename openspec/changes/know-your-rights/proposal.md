# Proposal: Know Your Rights (Glosario expansion)

## Intent

Expand the existing `GlosarioRecargos` component with three new labor-rights sections so users can understand their legal protections beyond surcharge rates — rest days, max hours, and how to claim discrepancies. Pure content expansion: no routing, types, or calculation changes.

## Scope

### In Scope
- Add a second collapsible `<details>` block: "Conocé tus derechos laborales"
- Section 1: "Tu descanso obligatorio y día compensatorio" (CST Arts. 172–176, 179–180, Ley 2466/2025)
- Section 2: "Jornada máxima legal" (CST Art. 161, Decreto 2352/1965 Art. 22, Ley 2101/2021, Ley 2466/2025)
- Section 3: "Cómo reclamar si algo no cuadra" (written complaint → Ministry → lawsuit)
- Official links footer with `target="_blank" rel="noopener noreferrer"`
- CSS additions to `GlosarioRecargos.module.css` (prose sections, step lists, link blocks)
- Legal disclaimer note (educational, not legal advice)

### Out of Scope
- No routing, types, or calculation logic changes
- No new components or file extraction (stay within `GlosarioRecargos.tsx`)
- No new test files (pure presentational, same pattern as existing glossary)
- No changes to `openspec/specs/legal/spec.md` — this is educational content, not a spec-level capability change

## Capabilities

> This section is the CONTRACT between proposal and specs phases.

### New Capabilities

None. This is educational prose content — no new spec-level behaviors, interfaces, or contracts.

### Modified Capabilities

None. No existing spec requirements change.

## Approach

Add a second `<details className={styles.details}>` block inside the existing `.glossary` card, after the surcharges section. The new block contains three prose sections as static JSX, matching the existing voseo tone ("aplicá", "trabajás") and pattern: plain-language explanation → legal citation. Official links use a `links` object at the top of the file for maintainability.

The component stays a single file; no sub-component extraction needed at this scale (~80 new lines of JSX).

```
<card.glossary>
  <details.surcharges>     ← existing
    <summary>¿Qué significa cada recargo?</summary>
    ...
  </details>

  <details.knowYourRights>  ← NEW
    <summary>Conocé tus derechos laborales</summary>
    // Section 1: Descanso obligatorio (prose)
    // Section 2: Jornada máxima (table + prose)
    // Section 3: Cómo reclamar (step list)
    // Official links with target="_blank"
  </details>
</card.glossary>
```

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/GlosarioRecargos.tsx` | Modified | Add `<details>` with 3 prose sections + links footer |
| `src/components/GlosarioRecargos.module.css` | Modified | Add prose/section/link selector styles |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Link rot (official URLs may change) | Med | Add "verified at time of writing" disclaimer; specific article refs are findable via search |
| Legal accuracy | Low | Cite article numbers precisely; add "educational, not legal advice" note |
| Component file grows long | Low | ~80 new lines is manageable; extract to sub-component if >300 total |

## Rollback Plan

Revert the two files (`GlosarioRecargos.tsx` and `.module.css`) to their pre-change state. No data migration, state, or routing impact — a clean git revert.

## Dependencies

None. All legal references are static text; no API calls or data dependencies.

## Success Criteria

- [ ] Three new sections render inside a second collapsible block below the surcharge table
- [ ] All legal references match the citations specified in the exploration
- [ ] All official links open in new tabs with `rel="noopener noreferrer"`
- [ ] Existing surcharge glossary still works and is independently collapsible
- [ ] `npx tsc --noEmit` passes with no errors
