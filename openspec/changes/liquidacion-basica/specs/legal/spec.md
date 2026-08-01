# Delta for Legal

## Change

`liquidacion-basica` — Adds the new `liquidacion-basica` capability (cesantías, intereses, prima, vacaciones). The `legal` capability itself gains no formulas; its only change is removing the non-goal that the new capability now contradicts.

## REMOVED Requirements

### Requirement: Non-goal — "No severance or vacation calculations"

(Reason: the `liquidacion-basica` capability ships cesantías (Art. 249 CST), intereses sobre cesantías (Ley 52/1975), prima de servicios (Art. 306 CST), and vacaciones (Art. 186 CST) through the dedicated `/liquidacion` view. Keeping "No severance or vacation calculations" in the `legal` non-goals would contradict shipped behavior.)
(Migration: delete the line `- No severance or vacation calculations` from section 6 (Non-Goals) of `openspec/specs/legal/spec.md`. The new behavior is specified in the full spec `openspec/specs/liquidacion-basica/spec.md`. No code, test, or doc references the removed line beyond the spec text itself.)

## Verification

- After archive, `openspec/specs/legal/spec.md` section 6 MUST no longer list "No severance or vacation calculations".
- All other `legal` requirements MUST remain unchanged.
