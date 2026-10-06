# Cashlendar first-version design

## Purpose and agreed requirements

Cashlendar helps a household record money coming in and going out, understand its balances, and track savings. It is a responsive web app deployed to Vercel, using Supabase for Google authentication and PostgreSQL persistence. Users can install it through their browser's Add to Home Screen flow.

The user selected a shared household: members have separate Google logins and share household accounts and transactions. The user selected IDR only. The three main views are Calendar, Charts, and List.

## Proposed first-version defaults

These are proposed decisions for review, rather than additional confirmed requirements:

- English interface with Indonesian rupiah formatting and Asia/Jakarta as the household timezone.
- One household per user in the first version. A new user creates a household or accepts an invitation.
- The household creator is the owner. Other users are members. Both roles manage shared accounts, transactions, categories, and savings; only the owner manages invitations and membership.
- Savings are goals funded by transfers from another household account into a linked savings account.
- The app supports installation and a useful offline screen; recording and synchronizing financial data requires an internet connection in this version.
- A light interface with a restrained green accent, readable totals, and mobile navigation between the three main views. Accounts, Savings, and Family are supporting screens.

## Approach

Recommended: Next.js App Router with TypeScript, deployed on Vercel, and Supabase Auth and PostgreSQL. This keeps the frontend, authentication callback, and server mutations in one application. Supabase Row Level Security enforces household access at the database layer.

Alternatives considered: a React SPA on Vercel with direct Supabase access simplifies rendering but puts more session and loading behavior in the client; a separate API adds deployment and authorization work without a first-version requirement that justifies it.

No Redis cache is required for this version. The earlier diagram was a separate example, not a Cashlendar architecture requirement.

## User journeys

### Login and household setup

A user signs in with Google. On first login they create a household, enter its name, and add their first account with an opening balance, or accept an existing household invitation.

An owner enters an invitation email and receives a shareable invitation link. The app does not send invitation emails in this version. An invitation is valid for seven days, can be revoked, and is accepted only by the authenticated user whose verified Google email matches its email. Raw invitation tokens are shown in the link but only token hashes are persisted; acceptance happens atomically on the server. An existing household member cannot join another household in this version.

Owners can remove members and revoke invitations. The owner cannot remove themselves or transfer ownership in this version. Removed users immediately lose database access to household records. Historical entries retain their author attribution.

### Accounts and transactions

Accounts represent cash, bank accounts, e-wallets, or savings accounts. Each has a name, type, nonnegative opening balance, and active or archived status. All use IDR. Archiving removes an account from new-entry selectors but retains its history; archiving an account linked to an active savings goal requires reassignment or archival of that goal.

Users add, edit, and delete income or expense entries with a positive whole-rupiah amount, date, account, category, and optional note. Store the creator and last editor for attribution. All household members can edit shared entries. Reject invalid amounts, missing fields, foreign household account/category references, and mutations into archived accounts.

An account balance equals its opening balance plus income minus expenses plus incoming transfers minus outgoing transfers. Opening balances do not count as income. Negative calculated balances are allowed for recording history accurately, with a visible negative balance state. Backdated edits update balances and all three views. Future transaction dates are rejected; planned transactions are outside this version's scope.

Transfers move a positive amount between two different active accounts in the same household. They are a single atomic record with source and destination, rather than two independent income/expense entries. Transfers change account balances but do not count as income or expenses in reports.

Dates for entries are local calendar dates; creation/edit timestamps are absolute timestamps. This prevents calendar dates changing when viewed from another timezone. Record amounts as integer rupiah using PostgreSQL bigint, with validation within JavaScript's safe integer range; use no floating-point currency arithmetic. API serialization and calculations must preserve that constraint.

### Calendar

Calendar is the initial view. It opens to the current month, shows daily income/expense totals, supports previous/next month and Today, and opens a selected day's entries. An Add action prefills the selected date. Transfers remain visible in daily details but do not contribute to income/expense totals.

On narrow screens, the calendar remains a seven-column month grid with compact day totals; selected-day details appear below it. Account and category filters apply to its daily summaries and entries.

### Charts

Charts show total income, total expenses, and net cash flow for a selected month, expense breakdown by category, and income/expense trends by day. Account and category filters apply consistently. Transfers and opening balances are excluded from cash-flow calculations. Charts have readable textual summaries and zero-data states. Savings balances are not added again to total household balances.

### List

List shows entries newest first with their date, type, category, account, amount, note, and author. It supports month, account, category, transaction-type, and text filters; text search matches notes, category names, and account names. Transfers show both accounts. Entries can be edited, or deleted through an explicit confirmation. Use pagination for history rather than downloading the household's complete history.

### Savings

Users create goals with a name, positive target amount, optional target date, and linked savings account. An account can have one active goal to avoid allocating the same balance to multiple goals. Progress is the linked account's current balance relative to its target, with a percentage clamped to 0–100 for display while the actual balance remains visible. Opening balances count toward savings progress.

Adding savings records a transfer from another account into the goal's linked savings account. A withdrawal is a transfer in the opposite direction. Goals can be edited and archived without deleting accounts or transfers. Savings funding does not inflate expense totals.

## Data model and authorization

- Profiles: authenticated user ID and display name; derive email verification from trusted Supabase authentication data.
- Households: name, owner user ID, currency fixed to IDR, timezone fixed to Asia/Jakarta.
- Household members: household ID, user ID, role, join timestamp; a unique user membership enforces the one-household rule.
- Invitations: household ID, normalized email, token hash, expiry, inviter, accepted timestamp, revoked timestamp. Owner-only access; acceptance uses a constrained server-side operation.
- Accounts: household ID, name, type, opening balance, archived timestamp, creator.
- Categories: household ID, name, income/expense kind, archived timestamp. Seed household-scoped defaults on creation. Referenced categories can be archived rather than deleted; new entries cannot select archived categories.
- Transactions: household ID, income/expense kind, account ID, category ID, amount, local date, optional note, creator, last editor, timestamps.
- Transfers: household ID, source/destination account IDs, amount, local date, optional note, creator, last editor, timestamps.
- Savings goals: household ID, linked savings account ID, name, target amount, optional target date, archived timestamp.

Every financial row has a household ID. Foreign-key design and mutation validation prevent cross-household references. All application tables have RLS enabled. Financial access depends on active membership, with owner checks for membership and invitations. Users cannot insert memberships or assign themselves owner roles directly. Household creation, invitation acceptance, and owner operations use carefully scoped database functions with fixed search paths and explicit authenticated identity checks.

Use the public Supabase publishable key in the client and authenticated sessions for normal access. Do not ship a service-role key to the browser or use it for ordinary financial mutations. Avoid caching authenticated financial responses across users. Index household/date queries and membership lookups. Compute summaries and balances in database queries scoped to the authenticated household so pagination does not alter totals.

## Application boundaries

- Authentication: Google sign-in, OAuth callback, verified session handling, sign-out, and route protection.
- Household: setup, membership, invitation creation/acceptance/revocation.
- Finance: validated transaction and transfer mutations, balances, and filtered summaries.
- Views: shared filter semantics and finance data rendered as Calendar, Charts, or List.
- Savings: goal management and transfers through the finance module.
- PWA: manifest, generated icons, installation guidance, service-worker registration, offline fallback.

Keep reusable amount/date formatting and finance calculations separate from view components. Refetch affected data after successful mutations; other members see changes on navigation, refresh, or return to the app. Realtime collaboration is deferred.

## PWA behavior

Provide a web app manifest, standalone display, theme color, regular and maskable icons, and HTTPS deployment. Cache the public app shell and offline fallback only. Do not cache authenticated finance pages, Supabase responses, or OAuth callback responses in the service worker. An offline visit displays a clear reconnect screen instead of fabricated or stale balances. Android browsers can expose an install action when supported; iOS users receive Share → Add to Home Screen guidance.

## States and accessibility

Use explicit loading, empty, permission-denied, and retryable-error states. Prevent duplicate submission while saving. Preserve entered values after failed saves. Clear session-specific client data on sign-out. On expired authentication, return to login without exposing household data. Display configuration guidance when required Supabase environment variables are absent.

Forms have visible labels, field-level errors, keyboard navigation, and visible focus. Dialogs trap and restore focus and close with Escape where appropriate. Income and expense meaning must be conveyed by labels as well as color. Touch targets and mobile layouts accommodate small screens. Charts include equivalent readable totals.

## Deployment deliverables

Provide application source, lockfile, Supabase SQL migrations including RLS, `.env.example` containing placeholders only, and a README explaining local setup, migration application, Google OAuth configuration, Supabase redirect URLs, and Vercel environment variables/deployment.

User-supplied Supabase and Google OAuth configuration is required to enable real login and persistence. No credentials are assumed to exist. Deploying to an external Supabase/Vercel account is separate from preparing the deployable app; do not claim a live deployment until it is verified.

## Validation and acceptance

1. Type checking, linting, and a production build pass.
2. Automated finance tests cover integer amounts, opening balances, transfers excluded from cash flow, edited/backdated records, date handling, and savings progress.
3. Database tests exercise owner/member/outsider access, removed membership, rejected cross-household references, invitation expiry/revocation/email mismatch/reuse, and atomic transfer behavior.
4. UI/browser checks cover mobile and desktop navigation, entry creation/edit/deletion, filters, empty/error states, forms and dialogs with keyboard access, and chart summaries.
5. Confirm manifest and icon delivery, service-worker registration, offline fallback, and exclusion of authenticated data from offline caches.
6. Google OAuth and production household isolation require a configured Supabase environment. Report them as unverified if credentials or a usable test instance are unavailable; do not substitute mock checks for integration proof.

## Deferred scope

Multiple currencies, private accounts within a shared household, offline financial writes, bank integrations, recurring or planned transactions, budgets, receipt uploads, automatic invitation email, owner transfer, multiple households per user, push notifications, and realtime presence are outside the first version.
