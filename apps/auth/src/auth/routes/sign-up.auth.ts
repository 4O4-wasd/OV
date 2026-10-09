import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { signUp } from '../utils.auth.js';
import { clientInfo } from '../../shared/client-info.shared.js';
import { rateLimit } from '../../shared/rate-limit.shared.js';
import type { AppEnv } from '../../types.js';
import { SignUpSchema, SignUpResponseSchema } from '../dto.auth.js';

export const signUpRoute = new Hono<AppEnv>();

signUpRoute.post(
  '/sign-up',
  describeRoute({
    tags: ['auth'],
    summary: 'Sign up',
    description:
      'Create a new account, start a session, and email a verification OTP',
    responses: {
      201: {
        description: 'Account created',
        content: {
          'application/json': { schema: resolver(SignUpResponseSchema) },
        },
      },
      400: { description: 'Disposable email addresses are not allowed' },
      409: { description: 'Email or handle already in use' },
      429: { description: 'Too many requests' },
    },
  }),
  rateLimit('sign-up', 5, '1 h'),
  validator('json', SignUpSchema),
  async (c) => {
    const dto = c.req.valid('json');
    return c.json(await signUp(dto, clientInfo(c)), 201);
  },
);
