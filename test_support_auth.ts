/**
 * Shared test authentication and base-URL helper.
 * Reads credentials strictly from environment variables (never hardcoded fallbacks).
 */

export function getBaseUrl(): string {
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
