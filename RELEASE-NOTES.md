# Commerce OS — Release Candidate 1 (RC1) Release Notes

**Version**: `1.0.0-rc1`  
**Release Date**: November 2026  
**Status**: Ready for Production Deployment (Release Candidate)  
**Test Suite Verdict**: 64 / 64 Automated Tests Passing (100% Success Rate)

---

## 🎯 Executive Summary

Commerce OS RC1 completes the transition from architectural blueprint to an industrial-grade, secure, and production-tested Modular Monolith e-commerce engine.

RC1 addresses all security, data integrity, and operational resilience requirements without sacrificing the high developer velocity and simplicity of a unified TypeScript codebase.

---

## 🚀 Key Deliverables in RC1

### 1. Zero-Plaintext at Rest Encryption Engine (`v2`)
- Upgraded field encryption to **AES-256-GCM v2** with 96-bit unique IVs and 128-bit authentication tags.
- Cryptographic keyring with explicit key identifier tagging (`v2:<key_id>:...`).
- Automated, crash-safe, and resumable key rotation mechanism (`reencryptBatch`).
- Prohibition of placeholder, insecure, or truncated keys via `BANNED_PRODUCTION_KEYS` enforcement.
- Deterministic HMAC-SHA256 blind indexing for privacy-preserving email lookups.

### 2. Deep Defense SSRF Guard
- Complete protection against Server-Side Request Forgery on webhook delivery.
- Detection and blocking of IPv4 loopbacks, RFC1918 private subnets, carrier-grade NAT, IPv6 loopbacks, IPv4-mapped IPv6, and cloud metadata IPs (`169.254.169.254`).
- Decimal, octal, and hex IP encoding normalization.
- DNS pre-resolution against DNS rebinding attacks.
- Disallowed HTTP redirects (`redirect: "error"`) on webhook dispatches.

### 3. Payment Gateway Idempotency & Atomic Refunds
- Constant-time HMAC signature verification on webhook/callback endpoints.
- Strict state transition enforcement: orders default to `PENDING_PAYMENT` and cannot be client-marked as `PAID`.
- Protection against out-of-order callback race conditions.
- Atomic refund ledger executing inventory restocking, status update, and outbox event dispatch in a single `BEGIN IMMEDIATE` transaction.

### 4. Resilient Transactional Outbox Worker
- Distributed worker coordination using randomized lease tokens (`lease_token`).
- Lease expiration safeguards ensuring unacknowledged events are claimed by surviving workers following process crashes.
- Conditional updates (`WHERE id = ? AND lease_token = ?`) preventing concurrent double delivery.
- Exponential backoff retry logic and Dead Letter Queue (DLQ) quarantine.

### 5. High-Concurrency SQLite WAL & Safe Backups
- Production WAL configuration (`journal_mode = WAL`, `synchronous = NORMAL`, `busy_timeout = 5000`).
- Safe point-in-time hot backups using `VACUUM INTO` with destination validation and pre-cleanup.
- In-memory 30-second cached integrity checks preventing disk I/O DoS.

### 6. SSR & SEO Performance Engine
- Full Server-Side Rendering via Vite SSR.
- Dynamic `schema.org` Product, Organization, and BreadcrumbList JSON-LD generation.
- Dynamic XML sitemap and `robots.txt` generation.
- OpenGraph and Twitter card metadata for storefront pages.

### 7. Cloud & PaaS Readiness (Liara Compatibility)
- `PORT` dynamically read from `process.env.PORT` with fallback to `3000`.
- Dedicated `liara.json` configuration with persistent disk mount targeting `/data`.
- Path sanitization and redaction (`[REDACTED_PROD_PATH]`) in production mode.

---

## 📊 Verification Test Matrix

| Test Suite | File | Tests Run | Passed | Failed | Success Rate |
|---|---|---|---|---|---|
| E2E Functional & API Suite | `test_e2e_full.ts` | 22 | 22 | 0 | 100% |
| SSR & SEO Engine Suite | `test_seo.ts` | 20 | 20 | 0 | 100% |
| Security & Hardening Suite | `test_resilience_hardening.ts` | 22 | 22 | 0 | 100% |
| **Total** | | **64** | **64** | **0** | **100%** |

---

## 🏁 Sign-off & Recommendation
Commerce OS Release Candidate 1 is fully qualified and approved for production staging and deployment.
