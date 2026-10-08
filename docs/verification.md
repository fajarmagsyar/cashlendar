# Cashlendar verification

## Money tabs, Excel, Profile and Settings update — 2026-10-06

| Check | Result | Evidence |
| --- | --- | --- |
| `pnpm test` | 17 passed | Existing finance/PWA checks plus actual 1,005-row export, filters, household isolation, original creator after another member edits, workbook round-trip, formula-looking notes and large IDR precision, profile-name validation and self-only profile updates retaining creator IDs |
| `pnpm lint` | Passed | No lint errors |
| `pnpm typecheck` | Passed | No TypeScript errors |
| `pnpm exec node node_modules/next/dist/bin/next build --webpack` | Passed | Production pages and Node export route compiled and generated |
| Authenticated/browser tests | Blocked | Local test transport cannot listen on 127.0.0.1:54329 (`EPERM`); escalation automatically rejected by session permissions. No current-update browser pass is claimed. |

Added browser scenarios cover 320px Money tabs, month retention, selected calendar day, visible recorder, dock creation on Accounts/Savings/Profile, keyboard tab switching, actual XLSX download beyond the first page, and unauthenticated export denial. Additional Profile scenarios cover name persistence, recorder display, Family/Settings access, disabled Soon controls, account switching with local logout scope and protected routes. Existing browser expectations now follow the four mobile links plus central + and logout in Profile. They still need execution in an environment that permits local servers.

Read-only independent code review found no critical or important financial/export defects. The Profile review identified that account switching inherited Supabase's global sign-out default; it now uses local scope to retain sessions on other devices. Hosted migration 003 and deployment were not applied. The export queries through the authenticated user with row-level security, gathers both sheets in one SQL snapshot, and returns a private uncached response.

The ordinary `pnpm build` invocation encountered a TypeScript `--showConfig` capture error in this session's script runtime. Running the same Next build explicitly with Node completed successfully; no TypeScript checks were bypassed. A parallel standalone typecheck initially raced build regeneration of `.next/types`; rerunning it after the build passed.

## Previous navigation/planning update

Checked locally on 2026-10-06 with Node 26.8.1, pnpm 11.3.0, and system Chromium.

| Check | Result | Evidence covered |
| --- | --- | --- |
| `pnpm test` | 13 passed | IDR precision and grouped amounts, Jakarta dates, transfers, savings, redirects, actual SQL/RLS, invitations, aggregate rollback, planned-expense isolation and atomic payment, 1005-plan reporting, worker cache allowlist |
| `pnpm test:e2e:auth` | 24 passed | Desktop/mobile transaction CRUD and full reports, accounts/goals, family permissions, invitation account switching, sign-out, planning and rescheduling, cancellation and payment, cursor editing, six dock destinations, 320 × 600 sheet layout |
| `pnpm test:e2e` | 6 passed | Production configuration state, protected routes, responsive containment, manifest and icons, actual worker offline navigation |
| `pnpm lint` | Passed | No lint errors |
| `pnpm typecheck` | Passed | No TypeScript errors |
| `pnpm build` | Passed | Production routes compiled and generated |

The authenticated suite uses the production application's pages and server actions with a local test-only Supabase HTTP transport. Its database executes the real migrations and row-level security; its sessions simulate Google-authenticated users. It runs its own isolated development build in `.next-auth`. The baseline suite builds and runs `.next-baseline` on port 3002 with empty Supabase environment variables, so it never changes `.env.local` or contacts the user's configured project. Initial baseline test discovery included authenticated tests without their required server; restricting its matcher to `app.spec.ts` corrected that harness error.

Database checks include anonymous denial, cross-household read/write denial, owner-only membership changes, removal invalidating access, verified-email invitation matching, expiry/revocation/reuse, archived references, category/type matching, creator immutability, complete summaries beyond a page, transfer atomicity, and saving-account linkage. Overflow cases exercise real rejected writes and verify rollback. These embedded database checks do not simulate separate concurrent PostgreSQL connections.

Browser layout checks cover 320, 390, 768, and 1440 px widths. Screenshots were inspected for desktop and phone calendar, planning, and entry sheets. A short-screen test verifies that the focused note stays above Save at 320 × 600. Chromium mobile emulation verifies layout and interactions; physical iOS/Android installation and Safari behavior remain unverified. The worker caches only public icons and a reconnect document. Financial data needs a network connection.

Review found two important issues: aggregate overflow could prevent balance rendering, and switching Google accounts discarded the invitation token. Both were fixed and regression-tested. Input error association and adjacent-month calendar announcements were also corrected.

The user reports that their original hosted setup works. This update was checked locally without changing hosted finances. The new planned-expense migration and deployment still need to be applied to that installation; migration execution access and a deployment connector are not available here. Hosted concurrency and physical-device installation were not verified in this update.

## UI delivery checks

- Hard rules PASS: browser containment at 320–1440 px, no fabricated balances or people in product source, existing routes retained, keyboard dialogs and real finance actions exercised by 24 authenticated checks.
- Contrast PASS: body 13.60:1, muted text 5.55:1, placeholder/outside-month dates 4.70:1, dock text over the darkest possible backdrop 4.68:1, active dock 7.64:1, planned labels 5.84:1. Ratios computed from the final CSS colors using relative luminance.
- Purpose PASS: navigation alone uses glass and elevation. The dock's six icons represent real destinations; a hollow calendar marker denotes planned spending. Cards and money fields stay opaque. Reasons are recorded in ui-refresh.md.
- Direction PASS: ENERGY 1 / RHYTHM 2 / MOTION 1. Existing light green identity, system typography, amounts as the entry-form focal point, restrained hover/press feedback, and reduced-motion support.
- Quality PASS: concise page names and action labels replace marketing filler; no new theme toggle or invented data. Input validation, pending/error states, focus restoration, offline handling, and actual SQL policies remain covered. Production compilation, lint, and TypeScript checks are recorded above.

## OAuth localhost redirect fix

After deployment, the user reported Google login ending at localhost:3000. The browser already requests its own origin as the Supabase callback. The server callback previously used the raw request URL for the final redirect, leaving it vulnerable to an internal localhost origin behind a deployment proxy. It now resolves the Vercel public forwarded host in production, then a validated configured HTTPS app origin, and keeps the local request origin for development. Success and failure redirects share that resolution; application-relative destination validation is retained.

All 21 unit tests, lint and standalone TypeScript checks pass. New regressions cover internal localhost versus public origin, a copied localhost environment value, Vercel preview cookies staying on their original hostname, local development, and malformed/untrusted host inputs. The web viewer could not open the deployment, but a direct unauthenticated HTTP check of the existing hosted `/auth/callback` returned 307 to `https://cashlendar-phi.vercel.app/login?error=callback&next=%2F`. This confirms the live missing-code callback already retains the production origin; Supabase Site URL/allowlist fallback is the leading hypothesis. The success exchange and hosted provider settings remain unverified. The local production build passed. Supabase Site URL and callback allowlist must also be configured; rejected callback URLs may fall back to the provider's Site URL. Exact production setup values are recorded in README.md.
