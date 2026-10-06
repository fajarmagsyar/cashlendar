# Navigation and planned expenses

The requested direction is a calmer money-management UI with Apple Liquid Glass inspiration confined to navigation. ENERGY 1 / RHYTHM 2 / MOTION 1. The existing light green identity is retained; this is an application for reading amounts and recording household finances.

Design decisions:

- A floating six-destination dock gives phone users direct access to Calendar, Charts, List, Accounts, Savings, and Family. Translucency and blur apply to that dock alone; opaque cards and forms keep financial information readable. It has an opaque fallback when backdrop filtering is unsupported.
- System typography matches native phone controls and uses tabular figures for money. Green marks income and primary actions, muted terracotta marks actual expenses, and a hollow marker plus text identifies planned expenses.
- Page names replace taglines and repeated helper captions. The household name stays in the header. Installation guidance opens from an optional header button instead of covering calendar content.
- The entry form starts with expense/income/transfer controls and a large amount field. Expense timing distinguishes Spent from Planned. Selecting a future calendar date fills that date and enables planning. A single active account is preselected; multiple accounts require an explicit choice, with the selected balance shown.
- Phone dialogs open as bottom sheets. A separate content scroll area keeps the Save button visible and avoids native fieldset scrolling problems. Labels, field errors, keyboard focus, Escape closing, and focus restoration remain accessible.
- Thousand separators use IDR dots and string formatting without floating-point rounding. Raw digits or correctly grouped whole amounts are accepted. Decimal values, malformed groups, negative amounts, and unsafe integers are rejected. Account opening balances and savings targets use the same input.
- Planned expenses have a separate household-protected table. Balances and cash flow use actual transactions only. Mark paid takes household and plan locks, creates an expense, then deletes the plan in one transaction. Failed writes retain the plan; duplicate payment is rejected. A JSON reporting function returns the entire month's plans independently of PostgREST row limits.

Apply only `202610060002_planned_expenses.sql` to an existing installation before deploying this update. The original migration was left unchanged.

Verification includes actual PostgreSQL/RLS tests and browser checks for future-plan creation, rescheduling, cancellation, payment, currency typing and cursor editing, all six navigation links at 320 px, and a 320 × 600 entry sheet. The initial short-screen assertion exposed a real note/Save overlap; scrolling now belongs to a normal wrapper outside the fieldset. Initial browser test failures also identified a date-label matcher that wrongly expected a year and a development indicator intercepting dock clicks; those were corrected.

The fresh read-only review found no important defects. Final check results and remaining hosted verification are recorded in verification.md.


## Money workspace and export

Calendar, List and Charts now share one URL-based Money workspace, retaining month, filters and selected day across tab changes. `/charts` and `/list` redirect to the matching tab with their query preserved. At phone widths, the dock contains Money, Accounts, +, Savings and Profile. The circular + uses the established green action color; glass remains confined to the dock. Desktop keeps named view links and contextual add buttons.

A short “Recorded by” line stays visible beside each transaction's date/account metadata on all widths. This is the authenticated person who originally entered the record; database triggers preserve that person across edits. Excel exports the selected month and filters in Transactions and Planned expenses sheets with names and recorder IDs. Sheets freeze the header, expose column filters and keep numeric IDR amounts except values beyond Excel's 15-digit precision, which stay exact text.

Migration `202610060003_finance_export.sql` is required after the planned-expense migration. Current browser validation is blocked by local server permissions; see verification.md for the current test results. Prior mobile screenshot claims above refer to the earlier UI, not these tab/dock changes.


## Profile and Settings

Profile replaces Family in the dock. The avatar in the header also links to Profile; logout is removed from the signed-in header. Profile holds the editable Cashlendar name, Google credential-management link, device-local account switching, Family and Settings shortcuts, and Sign out. The name lives in the existing RLS-protected profile record, so family names and recorder labels stay consistent while historical creator IDs remain unchanged. Family keeps its current owner/member permissions and has a back link to Profile.

Settings shows English and Indonesian rupiah (IDR), with both controls disabled and marked Soon. No preference is saved or implied to work. User explicitly selected Google-only authentication; no password form or extra identity provider was introduced.
