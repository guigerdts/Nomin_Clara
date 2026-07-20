# Tasks: Know Your Rights (Glosario expansion)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~160 (80 JSX + 80 CSS) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| T1 | Add `OFFICIAL_LINKS` const + second `<details>` block in TSX | Single PR | `npx tsc --noEmit` | Open browser, verify both `<details>` blocks collapsible and links open new tab | Revert `GlosarioRecargos.tsx` |
| T2 | Add CSS selectors for rights sections, step lists, links, disclaimer | Single PR | `npx tsc --noEmit` | Re-check visual rendering of new sections | Revert `GlosarioRecargos.module.css` |
| T3 | Full verification | Single PR | `npx tsc --noEmit` | Visual: both blocks independently collapsible, links open in new tab, disclaimer visible | Revert both files |

## Phase 1: Content Expansion

- [x] T1.1 Add `OFFICIAL_LINKS` module-level const with 3 exact official URLs in `GlosarioRecargos.tsx`
- [x] T1.2 Add second `<details>` block after existing `</details>`: `<summary>"Conocé tus derechos laborales"` with 3 prose sections (descanso, jornada, reclamo), `<footer className={styles.links}>`, and disclaimer `<p>`
- [x] T1.3 Verify all 3 official URLs match exactly: SUIN CST, SUIN Ley 2466/2025, Función Pública

## Phase 2: Styles

- [x] T2.1 Add `.rightsSection`, `.rightsHeading`, `.rightsSection p`, `.rightsSection cite` selectors
- [x] T2.2 Add `.stepList`, `.stepList li` selectors
- [x] T2.3 Add `.links`, `.links h4`, `.links ul`, `.links li`, `.links a`, `.links a:hover` selectors
- [x] T2.4 Add `.disclaimer` selector

## Phase 3: Verification

- [x] T3.1 Run `npx tsc --noEmit` — zero type errors
- [ ] T3.2 Manual check: both `<details>` blocks independently collapsible, links open in `target="_blank"`, disclaimer renders below links footer (manual — browser)
