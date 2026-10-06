# Money Experience Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task in this workspace.

**Goal:** One mobile Money page with Calendar, List and Charts tabs, a dock add action, visible recorder attribution and filtered Excel export.

**Architecture:** Server-selected views share URL filters. Reuse the existing transaction dialog and immutable authenticated creator. An RLS-protected SQL RPC gathers a complete export snapshot; a Node route writes XLSX with ExcelJS.

**Tech Stack:** Existing Next.js / React / Supabase, ExcelJS 4.4.0.

**Spec:** User instructions in this session; docs/ui-refresh.md supplies existing visual direction.

## Global Constraints

Preserve existing date pickers, actual balances, planned expense behavior and authentication. Use existing green palette; glass belongs to the dock. No deployment, real financial mutations or git operations. Hosted schema changes require manual application.

## Review Focus

- Export more than 50 / 1,000 entries without truncation.
- Keep household isolation and original recorder after a different member edits.
- Treat formula-looking notes as text; preserve rupiah precision beyond Excel's 15 digits.
- Keep selected month and filters when switching tabs or adding from the dock.
- Keep dock targets at least 44px at 320px width; keyboard tab navigation works.

### Task 1: Unified Money page

**Files:** app finance pages, navigation, filters, entry dialog, entry list, globals.css; authenticated browser tests.
**Interfaces:** EntryFilters.view selects calendar/list/charts; EntryButton accepts an icon-only custom trigger.
- [ ] Add and run failing mobile tests for shared tabs, filters, dock + and visible recorder.
- [x] Render all three views on `/`; retain `/list` and `/charts` aliases.
- [x] Add five-item mobile dock and preserve desktop navigation.
- [ ] Run browser checks at 320px and desktop.

### Task 2: Excel export

**Files:** finance_export SQL migration, excel.ts, export route/button, queries; unit and browser tests.
**Interfaces:** export_finances returns transactions and planned arrays. createFinanceWorkbook(data, month) returns XLSX bytes.
- [ ] Add and run failing SQL/XLSX and download tests.
- [x] Implement one snapshot with RLS; include recorder name/ID for recorded transactions and plans.
- [x] Write two sheets with numeric amounts, ISO dates, literal notes, safe large amounts.
- [x] Verify row counts, filter scope, unauthenticated access and unchanged attribution.

### Task 3: Verification

- [ ] Run pnpm test, lint, typecheck, authenticated and baseline Playwright, production build.
- [x] Review changes and document results and required migration.

Verification status: 15 unit tests, lint, types and explicit-Node production build pass. Browser tests added but blocked by local socket EPERM; not marked complete.

### Task 4: Profile and Settings (user steering)

**Goal:** Profile becomes the account hub and the mobile dock destination formerly occupied by Family. Family and Settings remain reachable from Profile; logout moves from the header into Profile. Language and currency show current values and Soon without changing finance behavior.
**Files:** new profile page, settings page, profile controls/actions/schema, profile query; navigation/header/icon/CSS and browser expectations.
- [x] Add profile schema and policy checks, browser scenarios for editing name, switching account and sign-out.
- [x] Implement self-only display-name updates and consistent header/recorder names.
- [x] Add Google credential-management and account-switch actions, pending optional clarification about email/password.
- [x] Show Family/Settings in Profile; mark English and IDR as Soon in Settings.
- [ ] Repeat relevant suite, types, lint and build; request a focused review.

Ruling: retain Google-based authentication unless user asks for an additional provider. Credential management links to Google; changing Cashlendar display name changes the profile record, not the immutable recorder identity. Optional clarification requested while independent work continues.

Profile delivery: Google-only choice confirmed. Independent review identified global switch-account logout; changed to local. Seventeen unit checks pass. Browser validation remains blocked; profile/settings production build succeeds.
