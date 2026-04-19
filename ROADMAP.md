# AIM v2 — Additions & Improvements

Items to add on the rebuild that were missing or fragile in v1.
Each is scoped with acceptance criteria and a rough session estimate.

---

## 1. Observability from day one
**Session: 0.5** | **Phase: 3**

**Why:** You've been debugging blind. Errors in production silently disappeared unless a user reported them.

**Scope:**
- Sentry for both client and server errors
- Structured JSON logs with a request ID on every line
- A `/src/lib/logger.ts` wrapper: `log.info()`, `log.warn()`, `log.error()` — all emit JSON with `{ request_id, user_id, route, level, message, ...context }`
- Middleware attaches a fresh UUID as `request_id` to every incoming request
- Azure Log Analytics workspace for log retention (30 days)

**Acceptance:**
- Trigger a deliberate error in dev. See it in Sentry within 30 seconds.
- Run a query against a slow endpoint. Every log line from that request shares a request ID.
- View 24h of logs in Azure Log Analytics.

---

## 2. Migrations as code (Alembic)
**Session: 1** | **Phase: 3**

**Why:** Loose SQL files with gaps (001–013, missing 011) were unversioned, unreversible, and conflict-prone.

**Scope:**
- Alembic installed and configured to point at Databricks via SQL Connector
- Baseline migration captures the current state of `sales.core.*` and `sales.pricing.*` as "already-applied"
- New migrations live in `/migrations/versions/` with timestamp-based filenames
- GitHub Actions job `migrate.yml` runs `alembic upgrade head` on merge to main
- Rollback procedure documented in `/docs/MIGRATIONS.md`

**Acceptance:**
- `alembic current` shows baseline on a fresh clone
- A test migration adds a column, `upgrade head` applies it, `downgrade -1` reverses it
- CI job runs the migration on merge, fails loudly if it errors

**Note:** Alembic against Databricks requires the SQLAlchemy Databricks dialect. Install `databricks-sqlalchemy`.

---

## 3. Feature flags
**Session: 0.5** | **Phase: 9**

**Why:** Branch chaos. Half-built features either got commented out or blocked merges.

**Scope:**
- `sales.core.features` table: `key`, `enabled`, `rollout_pct`, `description`, `updated_at`
- `/src/lib/features.ts` with `useFeature('key')` hook (React) and `getFeature('key', user)` (server)
- Seeded flags: `demo_mode`, `verbose_logging`, `proposal_v2`, `ai_task_extraction`
- Admin page at `/settings/features` (gated to Kevin) to flip flags live
- Cache: `CACHE.FEATURES` — 5 min TTL

**Acceptance:**
- Wrap a new button in `useFeature('demo_mode')` — toggle the DB row, button appears/disappears within 5 minutes (or immediately on refetch)
- Admin page lists all flags with toggles

---

## 4. Test harness (Playwright, 5 flows)
**Session: 1** | **Phase: 9**

**Why:** You've rebuilt Notepad and Overview multiple times because regressions kept breaking them. One test per critical path would've caught most of these.

**Scope — 5 flows only:**
1. `login.spec.ts` — Entra ID login, land on overview
2. `pricing-calculator.spec.ts` — Select segment, enter volume, apply discount, see total matches expected
3. `create-opportunity.spec.ts` — New opp, attach pricing quote, save, verify in list
4. `generate-proposal.spec.ts` — From opp, generate proposal, export PDF, verify PDF contains opp name
5. `notepad-ai-summary.spec.ts` — Paste text, click Summarize, wait for response, verify summary + tasks appear

**Acceptance:**
- `npm run test:e2e` runs all 5 green in CI
- Each test runs in under 30s
- CI blocks merge to main on failure

**Rule:** Never add a 6th Playwright test without explicit discussion. Five is the ceiling. Additional coverage goes in unit tests (Vitest).

---

## 5. Component library + Storybook
**Session: 1–2** | **Phase: 1**

**Why:** You never had a design system. Every page was a snowflake. The new style guide is only real if it's enforced.

**Scope:**
- Storybook 8 with Vite builder
- Stories for every primitive: Button, Input, Textarea, Select, Checkbox, Radio, Card, Dialog, Dropdown, Toast, Tooltip, Tabs, Badge, Avatar, Skeleton, Table
- Each story includes: Default, Variants, Disabled, Loading (if applicable), Dark mode preview
- Chromatic or Netlify preview deploy for design review

**Acceptance:**
- `npm run storybook` runs locally
- Every primitive in `/src/components/primitives/` has at least one story
- Pull requests include screenshot diffs if Chromatic is wired

---

## 6. Design tokens as TypeScript
**Session: 0.25** | **Phase: 1**

**Why:** Inline hex values scattered across 400+ files in v1. Impossible to rebrand.

**Scope:**
- `/src/styles/tokens.ts` exports every color, space, radius, shadow, motion value as named constants
- `tailwind.config.ts` imports from tokens — no duplicate values in Tailwind config
- CSS variables in `globals.css` generated from tokens
- ESLint rule blocks hex values in `.tsx` files: `no-restricted-syntax` with regex `/#[0-9a-fA-F]{3,8}/`

**Acceptance:**
- Grep for hex values in `/src/components/` returns zero results
- Changing `accent.500` in tokens.ts changes every accent color in the app

---

## 7. AI agent pattern — one way to do it
**Session: 0.5** | **Phase: 4**

**Why:** v1 mixed patterns across Pricing Agent, Notepad Agent, Deal Coach. No convention.

**Scope:**
- `/src/lib/anthropic.ts` — single client with retry + timeout
- `/src/lib/agents/` directory — one file per agent
- Pattern for each agent:
  ```typescript
  export async function runPricingAgent(input: PricingAgentInput): Promise<PricingAgentOutput> {
    // 1. Validate input with Zod
    // 2. Build prompt from structured template
    // 3. Call anthropic.messages.create with tool definitions
    // 4. Parse output with Zod
    // 5. Log with request_id
    // 6. Return typed output
  }
  ```
- No LangGraph, no LangChain. Direct Claude SDK.
- Model always `claude-sonnet-4-6` (or current Sonnet — read from env var `ANTHROPIC_MODEL`)

**Acceptance:**
- Two agents share the same file structure
- A new agent can be added in under 100 lines
- All agent calls visible in a single Sentry breadcrumb view

---

## 8. Zod schemas as the single source of truth
**Session: 0.5** | **Phase: 3**

**Why:** "Why is this undefined?" bugs. Types didn't match DB columns didn't match API responses didn't match form state.

**Scope:**
- `/src/schemas/` directory: one file per domain (pricing, proposal, opportunity, lead, account, user, note)
- Each Zod schema exports both the schema and the inferred TypeScript type
- API routes validate request body with Zod on every POST/PUT/PATCH
- Forms use `react-hook-form` with `zodResolver`
- DB query results cast through `schema.parse()` — loud failures beat silent bad data

**Acceptance:**
- One type per entity, imported everywhere
- Attempting to POST an invalid body returns 400 with field-level errors
- `schema.parse()` failure in a DB query logs to Sentry with the offending row

---

## 9. Environment parity (real Databricks in dev)
**Session: 0.5** | **Phase: 3**

**Why:** "Works locally, breaks in Azure" killed multiple sessions.

**Scope:**
- Local `.env.local` uses a read-only Databricks SQL warehouse token
- A `dev` catalog (`sales_dev.*`) mirrors `sales.*` schemas with safe-to-write data
- Write operations in `NODE_ENV=development` target `sales_dev.*`
- Production uses `sales.*` with a separate token
- Document in `/docs/ENVIRONMENTS.md`

**Acceptance:**
- Kevin can run `npm run dev` and hit real Databricks data immediately
- Running a migration in dev doesn't touch prod
- Switching environments is one env var change

---

## 10. Demo mode
**Session: 1** | **Phase: 9**

**Why:** AIM is a sales tool. You will demo it. You need a toggle that shows a compelling dataset without exposing real deals.

**Scope:**
- Feature flag `demo_mode: true` swaps the active dataset
- Seed script `/scripts/seed-demo.ts` creates:
  - 8 accounts (mix of HP, ACO, HS, physician groups)
  - 20 opportunities across stages
  - 40 leads
  - 15 notes with AI summaries
  - 5 proposals in various states
  - Realistic names, amounts, dates clustered around "now"
- Demo data lives in `sales_demo.*` schema
- When `demo_mode = true`, `executeQuery()` routes to `sales_demo.*`
- Toggle in `/settings/features` behind admin gate

**Acceptance:**
- Flip `demo_mode` on → refresh → see demo dataset
- Flip off → see real data
- Demo data is internally consistent (proposal amounts match opportunity amounts, etc.)

---

## 11. Auth upgrade (SSO via Entra ID)
**Session: 1** | **Phase: 2**

**Why:** v1 used bcrypt-hashed passwords in `sales.core.users`. Not terrible, but: one more thing to manage, no MFA, no group-based access, not how CareInMotion does the rest of its internal apps.

**Scope:**
- Azure AD / Entra ID app registration
- NextAuth v5 with Azure AD provider
- Session cookie: HTTP-only, secure, SameSite=Lax
- `users` table still exists but only stores profile + role (no password)
- On first login, auto-provision user row from Entra claims
- Role mapping: Entra group → AIM role (`admin`, `sales`, `viewer`)

**Acceptance:**
- Kevin logs in with his CareInMotion Entra account — no password prompt on AIM
- New hires added to the `aim-sales` Entra group can log in immediately
- Removing a user from the group revokes access on next session refresh

---

## 12. Key Vault for all secrets
**Session: 0.5** | **Phase: 10**

**Why:** `.env.local` in production is a footgun.

**Scope:**
- Azure Key Vault `kv-aim-v2` (or existing `kv-salescommandcenter` renamed)
- Secrets: `DATABRICKS_TOKEN`, `ANTHROPIC_API_KEY`, `NEXTAUTH_SECRET`, `SENTRY_DSN`, `ENTRA_CLIENT_SECRET`, `RESEND_API_KEY`
- Container App references secrets via managed identity
- Local dev still uses `.env.local` but `.env.example` documents every required var
- Key rotation runbook in `/docs/SECRETS.md`

**Acceptance:**
- `.env.local` does not exist in production
- `az keyvault secret list --vault-name kv-aim-v2` shows all 6 secrets
- Rotating a secret does not require a redeploy (Key Vault reference resolution happens at container start)

---

## 13. Rate limiting on API routes
**Session: 0.25** | **Phase: 9**

**Why:** No protection against runaway clients or accidental loops. AI routes are expensive.

**Scope:**
- `@upstash/ratelimit` or equivalent (in-memory is fine for single instance)
- Rules:
  - AI routes: 30 req / 5 min per user
  - Mutation routes: 60 req / min per user
  - Read routes: unlimited
- 429 response with `Retry-After` header

**Acceptance:**
- Load-test an AI route with 50 rapid requests. See 429 after the 30th.
- Regular UI usage never hits the limit.

---

## 14. PDF generation in-app (for proposals)
**Session: 1** | **Phase: 6**

**Why:** You chose in-app PDF over Canva. The implementation matters — `@react-pdf/renderer` is the path of least resistance for matching the HTML preview.

**Scope:**
- `@react-pdf/renderer` — renders React components to PDF on the server
- Proposal template as a single React component, rendered to both HTML (for preview) and PDF (for export) from the same source
- Fonts: embed Geist (sans) + Geist Mono as base64 for consistent rendering
- Page numbers, headers/footers, table of contents
- CareIntelligence logo in header
- Download served from `/api/proposals/[id]/pdf`

**Acceptance:**
- Generated PDF matches HTML preview visually within reason
- PDF includes pricing snapshot exactly as stored at generation time
- File size under 2MB for a typical 10-page proposal
- Opens cleanly in Preview, Adobe, and Chrome PDF viewer

---

## 15. Progress tracking discipline (PROGRESS.md)
**Session: ongoing** | **Phase: every**

**Why:** v1 had a session-end summary in chat that disappeared. No persistent record of what shipped vs what's next.

**Scope:**
- `PROGRESS.md` at repo root
- Structure:
  ```markdown
  # AIM v2 Progress

  ## Current phase: [N]

  ## Completed
  - [date] Phase X shipped. See commit abc123.

  ## In flight
  - [item] — started [date], blocked on [thing]

  ## Queued (next 3)
  1. ...
  2. ...
  3. ...

  ## Deferred
  - [item] — reason, revisit when
  ```
- Updated at the end of every Claude Code session as part of the exit checklist

**Acceptance:**
- Every session ends with a PROGRESS.md commit
- Starting a new session, Claude Code reads PROGRESS.md first and reports top 3 queued items

---

## Summary — total net-new work

| # | Item | Sessions | Phase |
|---|---|---|---|
| 1 | Observability | 0.5 | 3 |
| 2 | Alembic migrations | 1 | 3 |
| 3 | Feature flags | 0.5 | 9 |
| 4 | Playwright (5 flows) | 1 | 9 |
| 5 | Storybook | 1–2 | 1 |
| 6 | Design tokens | 0.25 | 1 |
| 7 | AI agent pattern | 0.5 | 4 |
| 8 | Zod schemas | 0.5 | 3 |
| 9 | Env parity | 0.5 | 3 |
| 10 | Demo mode | 1 | 9 |
| 11 | SSO (Entra) | 1 | 2 |
| 12 | Key Vault | 0.5 | 10 |
| 13 | Rate limiting | 0.25 | 9 |
| 14 | PDF generation | 1 | 6 |
| 15 | PROGRESS.md | ongoing | every |

**Total net-new: ~9.5 sessions**, fully absorbed into the phased plan — not stacked on top.

---

## What to skip for now (tempting but not worth it)

- ❌ Multi-tenant architecture — single tenant (CareInMotion internal) is correct for now
- ❌ Real-time collaboration (WebSockets) — not needed, adds complexity
- ❌ Mobile app — responsive web is enough
- ❌ Offline mode — everything is online-only, that's fine
- ❌ i18n — English only, US-only
- ❌ Public API — internal tool, no external consumers
- ❌ AI voice input on Notepad — cool but not load-bearing
- ❌ Vector search on Knowledge Base — defer until there's actual KB content volume (>500 docs)

Each of these is a legitimate idea and each would add weeks. Say no now, revisit in 6 months.
