# PDF Tool
Frontend: React + Vite + Tailwind (frontend/)
Backend: FastAPI + pypdf + Ghostscript (backend/)
No paid APIs, no AI models, no watermarks.
Endpoints: POST /api/combine, POST /api/compress, GET /api/download/{id}
Do not modify backend/temp or backend/downloads contents directly.

## UI/Frontend Rule — ALWAYS APPLY (no exceptions, no asking)

For ANY task involving a website, web app, page, component, dashboard, form, or UI — even if the user doesn't mention HeroUI — default to HeroUI v3.

### Stack (non-negotiable default)
- @heroui/react + @heroui/styles (Tailwind CSS v4, React Aria Components)
- Compound component pattern (Card.Header/Card.Body, Button.Label, etc.)
- Semantic variants only: primary | secondary | tertiary | ghost | danger (never solid/flat/bordered — that's v2 legacy)

### Before writing any UI code
1. Query component docs/source first.
2. Never invent props — verify against fetched docs.

### Execution rules
- Apply changes in ONE batched pass across all components/pages. Do not stop for per-component approval.
- Every screen must look production-grade by default: proper spacing scale, elevation/variant hierarchy, consistent theme tokens from @heroui/styles — not raw unstyled Tailwind divs.
- Use compound structure even for simple cases (don't flatten Card into a div just because it's quick).
- If existing project uses plain Tailwind, migrate incrementally to HeroUI v3 rather than mixing systems in the same view.

