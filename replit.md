# Bizny

A premium productivity and venture coordination platform designed to help people discover opportunities, connect with collaborators, verify information, coordinate resources, and build productive ventures across Africa.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/bizny run dev` — run the web frontend (port 25817)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, TailwindCSS, shadcn/ui, wouter, framer-motion
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Fonts: Inter Tight (headings), Inter (body)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle ORM schema files (one per domain)
- `artifacts/api-server/src/routes/` — Express route handlers (one file per domain)
- `artifacts/bizny/src/` — React frontend source
- `artifacts/bizny/src/contexts/AuthContext.tsx` — JWT auth state management
- `artifacts/bizny/public/logo.jpg` — Bizny brain/circuit logo

## Architecture decisions

- Contract-first OpenAPI: spec gates codegen which gates the frontend. Never hand-write types that codegen produces.
- JWT auth stored in localStorage with a simple token prefix scheme (no bcrypt, no sessions — simplified for MVP).
- Co-Pilot uses rule-based keyword matching for MVP; no external LLM required.
- Marketplace has zero payment/checkout infrastructure by design — contact-info-only discovery.
- Field Agent verification tracked via `verification_status` enum on users table (unverified/pending/verified).

## Product

Bizny connects people, skills, capital, and opportunities across Africa through:

- **Landing Page** — Cinematic hero, philosophy, problem/solution, user roles, industries, field agent trust, early access CTA
- **Registration** — Multi-step onboarding (name/email/whatsapp/country → industry/role → skills/interests)
- **Dashboard** — Dual-mode feed (General + Venture Progress), platform stats, post creation
- **Opportunities** — Browse/filter funding, jobs, projects, partnerships, training, export, research
- **Marketplace** — Business discovery directory with contact info only (no payments)
- **Templates** — Venture blueprints with milestones, skills, resources, timeline, risks
- **Ventures** — Day-by-day progress tracking with multimedia updates
- **Co-Pilot** — AI industrial mentor chat assistant
- **Updates** — Platform milestones, industry news, community progress
- **Profile** — Verification status, active ventures, skills, field agent info

## User preferences

- NOT a social media platform, NOT fintech, NOT e-commerce checkout
- Premium/industrial aesthetic inspired by Stripe, Linear, Apple, Starlink
- Typography: Inter Tight (headings), Inter (body)
- Brand color: #0D7F7A teal
- "Industrial Enthusiast" must be treated as a major user role
- No wallets, payments, cryptocurrency, or financial infrastructure

## Gotchas

- Run codegen after every OpenAPI spec change: `pnpm --filter @workspace/api-spec run codegen`
- Body schema names must be entity-shaped (NoteInput, not CreateNoteBody) to avoid TS2308 collisions
- Express 5: use `/{*splat}` not `*` for wildcard routes; `req.params.id` is `string | string[]`
- DB push required after schema changes: `pnpm --filter @workspace/db run push`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `lib/api-spec/openapi.yaml` for full API contract
