export function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith('//') || /[\\\u0000-\u001f]/.test(decoded)) return '/';
    const parsed = new URL(value, 'https://cashlendar.invalid');
    return parsed.origin === 'https://cashlendar.invalid' ? parsed.pathname + parsed.search : '/';
  } catch { return '/'; }
}

type CallbackOriginOptions={production:boolean;appUrl?:string;vercel?:boolean;forwardedHost?:string|null};
function publicHttpsOrigin(value:string|undefined):string|null {
  if(!value) return null;
  try {
    const url=new URL(value);
    const local=url.hostname==='localhost' || url.hostname.endsWith('.localhost') || url.hostname==='[::1]' || /^127\./.test(url.hostname);
    if(url.protocol!=='https:' || local || url.username || url.password || url.pathname!=='/' || url.search || url.hash) return null;
    return url.origin;
  } catch {return null;}
}
export function callbackOrigin(requestUrl:string,{production,appUrl,vercel=false,forwardedHost}:CallbackOriginOptions):string {
  const requestOrigin=new URL(requestUrl).origin;
  if(!production) return requestOrigin;
  // Vercel supplies the browser-facing host; retaining it also keeps preview PKCE cookies on their original domain.
  if(vercel && forwardedHost && /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?(?::\d{1,5})?$/i.test(forwardedHost)) {
    const forwarded=publicHttpsOrigin(`https://${forwardedHost}`);
    if(forwarded) return forwarded;
  }
  return publicHttpsOrigin(appUrl) || requestOrigin;
}
