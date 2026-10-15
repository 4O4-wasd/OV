import { createHash, randomInt } from 'node:crypto';
import { HTTPException } from 'hono/http-exception';
import { sendOtpEmail } from '../mail/index.mail.js';
import { redis } from './redis.shared.js';

export type OtpPurpose = 'verify-email' | 'reset-password';

const OTP_TTL_SECONDS = 15 * 60;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const hashOtp = (otp: string) =>
  createHash('sha256').update(otp).digest('base64');

export async function assertOtp(
  purpose: OtpPurpose,
  userId: string,
  otp: string,
) {
  const key = `otp:${purpose}:${userId}`;
  const stored = await redis.get(key);
  if (!stored || stored !== hashOtp(otp)) {
    throw new HTTPException(400, { message: 'Invalid OTP' });
  }
  await redis.del(key);
}

export async function sendOtp(
  user: { id: string; email: string },
  purpose: OtpPurpose,
) {
  const key = `otp:${purpose}:${user.id}`;
  const fresh = await redis.set(
    `${key}:cooldown`,
    '1',
    'EX',
    OTP_RESEND_COOLDOWN_SECONDS,
    'NX',
  );
  if (fresh !== 'OK') return;

  const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');
  await redis.set(key, hashOtp(otp), 'EX', OTP_TTL_SECONDS);
  await sendOtpEmail(user.email, otp, purpose).catch(() => undefined);
}
