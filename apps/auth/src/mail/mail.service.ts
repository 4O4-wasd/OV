import { render } from '@react-email/render';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Resend } from 'resend';
import OtpEmail from './templates/otp-email.js';
import { OtpPurpose } from '../auth/token.util.js';

const SUBJECTS: Record<OtpPurpose, string> = {
  'verify-email': 'Verify your email',
  'reset-password': 'Reset your password',
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private _resend?: Resend;

  
  private get resend(): Resend {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set');
    }
    this._resend ??= new Resend(process.env.RESEND_API_KEY);
    return this._resend;
  }

  static readonly FROM = 'OV <no-reply@ov.404wasd.com>';

  
  async sendOtp(to: string, otp: string, purpose: OtpPurpose) {
    const { error } = await this.resend.emails.send({
      from: MailService.FROM,
      to,
      subject: SUBJECTS[purpose],
      react: OtpEmail({ otp, email: to, purpose }),
    });

    if (error) {
      this.logger.error(`Failed to send ${purpose} OTP to ${to}: ${error.message}`);
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  
  renderOtp(otp: string, email: string, purpose: OtpPurpose) {
    return render(OtpEmail({ otp, email, purpose }));
  }
}