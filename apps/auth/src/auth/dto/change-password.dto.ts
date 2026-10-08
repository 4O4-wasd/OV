/**
 * Payload for setting a new password using an OTP
 */
export class ChangePasswordDto {
  /**
   * The email address of the account
   * @example jane@example.com
   */
  email: string;

  /**
   * The OTP sent to the email address
   * @example 482913
   */
  otp: string;

  /**
   * The new password
   */
  newPassword: string;
}