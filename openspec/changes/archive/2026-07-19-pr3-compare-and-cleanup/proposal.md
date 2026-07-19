# Proposal: PR3 — ComparePage + cleanup + vite-to-root

## Intent

Cerrar la migración a React+TS+Vite: construir la página de comparativa de registros (última página faltante), agregar soporte de deducciones en los registros guardados, eliminar todos los archivos legacy de vanilla JS, y mover `vite/` a la raíz del repo para que el proyecto quede limpio y desplegable sin subdirectorios artificiales.

## Scope

### In Scope
1. Schema: `deductionsInput` + `splitMode` en `SavedRecord`, actualizar `handleSave`
2. ComparePage: `ImportSection`, `ComparisonTable` (sorteable), `ComparisonChart` (Canvas), ruta `/compare`
3. ComparisonTable columnas: alias, quincena, devengado, deducciones, neto, diferencia
4. Uso del `splitMode` guardado en cada registro para recomputar neto (no el localStorage del viewer)
5. Borrar: `index.html`, `comparar.html`, `js/*.js`, `css/styles.css`
6. Mover `vite/` → raíz del repo: `vite/src/` → `src/`, `vite/index.html` → `index.html`, actualizar `vite.config.ts`, `package.json`, `tsconfig.json`
7. Actualizar `vercel.json` con las rutas post-move

### Out of Scope
- Borrar `.gga` o `AGENTS.md` de la raíz (son config de dev, no del app)
- Migración de datos en localStorage (los registros existentes sin `deductionsInput` se muestran sin columna de neto)
- Tests de la ComparePage con datos de deductions (se cubren en el cambio de schema)

## Capabilities

### New Capabilities
- `record-deductions`: Cómo se guardan y restauran las deducciones en los registros persistidos

### Modified Capabilities
None — las capacidades de cálculo existentes no cambian.

## Approach

1. Extender `SavedRecord` con campos opcionales `deductionsInput` y `splitMode`
2. `handleSave` en CalculatorPage persiste el estado actual de deducciones + splitMode
3. Componentes nuevos en `pages/ComparePage/`: `ImportSection`, `ComparisonTable`, `ComparisonChart`
4. Mover archivos de `vite/` a la raíz: reorganización física del repo
5. Verificar `vite build` y `vitest run` después del move

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `vite/src/lib/types.ts` | Modified | + `deductionsInput?` + `splitMode?` en SavedRecord |
| `vite/src/pages/CalculatorPage/CalculatorPage.tsx` | Modified | handleSave persiste deductions + splitMode |
| `vite/src/pages/ComparePage/` | New | 4 componentes + CSS modules |
| `vite/src/App.tsx` | Modified | Ruta /compare con ComparePage real |
| Raíz del repo | Moved | vite/ → raíz; archivos legacy borrados |
| `vercel.json` | Modified | Ruta post-move |
| `package.json` | Modified | scripts post-move |
| `README.md` | Modified | Instrucciones actualizadas |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Mover archivos rompe imports | Medium | `tsc --noEmit` + `vitest run` + build post-move |
| Vercel deploy falla post-move | Medium | Verificar vercel.json + build local antes del push |
| Old records sin deductions muestran columnas vacías | Low | Optional chaining en la tabla |

## Rollback Plan

Revert el commit de PR3. Los archivos legacy ya borrados se recuperan con `git restore` desde el commit de PR2. Si el move a raíz falla, revertir y mantener `vite/` como subdirectorio.

## Dependencies

- `DeductionSplitMode` type (ya existe del cambio anterior)
- `quincenaShare()` helper (ya existe)

## Success Criteria

- [ ] `vitest run` pasa con 115+ tests
- [ ] `tsc --noEmit` + `vite build` exitoso post-move
- [ ] ComparePage: importar JSON mock, ver devengado + deducciones + neto en tabla
- [ ] Registros legacy sin deductionsInput se muestran sin error
- [ ] Archivos legacy borrados no existen post-commit
- [ ] `vite dev` funciona desde la raíz sin --root flag
