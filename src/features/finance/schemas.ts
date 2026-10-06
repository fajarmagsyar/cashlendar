import { z } from 'zod';
import { parseRupiah } from '../../lib/finance/money.ts';
import { todayJakarta, validDate } from '../../lib/finance/dates.ts';
const id = z.uuid();
const name = z.string().trim().min(1, 'Enter a name.').max(80);
const amount = (allowZero = false) => z.string().transform((value, ctx) => {
  try { return parseRupiah(value, allowZero); }
  catch (error) { ctx.addIssue({ code:'custom', message: (error as Error).message }); return z.NEVER; }
});
const date = z.string().refine(validDate, 'Choose a valid date.').refine(d => d <= todayJakarta(), 'Transactions cannot have a future date.');
const optionalId = z.union([id, z.literal('')]).optional();
export const entrySchema = z.object({
  id: optionalId, kind: z.enum(['income','expense','transfer']),
  amount: amount(), date, note: z.string().max(500).default(''), account_id: id,
  category_id: optionalId, destination_account_id: optionalId
}).superRefine((entry, ctx) => {
  if (entry.kind === 'transfer') {
    if (!entry.destination_account_id || entry.destination_account_id === entry.account_id) ctx.addIssue({ code:'custom', path:['destination_account_id'], message:'Choose a different destination account.' });
  } else if (!entry.category_id) ctx.addIssue({ code:'custom', path:['category_id'], message:'Choose a category.' });
});
export const accountSchema = z.object({ id:optionalId, name, type:z.enum(['cash','bank','ewallet','savings']), opening_balance:amount(true) });
export const categorySchema = z.object({ id:optionalId, name, kind:z.enum(['income','expense']) });
export const goalSchema = z.object({ id:optionalId, name, account_id:id, target_amount:amount(), target_date:z.string().default('').refine(d => !d || validDate(d), 'Choose a valid target date.') });
export type EntryInput = z.input<typeof entrySchema>;
