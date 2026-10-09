import { Hono } from 'hono';
import { describeRoute, resolver } from 'hono-openapi';
import { deleteUser } from '../utils.user.js';
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
    return c.json(await deleteUser(auth), 200);
  },
);
