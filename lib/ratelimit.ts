// Simple in-memory rate limiter (resets on cold start)
// Keyed by IP + route. Sufficient for a single-instance deployment.

const store = new Map<string, { count: number; resetAt: number }>()

type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfter: number }

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true }
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { ok: true }
}
