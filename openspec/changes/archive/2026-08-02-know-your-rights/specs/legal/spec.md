# Delta for Legal

## Change

`know-your-rights` — Adds the "Conocé tus derechos laborales" educational block to the `legal` capability: a second collapsible `<details>` section inside `GlosarioRecargos` covering obligatory rest + compensatory day (CST Arts. 172–176, 179–180, Ley 2466/2025), legal maximum working hours (CST Art. 161, Decreto 2352/1965 Art. 22, Ley 2101/2021, Ley 2466/2025), and how to file a claim (written complaint → Ministry → lawsuit), with an official-links footer (`target="_blank" rel="noopener noreferrer"`) and an educational disclaimer. Pure content expansion: no routing, types, or calculation changes.

## ADDED Requirements

### Requirement: Educational block — "Conocé tus derechos laborales"

The system MUST render a second collapsible `<details>` block inside `GlosarioRecargos`, below the existing surcharge section, titled "Conocé tus derechos laborales", containing three prose sections: (1) obligatory rest and compensatory day, (2) legal maximum working hours, (3) how to claim discrepancies. Each section MUST include its precise legal citations.

#### Scenario: Rights block renders below the surcharge glossary
- **WHEN** the glossary card renders
- **THEN** a second independently-collapsible block titled "Conocé tus derechos laborales" appears below the surcharge section with the three content sections

#### Scenario: Surcharge glossary remains independently collapsible
- **WHEN** the rights block is open or closed
- **THEN** the existing surcharge section toggles independently and is unaffected

### Requirement: Rest and compensatory day content (CST Arts. 172–176, 179–180, Ley 2466/2025)

The system MUST explain the weekly rest day (in principle Sunday, Arts. 172–173 CST), the right to a compensatory day when worked on the obligatory rest day, and the applicable citations including Ley 2466/2025 where relevant.

#### Scenario: Rest section shows obligatory day and compensatory right
- **WHEN** the rights block's first section renders
- **THEN** it explains the weekly rest right, the compensatory-day right when the rest day is worked, and cites CST Arts. 172–176 and 179–180

### Requirement: Maximum working hours content (CST Art. 161, Decreto 2352/1965 Art. 22, Ley 2101/2021, Ley 2466/2025)

The system MUST explain the legal maximum working hours and their evolution — CST Art. 161, Decreto 2352/1965 Art. 22, Ley 2101/2021 (42-hour week), Ley 2466/2025 — in plain language with the citations.

#### Scenario: Jornada section shows maximum hours with citations
- **WHEN** the rights block's second section renders
- **THEN** it states the legal maximum week and cites CST Art. 161, Decreto 2352/1965 Art. 22, Ley 2101/2021 and Ley 2466/2025

### Requirement: Claim process content (written complaint → Ministry → lawsuit)

The system MUST explain, as a step list, how to claim discrepancies: formal written complaint to the employer, then the Ministry of Labor, then a labor lawsuit.

#### Scenario: Claim section renders a three-step path
- **WHEN** the rights block's third section renders
- **THEN** it lists the complaint path in order: written complaint, Ministry of Labor, labor lawsuit

### Requirement: Official links footer with safe new-tab behavior

The system MUST render an official-links footer with the exact official URLs (SUIN CST, SUIN Ley 2466/2025, Función Pública consolidated version), each opening in a new tab with `target="_blank"` and `rel="noopener noreferrer"`.

#### Scenario: Official links open safely in new tabs
- **WHEN** a worker clicks an official link in the links footer
- **THEN** the link opens in a new tab with `rel="noopener noreferrer"` and points to the official SUIN or Función Pública URL

### Requirement: Educational disclaimer

The system MUST show an educational disclaimer ("contenido educativo, no asesoría legal" in the app's voice) below the links footer, and MUST NOT present any section as legal advice.

#### Scenario: Disclaimer renders below links
- **WHEN** the rights block renders
- **THEN** the educational disclaimer is visible below the links footer

## Verification

- After archive, `openspec/specs/legal/spec.md` MUST include the educational "Conocé tus derechos laborales" requirements above.
- All pre-existing `legal` requirements MUST remain unchanged.
