# Tasks: PR3 — ComparePage + cleanup + vite-to-root

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Medium

## Phase 1: Schema + Save

- [x] 1.1 — `types.ts`: add `deductionsInput?: DeductionsInput` y `splitMode?: DeductionSplitMode` a `SavedRecord`
- [x] 1.2 — `CalculatorPage.tsx`: `handleSave()` persiste `deductionsInput` + `splitMode` actuales en el record
- [x] 1.3 — Tests: unit test que saveRecord incluya deductionsInput + splitMode; verify registros legacy cargan sin error

## Phase 2: ComparePage

- [x] 2.1 — `ComparePage.tsx`: lógica de carga — getAllRecords → computeRecordNeto por registro, estado de ordenamiento
- [x] 2.2 — `ImportSection.tsx`: file input + drop zone, llama a validateImportedJSON + importRecords, feedback toast
- [x] 2.3 — `ComparisonTable.tsx`: columnas alias/quincena/devengado/deducciones/neto/diferencia, sort por click en header, muestra "—" cuando no hay deductionsInput
- [x] 2.4 — `ComparisonChart.tsx`: Canvas chart devengado vs neto (useRef/useEffect), puntos para registros sin neto
- [x] 2.5 — CSS Modules para cada componente
- [x] 2.6 — `App.tsx`: reemplazar placeholder con `<ComparePage />`
- [x] 2.7 — Tests: RTL — import mock JSON con y sin deductionsInput, toggle sort

## Phase 3: Move vite/ → raíz (secuencia exacta)

- [ ] 3.1 — Borrar legacy: `rm index.html comparar.html js/ css/` (del repo, no staged aún)
- [ ] 3.2 — Mover: `mv vite/src . && mv vite/index.html . && mv vite/public . 2>/dev/null`
- [ ] 3.3 — `vite.config.ts`: eliminar `root: './vite'`, outDir → `'dist'`
- [ ] 3.4 — `package.json`: verificar scripts post-move
- [ ] 3.5 — `rmdir vite` si quedó vacío

## Phase 4: Verification + Deploy config

- [ ] 4.1 — `tsc --noEmit` desde raíz
- [ ] 4.2 — `vite build` desde raíz (verificar output en dist/)
- [ ] 4.3 — `vitest run` completo
- [ ] 4.4 — `vercel.json`: verificar build config post-move
- [ ] 4.5 — `README.md`: instrucciones finales

## Phase 5: Tests legacy + Old file deletion commit

- [ ] 5.1 — Verificar que los archivos legacy ya no existen en el working tree
- [ ] 5.2 — Commit con todo: schema, compare, move, cleanup
