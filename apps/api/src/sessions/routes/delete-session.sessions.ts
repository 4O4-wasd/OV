import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { and, eq } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '../../shared/db/index.js';
import { sessions } from '../../shared/db/schema.js';
import { evictToken } from '../../auth/session-cache.auth.js';
import { sessionAuth } from '../../auth/session.auth.js';
import { MessageResponseSchema } from '../../shared/dto.shared.js';
import type { AppEnv } from '../../types.js';
import { SessionIdParamSchema } from '../dto.sessions.js';

export const deleteSessionRoute = new Hono<AppEnv>();

deleteSessionRoute.delete(
  '/session/:id',
  describeRoute({
    tags: ['sessions'],
    summary: 'Delete session',
    description:
      "Delete one of the current user's sessions (cannot delete the current one)",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'Session deleted',
        content: { 'application/json': { schema: resolver(MessageResponseSchema) } },
      },
      400: { description: 'Cannot delete the current session' },
      404: { description: 'Session not found' },
      401: { description: 'Missing or invalid bearer token' },
      403: { description: 'Email is not verified' },
    },
  }),
  sessionAuth(),
  validator('param', SessionIdParamSchema),
  async (c) => {
    const auth = c.get('auth');
    const { id } = c.req.valid('param');
    if (id === auth.sessionId) {
      throw new HTTPException(400, {
        message: 'Cannot delete the current session',
      });
    }

    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.id, id), eq(sessions.userId, auth.user.id)))
      .get();
    if (!session) {
      throw new HTTPException(404, { message: 'Session not found' });
    }

    await db.delete(sessions).where(eq(sessions.id, session.id));
    await evictToken(session.tokenHash);
    return c.json({ message: 'Session deleted' }, 200);
  },
);
