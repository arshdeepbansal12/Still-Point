# Stillpoint Stress Assessment

Stillpoint is a private wellness self-check that helps people notice current stress patterns without presenting a medical diagnosis.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/stress-assessment/src/lib/assessment.ts` — question bank, reverse-scoring, category scoring, and session randomization
- `artifacts/stress-assessment/src/pages/stress-pages.tsx` — assessment, report, history, and privacy screens
- `lib/api-spec/openapi.yaml` — API contract for saved assessment sessions
- `lib/db/src/schema/assessment-sessions.ts` — persisted session data model
- `artifacts/api-server/src/routes/assessment.ts` — session API handlers

## Architecture decisions

- Facial expression analysis is not enabled in this first release; the API keeps nullable facial fields so the optional module can be added without changing the report contract.
- The safety question is stored with answers but excluded from the stress score; any non-zero response is a separate crisis flag.
- Session history is intentionally anonymous and has no account requirement in the current product surface.

## Product

- Consent-first 10-question assessment with randomized question order
- Reverse-scored PSS-inspired questions and normalized emotional, physical, and behavioral scores
- Results report with guidance, crisis support messaging, print/PDF-friendly export, history, and deletion controls

## User preferences

None recorded.

## Gotchas

- Run API codegen after changing `lib/api-spec/openapi.yaml`.
- The generated validator currently uses Zod 3, so API contract numeric ids use `number` rather than the generator's incompatible integer helper.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
