# Pricing Agent — Product Spec

**Status:** Sections 1–7, 9, 10 locked. Section 8 (UI + interaction) deferred to Pass 3.
**Last updated:** 2026-04-18
**Phase:** Phase 4 (main build) of REBUILD_PLAN.md; Phase 4.5 reserved for `partner_contracts` integration if needed
**Supersedes:** v1 Pricing Agent at `/agents/pricing` (see § 4 Migration from v1)

---

## 1. Purpose

The Pricing Agent is where Kevin (and future CEO-level sellers at CareInMotion) build quotes for specific opportunities. It computes list price, applies discount, breaks down COGS, enforces margin floor, and generates an AI narrative explaining the quote. The output feeds the Proposal Generator (Phase 6) as a frozen `pricing_snapshot_json`.

The Pricing Agent is **consultative, not self-service.** It's for a seller who understands margin, unit economics, and the pricing curve — not a tool that hides complexity for an untrained user. Density and precision beat simplicity. Keyboard shortcuts are welcome. Reasoning about trade-offs ("what happens to margin if I discount 18% on a mid-band HIE?") is the primary job.

Every quote is **deal-scoped.** The Pricing Agent opens in the context of a specific opportunity, auto-populates segment and band from that deal's fields, and writes quotes back to `sales.pricing.quotes` linked via `sales.pricing.deal_quotes`. A standalone "explore" mode is out of scope for v2 — if Kevin wants to scratch out hypotheticals, he does it inside an opportunity.

---

## 2. Primary user + jobs-to-be-done

### Primary user

**Kevin Ritter, CEO of CareInMotion** — single primary user today. Kevin sees CareIntelligence pricing every day, knows the segments by heart, understands which modules carry margin and which are loss leaders, and makes discount decisions that affect company margin.

Kevin's mental model of the tool: "I'm negotiating. I need to see the quote, the margin, the COGS breakdown, the approval zone, and the narrative — all at once, on one screen, fast enough that I can answer a client's question live."

### Secondary users (near-term, not hypothetical)

- **Other AIM Executives** (if any — there's zero today; Kevin is the only one). Same visibility as Kevin, including the margin-floor approval queue.
- **AIM Sales sellers** (when the team grows): same visibility, but cannot self-approve below-floor quotes — those go to Kevin's approval queue.
- **AIM Viewers**: cannot see Pricing Agent at all. Hidden from left nav, any URL attempt 403s.
- **AIM Admins**: see everything sellers see. Can edit pricing config via Databricks (not the AIM UI in v2).

### Jobs-to-be-done, in priority order

1. **"I'm on a call with a client and they asked for a quote for 3 HIE segments with the Policy Agent module — I need a quote in the next 60 seconds, including COGS and margin."** The core JTBD. Fast price-to-quote loop. No page-refreshes, no modals, no loading spinners over 500ms.
2. **"I negotiated a 22% discount with this client, and I need to see immediately whether that's above or below the margin floor, and whether I'm triggering a review."** Real-time margin feedback as inputs change.
3. **"The buyer said our Policy Agent module is overpriced — let me pull up the COGS breakdown to see how close we are to floor on that module alone."** Per-module cost transparency for negotiation.
4. **"I just saved version 4 of this quote. The buyer wants me to walk them through what changed from version 3."** Versioning + diff visibility.
5. **"I need to generate an AI narrative explaining the pricing rationale that I can paste into an email or a proposal."** AI narrative, same pattern as v1.
6. **"One of my sellers (future) just submitted a quote below floor. I need to review and approve or reject with a reason."** Approval inbox — initially with one user in queue, eventually a recurring workflow.

### Explicit non-jobs

- **Training a new seller.** If you don't already understand healthcare-segment pricing, this tool doesn't teach you. No tooltips explaining "what is PMPM," no walkthroughs.
- **Buyer-facing pricing display.** Buyers never see the Pricing Agent. They see proposal output (Phase 6), which renders the frozen snapshot with margin/COGS stripped.
- **Ad-hoc hypothetical quotes** not tied to an opportunity. v2 Pricing Agent is deal-scoped. If Kevin wants to model a hypothetical, he creates a sandbox opportunity.
- **Per-deal pricing access control via `deal_users.pricing_visibility`.** Decided: access is role-based only. `pricing_visibility` gates downstream proposal rendering, not the Pricing Agent itself.
- **Bulk quote generation** (e.g., "generate 50 quotes for a pipeline review"). One deal, one quote, one Pricing Agent session.

---

## 3. Scope

### 3.1 In scope (Phase 4)

#### Quote construction
- 5 segments: Payer, Health System, ACO, HIE, Community Organization (CBO)
- 20 bands per segment (varies; Payer has hp-b01 through hp-b20)
- Segment auto-populates from the opportunity's `sales.core.opportunities.segment` field
- Band auto-detects from the opportunity's volume (members for Payer PMPM, account count for others) — user can override
- Discount slider 0–40% with visible margin impact as it moves
- Module checkboxes — each module adds a line item with its own price curve and COGS
- Implementation fee: auto-computed from band per `impl_schedules`; flat dollar amount per band, not per-unit
- FHIR line items: Azure FHIR tier auto-computed from volume or selectable

#### Real-time margin math
- **Live COGS breakdown** as inputs change: platform COGS + module COGS + implementation cost
- **Gross margin floor:** 35% (enforced as soft warning, see § Margin floor below)
- **Margin displayed three ways:** absolute dollars (gross margin $), percentage (gross margin %), and a visual bar with a floor line
- **PMPM handling for Payer:** `recurringMultiplier = 12` built into the engine. Displayed rate is /member/mo; displayed annual revenue is rate × members × 12. **Never silently omit the ×12.**

#### Margin floor + approval
- Quotes below 35% margin save successfully but with `status = 'pending_review'`
- Pending review triggers an email to `PRICING_APPROVER_EMAIL` (currently Kevin's email) via Graph `Mail.Send`
- Approver UI lives at `/agents/pricing/review` — pending quotes listed with margin, discount, deal context, and [Approve] / [Reject with reason] buttons
- Approved quote → `status = 'approved'`. Rejected quote → `status = 'draft'` with the reason preserved in audit log. Seller receives notification.
- Raising margin above 35% auto-clears pending review (quote back to `'draft'`, notification to approver that it was self-resolved)

#### Versioning
- Every save creates a new row in `sales.pricing.quotes` with incremented `version`
- One `is_active = TRUE` per deal at any time; saving flips the previous active to inactive
- Version history UI on the quote page with a "what changed" diff (line-items added/removed, discount delta, margin delta)
- Proposal generation (Phase 6) pins to a specific `quote_id` — the active quote at generation time becomes the proposal's frozen snapshot. Regenerating a proposal doesn't auto-float to a newer quote.

#### AI narrative
- Button: "Generate pricing narrative"
- Prompt takes the quote data (line items, totals, discount, rationale inputs from the user) and produces a 3-5 paragraph narrative explaining the value positioning
- Narrative is saved with the quote version; regenerating creates a new narrative version (same pattern as Notes & Tasks section regeneration)
- Narrative is what feeds into the proposal — the buyer-facing pricing language comes from here

#### Deal integration
- Pricing Agent is always opened in the context of a specific opportunity
- Route shape: `/opportunities/:dealId/pricing` (deal-scoped). Also accessible as `/agents/pricing?deal=:dealId` from the left-nav "Pricing" entry for convenience.
- The left-nav "Pricing" entry opens a "Which deal?" picker if clicked without a deal context
- Saving a quote writes back to `sales.pricing.deal_quotes` linking the quote to the deal
- Opportunity page shows a "Pricing" tab with the active quote summary inline, plus a link to the full Pricing Agent

#### Data source — live DB, not seed files
- `sales.pricing.segments`, `bands`, `band_pricing`, `modules`, `module_pricing`, `module_cogs`, `impl_schedules`, `discount_schedules` are all read at runtime
- `sales.app.cogs_config`, `implementation_fee_config`, `ai_usage_config`, `azure_fhir_tier_config` — read via a unified pricing repository
- Server-side cache via `cacheOrFetch()` (key: `CACHE_KEYS.pricingConfig()`, TTL: 24h — pricing config rarely changes; admins invalidate on change via `/api/admin/cache/invalidate`)
- No in-memory seed files. No `cogs.ts`, no `bands.ts`, no `modulePricing.ts`, no `implementationFees.ts`. The v1 pattern is retired entirely.

### 3.2 Out of scope (Phase 4 MVP)

- **`partner_contracts` integration.** Deferred to Phase 4.5 — decide whether to factor partner cost pass-through into COGS after we see how Phase 4 lands.
- **Benchmark comparisons** (`sales.pricing.benchmarks` currently empty). v1's fallback to `band.base_list_price_pu` carries forward. When benchmarks get populated by an external data source, we wire it in.
- **Custom segment creation.** Segments and bands are authored in Databricks by admins. The UI cannot create new segments.
- **Standalone "explore" mode.** v2 is deal-scoped; hypotheticals go in sandbox deals.
- **Export to Excel/CSV** of the quote breakdown. v1 didn't have it; v2 doesn't add it. The PDF proposal is the export artifact.
- **Multi-currency.** USD only.
- **Per-deal pricing visibility filtering.** Access is role-based; `deal_users.pricing_visibility` governs proposal rendering only.

### 3.3 Non-goals (explicit "no" to things that would seem natural)

- **No pricing history view across deals** (e.g., "how did we price HIE-band-5 last year?"). That's a reporting concern, not a Pricing Agent concern. Admins can query Databricks directly.
- **No "suggest a price" or "recommend a discount"** AI suggestions. The narrative is a post-hoc explanation, not a decision-making tool. Kevin sets the price.
- **No margin alerts delivered via Slack / Teams / SMS.** Email via Graph is the only notification channel for approval. The Notes & Tasks notification infrastructure (bell + email) handles the in-app approval-pending state.
- **No "quote templates"** (e.g., "standard Payer discovery quote"). Every quote is built from inputs. Templates are for Proposals, not Pricing.
- **No approval delegation.** Only the email in `PRICING_APPROVER_EMAIL` can approve. If Kevin is on vacation, someone has to update the config value or Kevin approves by phone.
- **No approvals for draft quotes.** Only below-floor saved quotes enter pending review. Drafts are private until saved.

---

## 4. Migration from v1

### 4.1 What v1 did well (keep)

- **Two-pane layout** (left: inputs, right: live quote preview). Keeps.
- **Discount slider with live margin feedback.** Keeps, with improved margin bar styling per v2 style guide.
- **Module checkboxes with per-module price + COGS transparency.** Keeps.
- **AI narrative generation.** Keeps, with per-section regenerate (matching Notes & Tasks pattern).
- **Segment + band + discount as the three top-level dimensions.** Keeps.

### 4.2 What v1 did badly (replace)

1. **Seed files as the source of truth for COGS, impl fees, module pricing, band config.**
 - v1: `cogs.ts`, `bands.ts`, `modulePricing.ts`, `implementationFees.ts` held authoritative pricing data in-memory. Databricks tables (`sales.pricing.module_cogs`, `sales.app.cogs_config`, `sales.pricing.impl_schedules`) existed but were reference-only.
 - Problem: manual sync. When Databricks values change, seed files must be updated in code and deployed. No auto-sync mechanism. Explicit sync risk documented in v1 CLAUDE.md §21.
 - v2: live Databricks queries via a pricing repository, cached server-side. Single source of truth is the DB. Seed files deleted. Admins update pricing by updating the DB; cache invalidates via admin endpoint or expires in 24h.

2. **Segment key fragmentation.**
 - v1: DB returns short codes (`payer`, `hs`, `aco`, `hie`, `cbo`), seed files use display names (`Payer`, `Health System`, etc.). A `normalizeSegmentKey()` helper in `pricingService.ts` maps 9 variants → 5 display names.
 - Problem: silent failures. Passing a raw DB key to the seed-file lookup threw at runtime or returned $0 COGS. Fixed in v1 2026-04-08 but the fix is fragile — add a new segment variant and it breaks again.
 - v2: segment keys are **short codes throughout**. The DB canonical form wins. UI displays a label resolved via a separate mapping table (`segments.display_name`) which is also DB-sourced. No normalization layer needed; one representation everywhere.

3. **Payer annual revenue silent-multiplier bug.**
 - v1: Payer is PMPM-priced, so annual revenue requires ×12. Bug: the metric-suffix lookup key in `page.tsx` had to be `"payer"` (not `"health_plan"`, an old alias) or `recurringMultiplier` wouldn't resolve and the ×12 silently failed. Fixed 2026-04-07 in commit 4124b03.
 - Problem: two-way coupling between a UI string and an engine lookup, with silent failure on mismatch.
 - v2: `recurringMultiplier` lives on the `segments` row in Databricks (or in a config row), read with the segment. The engine computes annual revenue unconditionally — `annual = rate × units × segment.recurring_multiplier`. No separate lookup, no string matching.

4. **Payer band 5-20 extrapolation.**
 - v1: `sales.pricing.impl_schedules` defines Payer implementation fees for bands 1-4 only. Bands 5-20 were extrapolated in `implementationFees.ts` by following the v1-derived curve.
 - Problem: extrapolated values aren't authoritative. If Databricks adds bands 5-20 with different values, we don't know without checking.
 - v2: the engine queries `impl_schedules` directly. If bands 5-20 aren't in the DB, the quote page shows an error: "Implementation fee not defined for this band — add to sales.pricing.impl_schedules." Forces the DB to be complete; no silent extrapolation.

5. **No server-side cache for pricing config.**
 - v1: 5-minute client-side cache in `pricingQuoteStore.ts`. Server-side cache PENDING forever (Track B-4 P4).
 - Problem: every cold React Query miss hit Databricks. Warehouse cold-start on a fresh page load. v1 flagged this as ongoing latency pain.
 - v2: `cacheOrFetch(CACHE_KEYS.pricingConfig(), CACHE_TTL.PRICING_24H, fetchPricingConfig)` in the repository. Config loaded once per 24h, serves all users.

6. **No quote versioning.**
 - v1: `sales.pricing.quotes` exists but v1 overwrote on save. No audit trail of pricing changes.
 - Problem: when Kevin discovered a margin discrepancy post-close, there was no way to reconstruct what the quote looked like at each step.
 - v2: every save is a new version row. Immutable history. Downstream proposals pin to a specific `quote_id`.

7. **Margin floor displayed but not enforced.**
 - v1: 35% margin floor shown in the UI but didn't block, flag, or notify. A seller could save a 10% margin quote and nothing would happen.
 - Problem: policy-without-teeth.
 - v2: below-floor quotes enter `pending_review`, email Kevin, block proposal generation until resolved. Policy has teeth; user experience stays soft (no hard block on save).

### 4.3 What's new in v2 (v1 did not have)

- **Quote versioning + active-version tracking** (`quotes.version`, `quotes.is_active`, `deal_quotes` linking to specific versions)
- **Margin-floor approval workflow** (`quotes.status` enum with `pending_review`)
- **Server-side pricing config cache**
- **Approval email to `PRICING_APPROVER_EMAIL` via Graph `Mail.Send`**
- **Approval review page at `/agents/pricing/review`**
- **Per-section AI narrative regeneration** (pattern from Notes & Tasks)
- **Version history diff view** (pricing delta, margin delta, added/removed modules)
- **Deep integration with opportunity page** — "Pricing" tab showing active quote summary

### 4.4 Data carried forward

- `sales.pricing.*` — all tables authoritative, v1 already uses them as reference
- `sales.app.*` pricing config tables (`cogs_config`, `implementation_fee_config`, `ai_usage_config`, `azure_fhir_tier_config`) — still authoritative, still read
- `sales.pricing.quotes`, `sales.pricing.quote_modules`, `sales.pricing.deal_quotes` — extended with new columns (see Pass 2b), existing rows backfilled with `version = 1`, `is_active = TRUE` for the latest quote per deal, earlier quotes flipped to inactive

### 4.5 Data dropped

- `frontend/src/lib/pricing/cogs.ts` — deleted
- `frontend/src/lib/pricing/bands.ts` — deleted
- `frontend/src/lib/pricing/modulePricing.ts` — deleted
- `frontend/src/lib/pricing/implementationFees.ts` — deleted
- `frontend/src/lib/pricing/quoteEngine.ts` — rewritten as a server-side module (`/src/lib/server/pricing/quoteEngine.ts`), no client-side quote math
- `frontend/src/lib/server/pricingQuoteStore.ts` — deleted (replaced by server-side `cacheOrFetch` + React Query on the client)
- `pricingService.ts` `normalizeSegmentKey()` — deleted (no normalization needed in v2)
- `SEGMENT_KEY_DISPLAY_MAP` constants — deleted

### 4.6 URL / route changes

| v1 | v2 | Note |
|---|---|---|
| `/agents/pricing` | `/agents/pricing` | Kept. Opens deal picker if no `?deal=` query param. |
| (none — was standalone) | `/opportunities/:dealId/pricing` | New. Deal-scoped Pricing Agent. |
| (none) | `/agents/pricing/review` | New. Approval inbox (Kevin only, or whoever is in `PRICING_APPROVER_EMAIL`). |
| (none) | `/opportunities/:dealId/pricing/versions/:versionId` | New. Read-only view of a specific quote version. |

### 4.7 User-facing breakage (flag for release note)

- **Pricing Agent no longer standalone.** You can't open `/agents/pricing` and start quoting without picking a deal first. If you land there without a deal context, you get a deal picker.
- **Quotes are versioned.** "Save" no longer overwrites; it creates a new version. The list of past versions is visible on the deal's Pricing tab.
- **Below-floor quotes trigger an approval flow.** Previously, you could save anything. Now, below-floor quotes enter pending review with an email to Kevin.
- **Segment keys are short codes everywhere.** UI still shows "Payer" / "Health System" etc. but URLs and API payloads use `payer` / `hs`. Not user-visible in most cases but worth noting for anyone building against the API.

### 4.8 Migration discipline

- v2 Pricing Agent migrations live in `/migrations/versions/`, numbered sequentially after the Phase 3 baseline and Phase 7.5 Notes & Tasks migration
- Phase 4 migration adds:
 - `version`, `is_active`, `status` columns to `sales.pricing.quotes`
 - Backfill existing rows: `version = 1`, `is_active = TRUE` for the most recent quote per deal, others `FALSE`
 - Backfill `status`: if there are existing `approved` rows, preserve; otherwise `draft`
 - New table `sales.pricing.quote_narratives` for AI narrative versioning
 - New table `sales.pricing.quote_approvals` for approval audit trail
 - View recreations for `v_quote_summary`, `v_deal_profitability`
- Seed-file deletions happen in the same commit as the migration — no overlap window where two sources of truth coexist

---

## 5. Information architecture

### Overview

Pricing Agent lives under Opportunities in the primary mental model — it's a deal tool. It's also surfaced under Agents in the left nav for discoverability. Every route is ultimately deal-scoped.

Five surfaces:

1. **Opportunity Pricing tab** (`/opportunities/:dealId` with `?tab=pricing`) — the summary card. Starting point.
2. **Pricing Agent full page** (`/opportunities/:dealId/pricing`) — the primary work surface.
3. **Version history page** (`/opportunities/:dealId/pricing/versions`) — list of all versions with rollback affordance.
4. **Version detail (read-only)** (`/opportunities/:dealId/pricing/versions/:versionId`) — what v7 looked like on Tuesday.
5. **Approval review page** (`/agents/pricing/review`) — Kevin's inbox of pending quotes, across all deals.

Plus one deep-linking shortcut:

6. **Standalone entry** (`/agents/pricing`) — opens a deal picker, routes to #2.

---

### Navigation model

#### Left rail placement

```
SECTIONS
  Overview
  Opportunities
  Leads
  Accounts

INTELLIGENCE
  Policy Feed
  Industry News
  Competitive Intel
  AI News

AGENTS
  Pricing             ← here
  Proposals
  Notes & Tasks
  Opportunity Coach
```

**Rule:** left-rail entry "Pricing" highlights when the user is on any `/opportunities/:dealId/pricing/*` or `/agents/pricing/*` URL. No count badge, no severity indicator, consistent with Notes & Tasks pattern.

**Exception:** if there are **pending approvals assigned to the current user** (i.e., current user's email matches `PRICING_APPROVER_EMAIL`), show a small Coral dot next to "Pricing." Not a count — just a presence indicator. Clicking the rail entry routes to the approval review page in that case, not the deal picker.

For all other users (sellers), no dot. They never see pending-review state on the rail.

#### Deep routes

```
/agents/pricing                                         Deal picker landing (fallback)
/agents/pricing/review                                  Approver inbox
/opportunities/:dealId/pricing                          Main Pricing Agent surface
/opportunities/:dealId/pricing/versions                 Version history list
/opportunities/:dealId/pricing/versions/:versionId      Read-only version detail
/opportunities/:dealId/proposals/new?quote=:versionId   (Phase 6 exit route — not built here)
```

#### Cross-module navigation

- From `/opportunities/:dealId` → Pricing tab → `/opportunities/:dealId/pricing`
- From `/opportunities/:dealId/pricing` → back button → `/opportunities/:dealId?tab=pricing`
- From `/agents/pricing` (standalone entry) → deal picker → select → `/opportunities/:dealId/pricing`
- From `/agents/pricing/review` → click a pending quote → `/opportunities/:dealId/pricing` with that version active
- From `/opportunities/:dealId/pricing` → version history link → `/opportunities/:dealId/pricing/versions`
- From any version list item → `/opportunities/:dealId/pricing/versions/:versionId` (read-only)

---

### Surface 1 — Opportunity Pricing tab (summary card)

Lives inside the Opportunity detail page as one of the tabs. Mental model: "give me the headline number without opening a whole agent."

#### Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│ ← Opportunities  ›  Horizon Health Plan — Q2 Expansion               │
│                                                                       │
│ [Overview] [Activity] [Pricing] [Proposals] [Files]                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Pricing                            [Open Pricing Agent →]            │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                                                                  │ │
│  │  $1,847,200 / yr     v7  [Approved]                             │ │
│  │  ────────────                                                    │ │
│  │                                                                  │ │
│  │  Discount: 22%        Margin: 38.4% ▬▬▬▬▬▬▬▬▬▬▬▬▬▬ ┃ 35% floor │ │
│  │                                                                  │ │
│  │  Segment: Payer       Band: hp-b06      125K members            │ │
│  │                                                                  │ │
│  │  Last updated: 2 hours ago by Kevin                              │ │
│  │                                                                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│  Version history (7)                                 [View all →]     │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │ v7  $1.85M   38.4%  Approved   2h ago     • active              │ │
│  │ v6  $1.72M   32.1%  Rejected   yesterday                        │ │
│  │ v5  $1.85M   35.2%  Approved   3d ago                           │ │
│  │                                                [See 4 more →]    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

#### What's in the card

**Header row:** title "Pricing" + CTA `[Open Pricing Agent →]` — the primary action.

**Active version panel:**
- **Annual total** (large, mono) with `/ yr` suffix. For Payer segments: `/ yr` explicitly shown because PMPM × 12 = annual is non-obvious.
- **Version identifier** (`v7`) + **status badge** (`Draft` / `Pending review` / `Approved` / `Rejected`) using status tokens from style guide:
 - Draft → neutral badge
 - Pending review → Amber badge
 - Approved → Success (Emerald) badge
 - Rejected → Danger (Coral) badge
- **Discount percent** + **margin percent** on one row, with a small inline margin bar showing the 35% floor.
- **Segment** + **band** + **primary volume metric** (members for Payer, accounts for others) on one row.
- **Last updated** metadata — timestamp + actor's first name.

**Version history summary:**
- Shows the 3 most recent versions with tiny rows. Click `[View all →]` to go to `/opportunities/:dealId/pricing/versions`.
- Each row: version number, total, margin, status, relative time, active marker (`• active` for the one with `is_active = TRUE`).
- If only 1 version exists, hide this section entirely — a version history of 1 is visual noise.

#### Empty state

If the deal has no quote yet:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                      │
│                          💰  No pricing yet                          │
│                                                                      │
│                  Create a quote to start pricing this                │
│                  opportunity. The agent will auto-populate           │
│                  segment and band from this deal's fields.           │
│                                                                      │
│                      [Open Pricing Agent →]                          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Access control

- `AIM Admins`, `AIM Executives`, `AIM Sales` → see the tab, see the summary, can click into the agent.
- `AIM Viewers` → the Pricing tab is hidden entirely from the opportunity page's tab bar.

#### Phase 6 coupling note

The Proposal Generator reads from this tab's active version. When the Proposals tab's "Generate proposal" flow is triggered, it pulls the currently-active quote_id and freezes it. This is a Phase 6 concern, not Pass 2a, but called out here so the relationship is visible.

---

### Surface 2 — Pricing Agent full page (primary work surface)

This is where quotes get built. Route: `/opportunities/:dealId/pricing`.

Two-pane layout: inputs on the left (40%), live preview on the right (60%). No modals, no tabs within the page — everything visible at once.

#### Layout

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ← Horizon Health Plan                 v7  [Active] [Approved]       [Version history →]│
├─────────────────────────────────────┬──────────────────────────────────────────────────┤
│                                     │                                                  │
│  CONFIGURE                          │  QUOTE  v7                                       │
│                                     │                                                  │
│  Segment                            │  $1,847,200 / year        Margin 38.4%          │
│  ○ Payer                            │  ────────────                                    │
│  ○ Health System                    │                                                  │
│  ○ ACO                              │  Line items                                      │
│  ○ HIE                              │  ┌─────────────────────────────────────────────┐│
│  ○ CBO                              │  │ Platform (base)                   $420,000 ││
│                                     │  │ 125,000 members × $0.28/member/mo × 12      ││
│  Volume                             │  ├─────────────────────────────────────────────┤│
│  [125,000] members                  │  │ Policy Agent module               $562,500 ││
│  Band: hp-b06 (auto)  [Override ▾]  │  │ 125,000 members × $0.375/member/mo × 12     ││
│                                     │  ├─────────────────────────────────────────────┤│
│  Discount                           │  │ RAF Optimizer module              $337,500 ││
│                                     │  │ 125,000 members × $0.225/member/mo × 12     ││
│  [────●──────]  22%                 │  ├─────────────────────────────────────────────┤│
│  0%                           40%   │  │ Implementation fee (one-time)     $225,000 ││
│                                     │  │ Band hp-b06                                 ││
│  Modules  ✓ 4 of 11                 │  │                                             ││
│  ┌─────────────────────────────┐    │  │ FHIR Tier 2                       $180,000 ││
│  │ ✓ Platform (base)           │    │  │ 125,000 members × estimated tier 2 usage    ││
│  │ ✓ Policy Agent              │    │  │                                             ││
│  │ ✓ RAF Optimizer             │    │  │ AI usage (included)                    —    ││
│  │ ✓ FHIR Tier 2               │    │  │                                             ││
│  │ ☐ Care Management           │    │  │                                             ││
│  │ ☐ Digital Quality Measures  │    │  │ Subtotal                        $1,725,000 ││
│  │ ☐ Prior Authorization       │    │  │ Discount (22%)                   -$379,500 ││
│  │ ☐ Population Health         │    │  │ ─────────────                               ││
│  │ ☐ Contract Perf. Analytics  │    │  │ Annual total                    $1,347,500 ││
│  │ ☐ Consent Management        │    │  │ Implementation (one-time)         $225,000 ││
│  │ ☐ Care-Enabled Network      │    │  │ ─────────────                               ││
│  └─────────────────────────────┘    │  │ Total Year 1                    $1,572,500 ││
│                                     │  │                                             ││
│  AI rationale inputs  (optional)    │  └─────────────────────────────────────────────┘│
│  Why this discount?                 │                                                  │
│  [                             ]    │  Margin 38.4%                                   │
│  Competitive context?               │  ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ ┃ 35% floor              │
│  [                             ]    │                                                  │
│                                     │  COGS breakdown                                 │
│                                     │  Platform COGS          $147,000  (35% of line) │
│                                     │  Module COGS            $337,500  (38% of line) │
│                                     │  Implementation cost    $135,000  (60% of line) │
│                                     │  ──────────                                     │
│                                     │  Total COGS             $619,500                │
│                                     │  Gross margin           $953,000  (38.4%)       │
│                                     │                                                  │
│                                     │  AI narrative                       [↻ Regen]   │
│                                     │  ┌─────────────────────────────────────────────┐│
│                                     │  │ (free-form prose, 3-5 paragraphs)           ││
│                                     │  │ [Edit]                                      ││
│                                     │  └─────────────────────────────────────────────┘│
│                                     │                                                  │
├─────────────────────────────────────┴──────────────────────────────────────────────────┤
│                                                     [Discard changes]  [Save as v8]    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Header

- Deal name + breadcrumb back link
- **Version badge** showing which version is loaded. If `v7` is active AND `approved`, header shows `v7 [Active] [Approved]`. If user edits, header updates to `v8 [Draft] — editing from v7`.
- **Version history link** top-right → `/opportunities/:dealId/pricing/versions`

#### Left pane — Configure (40% width)

All inputs live here. Dense, no hand-holding.

**Segment selector** — radio group, 5 options. Auto-populated from `sales.core.opportunities.segment`. Changing segment resets band and recomputes volume-to-band mapping.

**Volume input** — numeric input with segment-appropriate unit ("members" for Payer, "accounts" for others). Changing volume auto-updates band. User can explicitly override band via `[Override ▾]` dropdown.

**Discount slider** — 0-40% range. Live margin feedback in the right pane as slider moves. Below-floor warning renders in right pane (not here) when margin drops below 35%.

**Module checkboxes** — all 11 modules listed. Platform is pre-checked and usually non-optional for a Payer deal (but can be unchecked if modeling a module-only scenario). Checking/unchecking a module updates line items and margin instantly.

**AI rationale inputs** — two optional text areas. "Why this discount?" and "Competitive context?" Feed into the AI narrative prompt. Empty is fine; narrative will generate without them but will be less contextual.

#### Right pane — Quote preview (60% width)

**Headline row** — annual total (large, mono) + margin percent (inline). This is the "hold this up on a call" area.

**Line items table** — one row per active component:
- Platform (always, assuming it's checked)
- Each selected module
- Implementation fee (one-time, called out separately)
- FHIR tier (if applicable to segment — Payer only typically)
- AI usage (shown as "included" with `—` for value, per v1 pattern)

Each line shows:
- Line name + brief formula/unit
- Annual dollar amount (mono)

**Subtotal → Discount → Annual total** — summed up with the discount applied. Implementation fee listed separately below because it's one-time, not annual. Total Year 1 = Annual + Implementation.

**Margin bar** — horizontal bar (~12px tall), fills to margin percentage, shows 35% floor as a vertical tick mark. Below-floor states described in § Margin floor UX below.

**COGS breakdown** — three rows (platform / module / implementation) plus total + gross margin. Each row shows dollars and percentage-of-that-line-item. Compact table, not a chart.

**AI narrative** — free-form text block, ~3-5 paragraphs. Renders below COGS. Has `[↻ Regen]` button in header to regenerate entire block. `[Edit]` button below to manually edit in-place (saves to `quote_narratives.body_text` on blur).

#### Footer (sticky at bottom of viewport)

Two buttons, right-aligned:
- `[Discard changes]` — only visible if inputs have been modified from the loaded version. Reverts to loaded version's state, no save.
- `[Save as v8]` — primary CTA. Shows "Save as v8" (next version number). Clicking creates a new version row per rules from Group A.

If margin is below floor, the Save button's label changes to `[Save as v8 — submit for review]` to signal the approval flow is coming.

#### Margin floor UX (below-floor state)

When margin drops below 35% (either by discount increase or module removal):

- **Margin bar** fills in Coral (`status.danger`) instead of Emerald (`status.success`). Per Group D answer: reuse the existing danger token.
- **Inline warning** appears right below the margin bar:

```
⚠ Below 35% floor — saving will submit for review
  Approver: kevin@careinmotion.com
  [Why is this flagged?]
```

- "[Why is this flagged?]" is a small info popover — one-line explainer: "Deals with margin below 35% require approval before proposal generation."
- Save button label updates (see Footer above).
- No hard block on save. Seller can always save; soft-warning is the limit.

#### Loading state

On first load of the page (data is cold):
- Left pane renders with skeleton placeholder for segment/band/volume
- Right pane renders with skeleton for line items and COGS
- AI narrative renders as "Not generated yet — [Generate narrative]" if no narrative exists for the active version

Cold-start latency target: <1.5 seconds from nav to fully-rendered. If Databricks warehouse is cold, show a skeleton shimmer on the pricing config; should not exceed 5 seconds.

#### Error states

- **Pricing config load fails** — full-page error: "Couldn't load pricing configuration. [Retry]". Don't render anything else.
- **Missing implementation fee for this band** (per v1 migration rule in §4.2 bullet 4) — inline error in the line items: "Implementation fee not defined for band hp-b15. Contact admin."
- **Missing segment config** — same pattern; error in place of segment selector.

#### Keyboard shortcuts

Per Group C answer: minimal.
- `⌘S` / `Ctrl+S` — Save as new version
- `⌘Enter` / `Ctrl+Enter` — Generate AI narrative

Nothing else. No custom discount shortcuts, no segment cycling, no margin toggle.

---

### Surface 3 — Version history page

Route: `/opportunities/:dealId/pricing/versions`.

Mental model: "show me every round of pricing this deal went through."

#### Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ← Horizon Health Plan  ›  Pricing  ›  Version history                     │
│                                                                            │
│  Version history  (7 versions)                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ v7   $1,847,200 / yr   Margin 38.4%   [Approved]   • active            ││
│ │ 2 hours ago by Kevin                                                   ││
│ │ Changes: discount 18% → 22%, added RAF Optimizer module                ││
│ │                                            [View read-only →] [Roll back]││
│ ├────────────────────────────────────────────────────────────────────────┤│
│ │ v6   $1,720,000 / yr   Margin 32.1%   [Rejected]                       ││
│ │ Yesterday at 4:22 PM by Kevin                                          ││
│ │ Changes: discount 22% → 28%                                            ││
│ │ Rejection reason: "Margin too deep, renegotiate with buyer"            ││
│ │                                            [View read-only →] [Roll back]││
│ ├────────────────────────────────────────────────────────────────────────┤│
│ │ v5   $1,850,000 / yr   Margin 35.2%   [Approved]                       ││
│ │ 3 days ago by Kevin                                                    ││
│ │ Changes: initial quote                                                 ││
│ │                                            [View read-only →] [Roll back]││
│ ├────────────────────────────────────────────────────────────────────────┤│
│ │ v4   $1,620,000 / yr   Margin 31.0%   [Rejected]                       ││
│ │ 4 days ago by Kevin                                                    ││
│ │ Changes: removed Care Management module                                ││
│ │ Rejection reason: "Module scope insufficient for ARR target"           ││
│ │                                            [View read-only →] [Roll back]││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### What's on the page

**Page header:** breadcrumb, title with total count.

**Version cards** (most recent first):
- **Version number** + **total** + **margin** + **status badge** + `• active` marker if `is_active = TRUE`
- **Timestamp + actor**
- **Changes summary** — computed diff from previous version. Short natural-language description: "discount 18% → 22%, added RAF Optimizer module". Computed server-side at read time, not stored.
- **Rejection reason** — if status is `rejected`, shows the reason preserved from the approval audit log.
- **Actions:** `[View read-only →]` routes to `/opportunities/:dealId/pricing/versions/:versionId`. `[Roll back]` is the rollback affordance — see below.

#### Rollback behavior

Clicking `[Roll back]` on any non-active version triggers a confirmation:

> **Roll back to v5?**
> This will flip v5 to active. v6 and v7 will remain in history but inactive.
> v5 was approved on Apr 15 by Kevin.
> [Cancel] [Roll back to v5]

On confirm:
- `POST /api/opportunities/:dealId/pricing/rollback` with target `quote_id` of v5
- Server flips `is_active`: current active (v7) → FALSE, target (v5) → TRUE
- Audit log entries on both quotes (`event: 'rolled_back_from'` on v7, `event: 'rolled_back_to'` on v5)
- Toast: "Rolled back to v5. [Undo]"
- Undo within 5 seconds reverts the flip

#### Access control

- Any user who can see the opportunity can see version history (read)
- Rollback action visible only to `AIM Admins` / `AIM Executives` / `AIM Sales` — not `Viewers`
- Rejection reasons visible to everyone who can see versions — not treated as sensitive

---

### Surface 4 — Version detail (read-only)

Route: `/opportunities/:dealId/pricing/versions/:versionId`.

Mental model: "I want to see exactly what v7 looked like on Tuesday."

#### Layout

Identical to Surface 2 (Pricing Agent full page) with two differences:

1. **All inputs are read-only.** Segment radio, volume input, discount slider, module checkboxes, AI rationale inputs — none are editable.
2. **Footer changes.** Instead of `[Discard] [Save as vN]`, footer shows:

```
                        [Open version in editor]   [Roll back to this version]
```

- `[Open version in editor]` — loads this version's inputs into the full Pricing Agent page. Editing and saving creates `v(N+1)` per fork rules. Starting point is v7's data, even though v7 isn't active.
- `[Roll back to this version]` — same behavior as the version history page's rollback.

#### Visible header

```
v7 of 9   [Approved]       Viewing read-only
```

Makes it unambiguous that this is a historical view, not the current state.

#### Why this surface exists

Three reasons:
1. **Audit.** "What exactly did we quote on Apr 12?"
2. **Investigation.** "Why was v6 rejected?" — see inputs, margin, reason in one place.
3. **Starting point for rework.** "Pull up v5, I want to edit from there." → `[Open version in editor]`.

Without this surface, reviewing old quotes requires Databricks queries. That's not acceptable for a CEO-level daily tool.

---

### Surface 5 — Approval review page

Route: `/agents/pricing/review`.

Mental model: "the inbox of pending quotes that need approval."

Only visible to the user whose email matches `PRICING_APPROVER_EMAIL`. All other users who navigate here get a 403.

#### Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ← Pricing Agent  ›  Review queue                                          │
│                                                                            │
│  Pending approval  (3)                                                     │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ ⚠ Horizon Health Plan — Q2 Expansion                                   ││
│ │ v8   $1,620,000 / yr   Margin 32.4%   [Below floor by 2.6%]            ││
│ │ Submitted 5 minutes ago by Sarah Chen                                  ││
│ │ Note: v7 (approved) is still active; v8 is a fork with deeper discount ││
│ │                                                                        ││
│ │ Segment: Payer     Band: hp-b06    125K members    Discount: 28%       ││
│ │                                                                        ││
│ │ Quick actions:                                                         ││
│ │ [View full quote →]   [Approve]   [Reject with reason…]                ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ ⚠ Meridian Physician Group — Implementation                             ││
│ │ v3   $487,500 / yr   Margin 28.9%   [Below floor by 6.1%]              ││
│ │ Submitted 2 days ago by Sarah Chen                                     ││
│ │                                                                        ││
│ │ Segment: ACO     Band: aco-b04    24 accounts     Discount: 35%        ││
│ │                                                                        ││
│ │ [View full quote →]   [Approve]   [Reject with reason…]                ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────┐│
│ │ Pinewood ACO — Renewal                                                 ││
│ │ v12   $985,000 / yr   Margin 33.1%   [Below floor by 1.9%]             ││
│ │ Submitted 2 days ago by Kevin Ritter                                   ││
│ │                                                                        ││
│ │ Self-submitted                                                         ││
│ │                                                                        ││
│ │ [View full quote →]   [Approve]   [Reject with reason…]                ││
│ └────────────────────────────────────────────────────────────────────────┘│
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

#### What's on the page

**Page header:** title with count.

**Pending quote cards,** newest first:
- Deal name + opportunity stage (small, muted)
- Version + total + margin + below-floor delta (calculated: `35 - margin`). Below-floor delta is the key number — it tells Kevin how deep the ask is.
- Submission timestamp + actor (the seller who saved it)
- **Fork note** — if there's another pending or active version for the same deal, call it out: "Note: v7 (approved) is still active; v8 is a fork with deeper discount." This handles the Group A Q4 "fork" case where two pending versions can coexist.
- Key inputs summary: segment, band, volume, discount.
- Actions: `[View full quote →]` (routes to Surface 2 with that version loaded), `[Approve]` (one-click), `[Reject with reason…]` (opens a small inline textarea).

#### Approve action

Click `[Approve]` → one confirmation step (no modal):

```
Approve v8 at 32.4% margin (2.6% below floor)?
[Cancel]  [Approve]
```

On confirm:
- `POST /api/opportunities/:dealId/pricing/versions/:versionId/approve`
- Server sets `quotes.status = 'approved'`
- Audit log entry in `quote_approvals` table with approver email, timestamp, decision
- Quote disappears from review queue
- Notification fires to submitter (in-app bell + email via Graph) per Group C answer
- Toast on review page: "Approved. Sarah will be notified."

No undo — approval is terminal. The submitter can always fork a new version.

#### Reject action

Click `[Reject with reason…]` → inline textarea expands under the card:

```
Reject v8  —  reason (required):
┌─────────────────────────────────────────────────────────────┐
│ Margin too deep for this stage of deal. Renegotiate        │
│ discount with buyer or add 1-2 modules to restore margin.   │
└─────────────────────────────────────────────────────────────┘
[Cancel]  [Reject and send]
```

- Reason is required — save disabled until text is entered
- Click `[Reject and send]`:
 - `POST /api/opportunities/:dealId/pricing/versions/:versionId/reject` with reason
 - Server sets `quotes.status = 'rejected'`, stores reason in audit log
 - Notification fires to submitter with the reason inline
 - Card disappears from review queue
 - Toast: "Rejected. Sarah will be notified with your reason."

No undo. If Kevin rejected by mistake, the seller can edit (which forks v9) and resubmit.

#### Empty state

```
┌─────────────────────────────────────┐
│                                     │
│       🎯  Nothing pending           │
│                                     │
│       All quotes are either         │
│       approved or still drafts.     │
│                                     │
└─────────────────────────────────────┘
```

#### Access control

- Only current user whose email matches `PRICING_APPROVER_EMAIL` sees this page
- Everyone else: 403 "Approval review requires being the designated approver. Contact Kevin."
- `AIM Admins` can see the page regardless (admin backdoor for debugging) but cannot approve/reject — the action buttons are disabled for them unless their email also matches

---

### Surface 6 — Standalone entry (deal picker)

Route: `/agents/pricing`.

Mental model: "I clicked Pricing from the left rail without a deal context — now what?"

#### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Pricing Agent                                                │
│                                                               │
│ Pick a deal to start pricing.                                 │
│                                                               │
│ 🔍 Search opportunities…                                     │
│                                                               │
│ Recent deals                                                  │
│ ┌──────────────────────────────────────────────────────────┐│
│ │ ↗ Horizon Health Plan — Q2 Expansion    (Payer · Negotiate)││
│ │ ↗ Meridian Physician Group — Impl        (Lead · Qualified)││
│ │ ↗ Pinewood ACO — Renewal                 (ACO · Close)    ││
│ │ ↗ Valley Regional — New Business         (HS · Discovery) ││
│ └──────────────────────────────────────────────────────────┘│
│                                                               │
│ All deals                                            [Filter]│
│ (paginated list)                                              │
└──────────────────────────────────────────────────────────────┘
```

- Typeahead search at the top
- "Recent deals" = last 5 deals the current user edited (any activity, not just pricing)
- "All deals" = paginated list, same as Opportunities page would show, but links route to `/opportunities/:dealId/pricing` instead of `/opportunities/:dealId`

#### Behavior

- Clicking a deal → routes to Surface 2 (`/opportunities/:dealId/pricing`)
- If the approver dot was showing on the rail, clicking the rail instead opens Surface 5 (review page). User already in review flow doesn't see this picker.

#### Access control

- Same as Surface 2: `AIM Admins`, `AIM Executives`, `AIM Sales` see the picker. `Viewers` get 403.

---

### Relationships between screens

**From /opportunities/:dealId (Opportunity detail):**
- Pricing tab → Surface 1 (summary card)
- From summary card `[Open Pricing Agent →]` → Surface 2

**From Surface 2 (Pricing Agent full page):**
- `[Version history →]` top-right → Surface 3
- Back link → /opportunities/:dealId?tab=pricing
- Save (below floor) → quote becomes pending_review; seller stays on Surface 2 but version number increments; approver sees new entry in Surface 5

**From Surface 3 (Version history):**
- `[View read-only →]` on any version → Surface 4
- `[Roll back]` on any non-active version → confirm modal → flips is_active → toast

**From Surface 4 (Version detail, read-only):**
- `[Open version in editor]` → Surface 2 with that version's inputs loaded
- `[Roll back to this version]` → confirm modal → flips is_active

**From Surface 5 (Approval review):**
- Click deal row → Surface 2 with that version loaded and highlighted
- `[Approve]` / `[Reject]` stay on Surface 5; card disappears from queue

**From Surface 6 (Deal picker):**
- Click deal → Surface 2

**From left rail:**
- "Pricing" click (no approver dot) → Surface 6
- "Pricing" click (with approver dot) → Surface 5

**From notification (email or in-app bell):**
- Email link → Surface 5
- In-app bell on a task-style notification (approval-pending) → Surface 5

---

### Open questions for Pass 2b

Tracked here for resolution before data model draft.

| Question | Impact |
|---|---|
| Does the approver dot on the left rail show for AIM Admins too, or only the email match? | Nav logic — 2b |
| If Kevin is the submitter AND the approver (as today), does self-submission auto-approve, or still require explicit approve? | Workflow — Pass 2c but affects audit model in 2b |
| Should rejection reasons have any templating (reusable canned reasons) or always free-text? | Pass 2c |
| Version history "changes summary" — how do we generate this? Diff two inputs JSON objects? Or store a changelog per save? | Pass 2b — affects whether we store a diff column |
| AI narrative edits (manual) — do they create a new narrative row (versioned) or overwrite? | Pass 2b |
| Phase 6 Proposals: when proposal is generated from v7, and later v8 is saved, does the proposal stay pinned to v7 or re-pin? | Cross-module with Proposals — park for Phase 6 |
| Do we show "time to approval" stats anywhere? ("v6 was reviewed in 12 minutes") | Out of scope for MVP — park |
| Can the approver also be the submitter? Edge case: Kevin submits v8, Kevin approves. No conflict of interest? | Policy question for Kevin |
| Per-deal "pricing is locked" state — e.g., contract signed, no more quotes? | Out of scope — park |
| Empty state for `/agents/pricing/review` when queue has been empty for days — are there analytics? | Polish — park |

Once these are answered (or parked as deferrals), Pass 2b (data model) and Pass 2c (workflows) are unblocked.

---

## 6. Data model

### Overview

The data model extends `sales.pricing.*` with versioning, status tracking, audit trails, and narrative history. Three tables are extended (`quotes`, `quote_modules`, `deal_quotes`), three new tables are added (`quote_narratives`, `quote_approvals`, `quote_rejections`), and one config row is added to `sales.core.features`.

Cross-referenced with `docs/SCHEMA.md` (populated in Phase 3).

---

### 1. Enum definitions

Enforced at the application layer via Zod. Databricks stores as STRING with CHECK constraints where feasible.

#### QuoteStatus
```typescript
type QuoteStatus = 'draft' | 'pending_review' | 'approved' | 'rejected'
```

Lifecycle:
- `draft` — above-floor saves, or initial state
- `pending_review` — below-floor saves that are not self-submissions
- `approved` — explicitly approved by reviewer, OR auto-approved self-submission
- `rejected` — explicitly rejected; terminal state for this version (seller must fork a new version)

#### ApprovalKind
```typescript
type ApprovalKind = 'explicit' | 'auto_self'
```

- `explicit` — reviewer navigated to `/agents/pricing/review` and clicked Approve
- `auto_self` — submitter email matched `PRICING_APPROVER_EMAIL` at save time; below-floor auto-approved on save

UI renders both as "Approved." The distinction lives in the audit trail and is queryable for admins.

#### RejectionReasonKind
```typescript
type RejectionReasonKind = 'canned' | 'custom'
```

- `canned` — reviewer picked a preset chip (unmodified)
- `custom` — reviewer typed free-text OR modified a canned reason before sending

#### CannedRejectionCode
```typescript
type CannedRejectionCode =
  | 'margin_too_deep'
  | 'wrong_segment'
  | 'deal_stage_mismatch'
  | 'missing_modules'
```

Four initial codes; canned chip labels and default text live in `/src/lib/pricing/rejectionReasons.ts`. Adding a canned reason requires a deploy.

#### NarrativeSource
```typescript
type NarrativeSource = 'ai_generated' | 'ai_regenerated' | 'manual_edit'
```

Every narrative row records how it was produced.

#### QuoteAuditEvent
```typescript
type QuoteAuditEvent =
  | 'created'
  | 'saved'
  | 'approved'
  | 'rejected'
  | 'rolled_back_from'     // this version was deactivated as part of a rollback
  | 'rolled_back_to'       // this version was activated as part of a rollback
  | 'narrative_regenerated'
  | 'narrative_edited'
  | 'auto_approved_self'   // distinct from 'approved' — caught by audit tooling
```

Every mutation endpoint appends one event to `quotes.audit_log_json`.

---

### 2. Schema changes — existing tables

#### `sales.pricing.quotes`

**v1 columns (carry forward with modifications):**
```
quote_id             STRING    PK
deal_id              STRING    FK → sales.core.opportunities(deal_id)
segment_key          STRING    -- short codes: 'payer'|'hs'|'aco'|'hie'|'cbo' (v1 used display names inconsistently; v2 canonicalizes)
band_key             STRING    -- e.g. 'hp-b06'
volume               BIGINT    -- members for Payer, accounts for others
discount_pct         DECIMAL(5,2)  -- 0.00 to 40.00
annual_total         DECIMAL(12,2)
implementation_fee   DECIMAL(12,2)
total_year_one       DECIMAL(12,2)
gross_margin_dollars DECIMAL(12,2)
gross_margin_pct     DECIMAL(5,2)
total_cogs           DECIMAL(12,2)
created_by           STRING    FK → sales.core.users(user_id)
created_at           TIMESTAMP
updated_at           TIMESTAMP
```

**New columns (Phase 4 migration):**
```
version              INT       NOT NULL DEFAULT 1
                                  -- per-deal version number; increments on save

is_active            BOOLEAN   NOT NULL DEFAULT FALSE
                                  -- exactly one TRUE per deal at any time
                                  -- flipped by: (a) new version save, (b) rollback action

status               STRING    NOT NULL DEFAULT 'draft'
                                  -- QuoteStatus enum

audit_log_json       STRING    NOT NULL DEFAULT '[]'
                                  -- JSON array of QuoteAuditEvent entries

rationale_why_discount    STRING    NULL
                                  -- free-text from left-pane "AI rationale inputs"

rationale_competitive     STRING    NULL
                                  -- free-text from left-pane "AI rationale inputs"

pricing_config_version    STRING    NULL
                                  -- snapshot of the DB-config version used to compute this quote
                                  -- e.g. a hash of segments+bands+band_pricing+module_pricing at save time
                                  -- enables re-rendering old quotes consistently even if config changes later

approved_at          TIMESTAMP NULL
approved_by          STRING    NULL FK → sales.core.users(user_id)
approved_kind        STRING    NULL  -- ApprovalKind enum; NULL if status != 'approved'

rejected_at          TIMESTAMP NULL
rejected_by          STRING    NULL FK → sales.core.users(user_id)
rejected_reason_kind STRING    NULL  -- RejectionReasonKind enum
rejected_reason_code STRING    NULL  -- CannedRejectionCode if canned; NULL if custom
rejected_reason_text STRING    NULL  -- full text (canned default, user-modified canned, or free-text)
```

**Backfill for v1 rows:**
- `version = 1` for every existing quote row
- `is_active = TRUE` for the most recent quote per deal (determined by `MAX(created_at)` per `deal_id`); `FALSE` for all others
- `status = 'approved'` for all v1 quotes (v1 didn't track approval; assume historical ones were blessed)
- `audit_log_json` = seeded with a single `'created'` event matching `created_at` and `created_by`
- `approved_at = created_at`, `approved_by = created_by`, `approved_kind = 'auto_self'` (reasonable historical assumption)
- `rationale_*` and `pricing_config_version` — NULL (not captured in v1)

**Constraints:**
- `version >= 1`
- `status IN ('draft', 'pending_review', 'approved', 'rejected')`
- `approved_kind IN ('explicit', 'auto_self')` when NOT NULL
- `rejected_reason_kind IN ('canned', 'custom')` when NOT NULL
- Exactly one `is_active = TRUE` per `deal_id` (application-layer constraint; enforced by save endpoint transactions)

**Audit log JSON format:**
```json
[
  {
    "ts": "2026-04-12T14:32:00Z",
    "actor_user_id": "usr-001",
    "event": "created",
    "version_created": 1,
    "was_below_floor": false
  },
  {
    "ts": "2026-04-15T09:12:00Z",
    "actor_user_id": "usr-001",
    "event": "saved",
    "version_created": 7,
    "was_below_floor": true,
    "pending_review": true,
    "submitter_is_approver": false
  },
  {
    "ts": "2026-04-15T10:02:00Z",
    "actor_user_id": "usr-001",
    "event": "approved",
    "kind": "explicit",
    "notes": null
  },
  {
    "ts": "2026-04-17T11:05:00Z",
    "actor_user_id": "usr-001",
    "event": "rolled_back_from",
    "rolled_back_to_quote_id": "qte-abc-v5",
    "reason": null
  }
]
```

Append-only. Endpoints never modify existing entries.

---

#### `sales.pricing.quote_modules`

**v1 columns carry forward unchanged:**
```
quote_module_id      STRING    PK
quote_id             STRING    FK → sales.pricing.quotes(quote_id)
module_key           STRING    -- 'platform', 'policy_agent', 'raf_optimizer', etc.
line_amount_annual   DECIMAL(12,2)
line_cogs            DECIMAL(12,2)
unit_price           DECIMAL(12,4)
metric_value         BIGINT    -- members, accounts, etc. depending on segment
recurring_multiplier INT       -- 1 for most segments, 12 for Payer (PMPM → annual)
```

**No new columns needed.** Every quote version has its own set of quote_modules rows. When v8 is saved, 11 new rows are inserted (one per selected module). The `quote_id` FK keeps them associated with the correct version.

**Backfill:** existing rows stay with their existing `quote_id` FKs; those quotes now have `version = 1` and `is_active = TRUE/FALSE` per above.

**Storage consequence:** a deal that goes through 20 versions with 4 modules selected each time = 80 `quote_modules` rows. At v2 scale this is negligible (hundreds of quotes annually). Not optimizing.

---

#### `sales.pricing.deal_quotes`

**v1 columns:**
```
deal_quote_id        STRING    PK
deal_id              STRING    FK → sales.core.opportunities(deal_id)
quote_id             STRING    FK → sales.pricing.quotes(quote_id)
created_at           TIMESTAMP
```

**New columns (Phase 4 migration):**
```
is_active_link       BOOLEAN   NOT NULL DEFAULT FALSE
                                  -- TRUE if this deal_quote row points to the currently-active quote
                                  -- Redundant with quotes.is_active but enables simpler joins
                                  -- for list queries that only need deal_quotes
```

**Backfill:**
- Every v1 deal_quote row inserted; `is_active_link = TRUE` for rows where the referenced quote has `is_active = TRUE`

**Constraint:** exactly one `is_active_link = TRUE` per `deal_id`.

**Why this table exists even though `quotes.deal_id` already links them:**
`deal_quotes` is the documented v1 integration point for external systems (if we ever build one) that want to ask "which quote is canonical for deal X?" without inspecting the full quotes table. It's effectively a denormalized view of "active quote per deal" that makes joins from the opportunity page faster.

Alternative considered: drop `deal_quotes` entirely, use `quotes.is_active` as the signal. Rejected: v1 code already reads `deal_quotes`, and the migration cost of rewriting those queries outweighs the table maintenance cost.

---

### 3. New tables

#### `sales.pricing.quote_narratives` (new)

Versioned narrative text. One quote can have many narratives; one is current at any time.

```
narrative_id             STRING    PK
quote_id                 STRING    NOT NULL FK → sales.pricing.quotes(quote_id)
version                  INT       NOT NULL
                                  -- per-quote version; independent of quote.version
body_text                STRING    NOT NULL
                                  -- free-form prose, 3-5 paragraphs typically
source                   STRING    NOT NULL
                                  -- NarrativeSource enum
model_used               STRING    NULL
                                  -- 'claude-sonnet-4-6' for AI-generated; NULL for manual_edit
generation_duration_ms   INT       NULL
                                  -- telemetry for AI runs
created_by               STRING    NOT NULL FK → sales.core.users(user_id)
created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
is_current               BOOLEAN   NOT NULL DEFAULT TRUE
                                  -- TRUE for the latest narrative on this quote
                                  -- FALSE for all historical narratives
```

**Versioning behavior:**
- First AI generation creates row with `version = 1, is_current = TRUE, source = 'ai_generated'`
- AI regeneration (click ↻): new row with `version = N+1, is_current = TRUE, source = 'ai_regenerated'`; previous current row flips to FALSE
- Manual edit (save after typing in textarea): new row with `version = N+1, is_current = TRUE, source = 'manual_edit'`; previous current row flips to FALSE
- Creating a new quote version (v8 from v7) does NOT automatically create a narrative; the new quote has no narrative until generated

**Narrative lifecycle:**
- A quote version can exist without a narrative — narrative is optional
- Narratives are tied to a specific `quote_id`, not to a deal. Rolling back to v5 shows v5's narrative history, not v7's

**Constraints:**
- `source IN ('ai_generated', 'ai_regenerated', 'manual_edit')`
- Exactly one `is_current = TRUE` per `quote_id` (application-layer)

---

#### `sales.pricing.quote_approvals` (new)

One row per approval event. Captures the decision + context.

```
approval_id              STRING    PK
quote_id                 STRING    NOT NULL FK → sales.pricing.quotes(quote_id)
approver_user_id         STRING    NOT NULL FK → sales.core.users(user_id)
kind                     STRING    NOT NULL
                                  -- ApprovalKind enum: 'explicit' | 'auto_self'
approver_email_at_time   STRING    NOT NULL
                                  -- snapshot of PRICING_APPROVER_EMAIL when approved
                                  -- lets us reconstruct who the approver was even
                                  -- after config changes
margin_pct_at_approval   DECIMAL(5,2) NOT NULL
                                  -- snapshot of gross_margin_pct at time of approval
floor_pct_at_approval    DECIMAL(5,2) NOT NULL DEFAULT 35.00
                                  -- in case the floor changes in future
below_floor              BOOLEAN   NOT NULL
                                  -- derived: margin_pct_at_approval < floor_pct_at_approval
notes                    STRING    NULL
                                  -- optional reviewer notes; not used in MVP UI but column present
created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

**Behavior:**
- Explicit approval from `/agents/pricing/review`: one row inserted, `kind = 'explicit'`
- Auto-approve on self-submission: one row inserted, `kind = 'auto_self'`
- The `quotes.approved_at / approved_by / approved_kind` columns mirror the latest approval row — denormalized for fast reads

**Retention:** approvals are audit records. Never deleted, never updated. Immutable.

---

#### `sales.pricing.quote_rejections` (new)

One row per rejection event. Separate from approvals because rejection semantics are richer (reason text, canned-vs-custom).

```
rejection_id             STRING    PK
quote_id                 STRING    NOT NULL FK → sales.pricing.quotes(quote_id)
rejected_by_user_id      STRING    NOT NULL FK → sales.core.users(user_id)
reason_kind              STRING    NOT NULL
                                  -- RejectionReasonKind: 'canned' | 'custom'
reason_code              STRING    NULL
                                  -- CannedRejectionCode if 'canned'; NULL if 'custom'
reason_text              STRING    NOT NULL
                                  -- full rejection text as sent to submitter
                                  -- if canned & unmodified: the default text for that code
                                  -- if canned & modified: the user's edited version
                                  -- if custom: free-text only
margin_pct_at_rejection  DECIMAL(5,2) NOT NULL
created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

**Behavior:**
- Click `[Reject and send]` in the review page: one row inserted
- The `quotes.rejected_*` columns mirror the latest (only) rejection row
- A quote can only be rejected once — after rejection, further action requires the seller to fork a new version

**Retention:** rejections are audit records. Immutable.

---

#### `sales.core.features` — config row for `PRICING_APPROVER_EMAIL`

The approver email lives in this table (not as an env var) so it's:
- Admin-editable without a deploy
- Auditable (who changed it, when)
- Versioned in the same tracking pattern as other features

```sql
-- Seeded in Wave 1 migration 002_create_features_table.sql:
INSERT INTO sales.core.features (key, enabled, rollout_pct, description, value, updated_at, updated_by)
VALUES (
  'pricing_approver_email',
  TRUE,
  100,
  'Email address of the user authorized to approve below-floor pricing quotes',
  'kevin@careinmotion.com',
  CURRENT_TIMESTAMP(),
  'migration-002'
);
```

The row is created by Wave 1 (pre-Phase-1). Phase 4 Pricing Agent just reads it. The `sales.core.features` table schema includes `value STRING` and `updated_by STRING` columns from Wave 1 migration 002 — no schema changes needed at Phase 4.

**Read pattern:**
- Server-side: `getFeature('pricing_approver_email')` returns the value from this row
- Client-side: exposed via `/api/auth/me` response, so the UI can check `session.user.email === PRICING_APPROVER_EMAIL` to show the approver dot and auto-approve logic

**Change cadence:**
- Initial: Kevin's email
- Future: Kevin changes via an admin UI (Phase 10 addition, not MVP) or directly in Databricks
- Audit: `sales.core.features.updated_by` + `updated_at` capture who changed it when

---

### 4. Cascade rules — application-layer enforcement

All cascades are enforced by mutation endpoints, not DB triggers.

#### Save a new version

Endpoint: `POST /api/opportunities/:dealId/pricing`

Transaction:
1. Compute: next `version` = `MAX(version) + 1` for this `deal_id` (fallback 1 if no quotes exist)
2. Insert new `quotes` row with computed version, `is_active = FALSE` initially, status derived below
3. Insert `quote_modules` rows for each selected module
4. Determine status:
 - If `margin_pct >= 35` → status = `'draft'` (or `'approved'` if we're implementing save-as-approved for above-floor; see note below)
 - If `margin_pct < 35` AND submitter email == `PRICING_APPROVER_EMAIL` → status = `'approved'`, insert `quote_approvals` row with `kind = 'auto_self'`
 - If `margin_pct < 35` AND submitter email != `PRICING_APPROVER_EMAIL` → status = `'pending_review'`, send approval email via Graph `Mail.Send` (fire-and-forget, in-app bell notification fires regardless)
5. Flip previous active quote's `is_active = FALSE`; set new quote's `is_active = TRUE`
6. Update `deal_quotes.is_active_link` accordingly
7. Append `'created'` or `'saved'` event to new quote's `audit_log_json`

**Note on above-floor status:** v1 quotes could be saved without any approval concept. In v2, an above-floor save goes straight to `'draft'` — not `'approved'`. `'approved'` is reserved for explicitly approved or auto-self-approved below-floor quotes. Above-floor quotes don't need approval; they're just drafts until a proposal is generated or a subsequent action marks them final.

**Alternative rejected:** have above-floor saves go directly to `'approved'` (since they're by definition fine). Why rejected: conflates two concepts (meets-margin vs approved-for-proposal) and clutters reporting. An above-floor quote that was never sent to a buyer isn't "approved" — it's just a draft that happens to meet margin. Better to keep `'approved'` semantic to the approval flow only.

#### Fork from a pending-review version

If v7 is `pending_review` and the seller edits and saves:
- v8 is created following all the save logic above
- v7 stays `pending_review` (not rejected, not dropped)
- The review page shows both v7 and v8 as pending for this deal; reviewer can act on either
- If v7 is later rejected, its status becomes `'rejected'`. v8 stays on its own track.

#### Approve a quote

Endpoint: `POST /api/opportunities/:dealId/pricing/versions/:versionId/approve`

Transaction:
1. Verify the approver's email matches `PRICING_APPROVER_EMAIL` (else 403)
2. Verify the quote's current status is `'pending_review'` (else 409 with message "Quote is not pending review")
3. Update quote: `status = 'approved'`, set `approved_at`, `approved_by`, `approved_kind = 'explicit'`
4. Insert `quote_approvals` row with `kind = 'explicit'`, snapshot of margin
5. Append `'approved'` event to `audit_log_json`
6. Send in-app + email notification to submitter
7. Return updated quote

#### Reject a quote

Endpoint: `POST /api/opportunities/:dealId/pricing/versions/:versionId/reject`

Transaction:
1. Verify approver email match (else 403)
2. Verify status is `'pending_review'` (else 409)
3. Validate rejection body: `reason_kind` and `reason_text` required; `reason_code` required if `reason_kind = 'canned'`
4. Update quote: `status = 'rejected'`, set `rejected_at`, `rejected_by`, `rejected_reason_*` columns
5. Insert `quote_rejections` row
6. Append `'rejected'` event to `audit_log_json`
7. Send in-app + email notification to submitter with reason text
8. Return updated quote

#### Roll back to a previous version

Endpoint: `POST /api/opportunities/:dealId/pricing/rollback` body: `{ targetQuoteId }`

Transaction:
1. Verify role (`AIM Admins`, `AIM Executives`, `AIM Sales` can roll back; `AIM Viewers` cannot)
2. Verify `targetQuoteId` belongs to this deal and currently has `is_active = FALSE`
3. Find current active quote; set `is_active = FALSE`, append `'rolled_back_from'` event
4. Set target quote `is_active = TRUE`, append `'rolled_back_to'` event
5. Update `deal_quotes.is_active_link` accordingly
6. Return both quotes

#### Rejected → resubmit on edit

Not a separate endpoint. When a seller edits a rejected quote and clicks save, the normal save path runs:
- A new version (v9) is created
- If still below floor AND not self-submission → `pending_review` again, email sent
- If above floor → `'draft'`
- The previously-rejected v8 stays `'rejected'` in history

Per Group A answer, no explicit "resubmit" button. Editing + saving is the resubmit action.

#### Auto-approve self-submission

Encoded inside the Save endpoint (Step 4 above). When submitter email == approver email AND below floor:
- `status = 'approved'`
- `approved_kind = 'auto_self'`
- `quote_approvals` row inserted with kind `'auto_self'`
- No email, no in-app notification (self-action)
- Audit log gets `'auto_approved_self'` event

---

### 5. Views

Views recreated in the Phase 4 migration.

#### `sales.pricing.v_quote_summary` — rewrite

```sql
CREATE OR REPLACE VIEW sales.pricing.v_quote_summary AS
SELECT
  q.quote_id,
  q.deal_id,
  q.version,
  q.is_active,
  q.status,
  q.segment_key,
  q.band_key,
  q.volume,
  q.discount_pct,
  q.annual_total,
  q.implementation_fee,
  q.total_year_one,
  q.gross_margin_pct,
  q.gross_margin_dollars,
  q.total_cogs,
  q.created_at,
  q.updated_at,
  q.approved_at,
  q.rejected_at,
  u_creator.display_name AS created_by_name,
  u_creator.email        AS created_by_email,
  u_approver.display_name AS approved_by_name,
  CASE
    WHEN q.gross_margin_pct < 35 THEN TRUE
    ELSE FALSE
  END AS below_floor,
  (SELECT COUNT(*) FROM sales.pricing.quote_modules qm WHERE qm.quote_id = q.quote_id) AS module_count,
  (SELECT body_text FROM sales.pricing.quote_narratives qn
     WHERE qn.quote_id = q.quote_id AND qn.is_current = TRUE
     LIMIT 1) AS current_narrative
FROM sales.pricing.quotes q
LEFT JOIN sales.core.users u_creator  ON q.created_by = u_creator.user_id
LEFT JOIN sales.core.users u_approver ON q.approved_by = u_approver.user_id;
```

Consumer: all list surfaces (Pricing tab summary, version history, review page, standalone deal picker).

#### `sales.pricing.v_pending_approvals` — new

Powers the `/agents/pricing/review` page.

```sql
CREATE OR REPLACE VIEW sales.pricing.v_pending_approvals AS
SELECT
  q.quote_id,
  q.deal_id,
  d.deal_name,
  d.stage AS deal_stage,
  q.version,
  q.segment_key,
  q.band_key,
  q.volume,
  q.discount_pct,
  q.annual_total,
  q.total_year_one,
  q.gross_margin_pct,
  q.created_at AS submitted_at,
  u.display_name AS submitted_by_name,
  u.email       AS submitted_by_email,
  (35.00 - q.gross_margin_pct) AS floor_delta_pct,
  -- Context: are there other pending or active versions for this deal?
  (SELECT COUNT(*) FROM sales.pricing.quotes q2
     WHERE q2.deal_id = q.deal_id
       AND q2.quote_id != q.quote_id
       AND q2.status IN ('pending_review', 'approved')
       AND q2.is_active = TRUE) AS has_active_companion
FROM sales.pricing.quotes q
LEFT JOIN sales.core.opportunities d ON q.deal_id = d.deal_id
LEFT JOIN sales.core.users u        ON q.created_by = u.user_id
WHERE q.status = 'pending_review'
ORDER BY q.created_at ASC;
```

#### `sales.pricing.v_quote_history_by_deal` — new

Powers the version history page and the Pricing tab's mini-history.

```sql
CREATE OR REPLACE VIEW sales.pricing.v_quote_history_by_deal AS
SELECT
  q.deal_id,
  q.quote_id,
  q.version,
  q.is_active,
  q.status,
  q.annual_total,
  q.total_year_one,
  q.gross_margin_pct,
  q.discount_pct,
  q.created_at,
  q.approved_at,
  q.rejected_at,
  q.rejected_reason_text,
  u.display_name AS created_by_name
FROM sales.pricing.quotes q
LEFT JOIN sales.core.users u ON q.created_by = u.user_id
ORDER BY q.deal_id, q.version DESC;
```

#### `sales.pricing.v_margin_alerts` — extend

v1 had a margin_alerts view. Extend it to filter for the new `below_floor` logic:

```sql
CREATE OR REPLACE VIEW sales.pricing.v_margin_alerts AS
SELECT
  q.quote_id,
  q.deal_id,
  q.version,
  q.is_active,
  q.status,
  q.gross_margin_pct,
  (35.00 - q.gross_margin_pct) AS floor_delta_pct,
  q.created_at,
  q.created_by
FROM sales.pricing.quotes q
WHERE q.gross_margin_pct < 35
  AND q.is_active = TRUE;
```

Reports / dashboards use this to surface "active quotes below floor" without caring about history.

---

### 6. Indexes (Z-ordering)

Applied after Phase 4 migration via scheduled Databricks job:

```sql
OPTIMIZE sales.pricing.quotes             ZORDER BY (deal_id, version, is_active);
OPTIMIZE sales.pricing.quote_modules      ZORDER BY (quote_id);
OPTIMIZE sales.pricing.quote_narratives   ZORDER BY (quote_id, is_current);
OPTIMIZE sales.pricing.quote_approvals    ZORDER BY (quote_id, created_at);
OPTIMIZE sales.pricing.quote_rejections   ZORDER BY (quote_id, created_at);
OPTIMIZE sales.pricing.deal_quotes        ZORDER BY (deal_id, is_active_link);
```

---

### 7. Server-side pricing config cache

Per Pass 1 scope decision, all pricing config is fetched from Databricks at runtime with 24h server-side cache.

#### Cache key + TTL

```typescript
// In /src/lib/cache.ts
CACHE_KEYS.pricingConfig() → 'pricing-config'
CACHE_TTL.PRICING_24H     → 24 * 60 * 60 * 1000
```

#### What's cached

Loaded as a single bundle:
- All rows from `sales.pricing.segments`
- All rows from `sales.pricing.bands`
- All rows from `sales.pricing.band_pricing`
- All rows from `sales.pricing.modules`
- All rows from `sales.pricing.module_pricing`
- All rows from `sales.pricing.module_cogs`
- All rows from `sales.pricing.impl_schedules`
- All rows from `sales.pricing.discount_schedules`
- All rows from `sales.app.cogs_config`
- All rows from `sales.app.implementation_fee_config`
- All rows from `sales.app.ai_usage_config`
- All rows from `sales.app.azure_fhir_tier_config`

Total size: roughly a few hundred rows, likely <100 KB serialized. Trivial to hold in memory.

#### Structure in code

```typescript
// /src/lib/server/pricing/repository.ts
export async function getPricingConfig(): Promise<PricingConfig> {
  return cacheOrFetch(
    CACHE_KEYS.pricingConfig(),
    CACHE_TTL.PRICING_24H,
    async () => {
      // Parallel fetch of all tables
      const [segments, bands, bandPricing, modules, modulePricing,
             moduleCogs, implSchedules, discountSchedules,
             cogsConfig, implFeeConfig, aiUsageConfig, fhirTierConfig] =
        await Promise.all([...]);

      return {
        segments, bands, bandPricing, modules, modulePricing,
        moduleCogs, implSchedules, discountSchedules,
        cogsConfig, implFeeConfig, aiUsageConfig, fhirTierConfig,
        loadedAt: new Date().toISOString(),
        version: computeConfigVersion(...),  // hash of key fields
      };
    }
  );
}
```

#### Cache invalidation

- TTL-based: 24 hours after last load, cache entry expires and next read triggers reload
- Manual: `POST /api/admin/cache/invalidate?key=pricing-config` forces reload
- Configuration changes in Databricks (via admin) are expected to be followed by a manual cache invalidation; documented in admin runbook

#### `pricing_config_version` column

When a quote is saved, the current `PricingConfig.version` (a hash) is snapshotted into `quotes.pricing_config_version`. This enables:
- Detecting stale quotes — if config changes, old quotes' computed totals may no longer match current config; we can flag them
- Consistent historical renders — rendering v5 of a quote from 3 months ago uses v5's snapshot data (`quote_modules.line_amount_annual` etc. are already frozen) plus the config version for reference

Not used in any MVP UI logic; purely for audit and future-proofing.

---

### 8. Zod schemas — high-level contract

Full schemas in `/src/schemas/pricing.ts` during Phase 4 implementation. Names:

- `QuoteSchema` — full quote with all fields
- `QuoteCreateSchema` — input for POST `/api/opportunities/:dealId/pricing`
- `QuoteListItemSchema` — summary used in lists
- `QuoteModuleSchema`
- `QuoteNarrativeSchema`, `QuoteNarrativeCreateSchema`
- `QuoteApprovalSchema`
- `QuoteRejectionSchema`, `QuoteRejectCreateSchema` (with `reason_kind`, `reason_code`, `reason_text` validation)
- `PricingConfigSchema` — the cached config bundle

All mutations validate via `*CreateSchema` on receipt. Read schemas parse DB results with `.parse()` to fail loud on drift.

---

### 9. Migration plan

#### Migration `008_pricing_agent_schema.sql` (Phase 4)

Single migration, multi-statement. No data loss. Runs AFTER Phase 3 (core migrations 005–006) and Phase 6 (proposals migration 007). The `sales.core.features` table and the `pricing_approver_email` config row both exist from Wave 1 (migration 002), so this migration doesn't need to create either.

Pseudo-structure:

```sql
-- 1. Extend sales.pricing.quotes
ALTER TABLE sales.pricing.quotes ADD COLUMNS (
  version INT, is_active BOOLEAN, status STRING, audit_log_json STRING,
  rationale_why_discount STRING, rationale_competitive STRING,
  pricing_config_version STRING,
  approved_at TIMESTAMP, approved_by STRING, approved_kind STRING,
  rejected_at TIMESTAMP, rejected_by STRING,
  rejected_reason_kind STRING, rejected_reason_code STRING, rejected_reason_text STRING
);

-- Backfill
UPDATE sales.pricing.quotes SET version = 1 WHERE version IS NULL;
UPDATE sales.pricing.quotes SET is_active = FALSE WHERE is_active IS NULL;
-- Set is_active = TRUE for most recent per deal
MERGE INTO sales.pricing.quotes q
USING (
  SELECT deal_id, MAX(created_at) AS max_created
  FROM sales.pricing.quotes
  GROUP BY deal_id
) latest
ON q.deal_id = latest.deal_id AND q.created_at = latest.max_created
WHEN MATCHED THEN UPDATE SET q.is_active = TRUE;

UPDATE sales.pricing.quotes SET status = 'approved' WHERE status IS NULL;
UPDATE sales.pricing.quotes SET audit_log_json = '[]' WHERE audit_log_json IS NULL;
UPDATE sales.pricing.quotes SET approved_kind = 'auto_self' WHERE status = 'approved' AND approved_kind IS NULL;
UPDATE sales.pricing.quotes SET approved_at = created_at WHERE approved_at IS NULL AND status = 'approved';
UPDATE sales.pricing.quotes SET approved_by = created_by WHERE approved_by IS NULL AND status = 'approved';

-- 2. Extend sales.pricing.deal_quotes
ALTER TABLE sales.pricing.deal_quotes ADD COLUMNS (is_active_link BOOLEAN);
MERGE INTO sales.pricing.deal_quotes dq
USING (
  SELECT deal_id, quote_id FROM sales.pricing.quotes WHERE is_active = TRUE
) active_quotes
ON dq.deal_id = active_quotes.deal_id AND dq.quote_id = active_quotes.quote_id
WHEN MATCHED THEN UPDATE SET dq.is_active_link = TRUE
WHEN NOT MATCHED THEN INSERT (...) VALUES (...);
UPDATE sales.pricing.deal_quotes SET is_active_link = FALSE WHERE is_active_link IS NULL;

-- 3. Create sales.pricing.quote_narratives
CREATE TABLE sales.pricing.quote_narratives (...);

-- 4. Create sales.pricing.quote_approvals
CREATE TABLE sales.pricing.quote_approvals (...);
-- Backfill: one row per existing approved quote
INSERT INTO sales.pricing.quote_approvals (approval_id, quote_id, approver_user_id,
                                            kind, approver_email_at_time,
                                            margin_pct_at_approval, floor_pct_at_approval,
                                            below_floor, created_at)
SELECT
  uuid() AS approval_id,
  q.quote_id,
  q.approved_by,
  'auto_self',
  u.email,
  q.gross_margin_pct,
  35.00,
  q.gross_margin_pct < 35,
  q.approved_at
FROM sales.pricing.quotes q
LEFT JOIN sales.core.users u ON q.approved_by = u.user_id
WHERE q.status = 'approved';

-- 5. Create sales.pricing.quote_rejections
CREATE TABLE sales.pricing.quote_rejections (...);
-- No backfill (no v1 rejected quotes exist)

-- 6. (Wave 1 / migration 002 already seeded sales.core.features.pricing_approver_email
--     with value='kevin@careinmotion.com'. No action needed here. If the row is somehow
--     missing at Phase 4 execution time, insert it:
--     INSERT INTO sales.core.features (key, enabled, rollout_pct, description, value, updated_at, updated_by)
--     VALUES ('pricing_approver_email', TRUE, 100, 'Email of designated pricing approver',
--             'kevin@careinmotion.com', CURRENT_TIMESTAMP, 'migration-008');)

-- 7. Recreate views
CREATE OR REPLACE VIEW sales.pricing.v_quote_summary AS ...;
CREATE OR REPLACE VIEW sales.pricing.v_pending_approvals AS ...;
CREATE OR REPLACE VIEW sales.pricing.v_quote_history_by_deal AS ...;
CREATE OR REPLACE VIEW sales.pricing.v_margin_alerts AS ...;
```

#### Rollback plan

Rolling back migration 008 is not practical — column drops on Delta tables are destructive. If something goes catastrophically wrong:
- Stop writes to `sales.pricing.quotes` via feature flag
- Take a snapshot of the table state
- Revert via restore from snapshot

Document this in `docs/MIGRATIONS.md` as the general Delta Lake rollback policy.

#### Pre-Phase-4 data task

Per Pass 1 §4.2 bullet 4: **`sales.pricing.impl_schedules` must have rows for ALL 20 Payer bands** before Pricing Agent v2 ships. Bands 5-20 need to be authored (not extrapolated in code).

This is a data-preparation step, not a migration step. Kevin or a data admin populates the missing rows directly in Databricks before the Phase 4 migration runs. If the data is missing, Pricing Agent for mid/large Payer deals will hard-error on load.

Pre-flight query to verify:
```sql
SELECT segment_key, COUNT(DISTINCT band_key) AS band_count
FROM sales.pricing.impl_schedules
GROUP BY segment_key;
```
Expected: Payer count = 20, all others per their respective band counts.

---

### 10. Storage growth projections

For reference:

| Table | Per-deal growth rate | Example at 20 versions |
|---|---|---|
| `quotes` | 1 row per save | 20 rows |
| `quote_modules` | N rows per save (N = selected modules, avg ~4) | 80 rows |
| `quote_narratives` | 1 row per AI gen + 1 per manual edit (variable) | ~10 rows typically |
| `quote_approvals` | 1 row per below-floor save (approved or auto-self) | ~5 rows |
| `quote_rejections` | 1 row per rejection | 0-2 rows typically |

Total per deal in a heavy case: ~120 rows across 5 tables. At 100 deals/year, ~12,000 rows annually. Well within Delta Lake comfortable operating range; no optimization needed at v2 scale.

---

### 11. Open questions for Sub-pass 2c

Tracked here for resolution in workflows pass.

| Question | Impact |
|---|---|
| When a rolled-back quote is edited, does the new version become v(N+1) or reuse the old numbering? | Workflow |
| How does the UI handle the case where `PRICING_APPROVER_EMAIL` points to a user who has been deactivated? | Workflow/error |
| Re-pinning a proposal to a newer quote — who can trigger it (any seller, or only the proposal's creator)? | Cross-module, Phase 6 |
| Narrative regeneration preserving user rationale inputs vs re-prompting from quote alone? | Workflow |
| Multi-tab concurrent editing of the same deal's quote — last-write-wins or conflict detection? | Workflow |
| Auto-save cadence for localStorage — every keystroke, every 10s, every 30s? | Workflow/polish |
| Draft restoration banner — similar to Notes & Tasks pattern? | Workflow |
| Approving a quote whose narrative hasn't been generated yet — warn or allow? | Workflow |

Once these are answered (or parked), Sub-pass 2c (workflows) is unblocked.

---

## 7. Workflows

### Overview

This pass specifies step-by-step user flows for every major Pricing Agent interaction. Empty states, loading states, error states, keyboard shortcuts. Assumes Pass 2a (IA, six surfaces) and Pass 2b (data model, versioning, cascades) are locked.

**Shared conventions applied throughout:**

- **Undo toast pattern.** After any reversible state change — mark done, rollback, unsaved-discard — a toast slides from bottom-right with 5-second [Undo] window.
- **Auto-save to localStorage every 10 seconds** while the Pricing Agent is open with dirty inputs. Server save requires explicit [Save as v8] click.
- **Processing icon replaces a CTA button** during AI generation or save. User can continue interacting with the page.
- **Failed icon replaces processing icon** on failure. Click to retry.
- **Section regenerate (↻)** on AI-generated content reuses current context; no separate prompt.

---

### 1. Workflow — Build a quote from scratch

Primary job-to-be-done: *"Build a quote for a specific opportunity that's ready for proposal generation in 60 seconds."*

#### Entry points

- From opportunity detail: `[Pricing] tab` → `[Open Pricing Agent →]` button
- From left nav: `Pricing` → deal picker → select deal
- From approver's pending review: clicking a pending quote routes into the Pricing Agent with that version loaded

#### Happy path — first-ever quote on this deal

1. User lands on `/opportunities/:dealId/pricing` with no existing quote
2. Left pane pre-populates from deal:
 - Segment: from `opportunities.segment_key` (e.g. `"payer"` for a Payer deal)
 - Volume: from `opportunities.primary_metric_value` (members, accounts, etc.)
 - Band: auto-detected from volume via `band_pricing` lookup; user can override
 - Discount: 0% (default)
 - Modules: Platform pre-checked; others unchecked by default
3. Right pane renders live quote preview from those defaults:
 - Annual total with PMPM×12 for Payer (explicit `/ yr` suffix)
 - Line items (Platform only, no modules)
 - Implementation fee (from `impl_schedules` for this band)
 - Margin bar — should be well above 35% floor at 0% discount
 - COGS breakdown
 - AI narrative section shows "Not generated yet — [Generate narrative]" button
4. User checks modules, adjusts discount, optionally fills rationale fields
5. Right pane updates in real-time — every input change triggers recomputation (debounced 200ms to avoid thrashing during slider drag)
6. User clicks `[Save as v1]` footer button
7. Server creates `quotes` row + `quote_modules` rows, status determined per cascade rules (§2b.4)
8. Page reloads with v1 as the active version; URL unchanged
9. Toast: "Quote saved as v1."

#### Happy path — subsequent quote (deal already has v5)

1. User navigates to `/opportunities/:dealId/pricing`
2. Page loads with v5 (the active version) as initial state
3. Header shows `v5 [Active] [Approved]`
4. User modifies inputs — header updates: `v6 [Draft] — editing from v5`
5. `[Save as v6]` footer becomes active
6. All subsequent behavior matches first-quote path

#### During AI narrative generation

1. User clicks `[Generate narrative]` (or ↻ on existing narrative)
2. Narrative section replaced by processing icon + "Generating narrative…" text
3. Server call (~20-40 seconds for initial gen)
4. On success: narrative renders, saved to `quote_narratives` as new row with `is_current = TRUE`
5. On failure: failed icon + "Click to retry"; previous narrative (if any) is preserved

#### Rationale inputs during regeneration

Per Group C answer:

- The "Why this discount?" and "Competitive context?" text areas on the left pane are considered state on the current session, not on the quote version
- When user clicks ↻ on the narrative, server re-runs the prompt with whatever's currently in those fields
- Fields are saved to the quote row (`rationale_why_discount`, `rationale_competitive`) only when the quote is saved
- This means: you can write rationale text, click ↻ to see a regenerated narrative with the new context, then revise rationale again, and click ↻ once more — all without saving a quote version. Only the final `[Save as v6]` persists the rationale to the DB.

#### Loading state on initial page load

If the page is cold (React Query cache miss + pricing config cache miss):

- Left pane renders with skeleton for segment/band/volume inputs (~200ms typical)
- Right pane renders with skeleton for line items, COGS, margin bar
- AI narrative section renders with "Loading…" or skeleton
- Typical full render: <1 second if pricing config is cached server-side, up to 5 seconds on cold warehouse

If the warehouse cold-start exceeds 5 seconds:
- Skeleton shimmer continues
- After 8 seconds, show a subtle message below skeleton: "Pricing config loading from Databricks (warehouse cold start)… this usually takes 10-15 seconds on first request."

#### Error states

- **Pricing config load fails:** full-page error, no inputs render. "Couldn't load pricing configuration. [Retry] [Back to deal]"
- **Deal not found (invalid dealId):** 404 page with back link
- **Missing implementation fee for this band:** inline error in line items: "Implementation fee not defined for band hp-b15. Contact admin to populate `sales.pricing.impl_schedules` for this band." Save button disabled.
- **Missing module pricing for selected segment:** inline error on that module: "Pricing not defined for Payer × Module XYZ. Module unselected." Module auto-unchecks; user can proceed.
- **Permissions (viewer trying to load):** 403 — "Pricing Agent requires AIM Sales or higher. Contact admin."

#### Keyboard shortcuts during build

- `⌘S` / `Ctrl+S` — Save as next version (Group C answer: minimal set)
- `⌘Enter` / `Ctrl+Enter` — Generate / regenerate AI narrative
- `Esc` — Return to opportunity page (with unsaved-changes confirm if dirty)
- Tab order: segment radios → volume input → band override → discount slider → module checkboxes → rationale fields → narrative → footer

---

### 2. Workflow — Adjust discount, watch margin drop

Primary job-to-be-done: *"I'm on a call and the buyer asked for 28%. Show me what that does to margin before I commit."*

#### Happy path

1. User is on `/opportunities/:dealId/pricing` with some existing inputs
2. User drags discount slider from 22% to 28%
3. Right pane updates in real-time (debounced 200ms):
 - Annual total drops
 - Margin bar fills change color — if margin was 38% and drops below 35%, bar transitions from Emerald to Coral (status.danger token)
 - Below-floor warning appears below bar: "⚠ Below 35% floor — saving will submit for review" with approver email displayed
 - Footer button label changes: `[Save as v7]` → `[Save as v7 — submit for review]`
4. User continues exploring: adds a module to partially offset margin drop, sees margin rise back above 35%, button label reverts
5. User settles on final configuration; saves normally

#### What user does NOT do during this flow

- No modal dialogs appear during slider drag (performance + UX concern)
- Margin bar color transitions smoothly — no flash or jarring snap
- Numbers update without layout shift (fixed-width mono font on totals)
- Slider doesn't auto-save; localStorage autosave is every 10s but UI state is fully reactive

#### Edge cases

- **Discount slider to 40% (max):** bar renders at whatever margin that produces (possibly negative)
- **Discount slider to 0% (min):** bar renders at max margin
- **All modules unchecked:** line items pane shows only Platform; totals recalculate; margin updates; `[Save as vN]` still functional (edge case of Platform-only quote is valid)
- **Platform unchecked:** line items empty except modules; totals might be weird (modules without platform base is unusual but not blocked)

---

### 3. Workflow — Save below floor, approval flow

Primary job-to-be-done (submitter): *"I need to quote below floor for this deal. I know it needs approval."*
Primary job-to-be-done (approver): *"I need to see pending below-floor quotes across my portfolio and make a decision."*

#### Path A — Submitter is approver (auto-approve self)

Per Group B answer: when submitter email matches `PRICING_APPROVER_EMAIL`, below-floor save auto-approves.

1. Kevin (who IS the approver) configures a quote that ends up below floor
2. Clicks `[Save as v7 — submit for review]`
3. Server logic:
 - Creates quote row with `status = 'approved'`
 - Inserts `quote_approvals` row with `kind = 'auto_self'`, kind-specific fields
 - Does NOT send email
 - Does NOT fire in-app bell
 - Appends `'auto_approved_self'` event to `audit_log_json`
4. Page updates:
 - Header: `v7 [Active] [Approved]`
 - Toast: "Saved as v7. Auto-approved (self-submission below floor)." — small, dismissible, no action needed
5. Kevin continues working normally

#### Path B — Submitter is not approver (default future case)

1. Sarah (seller, not approver) configures a below-floor quote for Horizon deal
2. Clicks `[Save as v7 — submit for review]`
3. Server logic:
 - Creates quote row with `status = 'pending_review'`
 - Fires Graph `Mail.Send` with approver email
 - Inserts `notifications` row with `channel = 'in_app'` for Kevin's bell (if in notifications schema — Notes & Tasks pattern; extend for pricing events)
 - Appends `'saved'` event to `audit_log_json` with `was_below_floor: true` and `pending_review: true`
4. Page updates:
 - Header: `v7 [Pending review]`
 - Toast: "Saved as v7. Submitted to Kevin for review."
5. Sarah continues working; she can still edit to create v8 (fork rule)

#### Approver receives notification (Kevin's view)

- **Email arrives** (subject: "[AIM] New quote pending review: Horizon Health Plan v7"):
 - Body: link only (Group B answer)
 - Click → `/agents/pricing/review` on login
- **In-app bell activates:**
 - Coral dot appears next to "Pricing" in left rail
 - Bell icon in top bar shows unread count
 - Clicking bell shows the notification: "Sarah submitted v7 for Horizon Health Plan (margin 32.4%)"
 - Clicking notification routes to `/agents/pricing/review`

#### Approver acts: Approve

1. Kevin on `/agents/pricing/review`
2. Sees Horizon v7 card with submitter, margin, volume, segment, quick-action buttons
3. Clicks `[Approve]`
4. Confirmation (no separate modal — inline): "Approve v7 at 32.4% margin (2.6% below floor)?"
5. Kevin confirms
6. Server:
 - Updates quote: `status = 'approved'`, sets `approved_at`, `approved_by`, `approved_kind = 'explicit'`
 - Inserts `quote_approvals` row with `kind = 'explicit'`
 - Appends `'approved'` event to audit_log
 - Fires notification to Sarah (in-app bell + email via Graph)
7. v7 card disappears from review queue
8. Toast: "Approved. Sarah will be notified."

#### Approver acts: Reject

1. Kevin clicks `[Reject with reason…]` on v7 card
2. Inline expansion: textarea + 4 canned chips + `[Cancel]` / `[Reject and send]`
3. Kevin clicks "Margin too deep" chip → textarea pre-fills with default text
4. Kevin edits: "Margin too deep for this stage of deal. Renegotiate discount with buyer or add 1-2 modules to restore margin." → adds "Try bringing Care Management module into scope, it usually lifts margin 3-4%."
5. Kevin clicks `[Reject and send]`
6. Server:
 - Updates quote: `status = 'rejected'`, sets `rejected_at`, `rejected_by`, `rejected_reason_*` columns
 - `rejected_reason_kind = 'custom'` (because edited), `rejected_reason_code = 'margin_too_deep'` (the chip source), `rejected_reason_text` = full edited text
 - Inserts `quote_rejections` row
 - Appends `'rejected'` event to audit_log
 - Fires notification to Sarah with reason text inline
7. v7 card disappears from review queue
8. Toast: "Rejected. Sarah will be notified with your reason."

#### Deactivated approver edge case

Per Group B Q1 answer (silent fail):

- When a below-floor save would require email to a deactivated `PRICING_APPROVER_EMAIL`:
 - Graph `Mail.Send` throws / returns error
 - Sentry captures with tag `pricing_approver_unreachable`
 - Save itself still succeeds; quote enters `pending_review` state
 - No user-facing error, no fallback routing
 - In-app bell notification also targets the deactivated user; also silently fails
- Result: quote sits in `pending_review` until admin fixes config (via `sales.core.features` update)
- When config is fixed, future saves route correctly; the stuck v7 needs explicit approval from the new approver via `/agents/pricing/review`

#### Empty state (no pending approvals)

- `/agents/pricing/review` with nothing in queue: "🎯 Nothing pending. All quotes are either approved or still drafts."

---

### 4. Workflow — Reject + resubmit loop

Primary job-to-be-done (seller): *"My quote was rejected. I want to revise and resubmit."*

Per Group A decision: no explicit "resubmit" button. Editing + saving is the resubmit action.

#### Happy path

1. Sarah sees rejection notification (in-app + email)
2. Clicks notification → routes to `/opportunities/:dealId/pricing` with v7 loaded
3. v7 shows in header: `v7 [Rejected]`
4. Rejection reason rendered prominently above the quote (in a Coral tinted banner): "Rejected by Kevin on Apr 15: 'Margin too deep for this stage of deal. Renegotiate discount with buyer or add 1-2 modules to restore margin. Try bringing Care Management module into scope, it usually lifts margin 3-4%.'"
5. Sarah adjusts inputs — discount down from 28% to 24%, adds Care Management module
6. Header updates: `v8 [Draft] — editing from v7`
7. Sarah clicks `[Save as v8]`
8. If still below floor: back to `pending_review`, notification fires again
9. If above floor: status `draft`, no notification
10. v7 stays `[Rejected]` in history forever; v8 is the new version with its own state

#### Seeing rejection history on older versions

- Version history page shows v7 with rejection banner inline
- Read-only version view of v7 shows the full rejection reason in header

---

### 5. Workflow — Roll back to a previous version

Primary job-to-be-done: *"v7 was approved but I realize v5 was actually better. Make v5 active again."*

Per Group A decision: rollback = flip `is_active`. Lightweight.

#### Happy path

1. User on `/opportunities/:dealId/pricing/versions` (version history page)
2. Sees 7 versions; v7 is `• active`
3. Clicks `[Roll back]` on v5 row
4. Confirmation modal:
 > "Roll back to v5? This will flip v5 to active. v6 and v7 will remain in history but inactive. v5 was approved on Apr 15 by Kevin. [Cancel] [Roll back to v5]"
5. User confirms
6. Server:
 - Flips v7: `is_active = FALSE`, appends `'rolled_back_from'` event to audit log with `rolled_back_to_quote_id` of v5
 - Flips v5: `is_active = TRUE`, appends `'rolled_back_to'` event
 - Updates `deal_quotes.is_active_link` accordingly
7. Toast: "Rolled back to v5. [Undo]"
8. Undo within 5s reverses the flip

#### Edit after rollback

Per Kevin's choice (Group A): renumber to preserve linear history.

1. User is on v5 (active after rollback), edits inputs
2. Header: `v6 [Draft] — editing from v5 (rolled back from v7)`
3. User saves
4. Server:
 - Creates new quote row with `version = 6`
 - **Renumbers** old v6 → v7 and old v7 → v8 across `quotes`, `quote_modules`, `quote_narratives`, `quote_approvals`, `quote_rejections`
 - Each renumbered quote's `audit_log_json` gets a `'renumbered'` event: `{ event: 'renumbered', old_version: 6, new_version: 7, reason: 'rollback_edit', ts: '...', original_created_at: '...' }`
 - Sets new v6 as `is_active = TRUE`; all others inactive
 - Appends `'created'` event to new v6's audit log
5. User sees history now:
 - v6 (new, active)
 - v7 (old v6, rejected — historical)
 - v8 (old v7, approved — historical)
 - v5 (active pre-rollback; now inactive again)
 - v1-v4 (historical, unchanged)
6. Toast: "Saved as v6. Previous v6 and v7 renumbered to v7 and v8."

**Technical complexity of renumbering:**
- Multi-table MERGE INTO statement to update all references
- Wrapped in a transaction so partial renumbering can't happen
- Audit events track the original version numbers so admins can reconstruct true history from the JSON
- External references use `quote_id` not version, so proposals and notifications don't break

#### Read-only view of a version

1. User on version history page
2. Clicks `[View read-only →]` on any version
3. Routes to `/opportunities/:dealId/pricing/versions/:versionId`
4. Pricing Agent renders with all inputs disabled
5. Header: `v7 of 9 [Approved] — Viewing read-only`
6. Footer: `[Open version in editor] [Roll back to this version]`
7. Clicking `[Open version in editor]` loads this version's inputs into the editable Pricing Agent. Editing creates v(N+1).

---

### 6. Workflow — AI narrative lifecycle

Primary job-to-be-done: *"Generate the pricing story I'm going to tell the buyer, then refine it until it's right."*

#### Generate for the first time

1. User is on `/opportunities/:dealId/pricing` with an active quote and no narrative
2. AI narrative section shows: "Not generated yet — [Generate narrative]"
3. User optionally fills rationale fields
4. Clicks `[Generate narrative]` or presses `⌘Enter`
5. Section replaced by processing icon + "Generating narrative…"
6. Server call (20-40 seconds typical):
 - Fetches quote data (line items, totals, segment, discount, margin, rationale inputs)
 - Constructs prompt from template + quote context
 - Calls Claude Sonnet 4.6 with `model: 'claude-sonnet-4-6'`
 - Parses response (strips fences if present, validates non-empty)
7. On success:
 - Creates `quote_narratives` row: `version = 1, source = 'ai_generated', is_current = TRUE`
 - Appends `'narrative_regenerated'` event (first gen uses same event name as regen) to quote audit log
 - UI renders narrative text in the section
8. On failure: failed icon, retry button

#### Regenerate

Per Group C answer: preserve rationale inputs, reuse current context.

1. User on active quote with narrative shown
2. Clicks ↻ button in narrative section header
3. Section replaced by processing icon
4. Server:
 - Reads current rationale fields from the request body (server doesn't rely on DB for this — UI sends current form state)
 - Re-runs prompt with new rationale + same quote context
 - Creates new `quote_narratives` row: `version = N+1, source = 'ai_regenerated', is_current = TRUE`
 - Previous current row flips to `is_current = FALSE`
 - Appends `'narrative_regenerated'` event to quote audit log
5. UI updates with new narrative
6. **The old narrative is NOT shown as "previous version" in the UI** — it's in the DB for audit purposes only. If Kevin wants to see it, he queries the DB directly (not a v2 MVP surface).

#### Manual edit

1. User clicks `[Edit]` button below narrative
2. Narrative text becomes a textarea with current text pre-filled
3. User types edits
4. User clicks `[Save edit]` (or clicks outside the textarea — save on blur)
5. Server:
 - Creates new `quote_narratives` row: `version = N+1, source = 'manual_edit', is_current = TRUE`
 - Previous current flips to `is_current = FALSE`
 - Appends `'narrative_edited'` event to quote audit log
6. UI re-renders narrative as text (not textarea)
7. No toast — saves are quiet for narrative edits

#### AI errors

- Timeout (>60s): failed icon, retry. Doesn't consume a narrative version row.
- Claude rate limit: failed icon + tooltip "AI temporarily unavailable. Try again in a minute."
- Malformed AI response (non-text, no content): failed icon + audit log entry with `source: 'ai_generated_failed'`. Server side doesn't create a narrative row on failure.
- Quota exceeded: failed icon + "Daily AI quota reached. Contact admin."

#### Approving without a narrative

Per Group B answer: warn and allow.

1. Kevin on `/agents/pricing/review`
2. Quote v7 has no narrative (seller submitted below-floor without generating one)
3. Kevin clicks `[Approve]`
4. Confirmation: "This quote has no pricing narrative. Approve anyway? [Cancel] [Approve without narrative]"
5. Kevin confirms
6. Approval proceeds normally

---

### 7. Workflow — Generate a proposal from a quote (Phase 6 coupling, high-level)

Full proposal workflow is Phase 6. This section covers only the Pricing Agent side of the handoff.

#### From Pricing Agent to Proposal Generator

1. User on `/opportunities/:dealId/pricing` with an active approved quote (v7)
2. User clicks a `[Generate proposal →]` button (location TBD in Phase 6 spec)
3. Routes to `/opportunities/:dealId/proposals/new?quote=v7-quote-id`
4. Phase 6 proposal flow takes over

#### What Pricing Agent provides

- `quote_id` (pinned; proposal freezes to this specific version)
- Current narrative (the `is_current = TRUE` narrative for this quote_id)
- Line items + totals (all fields from `quotes` + `quote_modules`)
- Rationale inputs (for buyer-facing pricing language)

#### What Pricing Agent does NOT do

- Doesn't generate the proposal itself (Phase 6 concern)
- Doesn't mutate the quote on proposal generation
- Doesn't prevent generating another proposal from the same quote (multiple proposals can pin to v7)

#### Warn-but-allow when pending version exists

Per Group D answer from Pass 2a discussion:

1. User tries to generate a proposal while v8 (the latest) is `pending_review`
2. Prompt: "This deal has a pending v8 in review. The proposal will use v7 (approved). Continue?"
3. User confirms → proposal generation proceeds with v7 pinned
4. **Exception:** if no approved version exists and only pending exists (e.g., all versions v1-v7 are either rejected or pending), block with: "Resolve pending review before generating a proposal." No proceed button.

#### Re-pinning an existing proposal

Per Group C answer: any seller on the deal can re-pin.

- Surface lives in Proposal Generator, not Pricing Agent
- Button: `[Re-pin to active quote]` in the proposal's header when `pinned_quote_version != active_quote_version`
- Click → confirmation → proposal's `quote_id` reference updates
- Old proposal artifact is preserved as a historical version (Phase 6 spec handles versioning on the Proposal side)

---

### 8. Workflow — Approver reviews the queue

Primary job-to-be-done: *"I have pending approvals. Work through them efficiently."*

#### Landing behavior

1. Kevin notices Coral dot on left rail's "Pricing" entry
2. Clicks entry
3. Routes to `/agents/pricing/review` (not deal picker, because approver dot is active)
4. Sees list of pending quotes, newest first
5. Works through them

#### Bulk actions

Not in MVP. Each approval or rejection is individual. Rationale: the "below floor" signal warrants per-quote context, not batch processing. If approver has 20 pending quotes, they're reviewing each one individually.

If this becomes friction (e.g., a seller team of 10 generating hundreds of pending quotes), post-MVP we can add multi-select. For now, deliberately avoided.

#### Sorting and filtering

MVP: chronological (oldest first, to surface stuck quotes). Below the list header, a small pill cluster shows counts:

```
Oldest first  •  3 pending  •  0 older than 24h
```

No filter controls. List is short by design — if it's not, that's a sign of review backlog worth addressing operationally, not UX-ly.

#### Keyboard navigation

- `↓` / `↑` — move focus between quote cards
- `a` — approve focused card (with confirmation)
- `r` — reject focused card (opens rejection textarea)
- `Enter` — open focused card in Pricing Agent (full view)
- `Esc` — dismiss rejection textarea without sending

#### Pending-reviews staleness

Not a v2 MVP feature. If a quote sits in `pending_review` for more than 24 hours, no special UI treatment. Post-MVP: add an aging indicator ("pending 2 days") for prioritization.

---

### 9. Workflow — Draft restoration

Primary job-to-be-done: *"I had a quote half-built yesterday before my laptop died. Bring my work back."*

Per Group C answer: restore banner, matching Notes & Tasks.

#### Happy path

1. User closes browser with dirty inputs (auto-save has captured state to localStorage)
2. User returns next day, navigates to `/opportunities/:dealId/pricing`
3. Page detects localStorage draft with key `aim:pricing:dealId-<id>` (present, within 24h TTL)
4. Banner at top of page:
 > 📝 You have an unsaved draft from yesterday. [Restore] [Discard]
5. User clicks `[Restore]`:
 - localStorage values load into form fields
 - Right pane re-renders with those inputs
 - Banner dismisses
6. OR user clicks `[Discard]`:
 - localStorage draft cleared
 - Form loads with the current active version's values (default behavior)
 - Banner dismisses

#### localStorage draft behavior

- Written every 10s while page is dirty (inputs differ from loaded version)
- Key format: `aim:pricing:draft:<dealId>`
- Content: JSON with all input fields + timestamp
- TTL: 24 hours (cleared on next page load if older)
- Cleared on successful save
- Browser-only: if user returns on a different browser/device, no banner appears

#### Multi-tab localStorage

If user has two tabs open for the same deal:
- Both write to the same localStorage key
- Last write wins (tabs don't coordinate)
- Not surfaced in UI as a conflict
- Matches Group B multi-tab decision (last-write-wins silently)

---

### 10. Error and empty state inventory

Consolidated reference.

#### Pricing Agent full page

- **Loading (cold start):** skeleton on both panes. If >8s, subtle message about warehouse cold start.
- **Pricing config load failure:** full-page error, no inputs render. "Couldn't load pricing configuration. [Retry]"
- **Deal not found:** 404 with back link to Opportunities
- **Missing impl fee for band:** inline error; save blocked.
- **Missing module pricing:** inline error on module; module auto-unchecks; save allowed
- **Permissions (Viewer role):** 403 with message "Pricing Agent requires AIM Sales or higher"

#### Opportunity Pricing tab

- **Deal has no quote:** empty state with `[Open Pricing Agent →]` CTA
- **Deal has quote but fields missing:** renders what's available, shows "Data incomplete" tag
- **Load error:** "Couldn't load pricing data. [Retry]" banner, tab remains but no data

#### Version history

- **No versions (new deal):** shouldn't render — tab hidden if no quotes
- **Load error:** "Couldn't load version history. [Retry]"

#### Version detail (read-only)

- **Version not found:** 404
- **No longer exists (deleted?):** not possible in v2; quotes aren't deleted

#### Approval review page

- **Empty queue:** "🎯 Nothing pending. All quotes are either approved or still drafts."
- **Load error:** "Couldn't load review queue. [Retry]"
- **Permissions (not approver):** 403 with explanation

#### Deal picker (standalone)

- **No deals:** "You don't have any opportunities yet. [Create opportunity]"
- **Search empty:** "No deals match your search."

#### Notification

- **Email delivery failure (sender end):** silent; Sentry captures. No user-facing state.
- **Bell notification click routes to deleted deal:** fallback to Opportunities list with toast "This deal is no longer available."

---

### 11. Keyboard shortcuts — full inventory

Minimal set per Group C.

#### Global (every Pricing Agent page)

- `⌘K` / `Ctrl+K` — focus global search (Phase 9+ feature, reserved)

#### Pricing Agent full page

- `⌘S` / `Ctrl+S` — save as next version
- `⌘Enter` / `Ctrl+Enter` — generate / regenerate AI narrative
- `Esc` — return to opportunity page (with confirm if dirty)

#### Approval review page

- `↓` / `↑` — move focus between cards
- `a` — approve focused card
- `r` — reject focused card (opens textarea)
- `Enter` — open focused card in full Pricing Agent
- `Esc` — dismiss rejection textarea

#### Version history page

- `↓` / `↑` — navigate rows
- `Enter` — view focused version (read-only)
- `Esc` — back to opportunity

No `⌘D` for discount, no `⌘M` for margin toggle, no segment-cycling shortcut. Kept surface small.

---

### 12. Acceptance criteria (feeds REBUILD_PLAN.md Phase 4)

Phase 4 is complete when:

1. **Build a quote end-to-end:** user can open Pricing Agent on a deal, configure inputs, save v1. Verify row written to `sales.pricing.quotes` with `version = 1, is_active = TRUE, status = 'draft'` (above-floor) or `'approved'` (below-floor self-submission).
2. **Save below floor triggers approval email:** as a non-approver user, save below-floor quote. Verify email sent via Graph `Mail.Send` to `PRICING_APPROVER_EMAIL`, verify in-app bell notification fires, verify quote status = `'pending_review'`.
3. **Auto-approve self-submission:** as Kevin (approver), save below-floor quote. Verify status = `'approved'`, `approved_kind = 'auto_self'`, no email sent.
4. **Explicit approval:** approver navigates to review page, approves a pending quote. Verify status = `'approved'`, `approved_kind = 'explicit'`, notification fires to submitter.
5. **Rejection with canned reason:** approver rejects a pending quote with a canned chip. Verify `rejected_reason_kind = 'canned'`, `rejected_reason_code` set, `rejected_reason_text` = canned default text.
6. **Rejection with edited reason:** approver rejects with modified canned reason. Verify `rejected_reason_kind = 'custom'`, `rejected_reason_code` still set to originating chip, `rejected_reason_text` = edited version.
7. **Fork from pending:** seller edits a pending-review quote; verify v(N+1) created, original pending version unchanged, both visible in review queue.
8. **Fork from rejected:** seller edits a rejected quote; verify v(N+1) created per save cascade rules.
9. **Rollback:** user clicks rollback on v5; verify v5 becomes `is_active = TRUE`, v7 becomes `is_active = FALSE`, audit log entries on both.
10. **Rollback with edit:** after rollback to v5, user edits and saves. Verify new v6 created, old v6/v7 renumbered to v7/v8, audit log entries capture renumbering.
11. **Narrative generation:** click `[Generate narrative]`, verify `quote_narratives` row created with `source = 'ai_generated'`, `is_current = TRUE`.
12. **Narrative regeneration preserves rationale:** fill rationale fields, regenerate, verify new narrative reflects rationale context.
13. **Narrative manual edit creates new version:** manual edit via `[Edit]` button creates new `quote_narratives` row with `source = 'manual_edit'`.
14. **Deactivated approver silent fail:** set `PRICING_APPROVER_EMAIL` to invalid/deactivated user; save below-floor; verify save succeeds, Sentry captures email failure, no user-facing error.
15. **Multi-tab save:** two tabs on same deal save independently; verify both saves create sequential versions, no conflict UI.
16. **Draft restoration:** close browser with dirty inputs, reopen; verify banner appears; restore button loads localStorage state.
17. **Proposal pinning coupling:** Phase 6 generates proposal from v7 quote_id; verify proposal metadata stores quote_id (pinned), not version number.
18. **Proposal generation warn-but-allow:** generate proposal while v8 pending, v7 approved; verify confirm dialog appears, user can proceed with v7.
19. **Proposal generation blocked when no approved version exists:** all versions pending or rejected; verify proposal generation blocked with "Resolve pending review" message.
20. **Pricing config cache:** verify first load triggers Databricks query, subsequent loads within 24h use cache, manual invalidation clears cache.
21. **Access control:** verify `AIM Viewers` cannot access Pricing Agent (403); admins can see review page but cannot approve unless their email matches `PRICING_APPROVER_EMAIL`.
22. **Keyboard shortcuts:** verify `⌘S`, `⌘Enter`, `Esc` function as specified.

---

### 13. Open questions for Pass 3 (visual / interaction design)

| Question | Impact |
|---|---|
| Exact margin bar design (width, height, tick mark style for floor) | Pass 3 |
| Coral variant for below-floor: same token as status.danger, or a distinct hue | Pass 3 |
| COGS breakdown visualization — thin horizontal bars or just a table | Pass 3 |
| Module checkbox list — plain list or grouped by category (platform, AI, admin, clinical) | Pass 3 |
| Approval review card design — full mockup | Pass 3 |
| Rejection textarea styling — inline expansion vs separate panel | Pass 3 |
| Version history card layout — compact list vs timeline vs table | Pass 3 |
| Header state transitions (Draft → Pending → Approved animations) | Pass 3 |
| Loading skeleton specifics for the two-pane layout | Pass 3 |
| Toast positioning and animation curves | Pass 3 |

---

## 8. UI + interaction notes — Pass 3

Deferred to a future design session. This pass covers: dense power-user layout with CareInMotion brand colors, margin bar visual specifics (width, tick mark, color transitions), COGS breakdown visualization, module checkbox grouping, approval review card full mockup, rejection textarea styling, version history card layout, header state transitions, loading skeleton specifics, toast positioning and motion curves.

Depends on the rewritten `docs/STYLE_GUIDE.md` (already done) for tokens, and on Kevin's input on specific interactive moments (e.g., how the margin bar should feel as the discount slider moves).

---

## 9. API surface

Deferred to Phase 4 implementation. High-level route contract:

| Route | Method | Purpose |
|---|---|---|
| `/api/opportunities/:dealId/pricing/config` | GET | Active pricing config for this deal's segment (cached 24h) |
| `/api/opportunities/:dealId/pricing` | GET | Active quote for deal (version + full state) |
| `/api/opportunities/:dealId/pricing` | POST | Save new version (creates v(N+1), handles status cascade) |
| `/api/opportunities/:dealId/pricing/versions` | GET | All versions for deal |
| `/api/opportunities/:dealId/pricing/versions/:versionId` | GET | Single version read-only |
| `/api/opportunities/:dealId/pricing/versions/:versionId/approve` | POST | Explicit approval (approver only) |
| `/api/opportunities/:dealId/pricing/versions/:versionId/reject` | POST | Explicit rejection with reason (approver only) |
| `/api/opportunities/:dealId/pricing/rollback` | POST | Flip is_active to a target version |
| `/api/opportunities/:dealId/pricing/narrative` | POST | Generate / regenerate narrative (optionally per quote version) |
| `/api/opportunities/:dealId/pricing/narrative` | PATCH | Manual edit to current narrative |
| `/api/pricing/review` | GET | Pending approvals queue (approver only) |
| `/api/pricing/search` | GET | Deal picker typeahead |

All routes:
- Zod validation on request + response
- `getSessionUser()` auth guard
- Role check (`AIM Sales` or higher for most; `PRICING_APPROVER_EMAIL` match for approvals)
- Audit trail write where applicable
- Rate limiting per CLAUDE.md § Stack

---

## 10. Acceptance criteria

Folded into § 7.12. Also published into REBUILD_PLAN.md Phase 4 exit criteria.

---

## 11. Open questions

Rolling. Pass 1 and Pass 2 items resolved. Pass 3 items remain.

| Question | Stage | Owner |
|---|---|---|
| Exact margin bar design (width, height, tick mark style) | Pass 3 | Kevin |
| Coral variant for below-floor: same as status.danger or distinct hue | Pass 3 | Kevin |
| COGS breakdown visualization — horizontal bars or table | Pass 3 | Kevin |
| Module checkbox grouping (flat list vs categorized) | Pass 3 | Kevin |
| Approval review card full design mockup | Pass 3 | Kevin |
| Rejection textarea inline expansion vs separate panel | Pass 3 | Kevin |
| Version history card layout (list / timeline / table) | Pass 3 | Kevin |
| Header state transitions (Draft → Pending → Approved animations) | Pass 3 | Kevin |
| Loading skeleton specifics for two-pane layout | Pass 3 | Kevin |
| Toast positioning and motion curves | Pass 3 | Kevin |
| Partner contracts (Phase 4.5) — integrate when? | Phase 4.5 kickoff | Kevin |

All Pass 1 and Pass 2 questions resolved through this document.
