import { OtpPurpose } from './token.util.js';

export const OTP_TTL_SECONDS = 15 * 60; 
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const SESSION_TTL_SECONDS = 60;

export const otpKey = (purpose: OtpPurpose, userId: number) =>
  `otp:${purpose}:${userId}`;

export const otpCooldownKey = (purpose: OtpPurpose, userId: number) =>
  `otp:${purpose}:${userId}:cooldown`;

export const sessionKey = (tokenHash: string) => `sess:${tokenHash}`;
