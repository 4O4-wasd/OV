/**
 * Payload for signing in
 */
export class SignInDto {
  /**
   * The user's email address
   * @example jane@example.com
   */
  email: string;

  /**
   * The user's password
   */
  password: string;
}
