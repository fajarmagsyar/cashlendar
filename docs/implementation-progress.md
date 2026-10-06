# Execution ledger: docs/superpowers/plans/2026-10-06-cashlendar.md

Ruling: Native execution follows the user's acceptance of the recommended method. Work stays in this empty workspace because `.git` is not a usable repository and is read-only; no commits or worktree are possible.

Pre-flight: Task 1 types → Task 2 schema → Task 4 queries/actions → Task 5 views are consistent. Household helpers feed authenticated reads/writes. Savings uses the shared transfer action.

Ruling: Use Node's built-in test runner with test-isolation disabled rather than Vitest: this environment blocks child process creation, and native tests can directly execute pure TypeScript. Browser tests remain Playwright. Risk: test command requires Node 22+.

Tasks 1–8: implemented and locally verified. Cashlendar includes protected Google OAuth routes and onboarding, household membership and invitations, accounts and categories, transaction CRUD, atomic transfers, calendar/chart/list filters and reports, savings goals, and install assets with a public-only offline fallback.

Ruling: Node 22.18+ is required for native TypeScript tests. Actual checks ran on Node 26.8.1. ESLint 9 and TypeScript 6 were selected to match the installed Next.js lint plugins. The environment's inaccessible global pnpm store was replaced with a writable temporary store; dependency versions remain in the portable lockfile.

Ruling: Supabase CLI, hosted project credentials, and Google credentials were unavailable. SQL verification uses the actual migration in embedded PostgreSQL (PGlite). Authenticated browser verification uses a test-only local transport over that database with signed sessions. This proves application actions and database policies locally, but does not prove hosted OAuth, concurrent database connections, or external deployment.

Fresh read-only review completed. Both important findings were corrected: serialized database writes now reject unsafe aggregate amounts before committing, and invitation account switching retains the invitation destination. Minor findings were also addressed: field errors are associated with their inputs and announce invalid state, and calendar dates outside the queried month avoid claiming zero entries. Regression tests pass.

Verification: 10 domain/database/worker tests, 14 authenticated browser tests, and 6 baseline production browser tests. Production build, TypeScript, and lint passed. A final baseline run exposed a test-discovery configuration error: it also selected authenticated tests without their fixture server. The baseline configuration now explicitly selects app.spec.ts; the authenticated suite has a separate documented command. See verification.md for results and limits.

No external project was created, no invitation was sent, and no deployment or Git commit was performed. Setup and deployment steps are in README.md.

UI and planning update: implemented the requested glass navigation dock, six accessible mobile destinations, concise signed-in page copy, amount-first entry sheets, grouped IDR inputs across transaction/account/goal forms, and planned expenses. Added migration 202610060002; the original schema file remains unchanged. Plans are separate from actual cash flow and are consumed atomically when paid. Reporting returns all monthly plans as JSON, avoiding API row truncation.

Checks for this update: 13 domain/database/worker tests and 24 authenticated browser checks passed, plus 6 production baseline/PWA checks. These include the native fieldset scroll regression at 320 × 600 and amount cursor editing. A fresh read-only review found no important defects. Contrast and screenshots were checked. The user reports their original hosted installation works; this update does not apply SQL to that hosted project or deploy to Vercel. README.md specifies the one new migration to apply before deployment.


## Money workspace / recorder / XLSX — 2026-10-06

Implemented shared Calendar/List/Charts tabs, mobile central dock creation, original recorder visibility, authenticated filtered XLSX export and migration 003. Added database/workbook unit coverage and browser scenarios; existing browser navigation expectations updated. Fifteen unit tests, lint and types passed; explicit-Node production build passed. Browser execution is blocked by local server socket permissions. Independent read-only review found no critical/important issues. Hosted migration and deployment remain manual.

Ruling: continue authorized implementation directly under the developer autonomy instructions; no repeat design approval. Existing date-picker work preserved. No git/worktree operations because the repository metadata is read-only. Export covers the selected month and all current filters; plans use a separate sheet so recorded financial totals remain unchanged.
