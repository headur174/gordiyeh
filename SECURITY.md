# Commerce OS — Security Architecture & Threat Model

This document outlines the security architecture, threat model, and defense-in-depth protections implemented in **Commerce OS (Release Candidate 1)**.

---

## 🔒 1. Cryptographic Protection at Rest

Commerce OS implements **Zero-Plaintext at Rest** for sensitive fields (customer identities, order recipient details, contact emails, phone numbers, and physical addresses).

### AES-256-GCM v2 Specification
- **Algorithm**: `aes-256-gcm`
- **Ciphertext Wire Format**: `v2:<key_id>:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`
  - `iv`: 12 cryptographically random bytes (96 bits) generated via `crypto.randomBytes(12)` uniquely per encryption operation.
  - `auth_tag`: 16-byte authentication tag (128 bits) ensuring ciphertext integrity and authenticity.
  - `key_id`: Explicit key identifier (e.g., `k1`, `k2`) enabling zero-downtime key rotation.
- **Key Validation (`parseAndValidateKey`)**:
  - Rejects null, empty, or short keys.
  - Rejects known insecure/placeholder keys (`BANNED_PRODUCTION_KEYS` blacklist).
  - Accepts 64-character hexadecimal keys or passphrases with >= 32 characters.

### Deterministic Blind Indexing
To permit exact-match lookup on encrypted customer emails without decrypting the entire database table or exposing plaintext:
- **Hash Algorithm**: `HMAC-SHA256`
- **Formula**: `blind_index = HMAC-SHA256(normalize(email), DB_ENCRYPTION_KEY)`
- Plaintext emails are never stored in indexable columns.

---

## 🌐 2. SSRF (Server-Side Request Forgery) Defense Engine

Commerce OS features an industrial-grade SSRF defense engine in `server/utils/ssrfGuard.ts` safeguarding all outbound webhook dispatches and external API calls.

### Threat Model Defenses
1. **Loopback & Local Addresses**: Blocks `127.0.0.0/8`, `localhost`, `[::1]`, and all IPv6 loopback variants.
2. **Private Network Boundaries (RFC 1918)**:
   - `10.0.0.0/8`
   - `172.16.0.0/12`
   - `192.168.0.0/16`
3. **Link-Local & Cloud Metadata Endpoints**:
   - `169.254.0.0/16` (Blocks AWS/GCP/Azure/DigitalOcean metadata endpoints).
   - `fe80::/10` (IPv6 Link-Local).
4. **Alternative Encodings**: Decodes integer IP representations (`http://2130706433`), octal strings (`http://0177.0.0.1`), and hex strings (`http://0x7f000001`).
5. **DNS Rebinding Protection**: Pre-resolves domain names via asynchronous DNS (`dns.promises.lookup`) and validates the resolved IP address before allowing the HTTP request.
6. **Strict HTTP Redirect Policy**: `safeFetchWebhook` explicitly enforces `redirect: "error"` to prevent attackers from using public URLs that redirect to internal network targets.

---

## 💳 3. Payment Integrity & Idempotency

### Constant-Time Signature Verification
All payment gateway callbacks verify digital signatures using `crypto.timingSafeEqual` to prevent side-channel timing attacks:
```typescript
const computedSig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
const match = crypto.timingSafeEqual(Buffer.from(computedSig), Buffer.from(callbackSig));
```

### State Machine Transition Rules
- Orders initialize in `PENDING_PAYMENT`.
- Clients cannot self-declare an order as `PAID`. Only a verified payment callback or gateway settlement transitions an order to `PAID`.
- Once marked `PAID`, out-of-order `FAILED` callbacks are rejected.
- Double-payment attempts on already-settled transactions are rejected idempotently.

### Atomic Refund Ledger
Refunds restore item inventory counts, record a immutable refund transaction, transition order state to `REFUNDED`, and enqueue an outbox event within a single `BEGIN IMMEDIATE` database transaction.

---

## 🛡️ 4. HTTP Headers & Rate Limiting

- **HTTP Security Headers**:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `Referrer-Policy: strict-origin-when-cross-origin`
- **Rate Limiting**:
  - Sensitive administrative and diagnostic endpoints (`/system/*`) are rate-limited to 10 requests per minute per IP address.
- **Path Disclosure Defense**:
  - In production (`NODE_ENV=production`), absolute server filesystem paths in API responses are redacted to `[REDACTED_PROD_PATH]`.
