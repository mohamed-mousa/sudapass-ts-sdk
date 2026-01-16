/**
 * Token response from the Sudapass token endpoint.
 */
export interface TokenResponse {
  /**
   * Access token for API requests.
   */
  access_token: string;

  /**
   * ID token containing user claims (JWT).
   */
  id_token?: string;

  /**
   * Refresh token for obtaining new access tokens.
   * Note: Each refresh returns a NEW refresh token (token rotation).
   */
  refresh_token?: string;

  /**
   * Token type (always "Bearer").
   */
  token_type: "Bearer";

  /**
   * Access token lifetime in seconds.
   */
  expires_in: number;

  /**
   * Granted scopes.
   */
  scope?: string;
}

/**
 * OAuth error response.
 */
export interface OAuthError {
  error: string;
  error_description?: string;
}
