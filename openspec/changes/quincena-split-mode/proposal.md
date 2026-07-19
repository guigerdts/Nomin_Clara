# Proposal: Modo de distribución de deducciones por quincena

## Intent

Actualmente el módulo divide `totalDeductions / 2` asumiendo reparto parejo entre las dos quincenas. En la práctica, muchas empresas colombianas aplican los descuentos completos en una sola quincena (usualmente la segunda), tratando la primera como anticipo. Sin este ajuste, la comparación "neto calculado vs. pago real" muestra una diferencia falsa de timing, no de error del empleador, restando credibilidad a la herramienta.

## Scope

### In Scope
- Selector de modo de distribución (3 esquemas) en DeduccionesForm
- Parámetro `splitMode` en `computeDeductions()` y `calculateNetPay()`
- localStorage persistente con migración automática (default: `'even'`)
- Tests para los 3 modos + compatibilidad con datos existentes
- Indicador visible en TotalsPanel del modo aplicado

### Out of Scope
- Cálculo automático del modo usado por cada empresa (es decisión del usuario)
- Modos adicionales tipo "split por días trabajados" (raro, sinriesgo demostrable)
- Cambio en las fórmulas de cálculo individual (salud, pensión, FSP, retefuente)

## Capabilities

### New Capabilities
- `deduction-split`: Cómo se distribuye el total de deducciones entre quincenas

### Modified Capabilities
None — las capacidades existentes (cálculo de deducciones individuales) no cambian.

## Approach

1. Agregar `DeductionSplitMode` type (`'even' | 'second-fortnight' | 'first-fortnight'`)
2. `calculateNetPay()` recibe `splitMode` y asigna el peso completo a la quincena indicada
3. `computeDeductions()` propaga el modo para que los items del desglose muestren su split
4. localStorage key `deduction-split-mode` con default `'even'` para datos existentes
5. Select radio-group en DeduccionesForm con texto de ayuda

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `vite/src/lib/types.ts` | Modified | + `DeductionSplitMode` type |
| `vite/src/lib/deductions.ts` | Modified | + split mode param en calculateNetPay |
| `vite/src/pages/CalculatorPage/DeduccionesForm.tsx` | Modified | + radio group selector |
| `vite/src/pages/CalculatorPage/TotalsPanel.tsx` | Modified | + indicador de modo aplicado |
| `vite/src/lib/__tests__/deductions.test.ts` | Modified | + tests para 3 modos |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Romper compatibilidad con localStorage existente | Low | Default 'even' + tests de migración |
| Usuario selecciona modo incorrecto y piensa que hay error | Low | Texto de ayuda explicativo en el selector |

## Rollback Plan

Revertir los 5 archivos tocados y mantener default 'even' silegacy persisted data.

## Success Criteria

- [ ] 3 modos implementados con tests unitarios pasando
- [ ] localStorage sin `deduction-split-mode` tratado como `'even'`
- [ ] Selector visible y el cambio se refleja en TotalsPanel
- [ ] Tests existentes de deductions siguen pasando (modo `'even'` compat)
