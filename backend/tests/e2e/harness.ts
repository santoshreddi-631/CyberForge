import { generateKeyPairSync, sign } from "node:crypto";
import { createApp } from "../../src/app.js";
import { createClient } from "../../src/db/client.js";
import { _resetEnvCache } from "../../src/config/env.js";
import { runMigrations } from "../../src/db/migrations/run.js";
import { seed } from "../../src/db/seeds/run.js";
import {
  activateLicense,
  resetLicenseCache,
} from "../../src/modules/licensing/license.service.js";

export const databaseAvailable = Boolean(process.env.TEST_DATABASE_URL);
export const databaseDescription = databaseAvailable ? describe : describe.skip;

let prepared: ReturnType<typeof createClient> | null = null;
let application: ReturnType<typeof createApp> | null = null;
let privateKey: ReturnType<typeof generateKeyPairSync>["privateKey"] | null = null;

function assertDisposableDatabase(url: string): void {
  const parsed = new URL(url);
  if (!parsed.pathname.endsWith("_test") || !["127.0.0.1", "localhost"].includes(parsed.hostname)) {
    throw new Error("TEST_DATABASE_URL must point to a local database ending in _test");
  }
}

export async function prepareHarness(): Promise<{
  client: ReturnType<typeof createClient>;
  app: ReturnType<typeof createApp>;
}> {
  if (prepared && application) return { client: prepared, app: application };
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is required for PostgreSQL integration tests");
  assertDisposableDatabase(url);
  process.env.DATABASE_URL = url;
  process.env.REPORTER_HMAC_SECRET = "phase11-test-secret-012345678901234567890123";
  prepared = createClient(url);
  await prepared.sql.unsafe(
    "DROP SCHEMA IF EXISTS restricted CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public",
  );
  await runMigrations(prepared);
  await seed(prepared);

  const pair = generateKeyPairSync("ed25519");
  privateKey = pair.privateKey;
  process.env.LICENCE_PUBLIC_KEY_HEX = pair.publicKey
    .export({ type: "spki", format: "der" })
    .subarray(-32)
    .toString("hex");
  _resetEnvCache();
  resetLicenseCache();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const signature = sign(
    null,
    Buffer.from(JSON.stringify({ licensee: "Phase 11 Judge", expires_at: expiresAt })),
    privateKey,
  ).toString("base64");
  await activateLicense({ licensee: "Phase 11 Judge", expires_at: expiresAt, signature });
  application = createApp();
  return { client: prepared, app: application };
}

export function signLicense(expiresAt: string, licensee = "Phase 11 Judge") {
  if (!privateKey) throw new Error("Integration harness has not been prepared");
  return {
    licensee,
    expires_at: expiresAt,
    signature: sign(
      null,
      Buffer.from(JSON.stringify({ licensee, expires_at: expiresAt })),
      privateKey,
    ).toString("base64"),
  };
}

export async function markReportsEligible(client: ReturnType<typeof createClient>, caseId?: string): Promise<void> {
  await client.sql`
    UPDATE trust_decisions td
    SET status = 'eligible', weight = 1, reason_code = 'phase11_fixture',
        algorithm_version = 'phase11', decided_at = now()
    FROM reports r
    WHERE td.report_id = r.id
      ${caseId ? client.sql`AND r.case_id = ${caseId}` : client.sql``}
  `;
}

export function percentile(values: number[], percentage: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * percentage) - 1)];
}
