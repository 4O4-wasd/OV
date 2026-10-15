import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '../../shared/db/index.js';
import { users } from '../../shared/db/schema.js';
import { assertOtp } from '../../shared/otp.shared.js';
import { hash } from 'argon2';
import { evictUserSessions } from '../session-cache.auth.js';
import { MessageResponseSchema } from '../../shared/dto.shared.js';
import type { AppEnv } from '../../types.js';
import { ChangeForgottenPasswordSchema } from '../dto.auth.js';

export const changeForgottenPasswordRoute = new Hono<AppEnv>();

changeForgottenPasswordRoute.post(
  '/change-forgotten-password',
  describeRoute({
    tags: ['auth'],
    summary: 'Change forgotten password',
    description: 'Set a new password using the OTP emailed by forgot-password',
    responses: {
      200: {
        description: 'Password updated',
        content: { 'application/json': { schema: resolver(MessageResponseSchema) } },
      },
      400: { description: 'Email not found or invalid OTP' },
    },
  }),
  validator('json', ChangeForgottenPasswordSchema),
  async (c) => {
    const dto = c.req.valid('json');

    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .get();
    if (!user) {
      throw new HTTPException(400, { message: 'Email not found' });
    }

    await assertOtp('reset-password', user.id, dto.otp);

    await db
      .update(users)
      .set({ passwordHash: await hash(dto.newPassword) })
      .where(eq(users.id, user.id));
    await evictUserSessions(user.id);

    return c.json({ message: 'Password updated' }, 200);
  },
);
