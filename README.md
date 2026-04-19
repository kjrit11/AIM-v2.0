# AIM Sales Command Center — v2

**Repo:** `kjrit11/Aim-v2.0`
**Owner:** Kevin Ritter, CareInMotion
**Status:** Rebuild in progress (Phase 0).

v1 lives at `kjrit11/SalesCommandCenter` and stays running on its current Azure Container App until Phase 10 hard cutover. No changes to v1 unless truly critical.

---

## What this is

AIM (AlignInMotion) Sales Command Center is an internal sales-ops tool for CareInMotion. It sells and operates CareIntelligence — a Databricks-native healthcare data intelligence platform.

This is v2 — a clean rebuild in a fresh repo. See `/docs/REBUILD_PLAN.md` for why we're rebuilding and the phased plan.

---

## Getting started

### Prerequisites

- Node.js 20 or later
- Access to the CareInMotion Databricks workspace
- Azure AD / Entra ID account in the CareInMotion tenant

### First-time setup

1. Clone the repo:
   ```bash
   git clone https://github.com/kjrit11/Aim-v2.0.git
   cd Aim-v2.0
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` and fill in required values.

4. Verify the build passes:
   ```bash
   npm run typecheck
   npm run lint
   npm run build
   ```

5. Run the dev server:
   ```bash
   npm run dev
   ```

---

## Daily workflow

### Starting a new Claude Code session

Every session must begin with the opener from `CLAUDE.md`:

```
Read CLAUDE.md, docs/ARCHITECTURE.md, docs/STYLE_GUIDE.md, and docs/GOTCHAS.md
in that order. Then report:
  1. The current phase of the rebuild (from PROGRESS.md)
  2. The top 3 open items in PROGRESS.md
  3. Which files you will touch to address item #1

Do not write any code until you have reported all three.
```

### Ending a session

See `CLAUDE.md` § "Session end protocol."

---

## Key documents

| File | Purpose |
|---|---|
| `CLAUDE.md` | Governance, rules, session protocol. Read first every session. |
| `PROGRESS.md` | Current phase, in-flight work, top 3 queued items. |
| `docs/ARCHITECTURE.md` | Stack decisions and rationale. Full schema inventory. |
| `docs/STYLE_GUIDE.md` | Minimalist visual design spec. Single source of truth. |
| `docs/REBUILD_PLAN.md` | Full phased plan with exit criteria. |
| `docs/WAVE_1_CLEANUP.md` | One-time pre-Phase-1 schema cleanup (5 migrations). |
| `docs/MIGRATIONS.md` | Versioned SQL migrations workflow. |
| `docs/SCHEMA.md` | DB table reference, regenerated from `DESCRIBE TABLE`. |
| `docs/GOTCHAS.md` | Running list of hard-won lessons. Appended each session. |
| `docs/DEFERRED.md` | Features explicitly not being built, with revisit conditions. |
| `docs/AUTH.md` | Entra ID SSO setup (added in Phase 2). |
| `docs/DEPLOYMENT.md` | Azure Container Apps deploy flow (added in Phase 10). |

---

## Repo + cutover strategy

- **`kjrit11/SalesCommandCenter`** — v1, on its current Container App. Stays untouched until Phase 10. Read-only Databricks token recommended at end of Phase 5 to prevent accidental writes.
- **`kjrit11/Aim-v2.0`** (this repo) — v2 development. Lands on its own Container App at Phase 10 deploy.

**Phase 10 hard cutover:**
1. v1 Container App stops accepting writes (token revoked earlier).
2. Wave 4 migrations run against prod catalog (drop backwards-compat views, drop remaining legacy tables).
3. DNS / Container App traffic flips from v1 to v2.
4. v1 Container App stopped (not deleted) for 7 days as recovery buffer.
5. After 7 days: v1 Container App deleted, v1 repo archived on GitHub.

See `/docs/REBUILD_PLAN.md` § Phase 10 for the full cutover runbook.

---

## Schema cleanup timeline

Four waves of migrations:

- **Wave 1** (before Phase 1): 5 migrations — tracking + features tables, drop stale/empty duplicates. v1 unaffected. See `docs/WAVE_1_CLEANUP.md`.
- **Wave 2** (Phase 3): rename `deals` → `opportunities` with view facade; migrate `prospects` → `leads` with view facade. v1 keeps working via views.
- **Wave 3** (Phase 6): migrate `sales.app.proposals` + satellites to `sales.core.*` with view facade.
- **Wave 4** (Phase 10): drop all backwards-compat views, drop remaining `sales.app.*` legacy tables, drop `password_hash` column. v1 breaks (intentional).

---

## Commands

```bash
npm run dev           # Dev server, localhost:3000
npm run build         # Production build
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
npm run format        # Prettier write
npm run storybook     # Storybook dev server (Phase 1+)
npm run test          # Vitest (Phase 1+)
npm run test:e2e      # Playwright (Phase 9+)
npm run migrate:dev   # Run pending migrations against sales_dev (Phase 3+)
npm run migrate:prod  # Run pending migrations against sales.* — CI only (Phase 3+)
```

---

## Support

Questions, blockers, scope changes: talk to Kevin. Do not improvise around the plan.
