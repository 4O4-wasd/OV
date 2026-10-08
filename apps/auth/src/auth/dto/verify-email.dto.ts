/**
 * Payload for verifying the signed-in user's email with an OTP
 */
export class VerifyEmailDto {
  /**
   * The OTP sent to the account's email address
   * @example 482913
   */
  otp: string;
}