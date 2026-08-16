// Simple in-memory sliding-window rate limiter (per isolate).
// Good enough for abuse prevention; Cloudflare zone-level rate limiting can be added later.

const buckets = new Map();

export function rateLimit({ windowMs, max, message }) {
  return async (c, next) => {
    const key = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
    const route = c.req.path;
    const bucketKey = `${route}:${key}`;
    const now = Date.now();
    let entry = buckets.get(bucketKey);
    if (!entry || entry.windowStart + windowMs < now) {
      entry = { windowStart: now, count: 0 };
      buckets.set(bucketKey, entry);
      if (buckets.size > 5000) buckets.clear();
    }
    entry.count += 1;
    if (entry.count > max) {
      return c.json({ message }, 429);
    }
    await next();
  };
}