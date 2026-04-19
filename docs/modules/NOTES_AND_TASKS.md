# Notes & Tasks — Product Spec

**Status:** Sections 1–7, 9, 10 locked. Section 8 (UI + interaction) deferred to Pass 3.
**Last updated:** 2026-04-18
**Phase:** Phase 7.5 (templates + schema migration) + Phase 8 (main build) + Phase 8.5 (docx/PDF export) of REBUILD_PLAN.md
**Supersedes:** v1 "Notepad Agent" (see § 4 Migration from v1)

---

## 1. Purpose

Notes & Tasks is the capture-and-action layer of AIM. Sales operators paste raw notes from calls, demos, QBRs, and internal reviews; an AI agent turns them into a structured, professional record with a briefing, narrative, decisions, open items, risks, and extracted action items. Tasks live as first-class objects the user works from every day, independent of the notes they came from. Before a meeting, the same surface can generate a client-facing agenda from talking points. A user's day starts here, ends here, and the rest of AIM (opportunities, proposals, leads) feeds into it.

---

## 2. Primary user + jobs-to-be-done

### Primary user
Kevin and the CareInMotion sales team (3–10 people over the next year). Internal tool only.

### Secondary user (near-term, not hypothetical)
External consultants or part-time sales help brought in by Kevin and assigned tasks through the system.

### Jobs-to-be-done, in priority order

1. **"I want to know what I'm supposed to be doing today."**
   A task list, owned by me, sorted by urgency, with enough context that I can do the thing without re-opening the source note. This is the module's landing surface.

2. **"I just finished a call. I want to dump my notes somewhere that turns them into action without me re-reading them."**
   Raw notes in, structured output out. The AI produces a meeting briefing, narrative summary, decisions table, open items table, risks (with severity), next steps, and an extracted task list. Zero ceremony.

3. **"I want to send a professional agenda before the meeting."**
   Talking points in, formatted agenda out — same surface, different AI output. The agenda matches the CareInMotion document style (see `docs/DOCUMENT_STYLE.md` — to be created).

4. **"I want to delegate a follow-up to someone without losing track of it."**
   Assign a task to another user; see the status change; get surfaced on it if it stalls. Works for internal users today, external consultants in the near term.

5. **"I want to answer 'what did we discuss with [client] last quarter?' in 15 seconds."**
   Search across notes, filter by account / opportunity / meeting type, skim briefings.

6. **"I want every call with an account to appear on that account's timeline."**
   Notes link cleanly to opportunities, leads, and accounts. Activity aggregates without manual tagging.

### Explicit non-jobs (things this module does NOT try to do)

- Live meeting transcription or audio capture.
- Pre-meeting prep beyond the agenda generation (no briefing packs, no attendee research summaries).
- Project management — tasks don't have dependencies, subtasks, or time estimates.
- External integrations — Slack, calendar, email-in are deferred indefinitely.
- Mobile app — responsive web is enough.

---

## 3. Scope

### 3.1 In scope (Phase 7.5 + 8)

#### Notes
- Capture primitive: a **note** with meeting type, template category, entity association, attendees, and raw text body.
- A note can be created in two states: **pre-meeting** (raw talking points → AI generates agenda) or **post-meeting** (raw notes → AI generates summary + tasks + email draft). Both use the same object; the AI output is selected by which button the user clicks, not by a separate "stage" field.
- Four **template shells** drive the AI prompt and the rendered output structure:
  - `external_client` — formal third-person narrative, risks section surfaced, client-safe tone
  - `internal` — direct tone, decisions-forward, blunt about risks
  - `prospecting` — qualification-focused, next-steps heavy, tied to lead / opp stage
  - `sales_working` — working-session style, lighter summary, tasks-forward
- **Meeting type** is metadata (e.g., "QBR", "Discovery Call", "Proposal Review", "Leadership Review", "Sprint Review"). It's a tag for filtering and reporting. It does NOT pick the template — the template is chosen explicitly by the user or inferred from the entity category (Client → external_client, Internal → internal, Prospect → prospecting, etc.).
- **Category color coding** on note cards: Client, Sales, Prospect, Internal. Carried forward from v1.

#### AI outputs (per note)
- **Agenda generation** (pre-meeting) — structured agenda with purpose, discussion items, pre-reads, decisions needed, next steps with owners. Matches the CareInMotion agenda template structurally but rendered in-app.
- **Summary generation** (post-meeting) — briefing (2–3 sentences, formal third person), detailed narrative (discussion, key points, context), decisions made, open items, risks (with severity), next steps. Matches the CareInMotion notes template structurally but rendered in-app.
- **Task extraction** (post-meeting, part of summary generation) — produces structured action items with owner (resolved to a user via email), due date, status.
- **Email draft generation** (post-meeting) — carried forward from v1 with the grounding/anti-hallucination system prompt that landed late in v1.

#### Tasks (first-class objects)
- A **task** has: title, description, owner (user), due date, status, priority, source note (optional), linked entity (optional), `blocked_reason` (optional string), audit log (JSON array of changes).
- Status: `open`, `in_progress`, `done`, `cancelled` (four values — same as v1, kept simple per earlier decision). A task that's stuck is `open` with a non-null `blocked_reason` — we do not elevate Blocked to a first-class status.
- Priority: `high` / `medium` / `low` / `null` (user-set only, never AI).
- A task can exist without a source note (manually created from the `/tasks` page).
- A task assigned to another user shows up in their `/tasks` list; the delegator sees it in a "delegated" filter.
- **Bulk operations:** select multiple tasks, mark done / reassign / change priority / set due date.
- **Audit trail:** lightweight JSON log appended to each task on every state change (who, when, old value, new value). No dedicated audit UI in Phase 8; the log is inspectable by an admin query.

#### Visibility model
- Notes are **public (posted) by default.** Any team member can see any posted note.
- Author can toggle a note to **private** at any time; can toggle back to public at any time. No lock-in.
- There is no granular sharing (no "share with just these 2 people"). A note is either team-visible or author-only.
- Tasks inherit the source note's visibility but are effectively always visible to the owner and delegator regardless. A private note's tasks are visible only to author, owner, and delegator.

#### Templates (Phase 7.5, pre-dates main Notes & Tasks build)
- Four template shells (`external_client`, `internal`, `prospecting`, `sales_working`) stored in `sales.notepad.note_templates` (schema revised from v1).
- Each template has: shell definition (section headers, table columns), AI prompt variants for agenda and for summary, default category color, default meeting-type suggestions.
- Template authoring UI lives in admin/settings. Kevin can edit prompts and shells without a code change.
- Templates are versioned: editing an existing template creates a new version; existing notes keep their original template version.

#### Linking and navigation
- A note links to one primary **entity**: opportunity, lead, account, or "internal" (no entity). Inherited by tasks unless overridden.
- Attendees are attached to the note with internal/external split (carried forward from v1), contact record, title, organization.
- Navigation lanes: from an opportunity detail page → show all notes. From an account page → show all notes across opps. From a user → show all their assigned tasks.

#### Search
- Full-text search across note title, body, briefing, narrative, attendee names. 15-second goal: type "Horizon Health" and see all related notes.
- Filter chips: category, template, meeting type, date range, entity, has-tasks, has-risks.

### 3.2 Out of scope (Phase 8 MVP)

- **docx / PDF export** of agendas and notes. The in-app rendering is the shipped output in Phase 8. Phase 8.5 adds the branded document export leveraging whatever Phase 6 (Proposals) built for `@react-pdf/renderer`. When Phase 8.5 ships, the exports will match the Word templates Kevin provided on 2026-04-18.
- Live transcription, audio capture, or integration with meeting-platform APIs (Zoom, Teams, Google Meet).
- Recurring tasks.
- Task dependencies, subtasks, time estimates, time tracking.
- Task comments or discussion threads (conversations happen on the underlying opportunity / lead / account).
- Custom fields on tasks or notes.
- Granular sharing (notes are binary public/private).
- Task templates or checklists.
- Shared team-wide task views beyond "posted tasks" visibility. No "manager sees everyone's tasks" view in v2 MVP.
- Slack push, email-to-task, calendar sync.
- Mobile app.

### 3.3 Non-goals (explicit "no" to things that would seem natural)

These are scope boundaries, not just deferred features. Resist adding them later without explicit re-scoping.

- **No recurring tasks.** Sales follow-ups are one-time. "Every Monday pipeline review" belongs in a calendar, not a task list.
- **No task dependencies or subtasks.** A task with 3 subtasks is a project; AIM is not a project manager.
- **No time estimates or time tracking.** Sales tasks aren't billed hours.
- **No Kanban board view for tasks.** Tasks reward a list sorted by urgency, not a board. Single default view: list.
- **No task comments.** Conversations happen on the underlying entity.
- **No manager-only "team task" view.** Visibility is binary — posted or private — and applies equally to everyone.
- **No task priority beyond high/medium/low/none.** Urgency lives in due dates; priority is a soft tag.
- **No Blocked as a first-class status.** A blocked task is `open` with a `blocked_reason` string. Keeps the status enum small.

---

## 4. Migration from v1

v1's Notepad Agent is being replaced, not extended. This section names what carries forward and what breaks.

### 4.1 What v1 did well (keep)

- **Category color coding** (Client / Sales / Prospect / Internal) — kept verbatim as a fast visual scan aid. Tokens already in `tokens.ts`.
- **Meeting type taxonomy** as metadata — carried forward as a filter/reporting tag (not as a template selector).
- **Raw-notes-in, structured-out mental model.** The fundamental workflow is right; it just needs a better output format.
- **Email draft generation** with grounding/anti-hallucination system prompt — carried forward verbatim.
- **Attendee split: internal vs external** — carried forward.
- **Owner resolution by exact user match** — carried forward (no more first-name ILIKE).
- **AI model string `claude-sonnet-4-6`** — carried forward; read from `ANTHROPIC_MODEL` env var.
- **The v1 note ↔ entity link model** (notes link to one primary entity: opportunity / lead / account / internal-none) — carried forward.

### 4.2 What v1 did badly (replace)

- **Notepad landing page was a list of notes with no daily surface.** v2 replaces it with a `/tasks` page as the default landing surface. The note list lives at `/notes` as a secondary page.
- **AI summary output was unstructured.** v1 produced loose buckets; v2 produces a specific document structure (briefing → narrative → decisions → open items → risks → next steps → action items) matching the CareInMotion document style.
- **Tasks were buried inside notes.** v2 makes tasks first-class objects with their own page, their own search/filter, their own bulk operations.
- **Risks were not structured.** v2 adds a 3-level severity taxonomy (Critical / Watch / Monitoring) pulled from the CareInMotion notes template.
- **20+ meeting-type granularity drove the AI prompt.** v2 consolidates to 4 template shells; meeting type becomes a filterable tag.
- **No audit trail on task state changes.** v2 adds a lightweight JSON audit log per task.
- **No visibility model.** v2 adds posted-by-default with an unpost toggle.
- **No agenda generation.** v2 adds pre-meeting agenda as a first-class AI output (same mechanic as email draft).
- **`note_summaries` column names had 6 different failure modes in v1.** v2 treats `docs/SCHEMA.md` as the authoritative reference; every INSERT references constants from `DATABRICKS_TABLES`.
- **Owner display name title-cased from email prefix.** v2 joins `sales.core.users.display_name` on `owner_email` for the canonical display.
- **Notepad Agent branding.** v2 renames module to "Notes & Tasks" throughout.

### 4.3 What's new in v2 (v1 did not have)

- `/tasks` first-class page as the landing surface
- Agenda generation (pre-meeting AI output)
- Risk extraction with 3-level severity
- Task audit trail (JSON log)
- Public/private visibility model ("Post" toggle)
- 4 template shells (vs 20+ meeting-type-driven prompts)
- Template versioning
- Bulk task operations (multi-select → mark done, reassign, re-prioritize, re-due)
- Delegation view ("tasks I've assigned to others")
- `blocked_reason` string field on tasks for stuck-but-not-status-changed cases
- Branded docx/PDF export for agendas and notes (Phase 8.5)

### 4.4 Data carried forward

| v1 table | v2 disposition |
|---|---|
| `sales.notepad.notes` | Schema extended in Phase 8 migration. New columns: `visibility` (public/private), `posted_at`, `posted_by`, `template_key`, `template_version`. Existing rows back-filled (default `visibility='public'`, `template_key` inferred from `category`). |
| `sales.notepad.note_summaries` | Schema revised to match new output structure. New columns: `briefing`, `narrative_discussion`, `narrative_key_points`, `narrative_context`, and a structured `risks_json` column. Existing `exec_summary_text` kept for backward display of v1 notes. |
| `sales.notepad.note_actions` | Schema extended. New columns: `blocked_reason`, `audit_log_json`, `delegator_user_id`. Existing rows unchanged. |
| `sales.notepad.note_attendees` | Carried forward as-is. |
| `sales.notepad.note_email_drafts` | Carried forward as-is. |
| `sales.notepad.known_attendees` | Carried forward as-is. |
| `sales.notepad.note_templates` | **Schema replaced.** New `note_templates` schema with `template_key`, `shell_json`, `agenda_prompt`, `summary_prompt`, `version`, `active`. v1 rows not migrated — 4 new template rows seeded in Phase 7.5. |
| `sales.notepad.task_audit_log` | Retained as a fallback, but the new JSON-column approach supersedes it. May drop at Phase 10. |
| Views `v_note_latest_summary`, `v_note_search`, `v_open_actions`, `v_my_actions`, `v_email_draft_queue` | Recreated to match the new column layout. |

### 4.5 Data dropped

- `password_hash` column on `sales.core.users` (v1 auth; Entra SSO replaces it — see Phase 2 spec).
- v1 `note_templates` rows (schema is incompatible; 4 new rows seeded fresh).
- `note_summaries.exec_summary_text` is kept but becomes legacy — new notes populate `briefing` instead. After Phase 10, we decide whether to drop it.

### 4.6 URL / route changes

| v1 route | v2 route | Notes |
|---|---|---|
| `/notepad` | `/tasks` | **Landing surface changes entirely.** Default page now shows the user's task list. A redirect handles old bookmarks. |
| `/notepad` (list view) | `/notes` | Note list moves to a secondary page. |
| `/notepad/new` | `/notes/new` | Note creation route. |
| `/notepad/[noteId]` | `/notes/[noteId]` | Note detail route. |
| `/notepad/[noteId]/edit` | `/notes/[noteId]/edit` | Note edit route. |
| (none) | `/tasks/[taskId]` | **New.** Task detail page — tasks become navigable URLs. |
| (none) | `/settings/templates` | **New.** Template authoring UI. |

Redirects: `/notepad*` → corresponding `/notes*` or `/tasks*` route, with a one-time banner explaining the change.

### 4.7 User-facing breakage (flag for release note)

Things users did in v1 that no longer work the same way:

1. **Landing on `/notepad` showed a note list.** Now it redirects to `/tasks`. Users reaching for "my notes" must click the Notes tab.
2. **Notes were private-only.** They are now public-by-default. Users uploading sensitive content after v2 ships must explicitly unpost.
3. **Task status included `in_progress` but not `blocked`.** v2 adds a `blocked_reason` field; a task in progress but stuck is still `in_progress` with a reason — not a new status.
4. **The AI summary section headings changed.** Anyone referencing "Executive Summary" or "Key Decisions" in a saved workflow should be told these are now "Briefing" and "Decisions Made."
5. **Meeting types no longer change the AI prompt directly.** The AI is now driven by the 4 template shells. Users who relied on meeting-type-specific prompt behavior will see a different output format. The 4 shells cover the common cases.
6. **Note cards' sentiment, "≈ email," and "neutral" badges are gone.** They were shown in v1 without semantic clarity. The new card shows only: category, AI status, action count, risk count (if any), visibility icon.
7. **Email drafts that stored markdown fences in the DB** — the v1 bug was fixed in v1 itself; the fix carries forward. No user-facing change here, just noting it's preserved.

### 4.8 Migration discipline

- All v2 Notes & Tasks migrations go in `/migrations/versions/`, numbered sequentially after Phase 3's baseline.
- The Phase 8 migration is multi-statement: add columns, backfill existing rows, recreate views. Test in `sales_dev` before `sales` — always.
- Dropping columns (e.g., `exec_summary_text`) is deferred to Phase 10 — v1 reads them via the backwards-compat view pattern (see `docs/MIGRATIONS.md`).

---

## 5. Information architecture

### 5.1 Navigation model

#### Left rail

Single entry for the module within the AGENTS group of the left rail:

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
  Pricing
  Proposals
  Notes & Tasks   ← single entry, lives here
  Opportunity Coach
```

Active state on the left rail: when user is on any URL under the module, this entry is highlighted (`/tasks`, `/tasks/:id`, `/notes`, `/notes/new`, `/notes/:id`, `/settings/templates`). No count or badge on the entry — keeps the rail clean.

#### Top-bar tabs (within the module)

When user clicks "Notes & Tasks," they land on a page with a top-bar nav:

```
┌─────────────────────────────────────────────────────────────┐
│ ← Notes & Tasks                                             │
│ ┌────────┬────────┐                          [+ New]  [⚙]   │
│ │ Tasks  │ Notes  │                                         │
│ └────────┴────────┘                                         │
│                                                             │
│  [tab content renders here]                                 │
└─────────────────────────────────────────────────────────────┘
```

- **Tasks** tab is the default. URL: `/tasks`.
- **Notes** tab switches URL to `/notes`.
- Tab selection persists via URL — a bookmarked `/notes` lands on the Notes tab.
- `[+ New]` button: on Tasks tab, creates a new task (inline modal); on Notes tab, routes to `/notes/new`.
- `[⚙]` button: settings gear — opens template authoring at `/settings/templates` (admin role gated; hidden for non-admins).
- No breadcrumbs — tab state plus left-rail highlight is sufficient.

#### Deep routes

```
/tasks                    Tasks tab landing
/tasks/:taskId            Task detail (slide-over over /tasks or /notes)
/notes                    Notes tab landing
/notes/new                New note creation (full page)
/notes/:noteId            Note detail (slide-over over /notes or /tasks)
/notes/:noteId/edit       Edit note raw body (full page)
/settings/templates       Template authoring (admin only)
/settings/notifications   Email notification opt-out (all users)
```

### 5.2 Page — /tasks (Tasks tab, default landing)

The default landing for the module. Mental model: "what's on the team's plate right now?"

#### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Notes & Tasks  [Tasks | Notes]              [+ New task]  [⚙]    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Filter:  [View: All team ▾]  [Status: Open ▾]  [Owner: All ▾]       │
│           [Due: Any ▾]  [Entity: All ▾]  [Priority: All ▾]           │
│           🔍 Search tasks…                                           │
│                                                                      │
│ ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│  ▼ Overdue  (3)                                                     │
│  ┌───────────────────────────────────────────────────────────┐      │
│  │ ☐ Draft contract amendment for Horizon Health Plan        │      │
│  │    ▸ Kevin  ·  Due Apr 12  ·  3d late  ·  HI  ·  Horizon   │      │
│  │    Opportunities · Negotiate · Opp-47                      │      │
│  └───────────────────────────────────────────────────────────┘      │
│                                                                      │
│  ▼ Due today  (5)                                                   │
│                                                                      │
│  ▶ This week  (12)        (collapsed)                               │
│  ▶ Later  (8)             (collapsed)                               │
│  ▶ Done this week  (4)    (collapsed)                               │
└─────────────────────────────────────────────────────────────────────┘
```

#### Filter row (sticky when scrolling)

- **View** — segmented control: `All team` (default) · `My tasks` · `Delegated by me` · `Private`
- **Status** — `Open` (default, open + in_progress) · `In progress only` · `Done` · `Cancelled` · `All`
- **Owner** — `All` · specific user picker
- **Due** — `Any` · `Overdue` · `Today` · `This week` · `This month` · `No due date` · custom range
- **Entity** — `All` · `Opportunities` · `Leads` · `Accounts` · `Internal` · specific entity picker
- **Priority** — `All` · `High` · `Medium` · `Low` · `None`
- **Search** — full-text across task title, description, owner name, entity name

Filters combine with AND. Filter state persists in URL query string so bookmarks and shares work.

#### Task groups

- **Overdue** — past due, still open. Always expanded. Red accent on count.
- **Due today** — due_date = today. Expanded.
- **This week** — due in next 7 days. Collapsed.
- **Later** — due 8+ days out, or no due date. Collapsed.
- **Done this week** — completed in last 7 days. Collapsed. Shows recent accomplishments.

Empty group = hidden. All groups empty = "🎯 No tasks match your filters. Either clear the filters or celebrate — you're caught up. [Clear filters] [Back to All team]".

#### Task row

~48px tall. Structure:

```
☐  [title]
   [owner] · [due] · [late indicator] · [priority] · [entity link]
   [context line — what this task came from]
```

- **Checkbox** — toggle to `done` (strikethrough, animates to Done section after 2s)
- **Title** — click to open task slide-over
- **Owner** — avatar + first name. If delegated: "▸ [owner] · Delegated by [delegator]"
- **Due** — relative format (`Due Apr 12`, `Due today`, `No due date`)
- **Late indicator** — red `3d late` if overdue
- **Priority** — `HI` / `MED` / `LO` colored badge, or nothing
- **Entity link** — clickable account/opportunity/lead name
- **Context line** — grey. Source: `Note · Apr 12 discovery call`, `Opportunities · Negotiate · Opp-47`, `Delegated by Kevin`, or blank

#### Visibility indicators

- Private tasks show a `🔒` in the title row
- Private tasks appear in "All team" view only for owner + delegator — server-side filter

#### Bulk operations

- Click selects, shift-click ranges, cmd/ctrl-click toggles
- Bulk action bar slides up: `[Mark done] [Reassign…] [Due date…] [...]`
- All bulk ops respect visibility

#### Inline new task modal (from [+ New task])

```
┌────────────────────────────────────────────────────┐
│  New task                                     [×]  │
├────────────────────────────────────────────────────┤
│  Title                                             │
│  [                                              ]  │
│                                                    │
│  Description (optional)                            │
│  [                                              ]  │
│                                                    │
│  Owner: Me ▾    Due: None ▾    Pri: None ▾        │
│                                                    │
│  Link to (optional)                                │
│  [Typeahead ▾]                                     │
│                                                    │
│  ☐ Private to me and whoever I assign this to      │
│                                                    │
│                               [Cancel]  [Create]   │
└────────────────────────────────────────────────────┘
```

Manual tasks default to posted unless checkbox is ticked. No source note.

### 5.3 Page — /notes (Notes tab)

Secondary surface. List of notes grouped by date.

#### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Notes & Tasks  [Tasks | Notes]              [+ New note]  [⚙]    │
├─────────────────────────────────────────────────────────────────────┤
│  Filter:  [Visibility: All team ▾]  [Template: All ▾]                │
│           [Category: All ▾]  [Date: Last 30d ▾]  [Entity: All ▾]     │
│           [Has tasks: Any ▾]  [Has risks: Any ▾]                     │
│           🔍 Search notes, attendees, content…                       │
│ ─────────────────────────────────────────────────────────────────── │
│  Yesterday                                                           │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │▎Horizon Health Plan — Negotiation check-in         🔒   ···   │  │
│  │ Client · External client · Apr 17 · Kevin Ritter              │  │
│  │ Checked in on contract amendment status. VP of Procurement … │  │
│  │ • 3 tasks  · ⚠ 1 risk  · Horizon Health Plan (Opp-47)         │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ... more notes, grouped by date ...                                │
└─────────────────────────────────────────────────────────────────────┘
```

#### Note card

~80-100px tall. Click anywhere to open slide-over.

- **Left edge bar** — 3px, category color (Client emerald / Sales periwinkle / Prospect coral / Internal navy)
- **Title** — bold. If no user title, AI-generated after first save; fallback "Untitled · [date]"
- **Visibility indicator** — `🔒` private, `✓ Posted` when explicitly marked (vs default)
- **Metadata row 1** — `[Category] · [Template] · [Date] · [Author]`
- **Briefing preview** — first ~100 chars of AI-generated briefing
- **Metadata row 2** — `• N tasks  · ⚠ N risks  · [entity link]`. Counts only if >0.
- **`···` menu** — Open in slide-over · Open in full page · Edit · Duplicate · Mark private/public · Delete

#### Groups

By date: Today, Yesterday, [Day of week] (past 6 days), Older (Apr N). Within each, sorted by updated_at descending.

#### Empty state

"📝 No notes match your filters. Clear filters, or [+ Create a new note] to get started."

### 5.4 Page — /notes/new (full-page create)

Dedicated create page for deliberate note-taking.

#### Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Back to Notes                                 [Save draft] [Save] │
├─────────────────────────────────────────────────────────────────────┤
│    New note                                                          │
│                                                                      │
│    Title                                                             │
│    [                                                              ]  │
│                                                                      │
│    Template [External ▾]  Meeting type [Discovery ▾]  Visibility     │
│                                                         ● Posted     │
│                                                         ○ Private    │
│                                                                      │
│    Category [Prospect ▾]  Meeting date [Apr 18, 2026]                │
│                                                                      │
│    Linked entity [Meridian Physician Group ▾]                        │
│                                                                      │
│    Attendees                                                         │
│    External: [Sarah Patel, MD] [Jim Ortiz, COO] +                    │
│    Internal: [Kevin Ritter] [Sarah Chen] +                           │
│                                                                      │
│    Raw notes                                                         │
│    [                                                              ]  │
│    [                                                              ]  │
│    [                                                              ]  │
│                                                                      │
│    [Generate agenda (pre-meeting)]  [Generate summary + tasks (post)]│
└─────────────────────────────────────────────────────────────────────┘
```

#### Behavior

- **Save draft** — saves state, returns to /notes. Draft shows with "Draft" badge.
- **Save** — saves + returns to /notes. No AI invocation.
- **Generate agenda** — saves + runs agenda AI. Slide-over opens on result, agenda tab active.
- **Generate summary + tasks** — saves + runs summary AI. Slide-over opens, summary active.
- **Autosave** — every 10s to localStorage, 30s to server. Restore banner on reload if draft exists.
- **Attendees** — typeahead from `sales.notepad.known_attendees` (external) and `sales.core.users` (internal). New attendees auto-add to registry.
- **Template** — defaults per category (Prospect → Prospecting, etc.); user can override.
- **Leaving with unsaved changes** — confirm dialog with Save draft / Discard / Cancel.

### 5.5 Component — Note detail slide-over

Opens from note list click, or from a task row's source note context line.

#### Dimensions

40% of viewport width, minimum 560px. Slides from right. Background list stays visible, dimmed.

#### Structure

**Header (sticky):**
- Close button
- Note title
- Category · Template · Date · Author
- Visibility indicator (`🔒 Private` or `✓ Posted`)
- Linked entity link
- Actions: `[Edit]` · `[Full page]` · `[···]` menu (mark private/public, duplicate, delete)

**Body (scrollable) — renders the CareInMotion notes template structurally:**

```
BRIEFING
(2-3 sentence formal third person)

DISCUSSION
(prose paragraph)

KEY POINTS RAISED
(prose paragraph, attributions included)

CONTEXT & BACKGROUND
(prose paragraph, citations included)

DECISIONS MADE (N)
(table with # / decision / decided_by)

OPEN ITEMS (N)
(table with # / item / owner / target_date)

RISKS (N) ⚠ 1 Watch
(table with # / risk / severity / owner / mitigation, severity colored)

ACTION ITEMS (N)
(interactive table — mark done inline, click row for task slide-over)

NEXT STEPS
(prose paragraph)

EMAIL DRAFT
[Show draft] (collapsed by default)

ATTENDEES (N)
External (N):
  • Sarah Patel, MD
  ...
Internal (N):
  • Kevin Ritter
  ...

RAW NOTES
[Show raw] (collapsed)
```

Each AI-generated section has a `↻` icon in its header for per-section regeneration.

#### Interaction

- Click action item row → task detail slide-over stacks over note slide-over
- Click attendee name → tooltip/popover with contact detail
- Click linked entity → closes slide-over, routes to entity
- `Esc` → close slide-over

### 5.6 Component — Task detail slide-over

40% width, min 560px. Slides from right. Can stack over note slide-over.

#### Structure

**Header:**
- Close button
- Title (inline-editable)
- Status badge + priority tag
- Owner (editable via popover)
- Due date (editable via date picker popover)
- Entity link (editable via typeahead popover)
- Source note reference (if applicable, routes to note slide-over stacked)
- Visibility indicator

**Primary actions:**
- `[Mark done]` — most prominent
- `[Reassign]` — opens user picker popover
- `[···]` — change priority, set/clear due date, change status to in-progress/cancelled, add blocked reason, mark private/public, delete

**Body:**
- **Description** — inline editable
- **Blocked on** — shows only if `blocked_reason` set. Click to add/edit.
- **From note** — source note link (stacks slide-over if clicked)
- **History** — audit trail. Compact rows, newest first. Full JSON log visible only to admins + executives (Entra group `AIM Executives`).

All field edits autosave on blur. `Esc` closes.

### 5.7 Component — /settings/templates

Admin-only. 4 template cards + edit page per card.

#### List layout

```
┌─────────────────────────────────────────────────────────────────────┐
│ ← Settings  ›  Templates                          [+ New version]   │
├─────────────────────────────────────────────────────────────────────┤
│    Note templates                                                    │
│                                                                      │
│    [External client]  [Active v3]  Updated Apr 15 by Kevin           │
│                                    47 notes using this version       │
│                                    [Edit] [View history]             │
│                                                                      │
│    [Internal]         [Active v2]  Updated Apr 2 by Kevin            │
│                                    23 notes using this version       │
│                                    [Edit] [View history]             │
│                                                                      │
│    [Prospecting]      [Active v1]  ...                               │
│    [Sales working]    [Active v1]  ...                               │
└─────────────────────────────────────────────────────────────────────┘
```

#### Edit page

Exposes: description · default category · agenda prompt (textarea) · summary prompt (textarea) · shell JSON · `[Test with sample input]` · `[Save as new version]`.

Saving increments version and marks new as active; previous flips to inactive. Existing notes keep their original version; new notes use the latest.

### 5.8 Relationships between screens

**From /tasks:**
- Task title click → task slide-over (over /tasks)
- Source note context click → note slide-over (over /tasks)
- Entity link → navigate to opportunity/lead/account
- `[+ New task]` → inline modal
- Notes tab → /notes

**From /notes:**
- Note card click → note slide-over (over /notes)
- Entity link → navigate to entity
- `[+ New note]` → /notes/new (full page)
- Tasks tab → /tasks

**From /notes/new:**
- Back → /notes (confirm if dirty)
- After Save → /notes
- After Generate → slide-over on /notes with new note open

**From note slide-over:**
- Action item row → task slide-over (stacked)
- Entity link → closes slide-over, navigates
- Edit → /notes/:id/edit
- Full page → /notes/:id
- `Esc` → close

**From task slide-over:**
- Source note reference → note slide-over (stacked)
- Entity link → closes, navigates
- Reassign → user picker popover
- `Esc` → close

**From an opportunity/lead/account page (outside module):**
- "Activity" tab shows linked notes and tasks
- Click → opens corresponding slide-over over the entity page

---

## 6. Data model

### 6.1 Enums

Application-layer enforcement via Zod. Databricks stores as STRING with CHECK constraints where possible.

```typescript
type NoteVisibility = 'posted' | 'private'
type NoteTemplateKey = 'external_client' | 'internal' | 'prospecting' | 'sales_working'
type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled'
type TaskPriority = 'high' | 'medium' | 'low' | null
type RiskSeverity = 'critical' | 'watch' | 'monitoring'
type EntityType = 'opportunity' | 'lead' | 'account' | 'internal'
type UserRole = 'admin' | 'executive' | 'sales' | 'viewer' | null
type NotificationType =
  | 'task_assigned'
  | 'task_reassigned'
  | 'task_due_changed_by_delegator'
  | 'task_completed_by_owner'
  | 'note_shared_with_me'    // v2.1
type NotificationChannel = 'in_app' | 'email'
```

**Migration of v1 entity_type:** `'deal'` → `'opportunity'`, `'prospect'` → `'lead'`, `'client'` → `'account'`.

### 6.2 Table — `sales.notepad.notes`

**v1 carries forward:** `note_id`, `note_title`, `category`, `meeting_type`, `entity_type`, `entity_id`, `entity_name`, `account_id`, `account_name`, `meeting_date`, `ai_processed_flag`, `raw_notes`, `tags` (JSON), `is_deleted`, `created_at`.

**New columns (Phase 7.5 migration):**

```
visibility           STRING    NOT NULL DEFAULT 'posted'  -- 'posted' | 'private'
posted_at            TIMESTAMP NULL                       -- when first set to 'posted'
posted_by            STRING    NULL                       -- user_id of author
template_key         STRING    NULL                       -- 4 template keys
template_version     INT       NULL                       -- version used at creation
author_user_id       STRING    NOT NULL                   -- FK to sales.core.users
updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

**Backfill for v1 rows:**
- `visibility = 'posted'`
- `posted_at = created_at`
- `posted_by = author_user_id` (resolved from `owner_email` or `owner_name`)
- `template_key` inferred from `category`: Client → `external_client`, Sales → `sales_working`, Prospect → `prospecting`, Internal → `internal`
- `template_version = 1` (all v1 notes bootstrap to v1 template)
- `author_user_id` resolved via email match against `sales.core.users`
- `updated_at = COALESCE(last_edit_at, created_at)`

### 6.3 Table — `sales.notepad.note_summaries`

**v1 legacy columns (retained):** `summary_id`, `note_id`, `exec_summary_text`, `detailed_summary`, `key_decisions`, `open_items`, `risks`, `next_steps`, `created_at`.

**New columns (Phase 7.5 migration):**

```
briefing                     STRING  NULL  -- 2-3 sentence formal third person
narrative_discussion         STRING  NULL  -- prose paragraph(s)
narrative_key_points         STRING  NULL  -- prose with attributions
narrative_context            STRING  NULL  -- prose with citations
decisions_json               STRING  NULL  -- JSON array
open_items_json              STRING  NULL  -- JSON array
risks_json                   STRING  NULL  -- JSON array with severity
next_steps_text              STRING  NULL  -- prose
template_key                 STRING  NULL  -- snapshot
template_version             INT     NULL  -- snapshot
model_used                   STRING  NULL  -- e.g. 'claude-sonnet-4-6'
generation_duration_ms       INT     NULL  -- telemetry
```

**Backfill:** legacy columns stay populated for v1 notes; new columns are NULL. Rendering layer checks: if `briefing IS NOT NULL`, render new structure; else render legacy. No forced migration.

**JSON formats:**

`risks_json`:
```json
[
  { "id": "r1", "risk": "Budget review may delay signing", "severity": "watch",
    "owner_user_id": "usr-047", "mitigation": "Schedule informal alignment call" }
]
```

`decisions_json`:
```json
[
  { "id": "d1", "decision": "Proceed with amended pricing",
    "decided_by_user_id": "usr-123", "decided_by_name": "Sarah Patel, MD",
    "decided_by_is_external": true, "decided_on": "2026-04-17" }
]
```

`open_items_json`:
```json
[
  { "id": "oi1", "item": "Confirm board approval threshold",
    "owner_user_id": "usr-047", "owner_name_fallback": null,
    "target_date": "2026-04-24" }
]
```

**Note:** Open items (inside `note_summaries`) are distinct from tasks (in `note_actions`). Open items are meeting-record artifacts; tasks are work artifacts. AI may generate both from the same raw notes.

Constraint: one summary row per note (`UNIQUE(note_id)`).

### 6.4 Table — `sales.notepad.note_actions` (tasks)

**v1 carries forward:** `action_id`, `note_id`, `task`, `owner_display` (deprecated), `owner_user_id`, `owner_email` (deprecated), `due_date`, `status`, `priority`, `closed_at`, `closed_by`.

**New columns (Phase 7.5 migration):**

```
title                STRING    NOT NULL  -- canonical name; `task` kept as alias
description          STRING    NULL      -- longer body (new)
blocked_reason       STRING    NULL      -- open + stuck
delegator_user_id    STRING    NULL FK → sales.core.users
entity_type          STRING    NOT NULL DEFAULT 'internal'
entity_id            STRING    NULL
entity_name          STRING    NULL      -- denormalized for list speed
visibility           STRING    NOT NULL DEFAULT 'posted'
audit_log_json       STRING    NULL      -- JSON array of events
source_extracted     BOOLEAN   NOT NULL DEFAULT FALSE
is_deleted           BOOLEAN   NOT NULL DEFAULT FALSE
deleted_at           TIMESTAMP NULL
created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

**Backfill:**
- `title = task`
- `entity_type/id/name` inherited from parent note
- `visibility = 'posted'`
- `delegator_user_id = NULL`
- `audit_log_json = '[]'`
- `source_extracted = TRUE` (v1 tasks all came from notes)
- `description = NULL`
- `is_deleted = FALSE`

**Cascade rules (application layer — enforced by mutation endpoints, not DB triggers):**

- Note soft-delete → all tasks with matching `note_id` soft-delete
- Note visibility flip → tasks with `source_extracted = TRUE` update visibility
- Note entity change → tasks with `source_extracted = TRUE` that still match old entity update
- Manually-overridden tasks (entity differs from note) are not touched

**Audit log format:**
```json
[
  { "ts": "2026-04-12T14:32:00Z", "actor_user_id": "usr-001",
    "event": "created",
    "fields": { "title": "Draft contract amendment", "owner_user_id": "usr-001",
                "due_date": null, "priority": null, "status": "open" } },
  { "ts": "2026-04-14T09:15:00Z", "actor_user_id": "usr-001",
    "event": "updated",
    "fields": { "priority": { "old": null, "new": "high" } } },
  { "ts": "2026-04-15T10:02:00Z", "actor_user_id": "usr-001",
    "event": "delegated",
    "fields": { "delegator_user_id": { "old": null, "new": "usr-001" },
                "owner_user_id": { "old": "usr-001", "new": "usr-023" } } }
]
```

Append-only. Each mutation endpoint writes one entry.

### 6.5 Table — `sales.notepad.note_templates` (schema REPLACED)

v1 schema discarded. New schema supports versioning + per-template prompts.

```
template_id          STRING    PK
template_key         STRING    NOT NULL      -- 4 keys
version              INT       NOT NULL      -- starts at 1
display_name         STRING    NOT NULL      -- e.g. "External client"
description          STRING    NULL
default_category     STRING    NULL
agenda_prompt        STRING    NOT NULL      -- full AI prompt
summary_prompt       STRING    NOT NULL      -- full AI prompt
shell_json           STRING    NOT NULL      -- JSON shell definition
active               BOOLEAN   NOT NULL DEFAULT FALSE
created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
created_by_user_id   STRING    NOT NULL FK → sales.core.users
updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

**Versioning:** editing a template creates a new row with incremented version, marks active; previous active flips to inactive. Existing notes keep their `template_version` — renders use the specific version, not the latest.

**Seeding (Phase 7.5):** 4 rows with `version = 1`, `active = TRUE`, one per template_key. Prompts authored by Kevin in Phase 7.5 session(s).

### 6.6 Table — `sales.notepad.note_agendas` (new)

Parallel to `note_summaries` and `note_email_drafts`.

```
agenda_id                STRING    PK
note_id                  STRING    NOT NULL FK → notes.note_id
meeting_purpose          STRING    NULL
discussion_items_json    STRING    NOT NULL  -- JSON array
pre_reads_json           STRING    NULL
decisions_needed_json    STRING    NULL
next_steps_json          STRING    NULL
attendees_snapshot       STRING    NULL
template_key             STRING    NOT NULL
template_version         INT       NOT NULL
model_used               STRING    NULL
generation_duration_ms   INT       NULL
is_current               BOOLEAN   NOT NULL DEFAULT TRUE
created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

Regenerating creates a new row; old flips to `is_current = FALSE`.

### 6.7 Table — `sales.notepad.notifications` (new)

```
notification_id          STRING    PK
recipient_user_id        STRING    NOT NULL FK → sales.core.users
type                     STRING    NOT NULL  -- NotificationType enum
channel                  STRING    NOT NULL  -- 'in_app' | 'email'
source_type              STRING    NOT NULL  -- 'task' | 'note'
source_id                STRING    NOT NULL  -- action_id or note_id
title                    STRING    NOT NULL
body                     STRING    NULL
action_url               STRING    NULL      -- deep link
actor_user_id            STRING    NULL FK → sales.core.users
read_at                  TIMESTAMP NULL
read_in_app_at           TIMESTAMP NULL
dismissed_at             TIMESTAMP NULL
delivery_status          STRING    NOT NULL DEFAULT 'pending'
                                            -- 'pending'|'sent'|'failed'|'skipped'
sent_at                  TIMESTAMP NULL
failure_reason           STRING    NULL
created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
```

- One notification event → 2 rows (one per channel).
- In-app row: `delivery_status = 'sent'` immediately.
- Email row: `'pending'` → background worker calls Graph `Mail.Send` → `'sent'` or `'failed'`.
- Recipient's own actions don't notify them (self-actions produce no rows).
- Index `(recipient_user_id, read_at, created_at DESC)` for bell queries.
- Retention: 90-day archive of read notifications (post-MVP housekeeping).

### 6.8 Schema changes — `sales.core.users`

```
entra_object_id          STRING    NULL      -- stable Entra identifier
entra_groups_json        STRING    NULL      -- JSON array, refreshed on login
role                     STRING    NULL      -- derived from entra_groups_json
last_login_at            TIMESTAMP NULL
password_hash            STRING    -- v1 legacy, no longer read
```

**Role derivation (every login):**

```typescript
function deriveRole(groups: string[]): UserRole | null {
  if (groups.includes('AIM Admins')) return 'admin'
  if (groups.includes('AIM Executives')) return 'executive'
  if (groups.includes('AIM Sales')) return 'sales'
  if (groups.includes('AIM Viewers')) return 'viewer'
  return null  // no group → login fails
}
```

User in no AIM group → "Access denied. AIM access requires membership in an AIM group. Contact Kevin."

**Graph scope required:** `GroupMember.Read.All` (added to Entra app registration in Phase 2).

### 6.9 Views (recreated in migration)

**`sales.notepad.v_note_latest_summary`** — list-page data source. Joins notes + summaries, computes open_task_count / total_task_count / risk_count.

**`sales.notepad.v_open_actions`** — /tasks data source. Joins note_actions + users (owner, delegator) + notes. Filters `is_deleted = FALSE AND status IN ('open','in_progress')`. Application filters visibility at query time.

**`sales.notepad.v_note_search`** — full-text search view. Assembles `search_text` via `CONCAT_WS` across note title, raw body, briefing, narrative, attendee names.

**`sales.notepad.v_my_actions`** — v1 legacy view using SQL `current_user()`. Retained for backward compat; v2 does NOT use it (filters by JWT user_id instead). Dropped at Phase 10.

**`sales.notepad.v_email_draft_queue`** — unchanged.

### 6.10 Indexes (Z-ordering)

Applied after Phase 7.5 migration by a scheduled Databricks job:

```sql
OPTIMIZE sales.notepad.notes           ZORDER BY (author_user_id, meeting_date);
OPTIMIZE sales.notepad.note_actions    ZORDER BY (owner_user_id, status, due_date);
OPTIMIZE sales.notepad.note_summaries  ZORDER BY (note_id);
OPTIMIZE sales.notepad.note_agendas    ZORDER BY (note_id, is_current);
OPTIMIZE sales.notepad.notifications   ZORDER BY (recipient_user_id, read_at, created_at);
```

### 6.11 Migration plan

**Migration `006_notes_tasks_schema.sql` (Phase 7.5):**
- ALTER statements on `notes`, `note_summaries`, `note_actions`, `users`
- Backfill UPDATEs for each
- Replace `note_templates` (DROP + CREATE)
- CREATE TABLE `note_agendas`
- CREATE TABLE `notifications`
- CREATE OR REPLACE VIEW for all notepad views
- INSERT 4 seed rows into new `note_templates`

Phase 8 ships without a schema migration — all infrastructure already in place.

### 6.12 Zod schemas

Implementation in Phase 8. Names in `/src/schemas/notes_and_tasks.ts`:

- `NoteSchema`, `NoteSummarySchema`, `NoteAgendaSchema`, `NoteEmailDraftSchema`
- `TaskSchema`, `TaskCreateSchema`, `TaskUpdateSchema`
- `AttendeeSchema`, `TemplateSchema`, `NotificationSchema`

All mutations validate via `*CreateSchema` / `*UpdateSchema` on receipt. Read schemas used to parse DB results with `.parse()` for loud failures on drift.

---

## 7. Workflows

Shared conventions across all workflows:

- **Undo toast pattern.** After any reversible state change, toast slides up from bottom-right with [Undo] button. 5-second window. Applies to: mark task done, delete note, delete task, reassign, unpost.
- **Autosave cadence.** 10 seconds to localStorage, 30 seconds to server. Explicit save buttons force immediate save.
- **Failed state icon.** Red circle with `!` where the Generate button was. Click to retry.
- **Processing state icon.** Animated spinner where the Generate button was. Non-blocking — user can continue.
- **Section regeneration.** Every AI-generated section has a `↻` icon in its header. Click regenerates just that section.

### 7.1 Workflow — Capture a note post-meeting

**Happy path:**
1. User lands on `/tasks`, clicks Notes tab → `/notes`
2. Clicks `[+ New note]` → `/notes/new`
3. Fills metadata (title, template, meeting type, visibility, category, meeting date, linked entity, attendees)
4. Pastes raw notes
5. Clicks `[Generate summary + tasks]`

**During generation:**
- Both Generate buttons replaced by single processing icon + "Generating…"
- Form fields remain editable
- Top-right toast: "Generating summary — this may take 30-60 seconds."
- If user navigates away: note saved as draft, generation continues server-side, bell notification fires on completion

**On success:**
- Server creates summary + tasks + optional email draft rows
- User redirected to `/notes` list
- New note appears at top of Today group, highlighted briefly
- Slide-over opens automatically with summary visible
- Toast: "Note created with 3 tasks. [View] [Dismiss]"

**On failure:**
- User remains on `/notes/new` — form data preserved
- Processing icon → failed icon (red `!`)
- Hover: "AI generation failed. Click to retry."
- After 3 consecutive failures in 10 minutes: "AI is having trouble. Save as draft and try again later?"

**On partial output:**
- Note created with available sections
- Slide-over opens with subtle banner: "⚠ Some sections were not generated. [Regenerate missing sections]"
- Missing sections render "Not generated — [↻ Regenerate]"

**Save-as-draft path:**
- `[Save draft]` saves without AI invocation
- Note appears in `/notes` list with "Draft" badge
- Opening a draft shows raw body + two Generate buttons

**Empty states:**
- No raw notes: Generate buttons disabled. Tooltip: "Paste or type meeting notes to generate a summary."
- Raw notes <50 chars: Generate enabled with warning tooltip.

**Keyboard shortcuts on /notes/new:**
- `⌘S` — Save draft
- `⌘Enter` — Save + Generate summary
- `⌘⇧Enter` — Save + Generate agenda
- `Esc` — Exit (confirm if dirty)

### 7.2 Workflow — Create an agenda pre-meeting

Structurally identical to 7.1 but clicks `[Generate agenda]` instead.

**Differences:**
- Processing text: "Generating agenda…"
- Output: `note_agendas` row (no tasks extracted)
- Slide-over opens with Agenda section visible; Summary "Not generated — meeting hasn't happened yet"
- Post-meeting, user clicks `[Add meeting notes]` in slide-over:
  - Appends to raw body below `--- MEETING NOTES ---` divider
  - Enables `[Generate summary + tasks]`
  - Running it produces summary sections alongside existing agenda

**Copy agenda to external:**
- Agenda section header: `[Copy as markdown]` button
- Copies formatted markdown (including tables) to clipboard
- Toast: "Agenda copied to clipboard."
- Phase 8.5 adds `[Download as .docx]` matching the CareInMotion template.

### 7.3 Workflow — Daily task management

**Landing behavior:**
1. User signs in → `/overview`
2. Clicks left-rail "Notes & Tasks" → `/tasks`
3. Default filter: View = "All team", Status = "Open"
4. Groups render: Overdue (expanded, red count), Due today (expanded), This week, Later, Done this week (collapsed)

**Triage actions (per task):**
- **Mark done:** Click checkbox. Animates, slides to Done. Toast "Task marked done. [Undo]".
- **Reassign:** Click owner avatar → popover with typeahead → select → update in place. Notification fires. Toast "Reassigned to Sarah. [Undo]".
- **Change due date:** Click due-date pill → date picker popover → select.
- **Change priority:** Click priority pill → dropdown → select.
- **Open detail:** Click title or row (not pills) → slide-over.

**Filter + search:**
- Search debounced 300ms
- Filter state persists in URL
- "Clear all filters" button when any non-default

**Bulk operations:**
- Click row to select (no open)
- Shift-click for range; cmd/ctrl-click to toggle
- Bulk bar slides up: `[Mark done] [Reassign…] [Due date…] [...]`
- Undo reverses all selected

**Empty states:**
- No matches: "🎯 No tasks match your filters..."
- First-time user: "Tasks you create from notes or add manually will show up here. [+ Create your first task]"

**Keyboard shortcuts on /tasks:**
- `⌘K` — focus search
- `⌘⇧N` — new task modal
- `↑`/`↓` — navigate rows
- `Space` — mark done
- `Enter` — open detail
- `Esc` — clear selection

### 7.4 Workflow — Delegate a task

**Path A (delegate during note creation):**
1. Run Workflow 7.1 (new note + Generate)
2. AI extracts tasks; matches owner names to `sales.core.users` by fuzzy display-name
3. Matched tasks: `owner_user_id = matched`, `delegator_user_id = current_user`
4. Recipient receives 2 notifications (in-app bell + email via Graph)
5. Delegator sees tasks under "View: Delegated by me" filter

**Path B (reassign after creation):**
1. Click owner avatar on task row → popover → typeahead → select
2. Owner updates, audit log entry, notification fires
3. Toast "Reassigned to Sarah Chen. [Undo]"

**Delegated task visibility:**
- Delegator view: sees task with new owner's avatar, "Delegated" badge
- Delegatee view: task in own list with "Delegated by Kevin" context line
- Delegatee marks done: delegator receives "Sarah completed: [title]" notification

**Unmatched owner (AI can't resolve):**
- Task created with `owner_user_id = NULL`, title prefixed "⚠ Unassigned:"
- Appears in current user's list with red "Unassigned" badge
- User opens, assigns from typeahead

**Notification matrix:**

| Event | Notify? | Recipient |
|---|---|---|
| Task assigned | Yes | Owner (unless = creator) |
| Task reassigned | Yes | New owner |
| Due date changed by delegator | Yes | Owner |
| Due date changed by owner | No | — |
| Priority changed by delegator | Yes | Owner |
| Priority changed by owner | No | — |
| Task marked done by owner | Yes | Delegator (if any) |
| Task marked cancelled by owner | Yes | Delegator (if any) |
| Task deleted | No | — |

### 7.5 Workflow — Search

**Path A — from /notes:**
1. Click Notes tab
2. Type search query (debounced 300ms)
3. Full-text match across titles, briefings, attendee names, entity names
4. Click note → slide-over
5. Click entity link to drill further

**Path B — from /tasks:**
- Same pattern, scoped to tasks. Full-text across title, description, owner name, entity name.

**Empty results:**
- "No notes found for 'xyz'. Try a different keyword, clear filters, or [Create a new note]."

**Global search (⌘K across all of AIM)** — deferred to post-v2.

### 7.6 Workflow — Admin template authoring

Phase 7.5 ships the authoring surface. Phase 8 is first use.

**Happy path:**
1. User in `AIM Admins` → `/settings/templates`
2. Sees 4 template cards with active version info
3. Click `[Edit]` on "External client" → edit form
4. Edit prompt textarea
5. Click `[Test with sample input]` → modal with sample area
6. Paste raw notes → Run → see mock AI output
7. Close modal → `[Save as new version]`
8. New row in `note_templates`, version incremented, active flipped
9. Toast "External client template saved as v4."
10. Existing notes keep their version; new notes use v4

**Non-admin:** 403 "Template authoring requires admin access. Contact Kevin."

**Dangerous edits:** save blocked if prompt would break shell (server-side parse check on sample).

**Version history:** `[View history]` → list of versions with created_at, author, diff preview. Read-only in MVP.

### 7.7 Workflow — Unpost / re-post a note

**Happy path:**
1. Open posted note's slide-over
2. `···` menu → Make private
3. Prompt: "This note has been posted for 3 days. Your team may have already seen it. Unpost anyway?" [Cancel] [Unpost]
4. User confirms
5. Note → private. Cascade: tasks with `source_extracted = TRUE` flip to private. Audit entries.
6. Slide-over updates: 🔒 appears, Posted badge gone
7. Toast: "Note made private. 3 tasks also made private. [Undo]"
8. Undo within 5s reverses cascade

**Re-posting:** same flow, no warning prompt (posting is the default state).

**Edge cases:**
- Private note with tasks to others: extended warning: "This note has 2 tasks assigned to others (Sarah, Jim). Making it private will hide the note from them. Their tasks will also be hidden. Continue?"
- Delegators retain visibility of delegated tasks regardless of source note visibility.

### 7.8 Workflow — Edit or delete a note

**Edit:**
1. Slide-over → `[Edit]` → `/notes/:id/edit` (full page)
2. Same form as `/notes/new`, pre-populated
3. User can edit: title, template, meeting type, visibility, category, meeting date, linked entity, attendees, raw notes
4. Cannot edit AI-generated content directly (regenerate from slide-over instead)
5. Save → audit trail
6. If `entity_type/id` changed → cascade to tasks with `source_extracted = TRUE`

**Delete:**
1. Slide-over → `···` menu → Delete
2. Confirmation modal: "Delete this note? It will be archived. 3 tasks will also be archived."
3. Confirm → soft-delete cascade: note → tasks → agendas
4. Toast "Note deleted. [Undo]"
5. 5s undo window; after that, permanent soft-delete. Admin-only restore (not in MVP).

**Autosave conflict (two tabs):**
1. Tab A + Tab B editing same draft
2. Tab B autosaves first; server has Tab B's state
3. Tab A autosave attempt → server detects conflict (`updated_at` mismatch)
4. Tab A banner: "Another session edited this note. Your recent changes are saved locally only. [View server version] [Overwrite]"
5. User chooses.

### 7.9 Workflow — Per-section AI regeneration

**Happy path:**
1. Slide-over open on note with summary
2. Scroll to target section (e.g. Decisions Made)
3. Click `↻` in section header → processing spinner replaces section content
4. Server re-runs AI with: raw body + existing summary as context + focused prompt: "Regenerate ONLY the decisions section. Do not contradict existing content."
5. Returns new section data; server updates atomically
6. UI updates; audit entry logged

**Failed regeneration:** failed icon in place of section. Original content preserved server-side. Click to retry.

**Regeneratable sections:** briefing, narrative (as a group), decisions, open items, risks, action items, next steps, email draft, agenda.

**Special case — regenerating Action Items (destructive):**
1. Click `↻` on Action Items
2. Modal: "Regenerate action items? This will replace existing tasks. Tasks already completed, cancelled, or reassigned won't be affected — only open, unmodified tasks are regenerated."
3. Server keeps tasks where: `status != 'open'` OR `updated_at > created_at` OR `delegator_user_id` was set after creation
4. Soft-deletes remaining
5. AI extracts new tasks
6. Toast: "Regenerated 2 tasks. 1 task kept (reassigned to Sarah)."

### 7.10 Workflow — Notifications

**Bell (in top bar, every page):**
- Badge count = unread count
- Click → dropdown (not a page navigation)
- Up to 10 most recent, newest first
- Row: `[avatar] [title] [preview] [relative time]`
- Unread rows have background tint
- Row click → navigates to `action_url`
- Bottom links: "Mark all as read" · "View all" → `/notifications`

**Email delivery:**
- Background worker processes `channel='email' AND delivery_status='pending'`
- Calls Graph `Mail.Send` (from service principal `aim@careinmotion.com`)
- Subject: "[AIM] Sarah assigned you a task: [title]"
- Body: title + description + due + priority + deep link
- On success: `sent`, records `sent_at`
- On failure: `failed`, logs error, no auto-retry
- Admin manual retry: post-MVP

**Opt-out:**
- `/settings/notifications` — single toggle "Email me about task changes" (default ON)
- OFF → email rows skipped (`delivery_status = 'skipped'` for audit trail)
- In-app bell cannot be disabled

**Read-state:**
- Opening dropdown marks visible (top 10) as read on close
- Row click marks that row read
- "Mark all as read" marks all user's unread

### 7.11 Error and empty state inventory

**/tasks:**
- Empty (no match): "🎯 No tasks match your filters..."
- Empty (first-time): "Tasks you create from notes or add manually will show up here."
- Error: "Couldn't load tasks. [Retry]" with last cache if available
- Slow warehouse: skeleton rows first

**/notes:**
- Empty (no match): "📝 No notes match your filters."
- Empty (first-time): "Capture your first meeting to get started. [+ New note]"
- Error: "Couldn't load notes. [Retry]"

**/notes/new:**
- Missing required field: inline red "Title is required to save."
- Server error on save: "Couldn't save. [Retry]" — form not cleared
- AI generation failure: failed icon + retry per Workflow 7.1
- Raw notes <30 chars: tooltip warning, doesn't block

**Note slide-over:**
- Loading: skeleton with section headers
- Error: "Couldn't load this note. [Retry]"
- AI section failed: per-section failed icon

**Task slide-over:**
- Loading: skeleton
- 404 (deleted): "This task was deleted. [Go back to tasks]"
- Private task access denied: defensive "Access denied" + redirect (should never render if list is filtered correctly)

**Notifications dropdown:**
- Empty: "You're caught up. 🎉"
- Error: "Couldn't load notifications. [Retry]"

**/settings/templates:**
- Permission denied: "Template authoring requires admin access."
- Save failure: inline error

### 7.12 Keyboard shortcuts — full inventory

**Global:** `⌘K` — global search (Phase 9+)

**On /tasks:** `⌘K` (focus search), `⌘⇧N` (new), `↑`/`↓` (navigate), `Space` (done), `Enter` (open), `Esc` (clear)

**On /notes:** `⌘K`, `⌘⇧N`, `↑`/`↓`, `Enter`, `Esc`

**On /notes/new and /notes/:id/edit:** `⌘S` (save draft), `⌘Enter` (save + generate summary), `⌘⇧Enter` (save + generate agenda), `Esc` (exit)

**Inside slide-over:** `Esc` (close), `e` (edit)

**In task slide-over specifically:** `d` (due date), `r` (reassign), `p` (cycle priority), `x` (mark done)

### 7.13 Acceptance criteria (feeds REBUILD_PLAN.md Phase 8)

Phase 8 is complete when:

1. User can create a note end-to-end: metadata + raw body + Generate summary + tasks → structured output matching CareInMotion template with ≥3 tasks extracted
2. User can create an agenda: talking points + Generate agenda → structured output matching CareInMotion agenda template
3. Default /tasks view: lands on All team, groups by urgency, filter dropdowns work, URL reflects filter state
4. Delegate a task: click owner → typeahead → select → notification fires (in-app + email attempt)
5. Mark done with undo: click → strikethrough + toast + undo restores within 5s
6. Visibility toggle: unpost → warning → tasks cascade → undo reverses full cascade
7. Per-section regeneration: click `↻` → processing icon → new content on success
8. Entra group gate: user not in any AIM group can't log in; `AIM Executives` sees task audit history; `AIM Sales` cannot
9. Search: returns results within 2 seconds for <1000 rows
10. Bulk operations: multi-select 3+ → mark done → all transition, single toast
11. Autosave: two-tab edit surfaces conflict per Workflow 7.8
12. Settings: admin edits template, saves new version, tests with sample input, sees version history

---

## 8. UI + interaction notes — Pass 3

Deferred to a future design session. This pass covers: visual direction aligned with `docs/STYLE_GUIDE.md` (once rewritten with CareInMotion colors), motion specifications, exact processing/failed icon designs, toast positioning and animation curves, color usage for priority/severity pills, empty-state illustrations, keyboard focus ring styling, slide-over animation timing.

---

## 9. API surface

Deferred to Phase 8 implementation. High-level contract:

| Route | Method | Purpose |
|---|---|---|
| `/api/notes` | GET | List, paginated, filtered |
| `/api/notes` | POST | Create new note |
| `/api/notes/:id` | GET | Single note + summary + agenda + email draft |
| `/api/notes/:id` | PATCH | Update note metadata/body |
| `/api/notes/:id` | DELETE | Soft-delete cascade |
| `/api/notes/:id/visibility` | PATCH | Toggle posted/private with cascade |
| `/api/notes/:id/generate-summary` | POST | Full summary + tasks generation |
| `/api/notes/:id/generate-agenda` | POST | Agenda generation |
| `/api/notes/:id/generate-email-draft` | POST | Email draft generation |
| `/api/notes/:id/sections/:section/regenerate` | POST | Per-section regeneration |
| `/api/tasks` | GET | List, paginated, filtered by visibility |
| `/api/tasks` | POST | Create manual task |
| `/api/tasks/:id` | GET | Single task + history |
| `/api/tasks/:id` | PATCH | Update (owner, due, priority, status, etc.) |
| `/api/tasks/:id` | DELETE | Soft-delete |
| `/api/tasks/bulk` | PATCH | Multi-task update |
| `/api/notifications` | GET | User's notifications, paginated |
| `/api/notifications/:id/read` | PATCH | Mark read |
| `/api/notifications/mark-all-read` | POST | Mark all as read |
| `/api/templates` | GET | List active templates (public) |
| `/api/templates/:key/versions` | GET | Version history (admin) |
| `/api/templates/:key/edit` | POST | Save new template version (admin) |
| `/api/settings/notifications` | GET/PATCH | User opt-out preference |

All routes:
- Zod validation on request + response
- `getSessionUser()` auth guard
- Audit trail write where applicable
- Rate limiting per Section 4 of CLAUDE.md

---

## 10. Acceptance criteria

Folded into § 7.13. Also published into REBUILD_PLAN.md Phase 8 exit criteria (updated in a separate migration).

---

## 11. Open questions

Rolling list. Pass 1 items resolved in Pass 2 are removed.

| Question | Stage | Owner |
|---|---|---|
| Exact processing icon design (spinner style, color, size) | Pass 3 | Kevin |
| Exact failed icon design + error presentation | Pass 3 | Kevin |
| Toast positioning + animation curves | Pass 3 | Kevin |
| Color usage for task priority pills (HI/MED/LO) | Pass 3 | Kevin |
| Color usage for risk severity (Critical/Watch/Monitoring) | Pass 3 | Kevin |
| Empty-state illustrations — custom or typographic | Pass 3 | Kevin |
| Keyboard-focus ring styling | Pass 3 | Kevin |
| Slide-over animation — duration + easing | Pass 3 | Kevin |
| Task row hover state — tint only or richer | Pass 3 | Kevin |
| Phase 8.5 docx/PDF export engine — reuse Phase 6 exactly or different | Phase 8.5 kickoff | Kevin |

All Pass 1 and Pass 2 questions resolved through this document. Pass 3 remaining.
