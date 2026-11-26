import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { CommerceDB } from "../db";

/**
 * Central administrator authentication and API access policy.
 *
 * Design:
 *  - ADMIN_SECRET_KEY  : machine credential (Bearer / x-admin-token) and signing key.
 *                        When unset, generates an ephemeral 256-bit random key in memory.
 *  - ADMIN_PASSWORD    : human credential for /admin browser login (Basic auth, user "admin").
 *                        When unset, supports one-time atomic first-run password claim (scrypt-hashed in DB).
 *  - After a successful /admin login the server issues a signed, HttpOnly, SameSite=Strict session cookie.
 *    The admin SPA calls /api/* same-origin, so the cookie authenticates those calls automatically.
 *  - Every /api route is ADMIN-ONLY unless it is listed in PUBLIC_RULES below (deny by default).
 *
 * Nothing here trusts client-supplied role headers or unsigned cookies.
 */

const SESSION_COOKIE = "gordiyeh_admin_session";
const CLAIMED_ADMIN_KV_KEY = "admin_claimed_password_v1";
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

interface ClaimedAdminRecord {
  salt: string;
  hash: string;
  claimedAt: string;
}

function getClaimedAdminRecord(): ClaimedAdminRecord | null {
  try {
    const rec = CommerceDB.getKvJson(CLAIMED_ADMIN_KV_KEY, null) as ClaimedAdminRecord | null;
    if (rec && typeof rec.salt === "string" && typeof rec.hash === "string") {
      return rec;
    }
  } catch {
    // DB unavailable
  }
  return null;
}

function hashScryptPassword(password: string, saltHex: string): Buffer {
  return crypto.scryptSync(password, saltHex, 64);
}

function verifyClaimedPassword(password: string, record: ClaimedAdminRecord): boolean {
  try {
    const expected = Buffer.from(record.hash, "hex");
    const derived = hashScryptPassword(password, record.salt);
    if (expected.length !== derived.length) return false;
    return crypto.timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

function resolveAdminSecret(): string {
  const raw = (process.env.ADMIN_SECRET_KEY || "").trim();
  if (raw) {
    if (KNOWN_LEAKED_VALUES.has(raw)) {
      throw new Error("[Security] ADMIN_SECRET_KEY equals a value that was published in the public repository. Generate a new one.");
    }
    if (raw.length < MIN_SECRET_LENGTH) {
      const msg = `[Security] ADMIN_SECRET_KEY must be at least ${MIN_SECRET_LENGTH} characters long.`;
      if (isProduction()) throw new Error(msg);
      console.warn(`${msg} (allowed outside production only)`);
    }
    return raw;
  }
  if (isProduction()) {
    throw new Error("[Security] ADMIN_SECRET_KEY is required when NODE_ENV=production.");
  }
  console.warn("[Security] ADMIN_SECRET_KEY is not set. Using an ephemeral 256-bit random signing key for this process.");
  return crypto.randomBytes(32).toString("hex");
}

function resolveEnvAdminPassword(): string {
  const raw = (process.env.ADMIN_PASSWORD || "").trim();
  if (!raw) {
    if (isProduction()) {
      throw new Error("[Security] ADMIN_PASSWORD is required when NODE_ENV=production.");
    }
    return "";
  }
  if (KNOWN_LEAKED_VALUES.has(raw)) {
    throw new Error("[Security] ADMIN_PASSWORD equals a value that was published in the public repository. Generate a new one.");
  }
  if (raw.length < MIN_PASSWORD_LENGTH) {
    const msg = `[Security] ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
    if (isProduction()) throw new Error(msg);
    console.warn(`${msg} (allowed outside production only)`);
  }
  return raw;
}

function validateProductionPaymentSecret(): void {
  const raw = (process.env.PAYMENT_GATEWAY_SECRET || "").trim();
  if (raw) {
    if (KNOWN_LEAKED_VALUES.has(raw)) {
      throw new Error("[Security] PAYMENT_GATEWAY_SECRET equals a value that was published in the public repository.");
    }
    if (raw.length < MIN_SECRET_LENGTH && isProduction()) {
      throw new Error(`[Security] PAYMENT_GATEWAY_SECRET must be at least ${MIN_SECRET_LENGTH} characters long in production.`);
    }
    return;
  }
  if (isProduction()) {
    throw new Error("[Security] PAYMENT_GATEWAY_SECRET is required when NODE_ENV=production.");
  }
}

/** Validates credentials and prepares signing keys. Call once at startup so a misconfigured server never starts. */
export function initAdminAuth(): void {
  if (initialised) return;
  adminSecret = resolveAdminSecret();
  adminPassword = resolveEnvAdminPassword();
  validateProductionPaymentSecret();
  if (!adminPassword && !getClaimedAdminRecord()) {
    console.warn("[Security] ADMIN_PASSWORD is not set and no admin password has been claimed yet. Visit /admin to claim the initial password or set ADMIN_PASSWORD in environment.");
  }
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
  const candidatePass = decoded.slice(idx + 1);

  if (adminPassword) {
    return userOk && safeEqual(candidatePass, adminPassword);
  }
  const claimed = getClaimedAdminRecord();
  if (!claimed) return false;
  return userOk && verifyClaimedPassword(candidatePass, claimed);
}

const FIRST_RUN_CLAIM_HTML = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>راه‌اندازی اولیه دسترسی مدیریت | گُردیه</title>
  <style>
    body { font-family: Tahoma, sans-serif; background: #0f172a; color: #f8fafc; display: flex; min-height: 100vh; align-items: center; justify-content: center; margin: 0; padding: 1rem; }
    .card { width: 100%; max-width: 420px; background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,.35); }
    h1 { font-size: 1.15rem; margin: 0 0 8px; }
    p { font-size: 0.85rem; color: #cbd5e1; line-height: 1.7; margin: 0 0 18px; }
    label { display: block; font-size: 0.8rem; margin-bottom: 6px; color: #e2e8f0; }
    input { width: 100%; box-sizing: border-box; padding: 10px 12px; border-radius: 10px; border: 1px solid #475569; background: #0f172a; color: #fff; margin-bottom: 12px; font-size: 0.9rem; direction: ltr; }
    button { width: 100%; padding: 11px; border-radius: 10px; border: 0; background: #10b981; color: #06281e; font-weight: bold; cursor: pointer; font-size: 0.9rem; }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .err { color: #fda4af; font-size: 0.8rem; margin-bottom: 12px; display: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>تنظیم رمز عبور اولیه مدیر</h1>
    <p>متغیر محیطی <code>ADMIN_PASSWORD</code> تنظیم نشده است. یک رمز عبور قوی (حداقل ۱۲ کاراکتر) انتخاب کنید تا پنل مدیریت قفل و فعال شود.</p>
    <div id="err" class="err"></div>
    <form id="f">
      <label>رمز عبور جدید مدیر (حداقل ۱۲ کاراکتر)</label>
      <input id="p1" type="password" minlength="12" required autocomplete="new-password" />
      <label>تکرار رمز عبور</label>
      <input id="p2" type="password" minlength="12" required autocomplete="new-password" />
      <button id="btn" type="submit">ثبت رمز و ورود به پنل</button>
    </form>
  </div>
  <script>
    document.getElementById('f').addEventListener('submit', async function (e) {
      e.preventDefault();
      var errEl = document.getElementById('err');
      var btn = document.getElementById('btn');
      var p1 = document.getElementById('p1').value;
      var p2 = document.getElementById('p2').value;
      errEl.style.display = 'none';
      if (p1 !== p2) {
        errEl.textContent = 'رمز عبور و تکرار آن یکسان نیست.';
        errEl.style.display = 'block';
        return;
      }
      btn.disabled = true;
      try {
        var r = await fetch('/api/admin/bootstrap-claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: p1 })
        });
        var j = await r.json().catch(function(){ return {}; });
        if (!r.ok) {
          errEl.textContent = j.error || 'خطا در ثبت رمز عبور.';
          errEl.style.display = 'block';
          btn.disabled = false;
          return;
        }
        window.location.reload();
      } catch (ex) {
        errEl.textContent = 'خطا در برقراری ارتباط با سرور.';
        errEl.style.display = 'block';
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;

export function handleBootstrapClaim(req: Request, res: Response): void {
  ensureInit();
  res.setHeader("Cache-Control", "no-store");
  if (isProduction() || adminPassword) {
    res.status(409).json({ error: "ADMIN_PASSWORD is already configured or bootstrap claim is disabled in production." });
    return;
  }
  const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";
  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({ error: `رمز عبور باید حداقل ${MIN_PASSWORD_LENGTH} کاراکتر باشد.` });
    return;
  }
  if (KNOWN_LEAKED_VALUES.has(password)) {
    res.status(400).json({ error: "این رمز عبور غیرمجاز است؛ لطفاً رمز دیگری انتخاب کنید." });
    return;
  }

  // Atomic one-time claim inside SQLite (INSERT OR IGNORE fails closed on race)
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = hashScryptPassword(password, salt).toString("hex");
  const record: ClaimedAdminRecord = { salt, hash, claimedAt: new Date().toISOString() };
  const db = CommerceDB.getRawDb();
  const insertRes = db.prepare(`
    INSERT OR IGNORE INTO kv_store (key, value) VALUES (?, ?)
  `).run(CLAIMED_ADMIN_KV_KEY, JSON.stringify(record));

  if (Number(insertRes.changes) === 0) {
    res.status(409).json({ error: "رمز عبور مدیر قبلاً ثبت شده است. برای ورود از نام کاربری admin استفاده کنید." });
    return;
  }

  setSessionCookie(res);
  res.status(201).json({ success: true });
}

export function adminPageGuard(req: Request, res: Response, next: NextFunction): void {
  ensureInit();
  res.setHeader("X-Robots-Tag", "noindex, nofollow");
  res.setHeader("Cache-Control", "no-store");
  if (isAdminRequest(req)) return next();

  // First-run claim UI ONLY outside production when no env ADMIN_PASSWORD and no claimed DB hash exist yet
  if (!isProduction() && !adminPassword && !getClaimedAdminRecord()) {
    res.status(200).type("html; charset=utf-8").send(FIRST_RUN_CLAIM_HTML);
    return;
  }

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
  rule(["POST"], "/admin/bootstrap-claim"), // atomically locks itself after first claim or when ADMIN_PASSWORD is set
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
