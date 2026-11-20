# Commerce OS — Database Backup & Recovery Package

This document specifies the operational procedures for creating point-in-time consistent backups of the SQLite database in WAL mode, restoring from backups, handling disaster recovery, rotating encryption keys, and recovering from process crashes.

---

## 1. SQLite WAL Consistency Fundamentals

When SQLite operates in **Write-Ahead Logging (`PRAGMA journal_mode = WAL`)**, the database consists of three interrelated files:
1. `commerce.db`: The main database page file.
2. `commerce.db-wal`: The write-ahead log containing uncommitted or uncheckpointed changes.
3. `commerce.db-shm`: The shared memory index file.

### ⚠️ Critical Rule: Never Copy a Live WAL Database with `cp`
Copying `commerce.db` while active transactions are in progress can result in a corrupted or torn read because transactions reside partially in the `-wal` file.

---

## 2. Zero-Downtime Backup Procedures

### Method A: Native SQLite Hot Backup (`VACUUM INTO`)
Commerce OS utilizes the SQLite `VACUUM INTO` command, which locks the database read-only for micro-moments and generates an atomic, self-contained single-file backup with all WAL changes consolidated.

In application code (`server/dbConfig.ts`):
```typescript
import { createConsistentBackup } from "./server/dbConfig";

// Safe, path-validated atomic backup
const backupPath = "/data/backups/commerce-backup-2026-11-06.db";
const result = createConsistentBackup(backupPath);
console.log(`Backup completed: ${result.backupPath} (${result.sizeBytes} bytes)`);
```

Via SQLite CLI:
```bash
sqlite3 /data/commerce.db "VACUUM INTO '/data/backups/commerce-backup-$(date +%Y%m%d%H%M%S).db';"
```

### Method B: Automated Cron Backup Script
Save as `/usr/local/bin/backup-commerce.sh`:
```bash
#!/bin/bash
set -euo pipefail

BACKUP_DIR="/data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/commerce_${TIMESTAMP}.db"

mkdir -p "${BACKUP_DIR}"

# Atomic snapshot using VACUUM INTO
sqlite3 /data/commerce.db "VACUUM INTO '${BACKUP_FILE}';"

# Verify integrity of backup copy
INTEGRITY=$(sqlite3 "${BACKUP_FILE}" "PRAGMA integrity_check;")
if [ "${INTEGRITY}" != "ok" ]; then
    echo "ERROR: Backup integrity check failed: ${INTEGRITY}" >&2
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Compress backup
gzip -9 "${BACKUP_FILE}"

# Keep only the last 14 days of backups
find "${BACKUP_DIR}" -name "commerce_*.db.gz" -mtime +14 -delete

echo "Backup successful: ${BACKUP_FILE}.gz"
```

---

## 3. Database Restore Procedure

To restore Commerce OS from a backup file:

1. **Stop the Application Server**:
   ```bash
   # Liara: Stop the app from console, or locally:
   systemctl stop commerce-os # or docker stop commerce-os
   ```

2. **Archive the Current Broken/Corrupted Database**:
   ```bash
   TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
   mv /data/commerce.db "/data/commerce.db.corrupt.${TIMESTAMP}"
   rm -f /data/commerce.db-wal /data/commerce.db-shm
   ```

3. **Restore the Verified Backup**:
   ```bash
   gunzip -c /data/backups/commerce_20261106_120000.db.gz > /data/commerce.db
   ```

4. **Verify Integrity**:
   ```bash
   sqlite3 /data/commerce.db "PRAGMA integrity_check;"
   # Expected output: ok
   ```

5. **Start Application Server**:
   ```bash
   systemctl start commerce-os # or docker start commerce-os
   ```

---

## 4. Encryption Key Lifecycle & Key Rotation

Commerce OS implements AES-256-GCM v2 with key identifier tracking. All encrypted payloads include the key ID in their header:
`v2:k1:<iv_hex>:<auth_tag_hex>:<ciphertext_hex>`

### Generating a New Production Key
```bash
openssl rand -hex 32
# Example output: a8f41398c7b80e8e04b2b1d6f0288f638148b8c2c8f821639d48b111a4325a90
```

### Zero-Downtime Key Rotation Sequence

When rotating from key `k1` to key `k2`:

1. **Step 1: Configure Keyring in Environment**:
   Keep `k1` in the keyring so existing records can be read, and define `k2` as the active key:
   ```ini
   DB_ENCRYPTION_KEY_ID="k2"
   DB_ENCRYPTION_KEY="<new_k2_64_hex_key>"
   DB_ENCRYPTION_KEYRING='{"k1":"<old_k1_64_hex_key>"}'
   ```

2. **Step 2: Start Application**:
   New writes will automatically encrypt using `k2`. Reads for records encrypted with `k1` will automatically resolve `k1` from the keyring and decrypt cleanly.

3. **Step 3: Background Batch Re-encryption**:
   Execute the re-encryption utility without taking the database offline:
   ```typescript
   import { reencryptBatch } from "./server/cryptoVault";

   // Re-encrypt up to 500 records per transaction with crash resilience
   let offset = 0;
   while (true) {
     const result = reencryptBatch(db, "k2", 500, offset);
     console.log(`Re-encrypted ${result.migratedCount} records.`);
     if (result.migratedCount === 0 || result.remainingCount === 0) break;
     offset += result.migratedCount;
   }
   ```

4. **Step 4: Retire Old Key**:
   Once all records are migrated to `k2`, remove `k1` from `DB_ENCRYPTION_KEYRING`.

---

## 5. Crash Recovery & Resilience

1. **Outbox Worker Recovery**:
   - The outbox worker uses timed lease tokens (`lease_token TEXT`, `lease_expires_at INTEGER`).
   - If a worker process terminates during event delivery, the lease expires within 60 seconds.
   - The recovered worker automatically re-claims expired events and resumes processing.
2. **Order & Payment Atomicity**:
   - Orders are registered using `BEGIN IMMEDIATE` SQLite transactions.
   - Stock reduction and outbox event creation are committed in the same atomic transaction.
   - If a crash occurs before commit, SQLite rolls back the journal, preserving accurate inventory.
