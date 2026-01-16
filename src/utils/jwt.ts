import type { IdTokenPayload, SudapassProfile } from "../types/profile";

/**
 * Decodes a JWT without verifying the signature.
 * For production use, signature verification should be done server-side.
 */
export function decodeJwt(token: string): IdTokenPayload {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const payload = parts[1];
  if (!payload) {
    throw new Error("Invalid JWT payload");
  }

  const decoded = base64UrlDecode(payload);
  return JSON.parse(decoded) as IdTokenPayload;
}

/**
 * Extracts user profile from an ID token.
 */
export function extractProfile(idToken: string): SudapassProfile | null {
  try {
    const payload = decodeJwt(idToken);
    return {
      sub: payload.sub,
      name: payload.name,
      given_name: payload.given_name,
      family_name: payload.family_name,
      national_id: payload.national_id,
      birthdate: payload.birthdate,
      gender: payload.gender,
      email: payload.email,
      email_verified: payload.email_verified,
      phone_number: payload.phone_number,
      phone_number_verified: payload.phone_number_verified,
    };
  } catch {
    return null;
  }
}

/**
 * Decodes a base64url-encoded string.
 */
function base64UrlDecode(input: string): string {
  // Replace URL-safe characters with standard base64 characters
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");

  // Pad with '=' to make it valid base64
  const pad = base64.length % 4;
  if (pad) {
    base64 += "=".repeat(4 - pad);
  }

  // Decode based on environment
  if (typeof atob === "function") {
    return atob(base64);
  }

  // Node.js environment
  return Buffer.from(base64, "base64").toString("utf-8");
}
