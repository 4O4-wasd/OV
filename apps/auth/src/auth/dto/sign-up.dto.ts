/**
 * Payload for creating a new account
 */
export class SignUpDto {
  /**
   * The user's display name
   * @example Jane Doe
   */
  name: string;

  /**
   * The user's unique handle
   * @example jane
   */
  handle: string;

  /**
   * The user's email address
   * @example jane@example.com
   */
  email: string;

  /**
   * The user's password
   * @example correct horse battery staple
   */
  password: string;
}
