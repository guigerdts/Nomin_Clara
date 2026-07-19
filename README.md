# Nómina Clara

App web local para calcular y comparar nómina quincenal en Colombia.

**Stack**: React 18 + TypeScript (strict) + Vite + Vitest  
**Arquitectura**: SPA cliente (sin backend), CSS Modules + custom properties

Ley 2466/2025 — Reforma Laboral vigente desde jul 2026.

## Desarrollo local

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest (125+ tests)
npm run build    # tsc + vite build → dist/
```

## Deploy

Conectado a Vercel (SPA rewrite: `/*` → `/index.html`). Build automático en cada push a `main`.

## Features

- **Calculadora**: salario, horas extra, recargos nocturnos/festivos, auxilio de transporte
- **Deducciones**: salud 4% + pensión 4%, FSP (Art. 8 Ley 797/2003), retefuente estimado (Art. 383 ET)
- **Split quincenal configurable**: even / second-fortnight / first-fortnight, persistido por registro
- **Comparativa**: importar JSON, tabla sorteable con devengado, deducciones y neto por persona

## Licencia

Uso personal. Sin garantía de precisión legal — verificar con RR.HH.
