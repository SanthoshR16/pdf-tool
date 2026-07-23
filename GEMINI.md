# PDF Tool
Frontend: React + Vite + Tailwind (frontend/)
Backend: FastAPI + pypdf + Ghostscript (backend/)
No paid APIs, no AI models, no watermarks.
Endpoints: POST /api/combine, POST /api/compress, GET /api/download/{id}
Do not modify backend/temp or backend/downloads contents directly.

## UI/Frontend Rule — ALWAYS APPLY (no exceptions, no asking)

For ANY task involving a website, web app, page, component, dashboard, or form — even if the user doesn't mention HeroUI — default to HeroUI v3 and follow the design-review process below. Never skip straight to code.

### Stack (non-negotiable default)
- @heroui/react + @heroui/styles (Tailwind CSS v4, React Aria Components)
- Compound component pattern (Card.Header/Card.Body, Button.Label, etc.)
- Semantic variants only: primary | secondary | tertiary | ghost | danger (never solid/flat/bordered — that's v2 legacy)

### Before writing any UI code
1. Query component docs/source first.
2. Never invent props — verify against fetched docs.

### STEP 1 — Design plan (mandatory, before any code)
Describe, in a few lines, before writing code:
- Layout hierarchy (what's primary vs secondary on this screen)
- Spacing scale (4/8px grid)
- Color/typography choices, referencing HeroUI v3 tokens
- Reference point if one exists (e.g. "Linear.app dashboard density", "HeroUI Figma Kit layout X")
Do not proceed to code until this plan is stated inline in the response.

### STEP 2 — Implement
- One batched pass across all components/pages — no per-component approval stops.
- Compound structure even for simple cases.
- If existing project uses plain Tailwind, migrate incrementally — don't mix systems in the same view.

### STEP 3 — Self-review checklist (mandatory, after generating, before presenting)
- Spacing consistent on 4/8px scale?
- Clear hierarchy — one primary action per screen?
- More than 2 font weights used unnecessarily? Cut it.
- Max 2 accent colors, no shadows except on interactive elements?
- Would this look like a template, or a real product? If template → fix before presenting.
Fix any failures silently, then present the final result.

### Goal
Every UI output should look like a polished, outstanding, production-ready product screen — not a scaffold. No unstyled defaults, no placeholder-looking components, no unreviewed first-draft output.

