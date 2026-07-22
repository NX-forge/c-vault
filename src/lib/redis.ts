// Placeholder for Redis integration
// This will be used for rate limiting and caching

import { Redis } from "@upstash/redis";

let redis: Redis | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export { redis };

/**
 * Simple sliding-window-ish rate limit: allow `limit` calls per `windowSeconds`
 * per key. Returns true if the call is allowed. If Redis isn't configured
 * (e.g. local dev without Upstash set up), this always allows the call rather
 * than blocking the demo — rate limiting is a cost-protection measure, not a
 * feature the app depends on functionally.
 */
export async function checkRateLimit(
  key: string,
  limit = 20,
  windowSeconds = 60
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) {
    return { allowed: true, remaining: limit };
  }

  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }

  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

// Made with Bob
