import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { and, eq, ne } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '../../shared/db/index.js';
import { users } from '../../shared/db/schema.js';
import {
  refreshUserSessions,
  toUserSnapshot,
} from '../../auth/session-cache.auth.js';
import { hash } from 'argon2';
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
    const set: { name?: string; handle?: string; passwordHash?: string } = {};

    if (dto.name !== undefined) {
      set.name = dto.name;
    }
    if (dto.handle !== undefined) {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.handle, dto.handle), ne(users.id, auth.user.id)))
        .get();
      if (existing) {
        throw new HTTPException(409, { message: 'Handle is already taken' });
      }
      set.handle = dto.handle;
    }
    if (dto.password !== undefined) {
      set.passwordHash = await hash(dto.password);
    }

    const [user] = await db
      .update(users)
      .set(set)
      .where(eq(users.id, auth.user.id))
      .returning();

    await refreshUserSessions(user.id);
    return c.json(toUserSnapshot(user), 200);
  },
);
