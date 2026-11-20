import path from "node:path";
import fs from "node:fs";
import { DatabaseSync } from "node:sqlite";

export interface DatabaseConfig {
  dbPath: string;
  dataDir: string;
  isTest: boolean;
  isProduction: boolean;
}

export function getDatabaseConfig(): DatabaseConfig {
  const isTest = process.env.NODE_ENV === "test";
  const isProduction = process.env.NODE_ENV === "production";

  let dbPath: string;
  let dataDir: string;

  if (process.env.COMMERCE_DB_PATH) {
    dbPath = path.resolve(process.env.COMMERCE_DB_PATH);
    dataDir = path.dirname(dbPath);
  } else if (isTest) {
    dataDir = path.join(process.cwd(), "data", "test");
    dbPath = path.join(dataDir, `test_commerce_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.db`);
  } else {
    dataDir = path.join(process.cwd(), "data");
    dbPath = path.join(dataDir, "commerce.db");
  }

  // HARD SAFETY GUARD: Automated tests must NEVER run against production or primary dev database!
  if (isTest) {
    const defaultDevPath = path.resolve(path.join(process.cwd(), "data", "commerce.db"));
    if (path.resolve(dbPath) === defaultDevPath) {
      throw new Error(
        "CRITICAL DATABASE SAFETY GUARD TRIGGERED: Automated test execution was pointed at the production/development database path! Aborting to prevent data corruption."
      );
    }
  }

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return {
    dbPath,
    dataDir,
    isTest,
    isProduction,
  };
}

// In-memory cache for PRAGMA integrity_check to protect against expensive DoS calls (Gate 6)
let cachedIntegrity: { path: string; timestamp: number; result: { ok: boolean; result: string } } | null = null;

/**
 * Creates an atomic, SQLite WAL-consistent backup using VACUUM INTO (Gate 7).
 * This guarantees capturing all committed transactions without stopping the server.
 */
export function createConsistentBackup(db: DatabaseSync, backupTargetFilePath: string): void {
  if (!backupTargetFilePath || typeof backupTargetFilePath !== "string") {
    throw new Error("Invalid backup target path: Must be a valid string path.");
  }
  if (backupTargetFilePath.includes("\0")) {
    throw new Error("Invalid backup target path: Null bytes detected.");
  }

  const resolved = path.resolve(backupTargetFilePath);
  const targetDir = path.dirname(resolved);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Remove target if exists because VACUUM INTO fails if destination file already exists
  if (fs.existsSync(resolved)) {
    try {
      fs.unlinkSync(resolved);
    } catch (e: any) {
      throw new Error(`Failed to remove existing backup target file '${resolved}': ${e?.message || e}`);
    }
  }

  // VACUUM INTO creates an exact, transactionally consistent standalone database copy
  try {
    const escaped = resolved.replace(/'/g, "''");
    db.exec(`VACUUM INTO '${escaped}';`);
  } catch (err: any) {
    throw new Error(`Consistent WAL backup execution failed: ${err?.message || err}`);
  }
}

/**
 * Verifies SQLite database integrity using PRAGMA integrity_check.
 * Protects against disk exhaustion by caching the result for up to 30 seconds (Gate 6).
 */
export function verifyDatabaseIntegrity(targetDbPath: string, forceCheck: boolean = false): { ok: boolean; result: string } {
  if (!fs.existsSync(targetDbPath)) {
    return { ok: false, result: "Database file does not exist on disk" };
  }

  const now = Date.now();
  if (!forceCheck && cachedIntegrity && cachedIntegrity.path === targetDbPath && (now - cachedIntegrity.timestamp) < 30000) {
    return cachedIntegrity.result;
  }

  try {
    const tempDb = new DatabaseSync(targetDbPath);
    const row = tempDb.prepare("PRAGMA integrity_check;").get() as { integrity_check?: string; result?: string } | undefined;
    const checkResult = (row && (row.integrity_check || row.result || Object.values(row)[0])) as string;
    tempDb.close();

    const output = {
      ok: checkResult === "ok",
      result: checkResult || "unknown",
    };

    cachedIntegrity = { path: targetDbPath, timestamp: now, result: output };
    return output;
  } catch (err: any) {
    const errOutput = { ok: false, result: err?.message || String(err) };
    cachedIntegrity = { path: targetDbPath, timestamp: now, result: errOutput };
    return errOutput;
  }
}

/**
 * Safely restores a backup after verifying its integrity on a disposable test connection (Gate 7).
 */
export function restoreDatabaseFromBackup(backupFilePath: string, destinationDbPath: string): { ok: boolean; error?: string } {
  const integrity = verifyDatabaseIntegrity(backupFilePath, true);
  if (!integrity.ok) {
    return { ok: false, error: `Backup integrity check failed: ${integrity.result}` };
  }

  // Copy verified backup file to destination
  fs.copyFileSync(backupFilePath, destinationDbPath);

  // Remove stale WAL/SHM files for destination to ensure clean startup from backup image
  const walPath = `${destinationDbPath}-wal`;
  const shmPath = `${destinationDbPath}-shm`;
  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

  return { ok: true };
}
