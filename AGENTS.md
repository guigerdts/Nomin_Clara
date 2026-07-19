# Code Review Rules

## TypeScript
- Use const/let, never var
- Prefer interfaces over types
- No any types
- Strict mode enforced (strict: true)

## React
- Use functional components with hooks
- Prefer named exports over default exports
- CSS Modules for component styles
- Global theme tokens in global.css custom properties
- Canvas charts via useRef + useEffect (no chart library dependency)

## Testing
- Vitest with @testing-library/react for component tests
- Pure logic tested as unit tests (rates, storage, importExport)
- Integration tests for form → calculate → render flows
- No test files without corresponding source

## General
- Conventional commits only (no Co-Authored-By)
- Keep legal rates in lib/rates.ts with article references
- Format currency with formatCOP() helper
