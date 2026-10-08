# Phone reminders

Apply all pending migrations in filename order, including `202610080001_family_board.sql` and `202610080002_board_notifications.sql`. The board works without push configuration; phone notifications need the steps below.

Generate VAPID keys once, then keep the same pair across deployments:

```sh
pnpm exec web-push generate-vapid-keys --json
```

Set these Vercel environment variables and redeploy:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: generated public key (also needed at build time).
- `VAPID_PRIVATE_KEY`: generated private key, server only.
- `VAPID_SUBJECT`: a real contact such as `mailto:you@example.com`.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase's server-only service-role key. Never prefix it with `NEXT_PUBLIC_`.
- `CRON_SECRET`: a random secret, at least 32 characters, shared only with the scheduler.

The authenticated `GET /api/reminders` endpoint checks `Authorization: Bearer <CRON_SECRET>`, claims up to 20 deliveries, sends encrypted web push, and records delivery results. Successful deliveries are recorded per subscribed device and due date. An interrupted run can retry a notification; the shared notification tag replaces the earlier notification on supporting devices. Title edits do not send it again; changing the date schedules a new occurrence. Failed deliveries retry after five minutes, up to five attempts. Expired subscriptions are removed. Only current household members receive reminders; completed or deleted reminders are excluded. Notifications keep note/title details off lock screens and open the signed-in board. Provider acceptance does not guarantee the phone displays a notification at an exact time.

## Schedule a check every minute

Use Supabase Cron with `pg_net`, so reminders can run when the app is closed. Enable `pg_cron` and `pg_net` in Supabase's Extensions settings. Store the deployed HTTPS origin and the same cron secret in Supabase Vault using the Vault dashboard (names `cashlendar_app_url` and `cashlendar_cron_secret`). Then run:

```sql
select cron.schedule(
  'cashlendar-family-reminders',
  '* * * * *',
  $$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name='cashlendar_app_url') || '/api/reminders',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name='cashlendar_cron_secret')
    ),
    timeout_milliseconds := 60000
  );
  $$
);
```

Use the deployed origin without a trailing slash. Check Supabase Cron history and `net._http_response` for failed requests. Deployment protection must allow this production endpoint to receive authenticated scheduler requests. Do not expose Vault values or authorization headers in logs.

The scheduling mechanism follows [Supabase's Cron and Vault example](https://supabase.com/docs/guides/functions/schedule-functions) and [pg_net HTTP GET API](https://supabase.com/docs/guides/database/extensions/pg_net). A Vercel Pro minutely cron or another scheduler can call the same endpoint; Vercel Hobby's daily cron frequency is insufficient for timed reminders ([Vercel limits](https://vercel.com/docs/cron-jobs/usage-and-pricing)). No hosted scheduler has been created by this code change.

## Enable on each phone

Open More → Family board → Enable notifications, then allow the browser permission. Reminder times use WIB (Asia/Jakarta). The scheduler checks every minute; delivery may be later because of device connectivity or notification settings. New subscriptions receive future reminders, without a backlog of old due reminders. Pending reminders catch up for 24 hours after a scheduler interruption.

On iPhone/iPad, install Cashlendar with Safari's Share → Add to Home Screen, open the installed app, then enable notifications. Web push requires iOS/iPadOS 16.4 or later and permission requested from a user tap ([Apple WebKit guidance](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)). Browser permission does not automatically subscribe another family member; each person opts in while signed in.

Smoke test on a real phone: enable notifications, create a reminder two minutes ahead, close the app, verify one notification arrives and opens the board, then complete/delete another reminder before it is due and verify it sends nothing. This live delivery check requires configured keys, a running scheduler, HTTPS, and device permission.

To stop delivery, disable notifications on the device or unschedule the job:

```sql
select cron.unschedule('cashlendar-family-reminders');
```
