import { Ratelimit, type Duration } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "../types.js";
import { clientInfo } from "./client-info.shared.js";

export function rateLimit(prefix: string, limit: number, window: Duration) {
    const limiter = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(limit, window),
        prefix: `rl:${prefix}`,
    });

    return createMiddleware<AppEnv>(async (c, next) => {
        const { success } = await limiter.limit(clientInfo(c).ip ?? "unknown");
        if (!success) {
            throw new HTTPException(429, { message: "Too many requests" });
        }
        await next();
    });
}
