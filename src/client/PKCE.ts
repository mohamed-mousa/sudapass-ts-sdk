/**
 * PKCE (Proof Key for Code Exchange) utilities.
 * Uses S256 challenge method as required by Sudapass.
 */

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

/**
 * Generates a cryptographically random code verifier.
 * Length: 43-128 characters (base64url encoded).
 */
export async function generateCodeVerifier(): Promise<string> {
  const buffer = new Uint8Array(32);
  getCrypto().getRandomValues(buffer);
  return base64UrlEncode(buffer);
}

/**
 * Generates a code challenge from the code verifier using SHA-256.
 */
export async function generateCodeChallenge(
  codeVerifier: string
): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await getCrypto().subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/**
 * Generates a PKCE code verifier and challenge pair.
 */
export async function generatePKCE(): Promise<PKCEPair> {
  const codeVerifier = await generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  return { codeVerifier, codeChallenge };
}

/**
 * Generates a random state parameter for CSRF protection.
 */
export async function generateState(): Promise<string> {
  const buffer = new Uint8Array(16);
  getCrypto().getRandomValues(buffer);
  return base64UrlEncode(buffer);
}

/**
 * Generates a random nonce for replay protection.
 */
export async function generateNonce(): Promise<string> {
  const buffer = new Uint8Array(16);
  getCrypto().getRandomValues(buffer);
  return base64UrlEncode(buffer);
}

/**
 * Encodes a Uint8Array to a base64url string.
 */
function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]!);
  }

  // Use btoa in browser, Buffer in Node.js
  let base64: string;
  if (typeof btoa === "function") {
    base64 = btoa(binary);
  } else {
    base64 = Buffer.from(buffer).toString("base64");
  }

  // Convert to base64url
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Gets the crypto object for the current environment.
 */
function getCrypto(): Crypto {
  if (typeof globalThis.crypto !== "undefined") {
    return globalThis.crypto;
  }
  // Node.js < 19 fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("crypto").webcrypto as Crypto;
}
