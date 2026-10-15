import { Hono } from 'hono';
import { describeRoute, resolver, validator } from 'hono-openapi';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { eq, or } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '../../shared/db/index.js';
import { users } from '../../shared/db/schema.js';
import { sendOtp } from '../../shared/otp.shared.js';
import { hash } from 'argon2';
import { createSession } from '../session-cache.auth.js';
import { clientInfo } from '../../shared/client-info.shared.js';
import { rateLimit } from '../../shared/rate-limit.shared.js';
import type { AppEnv } from '../../types.js';
import { SignUpSchema, SignUpResponseSchema } from '../dto.auth.js';

const DISPOSABLE_DOMAINS: string[] = JSON.parse(
  readFileSync(
    createRequire(import.meta.url).resolve('disposable-email-domains'),
    'utf8',
  ),
);

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

    const domain = dto.email.split('@')[1]?.toLowerCase();
    if (!domain || DISPOSABLE_DOMAINS.includes(domain)) {
      throw new HTTPException(400, {
        message: 'Disposable email addresses are not allowed',
      });
    }

    const existing = await db
      .select()
      .from(users)
      .where(or(eq(users.email, dto.email), eq(users.handle, dto.handle)))
      .get();
    if (existing) {
      throw new HTTPException(409, {
        message:
          existing.email === dto.email ?
            'Email is already in use'
          : 'Handle is already taken',
      });
    }

    const [user] = await db
      .insert(users)
      .values({
        email: dto.email,
        name: dto.name,
        handle: dto.handle,
        passwordHash: await hash(dto.password),
      })
      .returning();

    const token = await createSession(user, clientInfo(c));
    await sendOtp(user, 'verify-email');

    return c.json({ token }, 201);
  },
);
