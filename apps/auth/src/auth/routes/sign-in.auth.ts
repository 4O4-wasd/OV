import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { signIn } from '../utils.auth.js';
import { clientInfo } from '../../shared/client-info.shared.js';
import { rateLimit } from '../../shared/rate-limit.shared.js';
import type { AppEnv } from '../../types.js';
import { SignInSchema, SignInResponseSchema } from '../dto.auth.js';

export const signInRoute = new Hono<AppEnv>();

signInRoute.post(
  '/sign-in',
  describeRoute({
    tags: ['auth'],
    summary: 'Sign in',
    description:
      'Sign in with email and password, starting a new session. Unverified accounts get a fresh verification OTP by email.',
    responses: {
      200: {
        description: 'Signed in',
        content: {
          'application/json': { schema: resolver(SignInResponseSchema) },
        },
      },
      401: { description: 'Invalid email or password' },
      429: { description: 'Too many requests' },
    },
  }),
  rateLimit('sign-in', 10, '15 m'),
  validator('json', SignInSchema),
  async (c) => {
    const dto = c.req.valid('json');
    return c.json(await signIn(dto, clientInfo(c)), 200);
  },
);
