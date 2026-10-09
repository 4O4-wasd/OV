import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';
import { resolveSession } from './session-cache.auth.js';
import type { AppEnv } from '../types.js';

export interface SessionAuthOptions {
  skipEmailVerification?: boolean;
}

export const sessionAuth = (options: SessionAuthOptions = {}) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const header = c.req.header('authorization');
    if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
      throw new HTTPException(401, { message: 'Missing bearer token' });
    }

    const token = header.slice('Bearer '.length).trim();
    const snapshot = await resolveSession(token);
    if (!snapshot) {
      throw new HTTPException(401, { message: 'Invalid or expired session' });
    }

    if (!snapshot.user.emailVerified && !options.skipEmailVerification) {
      throw new HTTPException(403, { message: 'Email is not verified' });
    }

    c.set('auth', {
      sessionId: snapshot.sessionId,
      tokenHash: snapshot.tokenHash,
      user: snapshot.user,
    });
    await next();
  });
