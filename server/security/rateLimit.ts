import type { NextFunction, Request, Response } from "express";
import { isAdminRequest, normaliseApiPath } from "./adminAuth";

/**
 * Small in-memory per-IP limiter for public endpoints that cost money or can be abused
 * (SMS one-time codes, AI chat, order creation, payment initiation/verification, order tracking).
 * Single-instance deployment only. In production the server sets "trust proxy" so req.ip is accurate.
 */
type Limit = { id: string; method: string; pattern: RegExp; max: number; windowMs: number };

const TEN_MIN = 10 * 60 * 1000;
const LIMITS: readonly Limit[] = [
  { id: "otp-send", method: "POST", pattern: /^\/auth\/otp\/send$/i, max: 5, windowMs: TEN_MIN },
  { id: "otp-verify", method: "POST", pattern: /^\/auth\/otp\/verify$/i, max: 10, windowMs: TEN_MIN },
  { id: "ai", method: "POST", pattern: /^\/(support\/chat|companion\/recommend)$/i, max: 40, windowMs: TEN_MIN },
  { id: "orders", method: "POST", pattern: /^\/orders$/i, max: 20, windowMs: TEN_MIN },
  { id: "pay-init", method: "POST", pattern: /^\/payment\/initiate$/i, max: 20, windowMs: TEN_MIN },
  { id: "pay-verify", method: "POST", pattern: /^\/payment\/verify$/i, max: 30, windowMs: TEN_MIN },
  { id: "track", method: "GET", pattern: /^\/orders\/track\/[^/]+$/i, max: 30, windowMs: TEN_MIN },
];

const hits = new Map<string, { count: number; resetAt: number }>();

export function publicRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const method = req.method.toUpperCase();
  const path = normaliseApiPath(req.path);
  const limit = LIMITS.find((l) => l.method === method && l.pattern.test(path));
  if (!limit || isAdminRequest(req)) return next();

  const now = Date.now();
  if (hits.size > 20000) {
    for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    if (hits.size > 20000) hits.clear();
  }
  const key = `${limit.id}:${req.ip || req.socket.remoteAddress || "unknown"}`;
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + limit.windowMs });
    return next();
  }
  entry.count += 1;
  if (entry.count > limit.max) {
    res.setHeader("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
    res.status(429).json({ error: "تعداد درخواست‌ها بیش از حد مجاز است. لطفاً کمی بعد دوباره تلاش کنید." });
    return;
  }
  next();
}
