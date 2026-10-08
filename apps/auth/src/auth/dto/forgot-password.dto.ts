/**
 * Payload for requesting a password-reset OTP
 */
export class ForgotPasswordDto {
  /**
   * The email address of the account to reset
   * @example jane@example.com
   */
  email: string;
}