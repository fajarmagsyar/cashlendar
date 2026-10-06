# Cashlendar verification

Checked locally on 2026-10-06 with Node 26.8.1, pnpm 11.3.0, and system Chromium.

| Check | Result | Evidence covered |
| --- | --- | --- |
| `pnpm test` | 10 passed | IDR precision, Jakarta dates, transfer accounting, savings progress, redirect safety, validation, actual SQL/RLS, invitations, rollback on aggregate overflow, worker cache allowlist |
| `pnpm test:e2e:auth` | 14 passed | Desktop and mobile transaction CRUD, full reports across pagination, supporting views, keyboard dialogs, field validation, savings transfers, account/goal persistence, owner/member controls, invitation account switching, sign-out and browser history |
| `pnpm test:e2e` | 6 passed | Production configuration state, protected routes, responsive containment, manifest and icons, actual worker offline navigation |
| `pnpm lint` | Passed | No lint errors |
| `pnpm typecheck` | Passed | No TypeScript errors |
| `pnpm build` | Passed | Production routes compiled and generated |

The authenticated suite uses the production application's pages and server actions with a local test-only Supabase HTTP transport. Its database executes the real migration and row-level security; its sessions simulate Google-authenticated users. It runs its own isolated development build in `.next-auth`. The baseline suite runs the production build without configured Supabase credentials. Initial baseline test discovery included authenticated tests without their required server; restricting its matcher to `app.spec.ts` corrected that harness error.

Database checks include anonymous denial, cross-household read/write denial, owner-only membership changes, removal invalidating access, verified-email invitation matching, expiry/revocation/reuse, archived references, category/type matching, creator immutability, complete summaries beyond a page, transfer atomicity, and saving-account linkage. Overflow cases exercise real rejected writes and verify rollback. These embedded database checks do not simulate separate concurrent PostgreSQL connections.

Browser layout checks cover 320, 390, 768, and 1440 px widths. Screenshots were inspected for desktop calendar and savings views. Chromium mobile emulation verifies layout and interactions; physical iOS/Android installation and Safari behavior remain unverified. The worker caches only public icons and a reconnect document. Financial data needs a network connection.

Review found two important issues: aggregate overflow could prevent balance rendering, and switching Google accounts discarded the invitation token. Both were fixed and regression-tested. Input error association and adjacent-month calendar announcements were also corrected.

Hosted Supabase migration, real Google OAuth, second-person invitation acceptance through Google, Vercel deployment, and HTTPS device installation still require external configuration and verification. No credentials, hosted resources, or live deployment were supplied. Follow README.md before using real household finances.
