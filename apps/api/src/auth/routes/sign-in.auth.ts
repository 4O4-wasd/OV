import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '../../shared/db/index.js';
import { users } from '../../shared/db/schema.js';
import { sendOtp } from '../../shared/otp.shared.js';
import { verify } from 'argon2';
import { createSession, toUserSnapshot } from '../session-cache.auth.js';
import { clientInfo } from '../../shared/client-info.shared.js';
import { rateLimit } from '../../shared/rate-limit.shared.js';
import type { AppEnv } from '../../types.js';
import { SignInSchema, SignInResponseSchema } from '../dto.auth.js';

export const signInRoute = new Hono<AppEnv>();

signInRoute.post(
  '/sign-in',
  describeRoute({
    tags: ['auth'],
    summary: 'Sign in',
    description:
      'Sign in with email and password, starting a new session. Unverified accounts get a fresh verification OTP by email.',
    responses: {
      200: {
        description: 'Signed in',
        content: {
          'application/json': { schema: resolver(SignInResponseSchema) },
        },
      },
      400: { description: 'Invalid request body' },
      401: { description: 'Invalid email or password' },
      429: { description: 'Too many requests' },
    },
  }),
  rateLimit('sign-in', 10, '15 m'),
  validator('json', SignInSchema),
  async (c) => {
    const dto = c.req.valid('json');

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .get();
    if (!user || !(await verify(user.passwordHash, dto.password).catch(() => false))) {
      throw new HTTPException(401, { message: 'Invalid email or password' });
    }

    const token = await createSession(user, clientInfo(c));
    if (!user.emailVerified) {
      await sendOtp(user, 'verify-email');
    }

    return c.json({ token, user: toUserSnapshot(user) }, 200);
  },
);
