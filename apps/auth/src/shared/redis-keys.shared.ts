import type { OtpPurpose } from './token.shared.js';

export const OTP_TTL_SECONDS = 15 * 60;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const SESSION_TTL_SECONDS = 60;

export const otpKey = (purpose: OtpPurpose, userId: string) =>
  `otp:${purpose}:${userId}`;

export const otpCooldownKey = (purpose: OtpPurpose, userId: string) =>
  `otp:${purpose}:${userId}:cooldown`;

export const sessionKey = (tokenHash: string) => `sess:${tokenHash}`;
