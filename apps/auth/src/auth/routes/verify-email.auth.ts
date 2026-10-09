import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { verifyEmail } from '../utils.auth.js';
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
    return c.json(await verifyEmail(auth.user.id, dto), 200);
  },
);
