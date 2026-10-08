# Cashlendar

A shared-household money manager with Calendar, List, and Charts tabs, Google login, IDR accounts, transfers, savings goals, Excel export, and home-screen installation.

## Update an existing installation

Apply `supabase/migrations/202610060003_finance_export.sql` in your Supabase SQL Editor, then deploy the updated app to Vercel. If the planned-expense migration `202610060002_planned_expenses.sql` has not been applied yet, apply it first. Run each migration once, in filename order. Both preserve existing accounts and transactions. If you manage migration history through the Supabase CLI, use `supabase db push` instead.

On mobile, Money contains Calendar, List, and Charts tabs with a shared month and filters. The dock shows Money, Accounts, +, Savings, and Profile. The central + in the dock opens Add transaction from any signed-in screen. Transactions show the original signed-in recorder; editing an entry preserves that attribution. Export Excel downloads all entries matching the current month and filters, including pages beyond the visible list. Planned expenses appear on a separate sheet. Amounts remain numeric for calculations; amounts requiring more than Excel's 15 significant digits are exported as exact text.

Profile lets you edit your Cashlendar display name, open Family and Settings, manage credentials through your Google account, switch Google accounts on this device, and sign out. Language and currency are marked Soon in Settings; the app currently uses English and IDR. Profile editing uses the existing self-only database policy and requires no additional migration.

In Add transaction, choose Expense → Planned and set the spending date. Selecting a future day in the calendar starts a planned expense automatically. Plans appear on the calendar but do not affect balances or charts. Mark paid records an expense on the payment date and removes the plan atomically. Plans can also be edited or deleted. Amount fields add IDR thousand separators as you type, such as `1.250.000`.

## Run locally

Use Node.js 22.18 or later and pnpm 11.

```sh
pnpm install
cp .env.example .env.local
pnpm dev
```

Open http://localhost:3000. Without Supabase configuration, Cashlendar shows setup instructions and protects all household screens. It does not create sample finances or pretend login is connected.

## Supabase setup

1. Create a dedicated Supabase project for Cashlendar.
2. Open the SQL Editor and run the files under `supabase/migrations/` in filename order, once each, or apply them through the Supabase CLI below. This creates tables, policies, database functions, signup profile handling, indexes, and transaction validation.
3. Copy your project URL and publishable key from the project's Connect dialog into `.env.local`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use the public publishable key, not a service-role or secret key. Database permissions depend on authenticated household membership. The migration resets grants on public tables/functions before granting Cashlendar access, so apply it to a dedicated project.

If using the CLI:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

To run local Supabase with Docker, use `supabase start` and `supabase db reset`; then set the local URL/key reported by the CLI. The Google provider needs separate configuration for real OAuth login.

## Google login

1. In Google Cloud, configure an OAuth consent screen and a Web application OAuth client. Add permitted test users while the consent screen is in testing mode.
2. In Supabase Authentication → Sign In / Providers → Google, enter the client ID and secret and enable the provider. These secrets belong in Supabase, not in the application repository.
3. Add the callback URL shown by Supabase to Google's **Authorized redirect URIs**, typically `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.
4. In Supabase Authentication → URL Configuration, set the Site URL to your app's URL. Add `http://localhost:3000/auth/callback` and `https://YOUR_DOMAIN/auth/callback` to the redirect allowlist. The application adds a `next` query parameter to preserve invitation destinations; use the provider's documented redirect-pattern support when configuring the allowlist, for example `http://localhost:3000/auth/callback**` and `https://YOUR_DOMAIN/auth/callback**`.
5. Restart the local app after changing environment variables. Sign in, create a household, and add the first account with its opening balance.

Reference: [Supabase Google login](https://supabase.com/docs/guides/auth/social-login/auth-google), [SSR cookie clients](https://supabase.com/docs/guides/auth/server-side/creating-a-client), and [redirect URL patterns](https://supabase.com/docs/guides/auth/redirect-urls).

## Deploy to Vercel

1. Push the application to your own Git repository and import it into Vercel. Select the Next.js framework preset; the build command is `pnpm build`.
2. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_APP_URL` to Vercel's environment variables. Use your production origin for `NEXT_PUBLIC_APP_URL`.
3. Deploy, then update Supabase Site URL and its redirect allowlist to match the HTTPS deployment URL.

### Google login redirects to localhost after deployment

For the current production domain, set these exact values:

- Supabase → Authentication → URL Configuration → Site URL: `https://cashlendar-phi.vercel.app`
- Supabase → Authentication → URL Configuration → Redirect URLs: `https://cashlendar-phi.vercel.app/auth/callback**`
- Vercel → Project Settings → Environment Variables → `NEXT_PUBLIC_APP_URL`: `https://cashlendar-phi.vercel.app` (Production)

The callback allowlist includes `**` because Cashlendar sends a `next` query parameter, including for invitations and Profile account switching. Local development may retain its separate localhost callback entry. Google Cloud's authorized redirect URI remains your Supabase project's `https://YOUR_PROJECT.supabase.co/auth/v1/callback`.

Save the settings and redeploy the app after changing Vercel environment variables or callback code. Start a fresh Google sign-in from the production login page; do not reuse the previous OAuth callback link. Supabase can fall back to its Site URL when the requested callback is not allowed. The server callback now resolves Vercel's public forwarded host, then the configured production origin, instead of assuming an internal request URL is public. Local development stays on the local request origin.

References: [Supabase redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls), [Vercel request headers](https://vercel.com/docs/headers/request-headers).
4. Redeploy after changing public environment variables, because Next.js includes them in the browser build.
5. Test Google login, household creation, a second member's invitation, and household isolation before entering real finances.

No Redis, custom API service, or service-role key is required. External projects and deployment are not created automatically by this source code.

Reference: [Vercel Next.js deployment](https://vercel.com/docs/frameworks/full-stack/nextjs).

The Supabase project is in Sydney (`ap-southeast-2`). `vercel.json` pins Vercel Functions to Sydney (`syd1`) so server rendering and database queries run in the same region. Redeploy for this setting to take effect. If the database region changes, update this setting too. See [Vercel region configuration](https://vercel.com/docs/regions).

Main-menu screens are fully prefetched in production. Visited pages stay in the browser's router cache for 30 seconds; server actions invalidate affected pages after a save, and returning to the app or reconnecting refreshes the current view. Other household members' changes can take up to this cache interval to appear during navigation. Private pages remain dynamically rendered and are not stored in a shared server cache. Local development disables automatic prefetching; production behavior can be checked with `AUTH_E2E_PRODUCTION=1 pnpm test:e2e:auth tests/e2e/authenticated/prefetch.spec.ts`.

## Use Cashlendar

- **Calendar:** navigate months, select a day, and add or review its entries.
- **Charts:** see cash flow, daily income/expenses, and spending by category. Text summaries accompany charts.
- **List:** filter by month, account, category, type, or text. Entries are paginated; totals cover every matching entry.
- **Accounts:** add cash, bank, e-wallet, or savings accounts. Opening balances do not count as income. Archive accounts to retain history.
- **Savings:** link one active goal to each savings account. Add savings or withdraw by transferring between accounts; transfers do not count as expenses or income.
- **Family:** household owners create invitation links tied to the recipient's verified Google email. Copy the link and send it yourself; there is no automatic invitation email. Links expire after seven days. Owners can revoke links and remove members.

Balances may become negative when recording past spending. Values use whole rupiah and Asia/Jakarta dates. Financial entries cannot have future dates. Editing an entry in an archived account requires restoring that account first.

## Install on your phone

On Android/Chrome, use the app's install prompt when available, or the browser menu's Install app / Add to Home Screen action. On iPhone/iPad, open Cashlendar in Safari and choose Share → Add to Home Screen. HTTPS is required outside localhost.

The service worker caches icons and a reconnect page only. It does not cache household pages, Supabase data, or authentication callbacks. Financial reads and writes require a connection. A failed form save preserves entered values while that form remains open.

Reference: [Next.js PWA guide](https://nextjs.org/docs/app/guides/progressive-web-apps).

## Checks

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm start
pnpm test:e2e
pnpm test:e2e:auth
```

The test suite executes financial validation and the actual SQL migration in an embedded PostgreSQL instance using PGlite. Its auth schema simulates user identities, including verified email and roles. It verifies database permissions and integrity rather than mocking finance query results. It does not prove hosted Supabase configuration, Google OAuth, or multi-connection concurrency.

The baseline browser tests build an isolated production app in `.next-baseline` and start it on port 3002 with blank Supabase configuration. They check route protection, configuration states, responsive containment, install assets, and offline navigation without changing `.env.local` or using your hosted project. Chromium is used from `/usr/bin/chromium` if available; otherwise install Playwright's browser with `pnpm exec playwright install chromium`. Set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to choose an installed browser.

The authenticated browser suite starts its own app on port 3001 and a local test-only Supabase transport on port 54329. The transport executes the real migrations and RLS in PGlite; it supplies signed test sessions instead of contacting Google. It checks entry creation, editing and deletion, planning and payment, formatted amount editing, complete reports beyond one page, accounts, savings transfers, family permissions, invitation account switching, sign-out, keyboard dialogs, field errors, and narrow layouts. Production source does not use this transport. Both ports must be free before running the suite.

See `docs/verification.md` for the actual checks run and remaining integration requirements.

## Project layout

- `src/app`: routes, auth callback, layouts, styles, and manifest.
- `src/features`: finance forms/views, accounts, savings, and household actions.
- `src/lib`: strict finance/date rules and Supabase clients/session handling.
- `public`: icons, allowlisted service worker, and offline page.
- `supabase/migrations`: schema, RLS, and household/finance functions.
- `tests`: domain/database and browser tests.

Approved design and implementation plan are under `docs/superpowers/`.
