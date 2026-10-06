export function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('//') || /[\\\u0000-\u001f]/.test(decoded)) return '/';
    const parsed = new URL(value, 'https://cashlendar.invalid');
    return parsed.origin === 'https://cashlendar.invalid' ? parsed.pathname + parsed.search : '/';
  } catch { return '/'; }
}
