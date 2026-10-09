import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { updateUser } from '../utils.user.js';
import { sessionAuth } from '../../auth/session.auth.js';
import { UserResponseSchema } from '../dto.user.js';
import type { AppEnv } from '../../types.js';
import { UpdateUserSchema } from '../dto.user.js';

export const updateUserRoute = new Hono<AppEnv>();

updateUserRoute.patch(
  '/me',
  describeRoute({
    tags: ['user'],
    summary: 'Update user',
    description:
      "Update the signed-in user's name, handle, or password. At least one field is required.",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: 'The updated user',
        content: {
          'application/json': { schema: resolver(UserResponseSchema) },
        },
      },
      400: { description: 'No fields to update' },
      409: { description: 'Handle is already taken' },
      401: { description: 'Missing or invalid bearer token' },
      403: { description: 'Email is not verified' },
    },
  }),
  sessionAuth(),
  validator('json', UpdateUserSchema),
  async (c) => {
    const auth = c.get('auth');
    const dto = c.req.valid('json');
    return c.json(await updateUser(auth, dto), 200);
  },
);
