// Main client
export { SudapassClient } from "./client/SudapassClient";

// Types
export type { SudapassConfig } from "./types/config";
export type { TokenResponse, OAuthError } from "./types/tokens";
export type { SudapassProfile, IdTokenPayload } from "./types/profile";

// Flows (for advanced usage)
export type { AuthorizationResult } from "./flows/authorize";
export type { TokenTypeHint } from "./flows/revoke";

// Utilities (for advanced usage)
export { SudapassError } from "./utils/http";
export { decodeJwt, extractProfile } from "./utils/jwt";
export { generatePKCE, generateState, generateNonce } from "./client/PKCE";
