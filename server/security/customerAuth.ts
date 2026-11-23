import crypto from "node:crypto";
import type { Request } from "express";
import { getAdminSigningSecret, isAdminRequest, safeEqual } from "./adminAuth";
import { CommerceDB } from "../db";

const CUSTOMER_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getCustomerSigningKey(): Buffer {
  const baseSecret = process.env.SESSION_SECRET?.trim() || getAdminSigningSecret();
  return crypto.createHmac("sha256", baseSecret).update("gordiyeh-customer-session-v1").digest();
}

export function signCustomerToken(phone: string): string {
  const exp = Date.now() + CUSTOMER_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({ phone, sub: phone, verified: true, exp }),
    "utf8"
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", getCustomerSigningKey()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function extractPresentedCustomerToken(req: Request): string | null {
  const customHeader = req.headers["x-customer-token"];
  if (typeof customHeader === "string" && customHeader.trim()) {
    return customHeader.trim();
  }
  const auth = req.headers.authorization;
  if (typeof auth === "string") {
    const m = /^Bearer\s+(.+)$/i.exec(auth);
    if (m && m[1].includes(".")) {
      return m[1].trim();
    }
  }
  return null;
}

export function verifyCustomerToken(token: string | null | undefined, expectedPhone?: string): { valid: boolean; phone?: string } {
  if (!token) return { valid: false };
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [payloadB64, sig] = parts;
  if (!payloadB64 || !sig) return { valid: false };

  const expectedSig = crypto
    .createHmac("sha256", getCustomerSigningKey())
    .update(payloadB64)
    .digest("base64url");

  if (!safeEqual(sig, expectedSig)) return { valid: false };

  try {
    const decoded = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
    if (!decoded || decoded.verified !== true || typeof decoded.phone !== "string") {
      return { valid: false };
    }
    if (typeof decoded.exp !== "number" || decoded.exp < Date.now()) {
      return { valid: false };
    }
    if (expectedPhone && decoded.phone !== expectedPhone) {
      return { valid: false };
    }
    return { valid: true, phone: decoded.phone };
  } catch {
    return { valid: false };
  }
}

export function isVerifiedCustomerAuthorized(req: Request, phone: string): boolean {
  if (isAdminRequest(req)) return true;
  const token = extractPresentedCustomerToken(req);
  return verifyCustomerToken(token, phone).valid;
}

/**
 * Checks whether access to a phone-scoped resource is permitted:
 *  - Administrators are always permitted.
 *  - Unverified 1-year guest accounts remain accessible seamlessly by phone for cart/chat continuity.
 *  - OTP-verified accounts require a valid signed session token (minted by /auth/otp/verify) matching that phone.
 */
export function checkPhoneAccess(req: Request, phone: string): { allowed: boolean; isVerifiedAccount: boolean } {
  if (isAdminRequest(req)) {
    return { allowed: true, isVerifiedAccount: false };
  }
  const account = CommerceDB.getCustomerAccountByPhone(phone);
  if (!account || !account.isVerified) {
    return { allowed: true, isVerifiedAccount: false };
  }
  const token = extractPresentedCustomerToken(req);
  const verified = verifyCustomerToken(token, phone);
  return { allowed: verified.valid, isVerifiedAccount: true };
}
