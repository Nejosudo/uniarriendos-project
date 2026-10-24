type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function checkRateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (entry.count < limit) {
    entry.count += 1;
    return { ok: true, retryAfterMs: 0 };
  }
  return { ok: false, retryAfterMs: entry.resetAt - now };
}

export function rateLimitKey(ip: string | null, userId: string | null, action: string): string {
  return `${action}:${userId || ip || 'anon'}`;
}

export function getClientIp(headers: Headers): string | null {
  const real = headers.get('x-real-ip')?.trim();
  if (real) return real.slice(0, 64);
  const cf = headers.get('cf-connecting-ip')?.trim();
  if (cf) return cf.slice(0, 64);
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first ? first.slice(0, 64) : null;
}

if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) if (now > v.resetAt) store.delete(k);
  }, 60_000).unref?.();
}
