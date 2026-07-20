# Design: Know Your Rights (Glosario expansion)

## Technical Approach

Add a second `<details>` block inside `GlosarioRecargos.tsx` with three static prose sections on labor rights. Pure JSX + CSS — no state, routing, or calculation changes. The existing table/details structure stays untouched; the new block sits below it in the same card.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| Component extraction | Sub-component vs inline | Sub-component adds file overhead for ~80 lines; inline keeps locality | **Inline** — stay in `GlosarioRecargos.tsx` |
| Links approach | Hardcoded vs `links` object | A `links` const at top makes updates easy and keeps the return block clean | **`links` const** at module level |
| Content storage | Static JSX vs fetched markdown | No backend, no API; static is simpler and zero-dependency | **Static JSX** |

## Data Flow

N/A — no runtime data flow. All content is static JSX rendered at build time.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/GlosarioRecargos.tsx` | Modify | Add `links` const, second `<details>` block (3 sections + links footer + disclaimer) |
| `src/components/GlosarioRecargos.module.css` | Modify | Add `.rightsSection`, `.rightsHeading`, `.stepList`, `.links`, `.disclaimer` selectors |

## Component Structure

```tsx
// Module-level links const
const OFFICIAL_LINKS = [
  { label: 'Código Sustantivo del Trabajo', href: 'https://www.suin-juriscol.gov.co/viewDocument.asp?ruta=Codigo/30019323' },
  { label: 'Ley 2466 de 2025 (texto oficial)', href: 'https://www.suin-juriscol.gov.co/viewDocument.asp?id=30055086' },
  { label: 'Función Pública (versión consolidada)', href: 'https://www.funcionpublica.gov.co/eva/gestornormativo/norma.php?i=260676' },
];

// Inside the card, after the existing </details>:
<details className={styles.details}>
  <summary className={styles.summary}>
    <h2 className={styles.heading}>Conocé tus derechos laborales</h2>
    <span className={styles.summaryIcon}>▼</span>
  </summary>
  <div className={styles.content}>
    {/* Section 1 */}
    <section className={styles.rightsSection}>
      <h3 className={styles.rightsHeading}>Tu descanso obligatorio y día compensatorio</h3>
      <p>
        Todo trabajador tiene derecho a un día de descanso remunerado a la semana,
        que en principio es el domingo (Arts. 172–173 CST). Si te hacen trabajar en
        tu día de descanso obligatorio, tenés derecho a un <strong>día compensatorio</strong> — un día
        DISTINTO de descanso, no simplemente el domingo siguiente.
      </p>
      <p>
        Hay dos escenarios: si trabajás domingos de forma <strong>ocasional</strong> (hasta 6
        domingos en un semestre), el compensatorio se paga con un recargo del 90%
        sobre el valor del día. Si lo hacés de forma <strong>habitual</strong> (más de 6), además
        del recargo, te debe quedar un día completo de descanso compensatorio en la
        semana — no te lo pueden "pagar" en plata.
      </p>
      <p>
        <cite>Arts. 172–176, 179–180 CST; Ley 2466/2025</cite>
      </p>
    </section>

    {/* Section 2 */}
    <section className={styles.rightsSection}>
      <h3 className={styles.rightsHeading}>Jornada máxima legal</h3>
      <p>
        Desde julio de 2026, la jornada máxima en Colombia es de <strong>42 horas semanales</strong>
        (Ley 2101/2021). Esa es la jornada ordinaria — lo que trabajás de más se paga
        como hora extra con los recargos que viste en la tabla de arriba.
      </p>
      <p>
        Las horas extra tienen límites: máximo <strong>2 horas al día</strong> y <strong>12 a la semana</strong>
        (Art. 161 CST, Art. 22 Decreto 2352/1965). Si tu empleador te exige más que
        eso, necesita autorización expresa del Ministerio de Trabajo. Sin esa
        autorización, las horas extra que excedan estos límites son ilegales.
      </p>
      <p>
        La Ley 2466/2025 también actualizó los recargos nocturnos y mantiene intactos
        los topes de jornada máxima.
      </p>
      <p>
        <cite>Art. 161 CST; Art. 22 Decreto 2352/1965; Ley 2101/2021; Ley 2466/2025</cite>
      </p>
    </section>

    {/* Section 3 */}
    <section className={styles.rightsSection}>
      <h3 className={styles.rightsHeading}>Cómo reclamar si algo no cuadra</h3>
      <p>
        Si revisaste tu liquidación y algo no cierra con lo que dice la ley, este
        es el camino:
      </p>
      <ol className={styles.stepList}>
        <li>
          <strong>Reclamo por escrito a RR.HH. o nómina.</strong> Presentalo formalmente,
          pedí que te reciban una copia con fecha y sello. Guardá esa constancia — es
          tu mejor prueba.
        </li>
        <li>
          <strong>Inspección del Ministerio de Trabajo.</strong> Si no hay respuesta o es
          insatisfactoria, presentate en una oficina del Ministerio de Trabajo o usá
          su canal digital. Hacen una visita de inspección y pueden ordenar el pago
          de lo adeudado.
        </li>
        <li>
          <strong>Demanda laboral.</strong> Si la inspección no resuelve, podés iniciar un
          proceso ordinario laboral ante un juez. Acá ya conviene tener abogado.
        </li>
      </ol>
    </section>

    {/* Official links */}
    <footer className={styles.links}>
      <h4>Fuentes oficiales</h4>
      <ul>
        {OFFICIAL_LINKS.map((link, i) => (
          <li key={i}>
            <a href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </footer>

    <p className={styles.disclaimer}>
      Esta información es educativa y no constituye asesoría legal. Las leyes
      pueden cambiar y cada caso tiene particularidades. Si tenés una situación
      concreta, consultá con un abogado laboral.
    </p>
  </div>
</details>
```

## CSS Additions

```css
/* ---- Rights sections ---- */
.rightsSection {
  margin-bottom: var(--space-5);
}

.rightsSection p {
  font-size: var(--font-size-sm);
  line-height: 1.6;
  margin: 0 0 var(--space-2);
}

.rightsSection p:last-child {
  margin-bottom: 0;
}

.rightsHeading {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin: 0 0 var(--space-2);
  color: var(--color-primary);
}

.rightsSection cite {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-style: italic;
}

.stepList {
  padding-left: var(--space-5);
  margin: 0;
}

.stepList li {
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  line-height: 1.6;
}

/* ---- Official links footer ---- */
.links {
  margin-top: var(--space-5);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
}

.links h4 {
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin: 0 0 var(--space-2);
  color: var(--color-text-secondary);
}

.links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.links li {
  margin-bottom: var(--space-1);
}

.links a {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  text-decoration: underline;
  word-break: break-all;
}

.links a:hover {
  color: var(--color-primary-dark);
}

/* ---- Disclaimer ---- */
.disclaimer {
  margin-top: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
  font-style: italic;
  line-height: 1.5;
}
```

## Interfaces / Contracts

None. No new TypeScript interfaces, types, or function signatures.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Build | `npx tsc --noEmit` | Verify zero type errors — structural compiler check |
| Visual | Manual review | Open component in browser, confirm both `<details>` blocks are independently collapsible, links open in new tab |

No unit tests — the component is pure presentational JSX with no logic branches. Same pattern as the existing glossary (no test file exists for it).

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary.

## Migration / Rollout

No migration required. Clean git revert if needed.

## Open Questions

None.
