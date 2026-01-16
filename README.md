# sudapass-ts-sdk

A framework-agnostic TypeScript SDK for integrating with the Sudapass Identity Provider using OpenID Connect (OIDC) Authorization Code flow with PKCE.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Framework Examples](#framework-examples)
  - [Next.js App Router](#nextjs-app-router)
  - [React SPA](#react-spa)
  - [Vue 3](#vue-3)
  - [Node.js Express](#nodejs-express)
- [Security](#security)
- [Error Handling](#error-handling)
- [License](#license)

## Features

- OIDC Authorization Code flow with PKCE (S256)
- Token exchange, refresh, and revocation
- Automatic token rotation handling
- JWT decoding for user profile extraction
- Framework-agnostic (works with Next.js, React, Vue, Node.js, etc.)
- Full TypeScript support with comprehensive types
- No external dependencies (uses native `fetch` and `crypto`)
- No hardcoded storage (you control token persistence)
- No client secret required (public client)

## Installation

```bash
npm install sudapass-ts-sdk
```

```bash
yarn add sudapass-ts-sdk
```

```bash
pnpm add sudapass-ts-sdk
```

## Quick Start

```typescript
import { SudapassClient } from "sudapass-ts-sdk";

// 1. Initialize the client
const client = new SudapassClient({
  baseUrl: "https://api.sp.nctr.sd",
  clientId: "your-client-id",
  redirectUri: "https://yourapp.com/callback",
});

// 2. Start authorization (redirect user to Sudapass)
const { url, codeVerifier, state } = await client.authorize();
// Store codeVerifier and state securely, then redirect to url

// 3. Handle callback (after user returns from Sudapass)
const { tokens, profile } = await client.handleCallback(code, codeVerifier);
// tokens: { access_token, id_token, refresh_token, expires_in }
// profile: { sub, name, national_id, email, ... }

// 4. Refresh tokens when needed
const newTokens = await client.refreshToken(tokens.refresh_token);
// IMPORTANT: Store newTokens.refresh_token (token rotation)

// 5. Logout (revoke tokens)
await client.revokeToken(refreshToken, "refresh_token");
```

## Configuration

### SudapassConfig

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `baseUrl` | `string` | Yes | - | Sudapass API base URL |
| `clientId` | `string` | Yes | - | Your application's client ID |
| `redirectUri` | `string` | Yes | - | OAuth callback URL (must be registered) |
| `scopes` | `string[]` | No | `["openid", "profile", "email"]` | OAuth scopes to request |

```typescript
const client = new SudapassClient({
  baseUrl: "https://api.sp.nctr.sd",
  clientId: "your-client-id",
  redirectUri: "https://yourapp.com/callback",
  scopes: ["openid", "profile", "email", "phone"], // optional
});
```

### Available Scopes

| Scope | Claims |
|-------|--------|
| `openid` | `sub`, `iss`, `aud` (required) |
| `profile` | `name`, `given_name`, `family_name`, `birthdate`, `gender`, `national_id` |
| `email` | `email`, `email_verified` |
| `phone` | `phone_number`, `phone_number_verified` |

## API Reference

### SudapassClient

#### Constructor

```typescript
new SudapassClient(config: SudapassConfig)
```

Creates a new Sudapass client instance.

---

#### authorize()

```typescript
authorize(): Promise<AuthorizationResult>
```

Generates the authorization URL and PKCE parameters. The caller must store the `codeVerifier` and `state` securely for use in the callback.

**Returns:**

```typescript
interface AuthorizationResult {
  url: string;        // Authorization URL to redirect the user to
  codeVerifier: string; // PKCE code verifier (store securely)
  state: string;      // CSRF protection state (store and validate)
  nonce: string;      // Replay protection nonce
}
```

**Example:**

```typescript
const { url, codeVerifier, state } = await client.authorize();

// Store for callback validation
session.codeVerifier = codeVerifier;
session.state = state;

// Redirect user
window.location.href = url;
```

---

#### handleCallback()

```typescript
handleCallback(
  code: string,
  codeVerifier: string
): Promise<{ tokens: TokenResponse; profile: SudapassProfile | null }>
```

Exchanges the authorization code for tokens and extracts the user profile from the ID token.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `code` | `string` | Authorization code from callback URL |
| `codeVerifier` | `string` | PKCE code verifier from `authorize()` |

**Returns:**

```typescript
{
  tokens: TokenResponse;
  profile: SudapassProfile | null;
}
```

**Example:**

```typescript
const code = searchParams.get("code");
const { tokens, profile } = await client.handleCallback(code, session.codeVerifier);

// Store tokens securely
session.accessToken = tokens.access_token;
session.refreshToken = tokens.refresh_token;

// Use profile data
console.log(`Welcome, ${profile.name}`);
```

---

#### refreshToken()

```typescript
refreshToken(refreshToken: string): Promise<TokenResponse>
```

Refreshes the access token using a refresh token.

**IMPORTANT: Token Rotation**

Each refresh request returns a **new refresh token**. The old refresh token is immediately revoked. You **must** store and use the new refresh token for subsequent requests. Reusing an old refresh token will trigger a security lockout and revoke all tokens in the family.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `refreshToken` | `string` | Current valid refresh token |

**Returns:** `TokenResponse` with new `access_token` and `refresh_token`

**Example:**

```typescript
const newTokens = await client.refreshToken(session.refreshToken);

// CRITICAL: Update stored tokens
session.accessToken = newTokens.access_token;
session.refreshToken = newTokens.refresh_token; // New refresh token!
```

---

#### revokeToken()

```typescript
revokeToken(
  token: string,
  tokenType?: "access_token" | "refresh_token"
): Promise<void>
```

Revokes an access token or refresh token. Use this for logout functionality.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `token` | `string` | Token to revoke |
| `tokenType` | `string` | Optional hint: `"access_token"` or `"refresh_token"` |

**Example:**

```typescript
// Logout: revoke refresh token
await client.revokeToken(session.refreshToken, "refresh_token");

// Clear local storage
session.accessToken = null;
session.refreshToken = null;
```

---

### Types

#### TokenResponse

```typescript
interface TokenResponse {
  access_token: string;      // Bearer token for API requests
  id_token?: string;         // JWT containing user claims
  refresh_token?: string;    // Token for refreshing access (rotates!)
  token_type: "Bearer";      // Always "Bearer"
  expires_in: number;        // Access token lifetime in seconds
  scope?: string;            // Granted scopes
}
```

#### SudapassProfile

```typescript
interface SudapassProfile {
  sub: string;                    // Unique user identifier
  name?: string;                  // Full name
  given_name?: string;            // First name
  family_name?: string;           // Last name
  national_id?: string;           // National ID number
  birthdate?: string;             // Date of birth (YYYY-MM-DD)
  gender?: string;                // Gender (M/F)
  email?: string;                 // Email address
  email_verified?: boolean;       // Email verification status
  phone_number?: string;          // Phone number
  phone_number_verified?: boolean; // Phone verification status
}
```

#### SudapassError

```typescript
import { SudapassError } from "sudapass-ts-sdk";

class SudapassError extends Error {
  error: string;           // OAuth error code
  errorDescription?: string; // Human-readable description
  statusCode?: number;     // HTTP status code
}
```

---

### Utility Functions

For advanced use cases, the SDK exports utility functions:

```typescript
import {
  decodeJwt,        // Decode JWT without verification
  extractProfile,   // Extract SudapassProfile from ID token
  generatePKCE,     // Generate code verifier and challenge
  generateState,    // Generate random state parameter
  generateNonce,    // Generate random nonce
} from "sudapass-ts-sdk";
```

## Framework Examples

### Next.js App Router

#### Environment Variables

```env
SUDAPASS_BASE_URL=https://api.sp.nctr.sd
SUDAPASS_CLIENT_ID=your-client-id
SUDAPASS_REDIRECT_URI=https://yourapp.com/auth/callback
```

#### Shared Client (`lib/sudapass.ts`)

```typescript
import { SudapassClient } from "sudapass-ts-sdk";

export const sudapass = new SudapassClient({
  baseUrl: process.env.SUDAPASS_BASE_URL!,
  clientId: process.env.SUDAPASS_CLIENT_ID!,
  redirectUri: process.env.SUDAPASS_REDIRECT_URI!,
});
```

#### Login Route (`app/auth/login/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sudapass } from "@/lib/sudapass";

export async function GET() {
  const { url, codeVerifier, state } = await sudapass.authorize();

  const cookieStore = await cookies();

  cookieStore.set("pkce_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  cookieStore.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  return NextResponse.redirect(url);
}
```

#### Callback Route (`app/auth/callback/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sudapass } from "@/lib/sudapass";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  const codeVerifier = cookieStore.get("pkce_verifier")?.value;

  if (!code || !codeVerifier || state !== storedState) {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }

  try {
    const { tokens, profile } = await sudapass.handleCallback(code, codeVerifier);

    cookieStore.set("access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
      path: "/",
    });

    if (tokens.refresh_token) {
      cookieStore.set("refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    if (profile) {
      cookieStore.set("user", JSON.stringify(profile), {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: tokens.expires_in,
        path: "/",
      });
    }

    cookieStore.delete("pkce_verifier");
    cookieStore.delete("oauth_state");

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch {
    return NextResponse.redirect(new URL("/auth/error", request.url));
  }
}
```

#### Logout Route (`app/auth/logout/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sudapass } from "@/lib/sudapass";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (refreshToken) {
    try {
      await sudapass.revokeToken(refreshToken, "refresh_token");
    } catch {
      // Continue with local logout
    }
  }

  cookieStore.delete("access_token");
  cookieStore.delete("refresh_token");
  cookieStore.delete("user");

  return NextResponse.redirect(new URL("/", request.url));
}
```

#### Token Refresh Route (`app/api/auth/refresh/route.ts`)

```typescript
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sudapass } from "@/lib/sudapass";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (!refreshToken) {
    return NextResponse.json({ error: "No refresh token" }, { status: 401 });
  }

  try {
    const tokens = await sudapass.refreshToken(refreshToken);

    cookieStore.set("access_token", tokens.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.expires_in,
      path: "/",
    });

    if (tokens.refresh_token) {
      cookieStore.set("refresh_token", tokens.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    cookieStore.delete("access_token");
    cookieStore.delete("refresh_token");
    cookieStore.delete("user");
    return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
  }
}
```

---

### React SPA

#### Auth Context (`src/context/AuthContext.tsx`)

```typescript
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { SudapassClient, SudapassProfile, TokenResponse } from "sudapass-ts-sdk";

interface AuthContextType {
  user: SudapassProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  handleCallback: (code: string, state: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const client = new SudapassClient({
  baseUrl: import.meta.env.VITE_SUDAPASS_BASE_URL,
  clientId: import.meta.env.VITE_SUDAPASS_CLIENT_ID,
  redirectUri: import.meta.env.VITE_SUDAPASS_REDIRECT_URI,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SudapassProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem("sudapass_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async () => {
    const { url, codeVerifier, state } = await client.authorize();
    sessionStorage.setItem("pkce_verifier", codeVerifier);
    sessionStorage.setItem("oauth_state", state);
    window.location.href = url;
  }, []);

  const handleCallback = useCallback(async (code: string, state: string) => {
    const storedState = sessionStorage.getItem("oauth_state");
    const codeVerifier = sessionStorage.getItem("pkce_verifier");

    if (state !== storedState || !codeVerifier) {
      throw new Error("Invalid state or missing verifier");
    }

    const { tokens, profile } = await client.handleCallback(code, codeVerifier);

    sessionStorage.setItem("access_token", tokens.access_token);
    if (tokens.refresh_token) {
      sessionStorage.setItem("refresh_token", tokens.refresh_token);
    }
    if (profile) {
      sessionStorage.setItem("sudapass_user", JSON.stringify(profile));
      setUser(profile);
    }

    sessionStorage.removeItem("pkce_verifier");
    sessionStorage.removeItem("oauth_state");
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = sessionStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        await client.revokeToken(refreshToken, "refresh_token");
      } catch {}
    }
    sessionStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, handleCallback }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
```

#### Callback Page (`src/pages/Callback.tsx`)

```typescript
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(searchParams.get("error_description") || errorParam);
      return;
    }

    if (code && state) {
      handleCallback(code, state)
        .then(() => navigate("/dashboard", { replace: true }))
        .catch((err) => setError(err.message));
    }
  }, [searchParams, handleCallback, navigate]);

  if (error) return <div>Error: {error}</div>;
  return <div>Authenticating...</div>;
}
```

---

### Vue 3

#### Composable (`src/composables/useAuth.ts`)

```typescript
import { ref, computed } from "vue";
import { SudapassClient, type SudapassProfile } from "sudapass-ts-sdk";

const client = new SudapassClient({
  baseUrl: import.meta.env.VITE_SUDAPASS_BASE_URL,
  clientId: import.meta.env.VITE_SUDAPASS_CLIENT_ID,
  redirectUri: import.meta.env.VITE_SUDAPASS_REDIRECT_URI,
});

const user = ref<SudapassProfile | null>(null);
const isLoading = ref(true);

// Initialize from storage
const stored = sessionStorage.getItem("sudapass_user");
if (stored) {
  user.value = JSON.parse(stored);
}
isLoading.value = false;

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value);

  async function login() {
    const { url, codeVerifier, state } = await client.authorize();
    sessionStorage.setItem("pkce_verifier", codeVerifier);
    sessionStorage.setItem("oauth_state", state);
    window.location.href = url;
  }

  async function handleCallback(code: string, state: string) {
    const storedState = sessionStorage.getItem("oauth_state");
    const codeVerifier = sessionStorage.getItem("pkce_verifier");

    if (state !== storedState || !codeVerifier) {
      throw new Error("Invalid callback");
    }

    const { tokens, profile } = await client.handleCallback(code, codeVerifier);

    sessionStorage.setItem("access_token", tokens.access_token);
    if (tokens.refresh_token) {
      sessionStorage.setItem("refresh_token", tokens.refresh_token);
    }
    if (profile) {
      sessionStorage.setItem("sudapass_user", JSON.stringify(profile));
      user.value = profile;
    }

    sessionStorage.removeItem("pkce_verifier");
    sessionStorage.removeItem("oauth_state");
  }

  async function logout() {
    const refreshToken = sessionStorage.getItem("refresh_token");
    if (refreshToken) {
      try { await client.revokeToken(refreshToken, "refresh_token"); } catch {}
    }
    sessionStorage.clear();
    user.value = null;
  }

  return { user, isAuthenticated, isLoading, login, logout, handleCallback };
}
```

---

### Node.js Express

```typescript
import express from "express";
import session from "express-session";
import { SudapassClient } from "sudapass-ts-sdk";

const app = express();

app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: false,
}));

const client = new SudapassClient({
  baseUrl: process.env.SUDAPASS_BASE_URL!,
  clientId: process.env.SUDAPASS_CLIENT_ID!,
  redirectUri: process.env.SUDAPASS_REDIRECT_URI!,
});

// Login route
app.get("/auth/login", async (req, res) => {
  const { url, codeVerifier, state } = await client.authorize();
  req.session.codeVerifier = codeVerifier;
  req.session.state = state;
  res.redirect(url);
});

// Callback route
app.get("/auth/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect("/error");
  }

  if (state !== req.session.state) {
    return res.redirect("/error");
  }

  try {
    const { tokens, profile } = await client.handleCallback(
      code as string,
      req.session.codeVerifier!
    );

    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token;
    req.session.user = profile;

    delete req.session.codeVerifier;
    delete req.session.state;

    res.redirect("/dashboard");
  } catch {
    res.redirect("/error");
  }
});

// Logout route
app.post("/auth/logout", async (req, res) => {
  if (req.session.refreshToken) {
    try {
      await client.revokeToken(req.session.refreshToken, "refresh_token");
    } catch {}
  }
  req.session.destroy(() => res.redirect("/"));
});

// Protected route example
app.get("/dashboard", (req, res) => {
  if (!req.session.user) {
    return res.redirect("/auth/login");
  }
  res.json({ user: req.session.user });
});

app.listen(3000);
```

## Security

### PKCE (Proof Key for Code Exchange)

This SDK uses PKCE with S256 challenge method, which is mandatory for Sudapass. PKCE protects against authorization code interception attacks.

### Token Rotation

Sudapass enforces refresh token rotation for security:

1. Each `refreshToken()` call returns a **new refresh token**
2. The previous refresh token is **immediately revoked**
3. You **must** store and use the new refresh token
4. Reusing an old refresh token triggers a security lockout
5. All tokens in the token family are revoked if reuse is detected

```typescript
// WRONG - Will cause lockout
const tokens = await client.refreshToken(savedRefreshToken);
// Using savedRefreshToken again later will fail!

// CORRECT - Always update
const tokens = await client.refreshToken(savedRefreshToken);
savedRefreshToken = tokens.refresh_token; // Update immediately!
```

### Best Practices

1. **Store tokens securely**: Use HTTP-only cookies (server-side) or secure storage
2. **Validate state**: Always verify the `state` parameter matches
3. **Use HTTPS**: Required in production for redirect URIs
4. **Revoke on logout**: Always revoke refresh tokens when users log out
5. **Handle token refresh**: Implement automatic refresh before expiration

## Error Handling

The SDK throws `SudapassError` for OAuth-related errors:

```typescript
import { SudapassClient, SudapassError } from "sudapass-ts-sdk";

try {
  const { tokens } = await client.handleCallback(code, verifier);
} catch (error) {
  if (error instanceof SudapassError) {
    console.error("OAuth Error:", error.error);
    console.error("Description:", error.errorDescription);
    console.error("Status:", error.statusCode);

    switch (error.error) {
      case "invalid_grant":
        // Authorization code expired or already used
        break;
      case "invalid_client":
        // Client ID not recognized
        break;
      case "invalid_request":
        // Missing or invalid parameters
        break;
    }
  }
}
```

### Common Error Codes

| Error Code | Description | Solution |
|------------|-------------|----------|
| `invalid_request` | Malformed request | Check required parameters |
| `invalid_client` | Invalid client_id | Verify client registration |
| `invalid_grant` | Invalid/expired code | Restart authorization flow |
| `invalid_scope` | Scope not allowed | Request allowed scopes only |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement backoff strategy |

## Requirements

- Node.js 18+ (for native `crypto.subtle` support)
- Modern browsers with Web Crypto API support

## License

MIT
