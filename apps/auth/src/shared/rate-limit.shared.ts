import type { Context, MiddlewareHandler, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { Ratelimit, type Duration } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { clientInfo } from './client-info.shared.js';
import type { AppEnv } from '../types.js';

let client: Redis | null = null;

function getUpstashRedis(): Redis | null {
  if (client !== null) return client;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  client = Redis.fromEnv();
  return client;
}

export function rateLimit(
  prefix: string,
  limit: number,
  window: Duration,
): MiddlewareHandler<AppEnv> {
  const redis = getUpstashRedis();
  const limiter = redis
    ? new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, window),
        prefix: `rl:${prefix}`,
      })
    : null;

  return async (c: Context<AppEnv>, next: Next) => {
    if (limiter) {
      const identifier = clientInfo(c).ip ?? 'unknown';
      const { success } = await limiter.limit(identifier);
      if (!success) {
        throw new HTTPException(429, { message: 'Too many requests' });
      }
    }
    await next();
  };
}
