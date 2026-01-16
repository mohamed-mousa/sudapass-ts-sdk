/**
 * Configuration for the Sudapass OIDC client.
 */
export interface SudapassConfig {
  /**
   * Base URL of the Sudapass API.
   * @example "https://api.sp.nctr.sd"
   */
  baseUrl: string;

  /**
   * Client ID provided by Sudapass administrator.
   */
  clientId: string;

  /**
   * Redirect URI registered with Sudapass.
   * Must be HTTPS in production.
   */
  redirectUri: string;

  /**
   * OAuth scopes to request.
   * @default ["openid", "profile", "email"]
   */
  scopes?: string[];
}
