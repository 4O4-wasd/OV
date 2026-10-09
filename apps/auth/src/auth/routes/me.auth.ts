import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';
import { serializeUser } from '../utils.auth.js';
import { sessionAuth } from '../session.auth.js';
import { UserResponseSchema } from '../../user/dto.user.js';
import type { AppEnv } from '../../types.js';

export const meRoute = new Hono<AppEnv>();

meRoute.get(
  '/me',
  describeRoute({
    tags: ['auth'],
    summary: 'Me',
    description: 'Get the currently signed-in user',
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'The current user',
        content: {
          'application/json': { schema: resolver(UserResponseSchema) },
        },
      },
      401: { description: 'Missing or invalid bearer token' },
      403: { description: 'Email is not verified' },
    },
  }),
  sessionAuth(),
  async (c) => {
    const auth = c.get('auth');
    return c.json(serializeUser(auth.user), 200);
  },
);
