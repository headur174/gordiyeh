import path from "node:path";

/**
 * Shared test authentication and base-URL helper.
 * Reads credentials strictly from environment variables (never hardcoded fallbacks).
 */

export function assertSafeTestEnvironment(): void {
  if (process.env.NODE_ENV !== "test") {
    throw new Error(
      `SAFETY GUARD: Test suites must run with NODE_ENV=test (current: '${process.env.NODE_ENV || "unset"}').`
    );
  }

  const rawBaseUrl = (process.env.BASE_URL || "").trim();
  if (rawBaseUrl) {
    let parsed: URL;
    try {
      parsed = new URL(rawBaseUrl);
    } catch {
      throw new Error(`SAFETY GUARD: Invalid BASE_URL '${rawBaseUrl}'.`);
    }
    const host = parsed.hostname.toLowerCase();
    if (host !== "127.0.0.1" && host !== "localhost" && host !== "::1") {
      throw new Error(
        `SAFETY GUARD: Refusing to run destructive/integration tests against non-local BASE_URL '${rawBaseUrl}'.`
      );
    }
  }

  const rawDbPath = (process.env.COMMERCE_DB_PATH || "").trim();
  if (rawDbPath) {
    const resolved = path.resolve(rawDbPath);
    const devDbPath = path.resolve(path.join(process.cwd(), "data", "commerce.db"));
    const prodDiskDbPath = "/data/commerce.db";
    if (resolved === devDbPath || resolved === prodDiskDbPath) {
      throw new Error(
        `SAFETY GUARD: Refusing to run tests with COMMERCE_DB_PATH pointing to '${resolved}'. Use an isolated /tmp database path.`
      );
    }
  }
}

export function getBaseUrl(): string {
  assertSafeTestEnvironment();
  if (process.env.BASE_URL) {
    return process.env.BASE_URL.replace(/\/+$/, "");
  }
  const port = process.env.PORT || "3000";
  return `http://127.0.0.1:${port}`;
}

export function getAdminSecretKey(): string {
  return (process.env.ADMIN_SECRET_KEY || "").trim();
}

export function getAdminPassword(): string {
  return (process.env.ADMIN_PASSWORD || "").trim();
}

export function requireTestAdminSecret(): string {
  const secret = getAdminSecretKey();
  if (!secret) {
    throw new Error(
      "ADMIN_SECRET_KEY environment variable is required to run authenticated integration tests."
    );
  }
  return secret;
}

export function adminBearerHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const secret = requireTestAdminSecret();
  return {
    ...extra,
    Authorization: `Bearer ${secret}`,
  };
}

export function adminBasicHeader(username = "admin", password = getAdminPassword()): string {
  if (!password) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is required for Basic authentication tests."
    );
  }
  return "Basic " + Buffer.from(`${username}:${password}`, "utf8").toString("base64");
}
