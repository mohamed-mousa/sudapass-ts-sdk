import type { OAuthError } from "../types/tokens";

/**
 * Error thrown when an OAuth request fails.
 */
export class SudapassError extends Error {
  constructor(
    public readonly error: string,
    public readonly errorDescription?: string,
    public readonly statusCode?: number
  ) {
    super(errorDescription || error);
    this.name = "SudapassError";
  }
}

/**
 * Makes a POST request to the token endpoint with form-urlencoded body.
 */
export async function postForm<T>(
  url: string,
  params: Record<string, string>
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });

  if (!response.ok) {
    let errorData: OAuthError | undefined;
    try {
      errorData = (await response.json()) as OAuthError;
    } catch {
      // Response body is not JSON
    }

    throw new SudapassError(
      errorData?.error || "request_failed",
      errorData?.error_description || `HTTP ${response.status}`,
      response.status
    );
  }

  // Handle empty responses (e.g., token revocation)
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}
