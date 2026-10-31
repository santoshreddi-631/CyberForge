import { createPublicKey, verify as verifySignature } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb, createClient } from "../../db/client.js";
import { getEnv } from "../../config/env.js";

type DatabaseClient = ReturnType<typeof createClient>;
type SqlExecutor = { execute: (query: unknown) => Promise<unknown[]> };

export interface LicenseDocument {
  licensee: string;
  expires_at: string;
  signature: string;
}

export interface LicenseStatus {
  licensee: string;
  expires_at: string;
  valid: boolean;
  expired: boolean;
}

interface StoredLicense {
  licensee: string;
  expiresAt: string;
  signature: string;
}

export class LicenseValidationError extends Error {
  readonly code = "LICENSE_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "LicenseValidationError";
  }
}

let cachedLicense: StoredLicense | null = null;
let clockRollbackDetected = false;

function canonicalPayload(licensee: string, expiresAt: string): Buffer {
  const parsedExpiry = new Date(expiresAt);
  const canonicalExpiry = Number.isFinite(parsedExpiry.getTime())
    ? parsedExpiry.toISOString()
    : expiresAt;
  return Buffer.from(JSON.stringify({ licensee, expires_at: canonicalExpiry }), "utf8");
}

function publicKeyFromHex(value: string): ReturnType<typeof createPublicKey> {
  if (!/^[0-9a-f]{64}$/iu.test(value)) {
    throw new Error("LICENCE_PUBLIC_KEY_HEX must contain 32 bytes");
  }
  const der = Buffer.concat([
    Buffer.from("302a300506032b6570032100", "hex"),
    Buffer.from(value, "hex"),
  ]);
  return createPublicKey({ key: der, format: "der", type: "spki" });
}

function decodeSignature(value: string): Buffer {
  if (/^[0-9a-f]{128}$/iu.test(value)) return Buffer.from(value, "hex");
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== 64) throw new Error("Licence signature must be 64-byte hex or base64");
  return decoded;
}

export function verifyLicenseSignature(document: LicenseDocument, publicKeyHex: string): boolean {
  const expiresAt = new Date(document.expires_at);
  if (!document.licensee.trim() || !Number.isFinite(expiresAt.getTime())) return false;
  try {
    return verifySignature(
      null,
      canonicalPayload(document.licensee, document.expires_at),
      publicKeyFromHex(publicKeyHex),
      decodeSignature(document.signature),
    );
  } catch {
    return false;
  }
}

function statusForLicense(license: StoredLicense | null, now: Date): LicenseStatus {
  if (!license) {
    return {
      licensee: "Not configured",
      expires_at: "1970-01-01T00:00:00.000Z",
      valid: false,
      expired: false,
    };
  }
  const expired = clockRollbackDetected || now.getTime() >= new Date(license.expiresAt).getTime();
  return {
    licensee: license.licensee,
    expires_at: new Date(license.expiresAt).toISOString(),
    valid: !expired,
    expired,
  };
}

async function readStoredLicense(client: DatabaseClient): Promise<StoredLicense | null> {
  const [row] = await client.db.execute(sql`
    SELECT licensee, expires_at, signature
    FROM license_state
    WHERE id = 1
    LIMIT 1
  `);
  if (!row) return null;
  const result = row as { licensee: string; expires_at: string; signature: string };
  const document: LicenseDocument = {
    licensee: result.licensee,
    expires_at: new Date(result.expires_at).toISOString(),
    signature: result.signature,
  };
  if (!verifyLicenseSignature(document, getEnv().LICENCE_PUBLIC_KEY_HEX)) {
    return null;
  }
  return {
    licensee: result.licensee,
    expiresAt: document.expires_at,
    signature: result.signature,
  };
}

async function observeServerClock(executor: SqlExecutor, now: Date): Promise<boolean> {
  const [row] = await executor.execute(sql`
    INSERT INTO latest_seen_time(id, latest_seen_at)
    VALUES (1, ${now.toISOString()}::timestamptz)
    ON CONFLICT(id) DO UPDATE SET
      latest_seen_at = greatest(latest_seen_time.latest_seen_at, excluded.latest_seen_at)
    RETURNING latest_seen_at
  `);
  const result = row as { latest_seen_at: string };
  return now.getTime() < new Date(String(result.latest_seen_at)).getTime();
}

export async function getLicenseStatus(now = new Date()): Promise<LicenseStatus> {
  if (cachedLicense) {
    clockRollbackDetected = await observeServerClock(getDb().db, now);
    return statusForLicense(cachedLicense, now);
  }
  if (getEnv().NODE_ENV === "test" && !process.env.LICENSE_ENFORCEMENT_TEST) {
    return statusForLicense(null, now);
  }
  const client = getDb();
  cachedLicense = await readStoredLicense(client);
  if (!cachedLicense) {
    return {
      licensee: "Not configured",
      expires_at: "1970-01-01T00:00:00.000Z",
      valid: false,
      expired: true,
    };
  }
  if (cachedLicense) {
    clockRollbackDetected = await observeServerClock(client.db, now);
  }
  return statusForLicense(cachedLicense, now);
}

export async function activateLicense(document: LicenseDocument, now = new Date()): Promise<LicenseStatus> {
  const env = getEnv();
  const expiresAt = new Date(document.expires_at);
  if (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) {
    throw new LicenseValidationError("Licence is already expired");
  }
  if (!verifyLicenseSignature(document, env.LICENCE_PUBLIC_KEY_HEX)) {
    throw new LicenseValidationError("Invalid licence signature");
  }
  const client = getDb();

  const stored = await client.db.transaction(async (tx: SqlExecutor) => {
    const [existing] = await tx.execute(sql`
      SELECT licensee, expires_at, signature
      FROM license_state
      WHERE id = 1
      FOR UPDATE
    `);
    const existingLicense = existing as { expires_at?: string } | undefined;
    if (existingLicense?.expires_at && expiresAt.getTime() < new Date(existingLicense.expires_at).getTime()) {
      throw new LicenseValidationError("Licence expiry cannot move backwards");
    }
    const [row] = await tx.execute(sql`
      INSERT INTO license_state(id, licensee, expires_at, signature)
      VALUES (1, ${document.licensee.trim()}, ${expiresAt.toISOString()}::timestamptz, ${document.signature})
      ON CONFLICT(id) DO UPDATE SET
        licensee = excluded.licensee,
        expires_at = excluded.expires_at,
        signature = excluded.signature,
        updated_at = now()
      RETURNING licensee, expires_at, signature
    `);
    clockRollbackDetected = await observeServerClock(tx, now);
    if (clockRollbackDetected) {
      throw new LicenseValidationError("Server clock rollback detected");
    }
    return row as { licensee: string; expires_at: string; signature: string };
  });

  cachedLicense = {
    licensee: stored.licensee,
    expiresAt: new Date(stored.expires_at).toISOString(),
    signature: stored.signature,
  };
  return statusForLicense(cachedLicense, now);
}

export async function enforceLicense(reqPath: string): Promise<boolean> {
  if (reqPath === "/health" || reqPath === "/license") return true;
  const status = await getLicenseStatus();
  return !status.expired;
}

export function resetLicenseCache(): void {
  cachedLicense = null;
  clockRollbackDetected = false;
}

export const licenseCanonicalPayload = canonicalPayload;
