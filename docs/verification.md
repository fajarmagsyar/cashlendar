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
## Menu latency and navigation motion

The confirmed Supabase region is Sydney (`ap-southeast-2`); `vercel.json` now selects Vercel's `syd1` region for the next deployment. The current live function region was not independently measured. Main-menu links fully prefetch route data in production, and the client router retains pages for 30 seconds. Server actions still invalidate affected cached views. The dock's highlight slides for 260 ms immediately on navigation intent and respects reduced motion; its accessibility state follows the committed route.

All 58 development browser checks passed on desktop and mobile. The two production-only prefetch checks passed in an isolated production build: Accounts opened with further RSC requests blocked after the full account data had prefetched. Production cache invalidation and sign-out/history checks also passed. All 21 unit tests passed. No deployment or hosted financial data changes were made.

## Indonesian language and landing page

Bahasa Indonesia is the default for new visitors. A one-year browser cookie stores the English/Indonesian preference. Settings now exposes an enabled language selector. Server pages and client components share a translation dictionary; dates use the selected locale, while amounts remain rupiah and the financial calendar remains in Jakarta. User-entered names and notes are preserved. The public login page uses a calendar and savings preview with labeled example data, and retains Google OAuth and invitation destinations. The offline document honors the same language cookie; public cache version v2 refreshes it.

Verification: the production build and all six public browser checks passed. The authenticated full run passed 62 checks, skipped two production-only prefetch checks, and reported four failures: two concurrent test-output collisions and two outdated Profile assertions. Targeted reruns passed the updated Profile and Money tests and Indonesian switching, validation, save, and landing checks on both viewports. A subsequent responsive check exposed an early measurement during a streamed redirect; waiting for the page heading fixed that test, and both desktop/mobile reruns passed. All 66 applicable authenticated checks have passed across these runs. Lint and type checking passed without warnings, and all 21 unit tests passed. Desktop and mobile landing screenshots were visually reviewed. No live deployment or hosted database changes were performed.

## More and the family board

The desktop and mobile docks now expose More (Lainnya), with Savings and Family board tools. More remains selected on both tool routes. The board supports household-shared notes, checklists, and reminders in Indonesian/English. Members can edit/delete each other's items. Database policies reject outside access; triggers preserve creator identity and stamp the editor. Version checks reject stale edits without clearing the draft. Checklist updates lock and change only the selected task, preserving other members' updates. The board refreshes every 30 seconds while visible, pauses automatic refresh while editing, and provides manual refresh. Reminder dates display in WIB, with completion and overdue states.

Phone reminders use device-specific browser opt-in, server-side VAPID delivery, a protected scheduler endpoint, and service-role-only queue functions. Delivery tests cover bounded concurrency, transient errors, expired devices, duplicate claims, completed reminders, and removed members. Notifications keep personal titles/notes off lock screens and open the authenticated board. Apply both new migrations and configure the keys and minutely scheduler described in [phone-reminders.md](phone-reminders.md). No hosted schema changes, scheduler setup, deployment, or real-device notification delivery has been performed.

Verification: all 25 unit/database tests pass, as do lint and TypeScript checks. All 28 development board/navigation checks passed on desktop/mobile. The production build passed; all 26 production board, phone opt-in, Money, planning, and prefetch checks passed across targeted runs. Phone browser tests mock the device push APIs while writing subscriptions through the real local database functions. Desktop/mobile tools and board screenshots were visually reviewed. The local fixture was extended for JSON checklist fields and identifiers containing digits, such as p_p256dh. Mobile prefetch streams may be cancelled after Next has decoded their data; prefetch verification blocks subsequent RSC requests and checks the destination renders promptly from cached data.

## App microinteractions

Design direction: retain Cashlendar's warm green palette and existing layouts; use motion to acknowledge input, show selected state, and confirm completion. ENERGY 2 / RHYTHM 1 / MOTION 2. Shared timing is 110–280 ms for controls, with a 420 ms chart/progress reveal and at most 75 ms of card staggering. Native CSS adds no animation dependency, event listeners, or waits to save/navigation handlers.

Added button/touch press feedback, fine-pointer icon movement, form focus/error transitions, Money's sliding selection marker, calendar/date selection feedback, dialog/backdrop and picker entrances, checkbox completion, save-toast entrance/dismissal and checkmark drawing, bounded card/list entrances, and chart/progress growth. Reduced motion disables movement, including hover icon translation and native picker pseudo-elements. Loading's existing reduced-motion behavior remains in place.

Delivery gate: Hard Gate PASS: no new copy, navigation destinations, fictional data, or dead controls; keyboard/picker/save tests pass and responsive checks find no overflow. Purpose Gate PASS: selection motion tracks the selected view, press feedback acknowledges input, dialogs/pickers establish the foreground, and completion/error feedback identifies results; no continuous decorative animation was added. Liveliness PASS: the declared motion level is local and brief, with green selected/primary controls remaining the focal point. Craft PASS: shared durations/easing, native controls and focus restoration, reduced-motion overrides, and immediate save/navigation behavior were checked in the running app. Palette, content, and layout structure remain the existing product design.

Verification: all 38 targeted browser checks passed on desktop/mobile, covering tab-marker alignment, keyboard selection, reduced motion, pickers, form errors/retry, duplicate-save protection, and navigation responsiveness. The production build, lint, and TypeScript checks passed. The mobile picker/Money screenshot was visually reviewed. No database migration or new deployment configuration is required for this change.

## Unified family pages

The board now uses full-page editors and one document format for text, checklists, tables, drawings and optional reminders. Text formatting applies per block. Spreadsheet formulas support arithmetic, cell references, ranges and SUM/AVERAGE/MIN/MAX/COUNT with a safe parser. Drawings support pointer input, color/width, stroke erasing, undo and clear. Board search and quick checklist/reminder completion remain available. Indonesian and English labels cover the new controls. Design choices, limits and rollout instructions are in [board-pages.md](board-pages.md).

Verification: all 29 unit/database tests and all 24 production desktop/mobile browser checks passed. The browser suite covers the combined-page save/reopen workflow, another member's updates, reminder completion surviving text edits, stale-edit protection, failed-save retry, unsaved-change confirmation, date-only calendar changes, block ordering/removal, occupied table row/column removal, drawing controls, keyboard use, reduced motion, 320/390/768/1440 widths, phone opt-in, Money and export regressions. Lint, standalone TypeScript and the production build passed. Desktop/mobile board and editor screenshots were visually reviewed.

The focused code review found a date-only calendar edit missing the dirty marker; an explicit DatePicker onChange and browser regression cover the fix. Cold development tests also exposed a Next webpack full-document reload when another tab first loaded the board, confirmed by beforeunload and a new document GET in the trace. The complete production suite verifies draft preservation without development HMR. Server-generated initial block IDs prevent hydration mismatches. Editor fields wait for input handlers before becoming editable, and opened records retain their original versions across server refreshes.

Delivery gate: Hard Gate PASS: working destinations and controls, responsive containment, visible focus, translated empty/loading/error states, no fabricated product content or new visual assets. Purpose Gate PASS: the title establishes document hierarchy, blocks separate distinct editable content, arrows reorder content, formula shading distinguishes computed cells, and pen colors are user-selected drawing tools. Liveliness PASS: ENERGY 1 / RHYTHM 2 / MOTION 2, existing warm green identity, brief block-insertion feedback and reduced-motion support. Craft PASS: sharing, version conflicts, input retention, permission boundaries, data conversion, bounded numeric drawing data and safe formula failures were checked in local SQL and production browsers.

Apply `202610080003_board_documents.sql` before deploying, after the existing board and notification migrations. No hosted migration, deployment, scheduler change or real-device notification send was performed. Existing phone reminder setup is still required. Drafts remain in the open editor; they are not persisted across browser sessions. Existing data conversion preserves original columns, identifiers, attribution, versions, timestamps, due dates and completion.

## Editor controls simplified

The page editor now uses icon-only action buttons with translated accessible names and native tooltips. Back, save, formatting, block ordering/removal, adding content, reminder toggling, table tools and drawing tools retain their behavior. Repeated block labels and visible status/helper prose were removed; formula guidance opens with the info action. Input labels remain available to assistive technology, and date/time labels appear when the bell action enables a reminder. All editor action targets are at least 44 px, with visible focus and selected states.

Only the sticky top-bar Save icon submits the editor. ActionForm's optional `showSubmit` flag defaults to true for other forms; the editor sets it to false to remove its duplicate default submit button. Loading appears in the same top-bar action.

Verification: all 16 production board checks passed across desktop and mobile, covering exactly one submit action, icon controls and tooltips, formula help, saving/reopening, family edits/conflicts, failed-save retry, reminder date changes, keyboard operation, drawing controls, deletion and reduced motion. Production build, lint and TypeScript passed. The mobile editor screenshot was visually reviewed. Delivery gate PASS: changes follow the existing warm green direction, icons identify real actions, accessible labels and keyboard focus remain, layouts contain tables at phone widths, and no new decorative assets or motion were added. No additional database migration is needed for this UI update.

The mobile table now uses a 72 px minimum column width, 28 px row-number gutter, 24 px column headers and 34 px editable rows. Readonly cells use tighter padding. Focused inputs use 16 px text for comfortable editing. Larger tables still scroll inside their own region. Both targeted production save/reopen tests passed on desktop/mobile; the phone check verifies three initial columns fit without scrolling, row height stays below 36 px, and cell width stays readable. Lint and the production build passed, and the updated mobile screenshot was visually reviewed.
