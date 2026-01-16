/**
 * User profile claims from the ID token.
 */
export interface SudapassProfile {
  /**
   * Unique user identifier.
   */
  sub: string;

  /**
   * Full name.
   */
  name?: string;

  /**
   * First name.
   */
  given_name?: string;

  /**
   * Last name.
   */
  family_name?: string;

  /**
   * National ID number.
   */
  national_id?: string;

  /**
   * Date of birth (YYYY-MM-DD).
   */
  birthdate?: string;

  /**
   * Gender (M/F).
   */
  gender?: string;

  /**
   * Email address.
   */
  email?: string;

  /**
   * Email verification status.
   */
  email_verified?: boolean;

  /**
   * Phone number.
   */
  phone_number?: string;

  /**
   * Phone number verification status.
   */
  phone_number_verified?: boolean;
}

/**
 * JWT payload structure for ID tokens.
 */
export interface IdTokenPayload extends SudapassProfile {
  /**
   * Issuer.
   */
  iss: string;

  /**
   * Audience.
   */
  aud: string;

  /**
   * Expiration time (Unix timestamp).
   */
  exp: number;

  /**
   * Issued at time (Unix timestamp).
   */
  iat: number;

  /**
   * Nonce value for replay protection.
   */
  nonce?: string;
}
