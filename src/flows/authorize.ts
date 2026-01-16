import type { SudapassConfig } from "../types/config";
import { generatePKCE, generateState, generateNonce } from "../client/PKCE";

export interface AuthorizationResult {
  /**
   * Authorization URL to redirect the user to.
   */
  url: string;

  /**
   * Code verifier to be stored and used in token exchange.
   */
  codeVerifier: string;

  /**
   * State parameter for CSRF protection.
   */
  state: string;

  /**
   * Nonce for replay protection.
   */
  nonce: string;
}

/**
 * Builds the authorization URL with PKCE parameters.
 */
export async function buildAuthorizationUrl(
  config: SudapassConfig
): Promise<AuthorizationResult> {
  const { codeVerifier, codeChallenge } = await generatePKCE();
  const state = await generateState();
  const nonce = await generateNonce();

  const scopes = config.scopes || ["openid", "profile", "email"];

  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: scopes.join(" "),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    nonce,
  });

  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const url = `${baseUrl}/oauth/authorize?${params.toString()}`;

  return {
    url,
    codeVerifier,
    state,
    nonce,
  };
}
