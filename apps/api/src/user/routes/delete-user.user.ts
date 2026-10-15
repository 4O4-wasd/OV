import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';
import { eq } from 'drizzle-orm';
import { db } from '../../shared/db/index.js';
import { sessions, users } from '../../shared/db/schema.js';
import { evictToken } from '../../auth/session-cache.auth.js';
import { sessionAuth } from '../../auth/session.auth.js';
import { MessageResponseSchema } from '../../shared/dto.shared.js';
import type { AppEnv } from '../../types.js';

export const deleteUserRoute = new Hono<AppEnv>();

deleteUserRoute.delete(
  '/me',
  describeRoute({
    tags: ['user'],
    summary: 'Delete user',
    description: 'Delete the signed-in user account and all its sessions',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Account deleted',
        content: { 'application/json': { schema: resolver(MessageResponseSchema) } },
      },
      401: { description: 'Missing or invalid bearer token' },
      403: { description: 'Email is not verified' },
    },
  }),
  sessionAuth(),
  async (c) => {
    const auth = c.get('auth');
    const rows = await db
      .select({ tokenHash: sessions.tokenHash })
      .from(sessions)
      .where(eq(sessions.userId, auth.user.id));

    await db.delete(users).where(eq(users.id, auth.user.id));
    await Promise.all(rows.map((s) => evictToken(s.tokenHash)));

    return c.json({ message: 'Account deleted' }, 200);
  },
);
