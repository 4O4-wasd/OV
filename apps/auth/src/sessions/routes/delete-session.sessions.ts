import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { deleteSession } from '../utils.sessions.js';
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
    await deleteSession(auth, id);
    return c.json({ message: 'Session deleted' }, 200);
  },
);
