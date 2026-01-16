import type { SudapassConfig } from "../types/config";
import type { TokenResponse } from "../types/tokens";
import type { SudapassProfile } from "../types/profile";
import type { TokenTypeHint } from "../flows/revoke";
import { buildAuthorizationUrl, AuthorizationResult } from "../flows/authorize";
import { exchangeCode, refreshAccessToken } from "../flows/token";
import { revokeToken } from "../flows/revoke";
import { extractProfile } from "../utils/jwt";

/**
 * Sudapass OIDC client for Authorization Code flow with PKCE.
 *
 * @example
 * ```typescript
 * const client = new SudapassClient({
 *   baseUrl: "https://api.sp.nctr.sd",
 *   clientId: "your-client-id",
 *   redirectUri: "https://yourapp.com/callback",
 * });
 *
 * // Start authorization
 * const { url, codeVerifier } = await client.authorize();
 * // Store codeVerifier securely, then redirect user to url
 *
 * // Handle callback
 * const { tokens, profile } = await client.handleCallback(code, codeVerifier);
 * ```
 */
export class SudapassClient {
  private readonly config: SudapassConfig;

  constructor(config: SudapassConfig) {
    this.validateConfig(config);
    this.config = {
      ...config,
      baseUrl: config.baseUrl.replace(/\/$/, ""),
    };
  }

  /**
   * Builds the authorization URL and generates PKCE parameters.
   * The caller must store the codeVerifier securely for the callback.
   */
  async authorize(): Promise<AuthorizationResult> {
    return buildAuthorizationUrl(this.config);
  }

  /**
   * Exchanges the authorization code for tokens.
   *
   * @param code - Authorization code from the callback
   * @param codeVerifier - Code verifier generated during authorization
   * @returns Tokens and decoded user profile
   */
  async handleCallback(
    code: string,
    codeVerifier: string
  ): Promise<{
    tokens: TokenResponse;
    profile: SudapassProfile | null;
  }> {
    if (!code) {
      throw new Error("Authorization code is required");
    }
    if (!codeVerifier) {
      throw new Error("Code verifier is required");
    }

    const tokens = await exchangeCode(this.config, code, codeVerifier);
    const profile = tokens.id_token ? extractProfile(tokens.id_token) : null;

    return { tokens, profile };
  }

  /**
   * Refreshes the access token using a refresh token.
   *
   * IMPORTANT: Each refresh returns a NEW refresh token.
   * The old refresh token is immediately revoked.
   * Always store the new refresh token from the response.
   *
   * @param refreshToken - Current refresh token
   * @returns New tokens (including new refresh token)
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    return refreshAccessToken(this.config, refreshToken);
  }

  /**
   * Revokes an access token or refresh token.
   *
   * @param token - Token to revoke
   * @param tokenType - Optional hint about token type
   */
  async revokeToken(
    token: string,
    tokenType?: TokenTypeHint
  ): Promise<void> {
    if (!token) {
      throw new Error("Token is required");
    }

    return revokeToken(this.config, token, tokenType);
  }

  /**
   * Validates the client configuration.
   */
  private validateConfig(config: SudapassConfig): void {
    if (!config.baseUrl) {
      throw new Error("baseUrl is required");
    }
    if (!config.clientId) {
      throw new Error("clientId is required");
    }
    if (!config.redirectUri) {
      throw new Error("redirectUri is required");
    }
  }
}
