import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { changeForgottenPassword } from '../utils.auth.js';
import { MessageResponseSchema } from '../../shared/dto.shared.js';
import type { AppEnv } from '../../types.js';
import { ChangeForgottenPasswordSchema } from '../dto.auth.js';

export const changeForgottenPasswordRoute = new Hono<AppEnv>();

changeForgottenPasswordRoute.post(
  '/change-forgotten-password',
  describeRoute({
    tags: ['auth'],
    summary: 'Change forgotten password',
    description: 'Set a new password using the OTP emailed by forgot-password',
    responses: {
      200: {
        description: 'Password updated',
        content: { 'application/json': { schema: resolver(MessageResponseSchema) } },
      },
      400: { description: 'Email not found or invalid OTP' },
    },
  }),
  validator('json', ChangeForgottenPasswordSchema),
  async (c) => {
    const dto = c.req.valid('json');
    return c.json(await changeForgottenPassword(dto), 200);
  },
);
