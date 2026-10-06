# Cashlendar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution, or superpowers:subagent-driven-development if the user selects delegation. Steps use checkbox syntax for tracking.

**Goal:** Build an installable shared-household money manager with Google login, IDR accounts and savings, and Calendar, Charts, and List views.

**Architecture:** Next.js App Router hosts the interface, OAuth callback, and validated server mutations on Vercel. Supabase PostgreSQL stores household-scoped records and enforces membership through RLS. Database queries compute complete balances and filtered summaries independently of list pagination.

**Tech Stack:** Next.js, React, TypeScript, Supabase JS and SSR clients, Zod, CSS, Vitest, Playwright, PostgreSQL SQL migrations and pgTAP database tests. Use pnpm and record resolved dependency versions in its lockfile. Confirm supported stable versions from official documentation at implementation time.

**Spec:** [Approved Cashlendar design](../specs/2026-10-06-cashlendar-design.md)

## Global Constraints

- English interface with Indonesian rupiah formatting and Asia/Jakarta as the household timezone.
- One household per user in the first version.
- Both roles manage shared accounts, transactions, categories, and savings; only the owner manages invitations and membership.
- All use IDR. Store amounts as integer rupiah with safe-integer validation and no floating-point currency arithmetic.
- Transfers change account balances but do not count as income or expenses in reports.
- Future transaction dates are rejected; planned transactions are outside this version's scope.
- An invitation is valid for seven days; only token hashes are persisted.
- An account can have one active goal to avoid allocating the same balance to multiple goals.
- Recording and synchronizing financial data requires an internet connection in this version.
- Do not cache authenticated finance pages, Supabase responses, or OAuth callback responses in the service worker.
- Do not ship a service-role key to the browser or use it for ordinary financial mutations.
- Do not create external projects or claim real Google OAuth/database isolation verification without a configured environment.
- The current workspace has no usable Git repository. Do not mutate the read-only `.git` directory. Commits and worktrees are unavailable unless the environment changes; record verification directly in the workspace.

## Review Focus

1. Amounts containing decimals, exponent notation, negative values, or values beyond the safe integer limit must fail without rounding; computed totals must also reject overflow (Task 1).
2. A user arriving through an invitation while signed out must retain the intended local destination through Google login without enabling an open redirect (Task 3).
3. Concurrent or repeated invitation acceptance must create exactly one membership; removed users must lose access even with an existing session (Task 2).
4. Account/category archival after a form opens must reject a stale save; historical entries remain readable and totals remain complete (Tasks 2 and 4).
5. A service-worker upgrade or sign-out must never replay another user's cached household data; offline navigation must show the reconnect screen (Task 7).

## File and Interface Map

- `src/app/`: routes, shared layout, global styles, loading/error boundaries, manifest, and OAuth callback.
- `src/lib/finance/`: public types, strict amount/date parsing, calendar layout, and pure finance calculations.
- `src/lib/supabase/`: environment configuration, browser/server clients, and authenticated session refresh.
- `src/features/household/`: household onboarding, invitation and membership actions, and Family screen.
- `src/features/finance/`: authenticated database queries, transaction/transfer actions, shared filters and entry forms.
- `src/features/accounts/` and `src/features/savings/`: account/category and goal actions and screens.
- `src/components/`: navigation, dialogs, shared controls, and PWA install guidance.
- `supabase/migrations/`: schema, indexes, foreign keys, triggers, functions, RLS, and finance queries.
- `tests/unit/`, `tests/db/`, `tests/e2e/`: finance/domain, database authorization, and browser proof respectively.
- `public/`: install icons, service worker, and standalone offline page.
- Root configuration: `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `.env.example`, `README.md`.

Keep forms, queries, and each view in separate files. Browser test fixtures may provide clearly identified test data in tests only; production must use actual authenticated data or honest empty/configuration states.

## Task 1: App foundation and finance rules

**Files:** Root configuration; `src/app/layout.tsx`, `src/app/globals.css`; `src/lib/finance/{types,money,dates,calculations,calendar}.ts`; `tests/unit/{money,dates,calculations,calendar}.test.ts`.

**Interfaces:** `parseRupiah(input: string, allowZero?: boolean): number`; `formatRupiah(amount: number): string`; `todayJakarta(now?: Date): string`; `validateEntryDate(value: string, today: string): string`; `getMonthRange(month: string): { start: string; endExclusive: string }`; `calendarDays(month: string): Array<{ date: string; inMonth: boolean }>`; `accountBalance(account: Account, entries: Transaction[], transfers: Transfer[]): number`; `cashFlow(entries: Transaction[]): { income: number; expenses: number; net: number }`; `savingsProgress(balance: number, target: number): number`. Define `Account`, `Category`, `Transaction`, `Transfer`, `SavingsGoal`, `EntryFilters`, and `ActionResult<T>` here for downstream tasks. IDs are strings; local dates use `YYYY-MM-DD`; amounts are safe integers. `ActionResult<T>` is a discriminated success/data or failure/error/fieldErrors union.

- [ ] Scaffold the TypeScript application and install supported dependencies; configure `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`.
- [ ] Write finance tests before implementation. Assert opening 100000 + income 50000 - expense 20000 - outgoing transfer 30000 produces 100000; transfers do not enter cash flow; savings balances are counted once. Assert `parseRupiah('1000') === 1000`, and reject `'1.5'`, `'1e3'`, `'-1'`, `'9007199254740992'`, blank input, zero expenses, and unsafe aggregate totals.
- [ ] Write date/calendar tests for Jakarta midnight, leap day, invalid dates, month/year navigation, seven-column grids, and future entry rejection. Run `pnpm test -- tests/unit` and confirm missing functions fail.
- [ ] Implement the exported interfaces and the app's light visual foundation; rerun those tests and `pnpm typecheck`. Expected: all assertions pass.

## Task 2: Database schema, access rules, and aggregate queries

**Files:** `supabase/config.toml`, `supabase/migrations/202610060001_cashlendar.sql`, `tests/db/household-access.sql`, `tests/db/finance-integrity.sql`, `tests/db/invitations.sql`.

**Interfaces:** Tables match Task 1 types. RPCs: `create_household(p_name text) -> uuid`; `create_invitation(p_email text, p_token_hash text) -> uuid`; `accept_invitation(p_token text) -> uuid`; `revoke_invitation(p_invitation_id uuid) -> void`; `remove_member(p_user_id uuid) -> void`; `account_balances() -> table(account_id uuid, balance bigint)`; `finance_summary(p_start date, p_end_exclusive date, p_account_id uuid, p_category_id uuid, p_kind text, p_search text) -> jsonb`; `list_entries` with those filters plus `p_limit integer` and `p_offset integer` returns transaction/transfer records and author names. Limit page size to 50. Derive household identity from `auth.uid()` rather than trusting supplied household IDs.

- [ ] Write database tests for member CRUD, outsider denial, owner-only membership operations, inability to self-promote, removed-member denial, owner self-removal denial, cross-household references, future dates, category-kind mismatch, and immutable creator attribution.
- [ ] Add invitation tests for verified-email mismatch, seven-day expiry, revocation, reuse, existing membership, and duplicate acceptance. Add integrity tests for atomic transfers, different source/destination accounts, archived references, active savings-account linkage, and one active goal per account.
- [ ] Run `supabase test db` against a local test instance; confirm missing schema fails. If Supabase CLI/PostgreSQL is unavailable, retain runnable SQL tests and explicitly record the environment blocker.
- [ ] Implement tables with bounded bigint amounts, household-aware foreign keys, indexes, RLS on every table, constrained authorization helpers with fixed search paths, invitation token hashing, transactional onboarding/default-category creation, and integrity triggers. Prevent direct writes that bypass owner/member rules.
- [ ] Implement aggregate and paginated queries. Pin totals across more than 50 entries, archived historical accounts, backdated edits, transfer exclusion, note/category/account search, and correct local-date ranges. Rerun database tests; verify concurrent acceptance with two real connections when a test instance is available. Code assertions alone are not concurrency proof.

## Task 3: Google login and household onboarding

**Files:** `src/lib/supabase/{config,client,server,session}.ts`, `src/proxy.ts` or the supported framework session-refresh entry point; `src/app/{login,auth/callback,onboarding,invite}/`; `src/features/household/{actions,queries,onboarding-form}.tsx`; `tests/unit/redirects.test.ts`, `tests/e2e/auth.spec.ts`.

**Interfaces:** `getServerSupabase()` returns the cookie-aware Supabase client; `requireHousehold()` returns verified user, household, and membership or redirects; `safeNextPath(value: string | null): string` permits application-relative destinations only; household actions return `Promise<ActionResult<T>>` and call Task 2 RPCs. Supabase config uses `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_APP_URL`.

- [ ] Test `safeNextPath('/invite?token=abc')` preserves its local path, while absolute URLs, protocol-relative URLs, backslashes, and encoded redirect bypasses return `/`. Cover missing configuration and failed/expired auth in UI tests.
- [ ] Run the redirect test expecting failure; implement Google sign-in, PKCE callback, cookie/session refresh, local return destinations, sign-out, protected routes, and actionable setup/error states.
- [ ] Implement create/join household onboarding with first account creation. Prevent duplicate submission, preserve fields on error, and check membership again on each protected server read and write.
- [ ] Rerun unit checks. With configured Google OAuth, verify login → callback → onboarding → household, invitation recovery after login, sign-out, and expired session. Record OAuth as unverified if configuration is absent.

## Task 4: Accounts, categories, and financial mutations

**Files:** `src/features/accounts/{actions,queries,accounts-screen,account-form,category-form}.tsx`; `src/features/finance/{actions,queries,schemas,entry-form,transfer-form,entry-dialog}.tsx`; `src/app/accounts/page.tsx`; `tests/unit/entry-validation.test.ts`, `tests/e2e/entries.spec.ts`.

**Interfaces:** `saveAccount(input: AccountInput)`, `archiveAccount(id: string)`, `saveCategory(input: CategoryInput)`, `archiveCategory(id: string)`, `saveTransaction(input: TransactionInput)`, `saveTransfer(input: TransferInput)`, and `deleteEntry(input: { id: string; kind: 'transaction' | 'transfer' })` return `Promise<ActionResult<T>>`. Optional input IDs distinguish create/update. `getFinanceData(filters: EntryFilters, page: number): Promise<FinanceData>` returns metadata, complete summary, daily/category aggregates, and one page of entries. `getAccounts(): Promise<Array<Account & { balance: number }>>` returns complete balances.

- [ ] Write schema tests for safe integers, date validity, kind/category matching, same-account transfers, required inputs, and ID handling. Run and confirm they fail before schema implementation.
- [ ] Implement authenticated actions and server-side validation using verified membership and Task 2 protections. Revalidate affected routes after mutations. Do not derive summaries from the paginated list.
- [ ] Build account/category creation, editing, and archival; expose calculated and negative balances. Build income/expense and transfer forms with labels, field errors, saving states, and preserved values after failure.
- [ ] Implement accessible entry dialogs and deletion confirmation. Test stale archived selectors, edited and backdated entries, duplicate submission prevention, negative calculated balances, and archived history. Rerun focused tests and type checking.

## Task 5: Calendar, Charts, and List

**Files:** `src/app/page.tsx`, `src/app/{charts,list}/page.tsx`; `src/components/{app-shell,navigation,dialog}.tsx`; `src/features/finance/{filters,calendar-view,charts-view,list-view,entry-row}.tsx`; `tests/e2e/views.spec.ts`.

**Interfaces:** All views consume `FinanceData` from Task 4 and `EntryFilters` from Task 1. Month/account/category use shared URL parameters; List additionally supports kind/search/page. `EntryDialog` accepts `{ date?: string; entry?: Transaction | Transfer }`. Today and initial month derive from `todayJakarta()`.

- [ ] Write browser scenarios for initial Calendar, month navigation, day selection/add prefill, shared filters, accessible totals, and list pagination. Include 51+ entries to ensure chart/calendar totals remain complete.
- [ ] Implement Calendar with compact mobile totals and selected-day details, Charts with income/expense/net and daily/category visualizations plus text summaries, and List with search/filter/pagination/edit/delete. Mark transfers distinctly without including them in cash flow.
- [ ] Build navigation between the three views and supporting Accounts/Savings/Family screens. Add loading, empty, retryable-error and permission states. Refetch data on navigation and return to the app; no realtime subscription required.
- [ ] Run `pnpm exec playwright test tests/e2e/views.spec.ts` at 390px and desktop widths. Check keyboard focus, dialogs, filters, month boundaries, transfer labels, and zero-data charts. Verify real-browser execution separately from static checks.

## Task 6: Savings goals and Family management

**Files:** `src/app/{savings,family}/page.tsx`; `src/features/savings/{actions,queries,savings-screen,goal-form}.tsx`; `src/features/household/{family-screen,invite-form}.tsx`; `tests/unit/savings-validation.test.ts`, `tests/e2e/household.spec.ts`.

**Interfaces:** `saveGoal(input: SavingsGoalInput)` and `archiveGoal(id: string)` return `Promise<ActionResult<SavingsGoal>>`; savings funding/withdrawal uses `saveTransfer` from Task 4. Family actions call Task 2 RPCs. Invitation creation generates a cryptographic token on the server and returns the link once; stored/listed records contain no raw token.

- [ ] Write tests for positive targets, savings-account-only linkage, duplicate active goals, 0/100% clamping with actual balance still visible, and funding excluded from expenses. Run focused tests before implementation.
- [ ] Implement goal create/edit/archive and funding/withdrawal through transfer forms. Refuse archival of an account linked to an active goal, with clear next steps.
- [ ] Implement member list, owner-only invitation creation/revocation, seven-day expiry display, copy-link feedback, and member removal confirmation. Member screens show truthful permissions; enforce the same restrictions server-side.
- [ ] Run browser scenarios for owner/member behavior, preserved author names after removal, goal funding/withdrawal, and revoked invitations. Run the relevant Task 2 SQL tests to prove restrictions independently of the UI.

## Task 7: Installation and offline behavior

**Files:** `src/app/manifest.ts`, `src/components/{pwa-registration,install-guidance}.tsx`, `public/sw.js`, `public/offline.html`, `public/icons/{icon-192,icon-512,maskable-512,apple-touch-icon}.png`, `tests/e2e/pwa.spec.ts`.

**Interfaces:** Manifest uses name Cashlendar, `/` start URL and scope, standalone display, green theme color, and correctly declared normal/maskable icons. Service worker caches only explicit public icon/offline assets and returns `/offline.html` for failed navigation; it never caches authenticated HTML, OAuth, or Supabase requests.

- [ ] Write browser assertions for manifest metadata, icon responses, service-worker activation, and no auth/API URLs in Cache Storage. Test offline navigation and old cache cleanup after a worker version change.
- [ ] Create original simple app icons with adequate maskable safe area using a local drawing tool; implement public offline page, worker registration, versioned allowlist caching, and install guidance.
- [ ] Implement supported browser install prompt behavior and iOS Share → Add to Home Screen instructions. Disable online mutation submission when disconnected without discarding unsaved form input.
- [ ] Run the PWA tests against a production server. Inspect offline navigation after sign-out and ensure another user's household never appears from cache. Record device-specific Add to Home Screen installation as unverified unless tested on that device.

## Task 8: Deployment handoff and complete verification

**Files:** `.env.example`, `README.md`, `next.config.ts`, `docs/verification.md`; update tests/configuration only to resolve concrete findings.

**Interfaces:** README provides `pnpm install`, `pnpm dev`, build/start commands, database migration/test steps, and Supabase/Google/Vercel setup. Production application remains honest when its environment is not configured.

- [ ] Document Supabase project/migrations, publishable-key environment variables, Google OAuth credentials and provider callback, app callback allowlist for localhost and production, Vercel import/environment setup, and HTTPS/PWA requirements. Keep credentials out of source.
- [ ] Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build`. Run `supabase test db` if the test instance is available; otherwise record the exact blocker.
- [ ] Start the built app with `pnpm start`; run `pnpm exec playwright test`. Review mobile/desktop screens, loading/error/empty states, keyboard/dialog behavior, and public install assets. Fix demonstrated failures and rerun only affected checks, then finish the relevant final build.
- [ ] Write `docs/verification.md` with actual command outcomes and distinguish unit/static, database, browser, real OAuth, device-installation, and deployed-production evidence. No fake success from missing credentials or browser restrictions.
- [ ] Deliver the runnable/deployable app and concise setup instructions. Request missing external configuration only after local implementation and verification are complete. Do not publish or modify external accounts without authorization.

## Plan Self-Review

The eight tasks cover authentication, household creation/invitations/permissions, account/category lifecycle, income/expenses/transfers, all three views and filters, savings, PWA install/offline behavior, accessibility/error states, and deployment documentation. Shared types are introduced in Task 1, database interfaces in Task 2, and finance queries/mutations in Task 4 before views consume them. Each Review Focus condition has a task and an explicit proof. No runtime app code or dependencies have been created during planning.

## Execution Handoff

Recommended: native execution in this session, implementing the tasks sequentially. The tasks share finance types and database interfaces, so one continuing implementer can keep those contracts consistent with less repeated context. A focused independent final review may be used under the execution skill; it is distinct from delegating implementation task-by-task.

Alternative: subagent-driven execution with separate implementation and review contexts for each task, at greater context cost.

Await user review of this plan and selection of execution method before beginning application implementation.
