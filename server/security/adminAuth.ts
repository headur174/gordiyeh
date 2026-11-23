import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";

/**
 * Central administrator authentication and API access policy.
 *
 * Design:
 *  - ADMIN_SECRET_KEY  : machine credential (Bearer / x-admin-token) and signing key. Required in production.
 *  - ADMIN_PASSWORD    : human credential for the /admin browser login (Basic auth, user "admin"). Required in production.
 *  - After a successful /admin login the server issues a signed, HttpOnly, SameSite=Strict session cookie.
 *    The admin SPA calls /api/* same-origin, so the cookie authenticates those calls automatically.
 *  - Every /api route is ADMIN-ONLY unless it is listed in PUBLIC_RULES below (deny by default).
 *
 * Nothing here trusts client-supplied role headers or unsigned cookies.
 */

const SESSION_COOKIE = "gordiyeh_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const MIN_SECRET_LENGTH = 24;
const MIN_PASSWORD_LENGTH = 12;
const MAX_LOGIN_FAILURES = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Values that were published in earlier versions of the public repository.
// They are rejected in every environment.
const KNOWN_LEAKED_VALUES = new Set([
  "gordiyeh-supervisor-secure",
  "gordiyeh_supervisor_secret_token_2025",
  "gordiyeh_draft_secret_token_2026",
  "gordiyeh2026",
  "admin",
]);

let adminSecret = "";
let adminPassword = "";
let sessionKey: Buffer = Buffer.alloc(0);
let draftPreviewToken = "";
let initialised = false;

const isProduction = () => process.env.NODE_ENV === "production";

function resolveCredential(name: string, minLength: number, generatedBytes: number): string {
  const raw = (process.env[name] || "").trim();
  if (raw) {
    if (KNOWN_LEAKED_VALUES.has(raw)) {
      throw new Error(`[Security] ${name} equals a value that was published in the public repository. Generate a new one.`);
    }
    if (raw.length < minLength) {
      const msg = `[Security] ${name} must be at least ${minLength} characters long.`;
      if (isProduction()) throw new Error(msg);
      console.warn(`${msg} (allowed outside production only)`);
    }
    return raw;
  }
  if (isProduction()) {
    throw new Error(`[Security] ${name} is required when NODE_ENV=production. Generate one with: openssl rand -hex 24`);
  }
  const generated = crypto.randomBytes(generatedBytes).toString("hex");
  console.warn(`[Security] ${name} is not set. Using a temporary value for this process only: ${generated}`);
  return generated;
}

/** Validates credentials and prepares signing keys. Call once at startup so a misconfigured server never starts. */
export function initAdminAuth(): void {
  if (initialised) return;
  adminSecret = resolveCredential("ADMIN_SECRET_KEY", MIN_SECRET_LENGTH, 24);
  adminPassword = resolveCredential("ADMIN_PASSWORD", MIN_PASSWORD_LENGTH, 12);
  sessionKey = crypto.createHmac("sha256", adminSecret).update("gordiyeh-admin-session-v1").digest();

  const configuredPreview = (process.env.DRAFT_PREVIEW_TOKEN || "").trim();
  if (configuredPreview && KNOWN_LEAKED_VALUES.has(configuredPreview)) {
    throw new Error("[Security] DRAFT_PREVIEW_TOKEN equals a value that was published in the public repository.");
  }
  draftPreviewToken =
    configuredPreview ||
    crypto.createHmac("sha256", adminSecret).update("gordiyeh-draft-preview-v1").digest("hex").slice(0, 40);
  initialised = true;
}

function ensureInit(): void {
  if (!initialised) initAdminAuth();
}

/** Signing secret available for session tokens once initialized. */
export function getAdminSigningSecret(): string {
  ensureInit();
  return adminSecret;
}

/** Token used to preview unpublished CMS drafts. Derived from ADMIN_SECRET_KEY unless DRAFT_PREVIEW_TOKEN is set. */
export function getDraftPreviewToken(): string {
  ensureInit();
  return draftPreviewToken;
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function signSession(expiresAt: number): string {
  const payload = String(expiresAt);
  const sig = crypto.createHmac("sha256", sessionKey).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifySession(value: string | undefined): boolean {
  if (!value) return false;
  const [payload, sig] = value.split(".");
  if (!payload || !sig || !/^\d{10,16}$/.test(payload)) return false;
  if (Number(payload) < Date.now()) return false;
  const expected = crypto.createHmac("sha256", sessionKey).update(payload).digest("hex");
  return safeEqual(sig, expected);
}

function presentedToken(req: Request): string | null {
  const headerToken = req.headers["x-admin-token"];
  if (typeof headerToken === "string" && headerToken) return headerToken;
  const auth = req.headers.authorization;
  if (typeof auth === "string") {
    const m = /^Bearer\s+(.+)$/i.exec(auth);
    if (m) return m[1].trim();
  }
  return null;
}

/** True only for a valid admin Bearer/x-admin-token or a valid signed session cookie. */
export function isAdminRequest(req: Request): boolean {
  ensureInit();
  const token = presentedToken(req);
  if (token && safeEqual(token, adminSecret)) return true;
  return verifySession(readCookie(req, SESSION_COOKIE));
}

function hasInvalidCredentials(req: Request): boolean {
  return Boolean(presentedToken(req) || readCookie(req, SESSION_COOKIE));
}

function setSessionCookie(res: Response): void {
  res.cookie(SESSION_COOKIE, signSession(Date.now() + SESSION_TTL_MS), {
    httpOnly: true,
    sameSite: "strict",
    secure: isProduction(),
    path: "/",
    maxAge: SESSION_TTL_MS,
  });
}

export function clearAdminSession(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: "strict", secure: isProduction(), path: "/" });
}

/** API middleware: 401 without credentials, 403 with credentials that are not valid. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (isAdminRequest(req)) return next();
  res.setHeader("Cache-Control", "no-store");
  if (hasInvalidCredentials(req)) {
    res.status(403).json({ error: "Forbidden: invalid or expired administrator credentials" });
    return;
  }
  res.status(401).json({ error: "Unauthorized: administrator authentication required" });
}

// ---------------------------------------------------------------------------
// Browser login for /admin and /tasks (HTTP Basic -> signed session cookie)
// ---------------------------------------------------------------------------

const loginFailures = new Map<string, { count: number; resetAt: number }>();

function loginLimited(ip: string): boolean {
  const entry = loginFailures.get(ip);
  if (!entry) return false;
  if (entry.resetAt < Date.now()) {
    loginFailures.delete(ip);
    return false;
  }
  return entry.count >= MAX_LOGIN_FAILURES;
}

function recordLoginFailure(ip: string): void {
  const now = Date.now();
  if (loginFailures.size > 5000) {
    for (const [key, value] of loginFailures) if (value.resetAt < now) loginFailures.delete(key);
    if (loginFailures.size > 5000) loginFailures.clear();
  }
  const entry = loginFailures.get(ip);
  if (!entry || entry.resetAt < now) loginFailures.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
  else entry.count += 1;
}

function basicCredentialsValid(req: Request): boolean {
  const auth = req.headers.authorization;
  if (typeof auth !== "string") return false;
  const m = /^Basic\s+(.+)$/i.exec(auth);
  if (!m) return false;
  const decoded = Buffer.from(m[1], "base64").toString("utf8");
  const idx = decoded.indexOf(":");
  if (idx < 0) return false;
  const userOk = safeEqual(decoded.slice(0, idx), "admin");
  const passOk = safeEqual(decoded.slice(idx + 1), adminPassword);
  return userOk && passOk;
}

export function adminPageGuard(req: Request, res: Response, next: NextFunction): void {
  ensureInit();
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "no-store");
  if (isAdminRequest(req)) return next();

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (loginLimited(ip)) {
    res.status(429).send("Too many failed login attempts. Try again later.");
    return;
  }
  if (basicCredentialsValid(req)) {
    loginFailures.delete(ip);
    setSessionCookie(res);
    return next();
  }
  if (typeof req.headers.authorization === "string") recordLoginFailure(ip);
  res.setHeader("WWW-Authenticate", 'Basic realm="Gordiyeh Admin", charset="UTF-8"');
  res.status(401).send("Authentication required.");
}

// ---------------------------------------------------------------------------
// Deny-by-default API policy
// ---------------------------------------------------------------------------

const SEG = "[^/]+";
type Rule = { methods: readonly string[]; pattern: RegExp };
const rule = (methods: readonly string[], path: string): Rule => ({ methods, pattern: new RegExp(`^${path}$`, "i") });

/**
 * Routes the public storefront needs. Everything else under /api requires an administrator.
 * Paths are relative to /api with the optional /v1 prefix removed.
 */
export const PUBLIC_RULES: readonly Rule[] = [
  rule(["GET"], "/health"),
  rule(["GET"], "/bootstrap"), // handler returns a reduced payload to non-admins
  rule(["GET"], "/products"),
  rule(["GET"], `/products/${SEG}`),
  rule(["GET"], `/products/${SEG}/videos`),
  rule(["GET"], `/orders/track/${SEG}`),
  rule(["GET"], "/settings/store-features"),
  rule(["GET"], "/site-config"),
  rule(["GET"], "/documents"),
  rule(["GET"], `/documents/${SEG}`),
  rule(["GET"], "/torob/feed"),
  rule(["GET"], "/torob/products"),
  rule(["GET"], "/integrations/torob/feed"),
  rule(["GET"], "/emalls/feed"),
  rule(["GET"], "/emalls/products"),
  rule(["GET"], "/integrations/emalls/feed"),
  rule(["GET", "POST", "DELETE"], "/support/sessions"),
  rule(["POST"], `/support/sessions/${SEG}/messages`),
  rule(["POST"], "/support/chat"),
  rule(["POST"], "/companion/recommend"),
  rule(["GET", "POST", "DELETE"], `/customer/memory/${SEG}`),
  rule(["POST"], "/customer/account/identify"),
  rule(["PATCH"], "/customer/account"),
  rule(["POST"], "/auth/otp/send"),
  rule(["POST"], "/auth/otp/verify"),
  rule(["POST"], "/orders"),
  rule(["POST"], "/payment/initiate"),
  rule(["POST"], "/payment/verify"),   // verifies bank transaction server-to-server with gateway
  rule(["POST"], "/payment/callback"), // signature enforced inside the handler
];

export function normaliseApiPath(rawPath: string): string {
  let p = rawPath || "/";
  p = p.replace(/^\/v1(?=\/|$)/i, "");
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}

export function isPublicApiRoute(method: string, rawPath: string): boolean {
  const m = method.toUpperCase() === "HEAD" ? "GET" : method.toUpperCase();
  const p = normaliseApiPath(rawPath);
  return PUBLIC_RULES.some((r) => r.methods.includes(m) && r.pattern.test(p));
}

/** Mount with app.use("/api", apiAccessGuard) BEFORE any /api router. */
export function apiAccessGuard(req: Request, res: Response, next: NextFunction): void {
  if (req.method === "OPTIONS") return next();
  if (isPublicApiRoute(req.method, req.path)) return next();
  return requireAdmin(req, res, next);
}
