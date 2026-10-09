import { createHash, randomBytes, randomInt } from 'node:crypto';

export function generateToken(): string {
  return randomBytes(48).toString('base64');
}

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('base64');
}

export type OtpPurpose = 'verify-email' | 'reset-password';
