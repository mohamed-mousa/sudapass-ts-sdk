import type { SudapassConfig } from "../types/config";
import type { TokenResponse } from "../types/tokens";
import { postForm } from "../utils/http";

/**
 * Exchanges an authorization code for tokens.
 */
export async function exchangeCode(
  config: SudapassConfig,
  code: string,
  codeVerifier: string
): Promise<TokenResponse> {
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const url = `${baseUrl}/oauth/token`;

  return postForm<TokenResponse>(url, {
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier,
  });
}

/**
 * Refreshes an access token using a refresh token.
 * Note: Each refresh returns a NEW refresh token (token rotation).
 * The old refresh token is immediately revoked.
 */
export async function refreshAccessToken(
  config: SudapassConfig,
  refreshToken: string
): Promise<TokenResponse> {
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const url = `${baseUrl}/oauth/token`;

  return postForm<TokenResponse>(url, {
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: config.clientId,
  });
}
