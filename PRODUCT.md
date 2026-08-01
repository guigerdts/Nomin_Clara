# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Colombian employees — salaried or variable-pay workers — who want to verify that their quincena/nómina was calculated correctly and understand what their prestaciones (prima, cesantías, vacaciones) should be. The same user may come back at a different point in the employment relationship (regular payday check, or contract termination / liquidación). There is no account or login; the tool is self-service and local-first.

## Product Purpose

Nómina Clara helps Colombian workers verify their pay and understand their labor rights. It computes quincenal pay (horas extra, recargos nocturnos y festivos), prestaciones (prima, cesantías, intereses, vacaciones), and liquidación concepts (indemnización, suspensiones), then explains each result with its formula and the legal reference behind it. Success means the worker can confirm whether their employer's payment is correct — and if it is not, they know exactly why and what rule supports them.

## Positioning

The defensible mechanism is legal transparency: every calculation surfaces its formula, its legal basis (CST articles, Ley 2466 de 2025, verified CSJ jurisprudence), and links to official sources (SUIN-Juriscol, Función Pública). A generic salary calculator can produce numbers; it cannot show the worker the exact article of law that justifies each line, or explain asymmetric effects like how a suspension affects each prestación differently. That explainability is what a neighboring product could not truthfully copy.

## Operating Context

- Used in Spanish (es-CO conventions: dates, currency via formatCOP()).
- Works on desktop and mobile browsers; dark mode supported.
- SPA with three main surfaces: Calculadora (pay computation with schedule/manual modes, historical record), Comparar (compare past quincenas, import/export), Liquidación (prestaciones, indemnización, suspensiones).
- Data persists locally in localStorage (no backend, no accounts).
- Educational material is explicitly not legal advice; users are directed to RR.HH. or a labor lawyer when a case matters.

## Capabilities and Constraints

- Computes quincenal pay: horas extra, recargos nocturnos y festivos (Ley 2101/2021 context), transport subsidy, deductions.
- Computes prestaciones: prima de servicios, cesantías, intereses sobre cesantías, vacaciones.
- Liquidación: indemnización (despido injusto), suspensiones del contrato (CST Arts. 51/53, with CSJ Art. 112/53 jurisprudence pinned for the prima row), días trabajados.
- Legal rates live in lib/rates.ts with article references; currency formatted with formatCOP().
- Canvas charts (no chart library dependency).
- Constraints: educational and non-legal-advice stance is durable; Colombia-only legislation; local storage only; conventional commits; TypeScript strict.

## Brand Commitments

- Product name: Nómina Clara ("clear payroll").
- Voice in UI: clear, honest, educational Spanish that respects the worker's intelligence — including honest nuance notes where doctrine debates (e.g., the CSJ prima criterion).
- Legal sources cited verbatim from official government URLs; no fabricated citations (CSJ citation pinned and verified from the product brief).

## Evidence on Hand

- Verified legal citations embedded in code: CST Arts. 51/53 (suspension), Art. 112 (disciplinary limits), Ley 2466 de 2025 (official SUIN text), CSJ Sala Laboral sentencia 18-sep-1980 reiterada 9-nov-1990 (exp. 3911) for the Art. 53 prima rule.
- 337 passing tests covering rates, storage, import/export, forms, and integration flows.
- OpenSpec archive of the suspension-de-trabajo module with proposal/spec/design/tasks/verify/archive reports (openspec/changes/archive/2026-08-01-suspension-de-trabajo/).
- No testimonials, case studies, or press exist — future work must not fabricate them.

## Product Principles

1. Every number a user sees must be traceable to a law or formula — never a black box.
2. Educate before deciding: explain rights and rules even when the user only asked for a calculation.
3. Be honest about legal nuance and uncertainty instead of presenting doctrine as settled fact.
4. The worker's data stays on their device; no accounts, no backend.
5. Default to accessibility: WCAG AA contrast, keyboard navigation, semantic structure, reduced-motion support.

## Accessibility & Inclusion

- WCAG AA is the working standard (contrast verified against computed ratios, focus management in the mobile nav, skip link, reduced-motion support).
- Spanish UI; neutral professional register in artifacts, es-CO formatting conventions.
- Works across desktop and mobile viewports with touch targets ≥ 44px.
