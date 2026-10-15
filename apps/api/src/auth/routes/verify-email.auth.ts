import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '../../shared/db/index.js';
import { users } from '../../shared/db/schema.js';
import { assertOtp } from '../../shared/otp.shared.js';
import { refreshUserSessions, toUserSnapshot } from '../session-cache.auth.js';
import { sessionAuth } from '../session.auth.js';
import { UserResponseSchema } from '../../user/dto.user.js';
import type { AppEnv } from '../../types.js';
import { VerifyEmailSchema } from '../dto.auth.js';

export const verifyEmailRoute = new Hono<AppEnv>();

verifyEmailRoute.post(
  '/verify-email',
  describeRoute({
    tags: ['auth'],
    summary: 'Verify email',
    description:
      "Verify the signed-in user's email with the OTP from sign-up",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Email verified',
        content: {
          'application/json': { schema: resolver(UserResponseSchema) },
        },
      },
      400: { description: 'Email is already verified or invalid OTP' },
      401: { description: 'Missing or invalid bearer token' },
    },
  }),
  sessionAuth({ skipEmailVerification: true }),
  validator('json', VerifyEmailSchema),
  async (c) => {
    const auth = c.get('auth');
    const dto = c.req.valid('json');
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.user.id))
      .get();
    if (!user) {
      throw new HTTPException(401, { message: 'Invalid or expired session' });
    }
    if (user.emailVerified) {
      throw new HTTPException(400, { message: 'Email is already verified' });
    }

    await assertOtp('verify-email', user.id, dto.otp);

    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, user.id));
    await refreshUserSessions(user.id);

    return c.json(toUserSnapshot({ ...user, emailVerified: true }), 200);
  },
);
