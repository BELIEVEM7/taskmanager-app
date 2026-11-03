type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();

  // Occasionally clear expired entries so memory doesn't grow forever
  if (store.size > 5000) {
    for (const [k, v] of store) if (v.resetAt < now) store.delete(k);
  }

  const entry = store.get(key);
  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { ok: true, retryAfter: 0 };
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}