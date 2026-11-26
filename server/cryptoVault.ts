import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// Military-Grade Field-Level & Envelope Encryption Engine (AES-256-GCM + HMAC Blind Index)
// Version 2: Key IDs (kid), backward-compatible v1 decryption, safe key rotation, zero plaintext at rest.

const KEY_DIR = process.env.COMMERCE_DB_PATH
  ? path.dirname(path.resolve(process.env.COMMERCE_DB_PATH))
  : path.join(process.cwd(), "data");
const KEY_FILE = path.join(KEY_DIR, ".master_vault.key");

// Default fallback seed used when DB_ENCRYPTION_KEY is not supplied in development
const DEFAULT_LEGACY_SEED = "commerce_os_master_vault_key_2323ef3b_ed70_4301_a9a9_929b2fdef520_production_v1";

// Strictly banned keys (known placeholders, zero keys, sequential keys, or documentation examples)
const BANNED_PRODUCTION_KEYS = new Set([
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "0000000000000000000000000000000000000000000000000000000000000000",
  "1111111111111111111111111111111111111111111111111111111111111111",
  "your-secure-production-vault-encryption-key-min-32-chars",
  "commerce_os_master_vault_key_2323ef3b_ed70_4301_a9a9_929b2fdef520_production_v1",
  "01234567890123456789012345678901",
]);

/**
 * Validates and parses an encryption key into a 32-byte cryptographic Buffer.
 * Supports:
 * - 64-character hex string (32 raw bytes generated via 'openssl rand -hex 32')
 * - High-entropy passphrase (>= 32 characters, derived via Scrypt with master salt)
 * - Raw 32-byte Buffer
 */
export function parseAndValidateKey(rawKey: string | Buffer): Buffer {
  if (Buffer.isBuffer(rawKey)) {
    if (rawKey.length !== 32) {
      throw new Error(`Invalid encryption key: raw Buffer must be exactly 32 bytes (got ${rawKey.length} bytes).`);
    }
    return rawKey;
  }

  const trimmed = rawKey.trim();

  // Check if banned
  if (BANNED_PRODUCTION_KEYS.has(trimmed.toLowerCase())) {
    throw new Error(
      "SECURITY ERROR: The provided DB_ENCRYPTION_KEY is a known insecure placeholder/example key and is strictly banned."
    );
  }

  // 1. 64-character Hex string (32 raw bytes)
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  // 2. High-entropy passphrase (>= 32 characters)
  if (trimmed.length >= 32) {
    return crypto.scryptSync(trimmed, "commerce_os_master_salt_2026", 32);
  }

  throw new Error(
    `Invalid DB_ENCRYPTION_KEY: Must be either a 64-character hex string (32 raw bytes generated via 'openssl rand -hex 32') or a high-entropy passphrase of at least 32 characters (got ${trimmed.length} characters).`
  );
}

interface KeyStore {
  activeKid: string;
  keys: Map<string, Buffer>;
}

function initKeyStore(): KeyStore {
  const keys = new Map<string, Buffer>();
  let activeKid = "k1";

  const envKey = process.env.DB_ENCRYPTION_KEY?.trim();

  // 1. Check environment variable for explicit encryption key (strictly validated)
  if (envKey) {
    const keyBuf = parseAndValidateKey(envKey);
    activeKid = process.env.DB_ENCRYPTION_KEY_ID || "k_env";
    keys.set(activeKid, keyBuf);
  }

  // Optional multi-key rotation keyring from environment (DB_ENCRYPTION_KEYRING='{"k1":"..."}')
  const envKeyring = process.env.DB_ENCRYPTION_KEYRING?.trim();
  if (envKeyring) {
    try {
      const parsedRing = JSON.parse(envKeyring);
      if (parsedRing && typeof parsedRing === "object") {
        for (const [kid, rawKey] of Object.entries(parsedRing)) {
          if (typeof rawKey === "string" && rawKey.trim() !== "") {
            keys.set(kid, parseAndValidateKey(rawKey));
          }
        }
      }
    } catch (err: any) {
      throw new Error(`Invalid DB_ENCRYPTION_KEYRING JSON: ${err?.message || err}`);
    }
  }

  const isProduction = process.env.NODE_ENV === "production";

  // 2. Ensure directory exists and load persisted random vault key if present
  if (!fs.existsSync(KEY_DIR)) {
    try {
      fs.mkdirSync(KEY_DIR, { recursive: true });
    } catch {
      // Ignore if read-only
    }
  }

  let fileKey: Buffer | null = null;
  if (fs.existsSync(KEY_FILE)) {
    try {
      const raw = fs.readFileSync(KEY_FILE, "utf-8").trim();
      if (raw.length === 64 && /^[0-9a-fA-F]{64}$/.test(raw) && !BANNED_PRODUCTION_KEYS.has(raw.toLowerCase())) {
        const candidate = Buffer.from(raw, "hex");
        const legacyFallback = crypto.scryptSync(DEFAULT_LEGACY_SEED, "commerce_os_master_salt_2026", 32);
        // Never treat static legacy dev seed as valid in production
        if (!isProduction || !crypto.timingSafeEqual(candidate, legacyFallback)) {
          fileKey = candidate;
          if (!keys.has("k1")) {
            keys.set("k1", fileKey);
          }
        }
      }
    } catch {
      // Continue to key provisioning
    }
  }

  const persistKeyFile = (hexKey: string) => {
    try {
      fs.writeFileSync(KEY_FILE, hexKey, { mode: 0o600 });
      try {
        const rootStat = fs.statSync(process.cwd());
        if (typeof process.getuid === "function" && process.getuid() === 0 && rootStat.uid !== 0) {
          fs.chownSync(KEY_FILE, rootStat.uid, rootStat.gid);
        }
      } catch {
        // Ignore chown if unsupported
      }
    } catch {
      // Read-only filesystem: keep key in memory
    }
  };

  // 3. Enforce fail-closed key requirement in production & guard existing DBs from silent key regeneration
  const resolvedDbPath = process.env.COMMERCE_DB_PATH
    ? path.resolve(process.env.COMMERCE_DB_PATH)
    : path.join(process.cwd(), "data", "commerce.db");
  const existingDbExists = fs.existsSync(resolvedDbPath);

  if (!envKey && keys.size === 0) {
    if (isProduction) {
      throw new Error(
        "[CryptoVault] DB_ENCRYPTION_KEY is required when NODE_ENV=production. Configure a persistent 64-char hex key ('openssl rand -hex 32') in your environment."
      );
    }
    if (existingDbExists && process.env.NODE_ENV !== "test") {
      console.warn(
        "[CryptoVault] Existing database detected without DB_ENCRYPTION_KEY; refusing to auto-generate a random replacement key."
      );
    }
    // Preserve development/test key behavior for local dev DB compatibility only
    const fallbackKey = crypto.scryptSync(DEFAULT_LEGACY_SEED, "commerce_os_master_salt_2026", 32);
    keys.set("k_fallback", fallbackKey);
    if (!keys.has("k1")) {
      keys.set("k1", fallbackKey);
    }
    if (!fileKey && !existingDbExists) {
      persistKeyFile(fallbackKey.toString("hex"));
    }
  }

  if (!keys.has(activeKid)) {
    activeKid = keys.keys().next().value || "k1";
  }

  return { activeKid, keys };
}

const keyStore = initKeyStore();
const ACTIVE_KEY = keyStore.keys.get(keyStore.activeKid)!;
const BLIND_INDEX_SALT = crypto.scryptSync(ACTIVE_KEY, "blind_index_salt_v1", 32);

export class DecryptionError extends Error {
  constructor(message: string, public readonly code: string = "AUTH_TAG_FAILED") {
    super(message);
    this.name = "DecryptionError";
  }
}

export const CryptoVault = {
  /**
   * Returns current active Key ID
   */
  getActiveKeyId(): string {
    return keyStore.activeKid;
  },

  /**
   * Registers a secondary key in memory (e.g. for rotation or multi-key transition)
   */
  registerKey(kid: string, keyBufferOrSecret: Buffer | string, makeActive: boolean = false): void {
    const buf = parseAndValidateKey(keyBufferOrSecret);
    keyStore.keys.set(kid, buf);
    if (makeActive) {
      keyStore.activeKid = kid;
    }
  },

  /**
   * Encrypt arbitrary string with AES-256-GCM.
   * Format: enc:v2:<kid>:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>
   */
  encryptString(plaintext: string): string {
    if (!plaintext && plaintext !== "") return "";
    const iv = crypto.randomBytes(12); // 96-bit standard IV for GCM
    const activeKey = keyStore.keys.get(keyStore.activeKid) || ACTIVE_KEY;
    const cipher = crypto.createCipheriv("aes-256-gcm", activeKey, iv);

    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();

    return `enc:v2:${keyStore.activeKid}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
  },

  /**
   * Decrypt AES-256-GCM ciphertext payload.
   * Transparently handles:
   * - enc:v2:<kid>:<iv>:<tag>:<ciphertext>
   * - enc:v1:<iv>:<tag>:<ciphertext> (legacy format)
   * - Plaintext fallback
   */
  decryptString(ciphertextPayload: string): string {
    if (!ciphertextPayload) return "";
    if (!ciphertextPayload.startsWith("enc:v1:") && !ciphertextPayload.startsWith("enc:v2:")) {
      return ciphertextPayload; // Plaintext fallback
    }

    const parts = ciphertextPayload.split(":");

    let kid = "k1";
    let ivHex = "";
    let tagHex = "";
    let encryptedText = "";

    if (parts[1] === "v2" && parts.length === 6) {
      kid = parts[2];
      ivHex = parts[3];
      tagHex = parts[4];
      encryptedText = parts[5];
    } else if (parts[1] === "v1" && parts.length === 5) {
      ivHex = parts[2];
      tagHex = parts[3];
      encryptedText = parts[4];
    } else {
      return ciphertextPayload;
    }

    const key = keyStore.keys.get(kid) || ACTIVE_KEY;
    try {
      const iv = Buffer.from(ivHex, "hex");
      const tag = Buffer.from(tagHex, "hex");

      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");
      return decrypted;
    } catch (err: any) {
      // If primary key failed, try fallback keys
      for (const [otherKid, otherKey] of keyStore.keys.entries()) {
        if (otherKid === kid) continue;
        try {
          const iv = Buffer.from(ivHex, "hex");
          const tag = Buffer.from(tagHex, "hex");
          const decipher = crypto.createDecipheriv("aes-256-gcm", otherKey, iv);
          decipher.setAuthTag(tag);
          let decrypted = decipher.update(encryptedText, "hex", "utf8");
          decrypted += decipher.final("utf8");
          return decrypted;
        } catch {
          // Continue trying other keys
        }
      }
      throw new DecryptionError(`Failed to authenticate data with available keys for payload: ${err?.message || err}`);
    }
  },

  /**
   * Encrypt a full JSON object into a single ciphertext string
   */
  encryptJson(obj: any): string {
    const raw = JSON.stringify(obj);
    return this.encryptString(raw);
  },

  /**
   * Decrypt a ciphertext string back into parsed JSON
   */
  decryptJson<T = any>(ciphertextPayload: string, fallback?: T): T {
    if (!ciphertextPayload) return (fallback ?? null) as unknown as T;
    try {
      const decryptedStr = this.decryptString(ciphertextPayload);
      if (!decryptedStr) return (fallback ?? null) as unknown as T;
      return JSON.parse(decryptedStr);
    } catch (err) {
      if (fallback !== undefined) return fallback;
      throw err;
    }
  },

  /**
   * Generates a deterministic HMAC-SHA256 Blind Index for searchable queries
   */
  blindIndex(value: string): string {
    if (!value) return "";
    const clean = value.trim().toLowerCase();
    return crypto.createHmac("sha256", BLIND_INDEX_SALT).update(clean).digest("hex");
  },

  /**
   * Masks sensitive information for UI display (e.g. 0912***4567)
   */
  maskPhone(phone: string): string {
    if (!phone || phone.length < 7) return "***";
    return phone.slice(0, 4) + "****" + phone.slice(-3);
  },

  /**
   * Safe, resumable re-encryption of records during key rotation (Gate 1).
   * If a record is already encrypted with targetKid, it is safely skipped (idempotent / crash-proof).
   */
  reencryptBatch(
    records: Array<{ id: string; ciphertext: string }>,
    targetKid?: string
  ): {
    migrated: Array<{ id: string; newCiphertext: string }>;
    skippedCount: number;
    failedCount: number;
  } {
    const kid = targetKid || keyStore.activeKid;
    const prefix = `enc:v2:${kid}:`;
    const migrated: Array<{ id: string; newCiphertext: string }> = [];
    let skippedCount = 0;
    let failedCount = 0;

    for (const rec of records) {
      if (!rec.ciphertext || rec.ciphertext.startsWith(prefix)) {
        skippedCount++;
        continue;
      }
      try {
        const plain = this.decryptString(rec.ciphertext);
        const prevKid = keyStore.activeKid;
        keyStore.activeKid = kid;
        const newCiphertext = this.encryptString(plain);
        keyStore.activeKid = prevKid;
        migrated.push({ id: rec.id, newCiphertext });
      } catch {
        failedCount++;
      }
    }

    return { migrated, skippedCount, failedCount };
  }
};
