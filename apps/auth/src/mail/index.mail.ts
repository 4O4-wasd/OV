import { Resend } from 'resend';
import OtpEmail from './templates/otp.mail.js';
import type { OtpPurpose } from '../shared/token.shared.js';

const SUBJECTS: Record<OtpPurpose, string> = {
  'verify-email': 'Verify your email',
  'reset-password': 'Reset your password',
};

const FROM = 'OV <no-reply@ov.404wasd.com>';

let resend: Resend | undefined;

function getResend(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export async function sendOtpEmail(to: string, otp: string, purpose: OtpPurpose) {
  const { error } = await getResend().emails.send({
    from: FROM,
    to,
    subject: SUBJECTS[purpose],
    react: OtpEmail({ otp, email: to, purpose }),
  });

  if (error) {
    console.error(`Failed to send ${purpose} OTP to ${to}: ${error.message}`);
    throw new Error('Failed to send email');
  }
}
