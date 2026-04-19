# Deferred — AIM v2

**Last updated:** 2026-04-19 (light mode added — dark indigo pivot deferred light)

Features and ideas that came up during v2 planning but were explicitly deferred to protect scope. These are not forgotten — they're parked.

**Rule:** If it's not on this list or in `PROGRESS.md`, it doesn't exist. No mental backlog.

**Review cadence:** At the end of each phase, look at this list and decide if anything has become urgent. If so, move it into `PROGRESS.md` as a queued item. Otherwise, leave it here.

---

## Deferred from initial planning

### Light mode

**Status:** Dark-only at Phase 2. The token system in `docs/STYLE_GUIDE.md` §2 and `src/app/globals.css` is dark-first; no `@media (prefers-color-scheme: light)`, no `.light` class, no inverted palette shim.

**Why deferred:** The Phase 2 dark-indigo pivot (2026-04-19) replaced the CareInMotion periwinkle/coral mode-aware palette with a single indigo-on-near-black system. Keeping the old light mode would have required maintaining a translation layer between the two aesthetics — a week of work that buys nothing for internal desk users. External demos on projectors were the original argument for light mode; those are not happening before Phase 6 (Proposals) at earliest.

**When to revisit:** Any of:
- An external demo is scheduled and the projector washes out `#08080B` background.
- Accessibility review flags dark-only as a blocker for a specific user.
- v2.1 scope reopens for theming (unlikely before late 2026).

When it returns, the light palette will be re-derived from the current dark tokens (not restored from the periwinkle/coral set — that palette is gone).

**Rough estimate:** 1 session to derive the light palette, wire a toggle, and audit every primitive against it.

---

### Knowledge Base UI

**Status:** Scaffolded with real content. `sales.app.kb_*` tables contain 18 articles, 7 categories, 16 assets, plus search history and feedback (confirmed in 2026-04-18 audit).

**Why deferred:** Not on the revenue path. Pricing → Opportunity → Proposal → Close ships first. The content exists but was never surfaced in v1's UI. v2 ships without a KB viewer and revisits at Phase 7.

**When to revisit:** At Phase 6 exit, decide whether to add a minimal read-only KB viewer in Phase 7 or defer further. Options:
- **Option A:** Phase 7 read-only viewer — list articles by category, render article body, show related assets. No write path, no search. Probably ~1 session.
- **Option B:** Defer further to v2.1. Build a richer KB with write path, search, embedded in Notepad and Proposal builder.

**Rough estimate:** Option A is 1 session. Option B is 2–3 sessions.

---

### `partner_contracts` integration into Pricing Agent

**Status:** Table exists at `sales.pricing.partner_contracts` with 6 live rows. v1 Pricing Agent didn't consume it — COGS came from seed files.

**Why deferred:** Phase 4 ships on v1's working logic (seed-file COGS). Integrating `partner_contracts` is a scope increase that deserves its own pass once the Pricing Agent is otherwise stable.

**When to revisit:** Phase 4.5 (between Phase 4 and Phase 5), or as a standalone mini-phase after Phase 10 ships.

**Rough estimate:** 0.5–1 session.

---

### Salesforce sync deep integration

**Status:** A Databricks job writes to `sales.integration.*` (5 tables). v1 didn't read these. v2 has open questions about overlap with `sales.core.accounts`.

**Why deferred:** Answers require talking to the owner of the Salesforce sync job before scoping work. Phase 5 (Opportunities) can ship reading only from `sales.core.*` if the Salesforce decision is deferred.

**When to revisit:** Phase 5 planning. Kevin identifies the sync job owner, confirms overlap, decides whether v2 reads from `sf_accounts_curated` or `sales.core.accounts` or both.

**Rough estimate:** 0.5–2 sessions depending on decision.

---

### Real-time collaboration

**Why deferred:** Internal tool, single-user workflows dominate. WebSocket complexity not justified.

**When to revisit:** If the sales team grows beyond 10 active users and collision becomes real.

---

### Mobile app

**Why deferred:** Responsive web covers mobile use cases for a sales tool.

**When to revisit:** Only if specific mobile workflows emerge (field sales, expense capture).

---

### Multi-tenant architecture

**Why deferred:** Single tenant (CareInMotion internal) is correct.

**When to revisit:** If AIM ever becomes a product sold externally.

---

### i18n / localization

**Why deferred:** US English only for internal tool.

**When to revisit:** Only if CareInMotion operations expand internationally in a way that requires it.

---

### Vector search / semantic search on KB

**Why deferred:** Depends on KB being exposed first, and on whether 18 articles justifies semantic search (probably not).

**When to revisit:** If KB content grows past ~200 articles.

---

### AI voice input on Notepad

**Why deferred:** Cool feature, not load-bearing.

**When to revisit:** If the sales team asks for it unprompted.

---

### Public API for external integrations

**Why deferred:** Internal tool, no external consumers.

**When to revisit:** Only if a specific integration forces it.

---

### Offline mode

**Why deferred:** Always-online is fine for a sales tool on laptops.

**When to revisit:** Probably never.

---

### Storybook Chromatic visual regression

**Why deferred:** Storybook + Playwright covers enough for a single-developer rebuild. Chromatic is valuable when a design team reviews PRs.

**When to revisit:** When the team grows past Kevin as sole reviewer.

---

### Email tracking / open-rate analytics on sent proposals

**Why deferred:** Phase 6 sends proposals. Tracking opens and clicks requires tracking-pixel infrastructure and adds privacy concerns.

**When to revisit:** After Phase 6 ships and usage data shows it's worth the complexity.

---

## How to add to this list

When scope creep happens mid-session:

1. Note the idea here in one paragraph.
2. Mark **why** it's deferred (not just "not now").
3. Mark **when** to revisit (a phase, a condition, or "probably never").
4. Return to the current phase work.

If an item has been on this list through 3 phase transitions and never got promoted, it probably doesn't matter. Delete it.
