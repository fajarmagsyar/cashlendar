export function parseRupiah(input: string, allowZero = false): number {
  if (!/^\d+$/.test(input)) throw new Error('Enter a whole rupiah amount using digits only.');
  const amount = Number(input);
  if (!Number.isSafeInteger(amount) || amount < (allowZero ? 0 : 1)) throw new Error(allowZero ? 'Enter a valid nonnegative rupiah amount.' : 'Enter a positive whole rupiah amount.');
  return amount;
}
export function safeSum(values: number[]): number {
  const total = values.reduce((sum, value) => {
    if (!Number.isSafeInteger(value)) throw new Error('This amount exceeds the supported range.');
    return sum + BigInt(value);
  }, 0n);
  if (total > BigInt(Number.MAX_SAFE_INTEGER) || total < BigInt(Number.MIN_SAFE_INTEGER)) throw new Error('The total exceeds the supported range.');
  return Number(total);
}
export function formatRupiah(amount: number): string {
  if (!Number.isSafeInteger(amount)) throw new Error('Invalid rupiah total.');
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
}
export function compactRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(amount);
}
export function checkedNumber(value: unknown): number {
  if (typeof value !== 'number' && !(typeof value === 'string' && /^-?\d+$/.test(value))) throw new Error('Invalid database amount.');
  const amount = Number(value);
  if (!Number.isSafeInteger(amount)) throw new Error('The total exceeds the supported rupiah range.');
  return amount;
}
