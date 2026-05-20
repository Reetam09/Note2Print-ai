# Note2Print AI

An AI-powered educational document platform that converts handwritten notes, images, PDFs, and voice recordings into clean, printable educational documents.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000 / proxy: /api)
- `pnpm --filter @workspace/note2print run dev` — run the web frontend (proxy: /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui + framer-motion + wouter
- API: Express 5 + Zod validation
- DB: PostgreSQL + Drizzle ORM
- AI: OpenAI GPT-4o (via Replit AI integration) — OCR, voice-to-text, formatting, exam generation
- API codegen: Orval (from OpenAPI spec → React Query hooks)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle DB schemas (documents, exam_papers, templates, conversations, messages)
- `lib/api-client-react/src/generated/` — generated React Query hooks (do not edit manually)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/note2print/src/pages/` — React page components

## Architecture decisions

- Contract-first API: OpenAPI spec drives Zod validation on server and React Query hooks on client.
- OpenAI `p-limit`/`p-retry` are externalized in esbuild so they load from node_modules at runtime.
- All AI operations go through `lib/integrations-openai-ai-server` which wraps the OpenAI SDK.
- Body size limit set to 50mb in Express to handle base64-encoded images and audio.
- Exam paper sections stored as JSON string in `exam_papers.sections` column.

## Product

- **Landing page** — marketing page with feature highlights
- **Dashboard** — live stats (documents count, exam papers, weekly activity) + recent activity feed
- **Exam Paper Generator** — fills in subject/grade/board/difficulty, picks question types (MCQ, short, long, etc.), AI generates full paper with sections and answer key
- **Assignment & Document Builder** — type/paste raw notes OR upload image (OCR via GPT-4V) OR record voice (Whisper), AI formats into professional document, supports English + Bengali
- **Editor** — view/edit documents and exam papers, grammar check, print/export
- **Saved Papers** — searchable + filterable list of all documents and exam papers
- **Settings** — dark mode toggle, language preference, school/teacher name pre-fill

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `openai`, `p-limit`, `p-retry` must be in both `artifacts/api-server/package.json` (dependencies) AND the `external` list in `artifacts/api-server/build.mjs`
- Do not run `pnpm dev` at workspace root — use `restart_workflow` instead
- `pnpm --filter @workspace/note2print run typecheck` to verify frontend without workflow env vars

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- `lib/api-spec/openapi.yaml` → run codegen after any change → don't touch generated files
