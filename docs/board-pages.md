# Shared board pages

The board now has one shared page format. Text, checklists, tables and drawings can appear together; a due date adds a reminder to the same page. Creating and editing use `/board/new` and `/board/[id]` with a persistent Save action. The board supports title/content search, quick checklist completion and reminder completion.

The design keeps Cashlendar's green action color, warm light background, opaque surfaces and system type. ENERGY 1 / RHYTHM 2 / MOTION 2. A large page title gives the editor a focal point. Small block headers hold formatting and ordering controls; functional arrow buttons move blocks. Tables and drawings get their own content area. A brief block entrance confirms insertion and honors reduced motion. Glass remains confined to the existing app dock, which is hidden during editing to prevent accidental navigation.

Text supports paragraph/heading, bold and italic per block. Tables support arithmetic, parentheses, unary signs, cell references and SUM/AVERAGE/MIN/MAX/COUNT, including ranges. References belong to the current table. Focus a cell to edit the original formula; leaving it displays the calculated value. Circular references, division by zero, invalid references and invalid input show spreadsheet errors. Calculation uses a small parser, with no eval or dynamic code execution. Tables are limited to 30 rows and 12 columns. Removing occupied rows or columns requires confirmation; references keep their literal coordinates.

Drawings use pointer input for fingers, pens and mice. Pen color/width, stroke erasing, undo and clear are available. Drawings are stored as bounded numeric points and rendered as SVG polylines, never arbitrary SVG markup. Limits are 200 strokes and 12,000 points per drawing. A page allows 50 blocks and up to 250,000 serialized characters. There are no new runtime dependencies.

Saves require an explicit action. Failed and conflicting saves retain the open draft; leaving with the editor's Back button asks before discarding, and closing/reloading the tab invokes the browser's unsaved-changes guard. Drafts are not stored across a browser session. Refreshing other household data is paused while the editor is open so it cannot replace an unsaved page.

## Database rollout

Apply `supabase/migrations/202610080003_board_documents.sql` before deploying this update, after the existing board and notification migrations. The transaction adds a validated `document` column and converts existing text/checklists without changing identifiers, versions, creators, editors, timestamps, completion or due dates. Legacy columns and kinds remain in place. New pages use `kind='note'`; the UI always reads the unified document. The notification queue now considers any page with a due date, with the existing subscriptions, leases, duplicate protection and membership checks preserved.

The household RLS policies remain in force. Whole-page saves require the version that was opened. Quick checklist completion locks the row and updates only the selected document task, preserving other tasks. Existing phone notification configuration and the scheduled reminder endpoint are still required; see `phone-reminders.md`.

For application rollback, the original columns remain available, but new-format changes are stored in `document`. Keep that column and migration when rolling back the application. Reversing the migration or deleting documents would lose new-format content; export/convert those pages first. Existing converted originals remain in their legacy columns.
