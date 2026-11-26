# Commerce OS — Production Modular Monolith

Commerce OS is an enterprise-grade, high-performance modular monolith e-commerce platform built on **React 19**, **TypeScript**, **Node.js (Express)**, **Vite SSR**, and **SQLite with Write-Ahead Logging (WAL)**.

This repository is hardened to **Release Candidate 1 (RC1)** standards, featuring zero-plaintext at-rest data encryption, transaction outbox guarantees, SSRF protection, strict payment idempotency, and full SEO readiness.

---

## 🚀 Key Architectural Highlights

- **Modular Monolith Core**: Domain modules (Catalog, Orders, Inventory, Payments, Outbox) decoupled through strict repository abstractions and asynchronous domain event publishing.
- **Resilient Transactional Outbox**: Guarantees at-least-once message delivery with randomized lease tokens, automatic retry with exponential backoff, and DLQ (Dead Letter Queue) quarantine.
- **Cryptographic Security**:
  - **AES-256-GCM v2** field-level zero-plaintext encryption for sensitive customer and order records.
  - Cryptographic key ring with zero-downtime key rotation (`reencryptBatch`) and crash-resilient progression.
  - Blind index hashing (`HMAC-SHA256`) enabling deterministic search on encrypted customer identifiers without exposing raw plaintext.
  - High-security SSRF protection engine with recursive private IP rejection, IPv6 unwrapping, decimal/octal normalization, and DNS rebinding prevention.
- **High Concurrency SQLite WAL**: Configured with `PRAGMA journal_mode = WAL`, `PRAGMA synchronous = NORMAL`, `PRAGMA busy_timeout = 5000`, and zero-downtime hot backups via `sqlite3_vacuum_into_file`.
- **SSR & SEO Engine**: Server-Side Rendering with dynamic JSON-LD structured data (`schema.org`), OpenGraph/Twitter meta tags, canonical URL verification, dynamic XML sitemap, and `robots.txt`.

---

## 📋 System Requirements

- **Node.js**: v22.13.0 or higher (`>=22.13.0` synced with `package.json`, `DEPLOYMENT.md`, and `liara.json`)
- **Package Manager**: `npm` (or `bun` / `pnpm`)
- **Operating System**: Linux / macOS / Windows WSL2

---

## 🛠️ Quick Start & Clean Install

Follow this step-by-step procedure to bootstrap a clean environment from scratch:

```bash
# 1. Clone repository and navigate to root
git clone <repository_url> commerce-os
cd commerce-os

# 2. Install production and development dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# Generate a cryptographically secure 32-byte master key
openssl rand -hex 32
# Copy the generated 64-character hex string into .env as DB_ENCRYPTION_KEY
```

### Environment Configuration Checklist (`.env`)

```ini
PORT=3000
NODE_ENV=production
COMMERCE_DB_PATH=data/commerce.db
DB_ENCRYPTION_KEY="<64_HEX_CHARACTERS_OR_32_CHAR_PASSPHRASE>"
DB_ENCRYPTION_KEY_ID="k1"
WEBHOOK_ALLOW_LOOPBACK="false"
```

---

## 🧪 Testing & Verification

Commerce OS includes a comprehensive test suite across three core dimensions:

```bash
# Run the entire test suite (64 automated tests)
npm run test:all

# Or run individual test suites:
npm run test:e2e          # E2E catalog, cart, checkout, inventory, and API parity
npm run test:seo          # SSR hydration, JSON-LD, sitemap, meta headers, robots.txt
npm run test:hardening    # Security gates: encryption, keys, outbox leases, SSRF, refunds
```

All 64 tests execute in isolated environments with zero modification to production databases.

---

## 📦 Production Build & Run

```bash
# Compile frontend bundle with Vite and backend bundle with esbuild
npm run build

# Start production server
npm start
```

The production server starts on port `3000` (or the dynamic port supplied by `process.env.PORT`).

---

## 📚 Documentation Suite

- [`DEPLOYMENT.md`](./DEPLOYMENT.md): Production deployment guide, Liara PaaS hosting, and container orchestration.
- [`BACKUP-RESTORE.md`](./BACKUP-RESTORE.md): SQLite WAL backup, disaster recovery, and zero-downtime key rotation.
- [`SECURITY.md`](./SECURITY.md): Threat model, SSRF protection, AES-256-GCM cipher specification, and rate limits.
- [`RELEASE-NOTES.md`](./RELEASE-NOTES.md): Full Release Candidate 1 (RC1) changelog and verification audit.

---

## 📄 License
MIT © Commerce OS Engineering
