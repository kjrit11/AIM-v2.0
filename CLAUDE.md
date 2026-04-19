# CLAUDE.md — AIM v2 Sales Command Center

**Last updated:** 2026-04-18 (Phase 0 scaffold + Wave 1 cleanup)

---

## Session opener — required every session

Every new Claude Code session on this repo MUST begin with:

```
Read CLAUDE.md, docs/ARCHITECTURE.md, docs/STYLE_GUIDE.md, and docs/GOTCHAS.md
in that order. Then report:
  1. The current phase of the rebuild (from PROGRESS.md)
  2. The top 3 open items in PROGRESS.md
  3. Which files you will touch to address item #1

Do not write any code until you have reported all three.
```

If any of those files is missing, stop and tell Kevin. Do not proceed.

---

## Ownership

Kevin Ritter, CEO, CareInMotion. Internal sales-ops tool. Not customer-facing.

---

## Stack (locked — do not deviate without explicit approval)

- **Frontend:** Next.js 14 App Router, TypeScript strict (no `any`, no suppressed errors)
- **Styling:** Tailwind CSS + CSS variables, tokens from `/src/styles/tokens.ts`
- **State:** `@tanstack/react-query` v5, TTLs only from `/src/lib/queryConfig.ts`
- **Forms:** `react-hook-form` + Zod
- **Validation:** Zod schemas shared between client and server (single source of truth)
- **Auth:** NextAuth v5 with Azure AD / Entra ID provider (SSO only, no passwords)
- **AI:** `@anthropic-ai/sdk` direct from Next.js API routes, model `claude-sonnet-4-6`
- **Data:** Databricks SQL Connector → Unity Catalog (`sales.*` schemas)
- **Migrations:** Versioned SQL files in `/migrations/versions/` run by CI (no Alembic — see `docs/MIGRATIONS.md`)
- **Charts:** `recharts`, lazy-loaded via `next/dynamic`
- **Tables:** `@tanstack/react-table` v8
- **PDF:** `@react-pdf/renderer` for proposal export (separate component tree from HTML preview)
- **Observability:** Sentry + structured JSON logs with request ID on every line
- **Feature flags:** `sales.core.features` table + `useFeature()` hook
- **Testing:** Playwright for 5 critical flows, Vitest for unit/component (no cap)
- **Component lib:** Storybook 8 — every primitive documented before first use
- **Hosting:** Azure Container Apps (frontend only — no backend container)
- **Secrets:** Azure Key Vault (no `.env.local` in production)

---

## Non-negotiable rules

1. All DB access through `executeQuery()` from `/src/lib/db.ts`. Never raw SQL inline.
2. All auth through `getSessionUser()` or `requireAuth()` from `/src/lib/auth.ts`.
3. All cache TTLs from `CACHE.*` in `/src/lib/queryConfig.ts`. Never hardcode `staleTime` or `gcTime` in components.
4. No inline hex values in any `.tsx` or `.ts` file under `/src/components/`. Tokens only. Enforced by ESLint.
5. No `sales.app.*` references in application code, except for the explicitly allowlisted tables during their migration phase (see `docs/ARCHITECTURE.md` § Schema inventory).
6. All public API routes validate request bodies with Zod schemas from `/src/schemas/`.
7. Every log line includes a request ID. Middleware attaches one; logger reads it from context.
8. A Storybook story exists before a new primitive is used in a page.
9. A Playwright test exists before a critical flow is considered shipped.
10. Feature flags via `useFeature()` — no commented-out code for in-progress work.
11. Table and view names come from constants in `/src/lib/db.ts` — never hardcode schema strings in route files.
12. Never interpolate user input into SQL. Use parameterized queries via `executeQuery()`.
13. All AI calls go through `/src/lib/anthropic.ts` wrapper. No direct SDK imports in route files.
14. Query duration logged on every `executeQuery()` call. Slow queries (>2s) alert via Sentry.

---

## Where things live

- **Style guide:** `/docs/STYLE_GUIDE.md` — minimalist Linear/Vercel aesthetic.
- **Architecture decisions:** `/docs/ARCHITECTURE.md` — rationale for every stack choice, full schema inventory.
- **Migration workflow:** `/docs/MIGRATIONS.md` — versioned SQL files, CI runner, rollback procedure.
- **Wave 1 cleanup:** `/docs/WAVE_1_CLEANUP.md` — one-time pre-Phase-1 schema cleanup (5 migrations).
- **Schema reference:** `/docs/SCHEMA.md` — regenerated from `DESCRIBE TABLE` output in Phase 3. Never trust memory; check here.
- **Gotchas:** `/docs/GOTCHAS.md` — running list of hard-won lessons. Appended at the end of every session.
- **Progress:** `/PROGRESS.md` — current phase, in-flight work, top 3 queued items.
- **Full plan:** `/docs/REBUILD_PLAN.md` — phased build order, exit criteria per phase.
- **Deferred:** `/docs/DEFERRED.md` — features explicitly not being built now, with revisit conditions.

---

## First-response rule (for Claude Code)

When Kevin describes a task, the first response must:

1. Restate the task in two sentences.
2. List the files that will change.
3. List the DB tables involved.
4. Flag risks or gotchas (check `/docs/GOTCHAS.md`).
5. Ask at most one clarifying question, only if needed.

Do not start producing code or files in the first response. Confirm the plan first.

---

## Pre-flight checklist (before every feature or bug fix)

- [ ] Which phase does this belong to? (Check `PROGRESS.md`.)
- [ ] Which DB tables? Cross-check `/docs/SCHEMA.md`.
- [ ] Any relevant entries in `/docs/GOTCHAS.md`?
- [ ] `cat` every file that will change. Report what's there before editing.
- [ ] Correct cache TTL? (From `queryConfig.ts` — never guess.)
- [ ] Auth guard present in every API route?
- [ ] Zod schema covers the request body?
- [ ] Replace vs. patch? (>40% of lines change → replace; ≤5 locations → patch.)

---

## Session end protocol

Before ending any Claude Code session:

1. Run `npm run typecheck`, `npm run lint`, `npm run build`. All zero errors.
2. Commit with a descriptive message.
3. Update `PROGRESS.md` — move completed items to "Completed," update top 3 queued.
4. If a new gotcha was discovered, append it to `/docs/GOTCHAS.md`.
5. If a new DB table was queried, verify its entry in `/docs/SCHEMA.md` is current.
6. Push to `main`. Report the commit hash.

---

## When in doubt

Stop and ask Kevin before inventing a pattern. Consistency beats cleverness.
