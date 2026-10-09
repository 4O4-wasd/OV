import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { forgotPassword } from '../utils.auth.js';
import { rateLimit } from '../../shared/rate-limit.shared.js';
import { MessageResponseSchema } from '../../shared/dto.shared.js';
import type { AppEnv } from '../../types.js';
import { ForgotPasswordSchema } from '../dto.auth.js';

export const forgotPasswordRoute = new Hono<AppEnv>();

forgotPasswordRoute.post(
  '/forgot-password',
  describeRoute({
    tags: ['auth'],
    summary: 'Forgot password',
    description: 'Request a password-reset OTP by email',
    responses: {
      200: {
        description: 'Password reset OTP sent',
        content: { 'application/json': { schema: resolver(MessageResponseSchema) } },
      },
      400: { description: 'Email not found' },
      429: { description: 'Too many requests' },
    },
  }),
  rateLimit('forgot-password', 5, '15 m'),
  validator('json', ForgotPasswordSchema),
  async (c) => {
    const dto = c.req.valid('json');
    return c.json(await forgotPassword(dto), 200);
  },
);
