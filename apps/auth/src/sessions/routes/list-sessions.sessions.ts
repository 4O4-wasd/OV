import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';
import { listSessions } from '../utils.sessions.js';
import { sessionAuth } from '../../auth/session.auth.js';
import { SessionResponseSchema } from '../dto.sessions.js';
import type { AppEnv } from '../../types.js';

export const listSessionsRoute = new Hono<AppEnv>();

listSessionsRoute.get(
  '/sessions',
  describeRoute({
    tags: ['sessions'],
    summary: 'List sessions',
    description: 'List all sessions for the current user',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'The list of sessions',
        content: {
          'application/json': { schema: resolver(SessionResponseSchema.array()) },
        },
      },
      401: { description: 'Missing or invalid bearer token' },
      403: { description: 'Email is not verified' },
    },
  }),
  sessionAuth(),
  async (c) => {
    const auth = c.get('auth');
    return c.json(await listSessions(auth), 200);
  },
);
