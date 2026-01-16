import type { SudapassConfig } from "../types/config";
import { postForm } from "../utils/http";

export type TokenTypeHint = "access_token" | "refresh_token";

/**
 * Revokes an access token or refresh token.
 */
export async function revokeToken(
  config: SudapassConfig,
  token: string,
  tokenTypeHint?: TokenTypeHint
): Promise<void> {
  const baseUrl = config.baseUrl.replace(/\/$/, "");
  const url = `${baseUrl}/oauth/token/revocation`;

  const params: Record<string, string> = {
    token,
    client_id: config.clientId,
  };

  if (tokenTypeHint) {
    params.token_type_hint = tokenTypeHint;
  }

  await postForm<void>(url, params);
}
