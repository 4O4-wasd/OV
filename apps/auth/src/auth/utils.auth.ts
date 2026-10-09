import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { eq, or } from 'drizzle-orm';
import { HTTPException } from 'hono/http-exception';
import { db } from '../db/index.js';
import { sessions, users } from '../db/schema.js';
import { sendOtpEmail } from '../mail/index.mail.js';
import {
  redisDel,
  redisGet,
  redisSetEx,
  redisSetNxEx,
} from '../shared/redis.shared.js';
import {
  evictUserSessions,
  refreshUserSessions,
  type UserSnapshot,
} from './session-cache.auth.js';
import { hashPassword, verifyPassword } from '../shared/password.shared.js';
import type { ClientInfo } from '../shared/client-info.shared.js';
import type {
  ChangeForgottenPasswordDto,
  ForgotPasswordDto,
  SignInDto,
  SignUpDto,
  VerifyEmailDto,
} from './dto.auth.js';
import {
  generateOtp,
  generateToken,
  hashToken,
  type OtpPurpose,
} from '../shared/token.shared.js';
import {
  otpCooldownKey,
  otpKey,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
} from '../shared/redis-keys.shared.js';

const require = createRequire(import.meta.url);

const DISPOSABLE_DOMAINS: string[] = JSON.parse(
  readFileSync(require.resolve('disposable-email-domains'), 'utf8'),
);

const fail = (status: 400 | 401 | 403 | 409 | 500, message: string) =>
  new HTTPException(status, { message });

type UserRow = typeof users.$inferSelect;

export async function signUp(dto: SignUpDto, client: ClientInfo) {
  const domain = dto.email.split('@')[1]?.toLowerCase();
  if (!domain || DISPOSABLE_DOMAINS.includes(domain)) {
    throw fail(400, 'Disposable email addresses are not allowed');
  }

  const existing = await db
    .select()
    .from(users)
    .where(or(eq(users.email, dto.email), eq(users.handle, dto.handle)))
    .get();
  if (existing) {
    throw fail(
      409,
      existing.email === dto.email
        ? 'Email is already in use'
        : 'Handle is already taken',
    );
  }

  const [user] = await db
    .insert(users)
    .values({
      email: dto.email,
      name: dto.name,
      handle: dto.handle,
      passwordHash: await hashPassword(dto.password),
    })
    .returning();

  const token = await createSession(user, client);
  await sendOtp(user, 'verify-email');

  return { token };
}

export async function signIn(dto: SignInDto, client: ClientInfo) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, dto.email))
    .get();
  if (!user || !(await verifyPassword(user.passwordHash, dto.password))) {
    throw fail(401, 'Invalid email or password');
  }

  const token = await createSession(user, client);
  if (!user.emailVerified) {
    await sendOtp(user, 'verify-email');
  }

  return { token, user: serializeUser(user) };
}

export async function forgotPassword(dto: ForgotPasswordDto) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, dto.email))
    .get();
  if (!user) {
    throw fail(400, 'Email not found');
  }
  await sendOtp(user, 'reset-password');
  return { message: 'Password reset OTP sent' };
}

export async function changeForgottenPassword(dto: ChangeForgottenPasswordDto) {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, dto.email))
    .get();
  if (!user) {
    throw fail(400, 'Email not found');
  }

  await assertOtp('reset-password', user.id, dto.otp);

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(dto.newPassword) })
    .where(eq(users.id, user.id));
  await evictUserSessions(user.id);

  return { message: 'Password updated' };
}

export async function verifyEmail(userId: string, dto: VerifyEmailDto) {
  const user = await db.select().from(users).where(eq(users.id, userId)).get();
  if (!user) {
    throw fail(401, 'Invalid or expired session');
  }
  if (user.emailVerified) {
    throw fail(400, 'Email is already verified');
  }

  await assertOtp('verify-email', user.id, dto.otp);

  await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.id, user.id));
  await refreshUserSessions(user.id);

  return serializeUser({ ...user, emailVerified: true });
}

export function serializeUser(user: UserRow | UserSnapshot) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    handle: user.handle,
    emailVerified: !!user.emailVerified,
    createdAt: user.createdAt,
  };
}

async function assertOtp(purpose: OtpPurpose, userId: string, otp: string) {
  const key = otpKey(purpose, userId);
  const stored = await redisGet(key);
  if (!stored || stored !== hashToken(otp)) {
    throw fail(400, 'Invalid OTP');
  }
  await redisDel(key);
}

async function sendOtp(user: UserRow | UserSnapshot, purpose: OtpPurpose) {
  const fresh = await redisSetNxEx(
    otpCooldownKey(purpose, user.id),
    OTP_RESEND_COOLDOWN_SECONDS,
  );
  if (!fresh) return;

  const otp = generateOtp();
  await redisSetEx(otpKey(purpose, user.id), OTP_TTL_SECONDS, hashToken(otp));
  try {
    await sendOtpEmail(user.email, otp, purpose);
  } catch (err) {
    console.error(
      `Failed to send ${purpose} OTP to ${user.email}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function createSession(user: UserRow, client: ClientInfo) {
  const token = generateToken();
  await db.insert(sessions).values({
    userId: user.id,
    tokenHash: hashToken(token),
    ip: client.ip,
    userAgent: client.userAgent,
  });
  return token;
}
