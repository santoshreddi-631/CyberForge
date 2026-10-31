import { generateKeyPairSync, sign } from "node:crypto";
import { randomBytes } from "node:crypto";
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
let runtimePrepared: ReturnType<typeof createClient> | null = null;
let application: ReturnType<typeof createApp> | null = null;
let privateKey: ReturnType<typeof generateKeyPairSync>["privateKey"] | null = null;
let runtimeDatabaseUrl: string | null = null;

function assertDisposableDatabase(url: string): void {
  const parsed = new URL(url);
  if (!parsed.pathname.endsWith("_test") || !["127.0.0.1", "localhost"].includes(parsed.hostname)) {
    throw new Error("TEST_DATABASE_URL must point to a local database ending in _test");
  }
}

export async function prepareHarness(): Promise<{
  client: ReturnType<typeof createClient>;
  runtimeClient: ReturnType<typeof createClient>;
  runtimeUrl: string;
  app: ReturnType<typeof createApp>;
}> {
  if (prepared && runtimePrepared && application && runtimeDatabaseUrl) {
    return { client: prepared, runtimeClient: runtimePrepared, runtimeUrl: runtimeDatabaseUrl, app: application };
  }
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL is required for PostgreSQL integration tests");
  assertDisposableDatabase(url);
  process.env.DATABASE_URL = url;
  process.env.JUDGING_RESET_ENABLED = "true";
  process.env.JUDGING_DATABASE_URL = url;
  process.env.JUDGING_DATABASE_DISPOSABLE = "true";
  process.env.JUDGING_ENVIRONMENT = "judging";
  process.env.REPORTER_HMAC_SECRET = "phase11-test-secret-012345678901234567890123";
  prepared = createClient(url);
  await prepared.sql.unsafe(
    "DROP SCHEMA IF EXISTS restricted CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public",
  );
  await runMigrations(prepared);
  await seed(prepared);

  const runtimePassword = randomBytes(32).toString("hex");
  await prepared.sql.unsafe(`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'community_scam_runtime_test') THEN
      EXECUTE 'DROP OWNED BY community_scam_runtime_test';
    END IF;
  END $$`);
  await prepared.sql.unsafe("DROP ROLE IF EXISTS community_scam_runtime_test");
  await prepared.sql.unsafe(
    `CREATE ROLE community_scam_runtime_test LOGIN PASSWORD '${runtimePassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT`,
  );
  await prepared.sql.unsafe(`DO $$ BEGIN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO community_scam_runtime_test', current_database());
  END $$`);
  await prepared.sql.unsafe("GRANT USAGE ON SCHEMA public TO community_scam_runtime_test");
  await prepared.sql.unsafe("GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO community_scam_runtime_test");
  await prepared.sql.unsafe("GRANT USAGE ON SCHEMA restricted TO community_scam_runtime_test");
  await prepared.sql.unsafe("GRANT INSERT ON TABLE restricted.challenge_contacts TO community_scam_runtime_test");
  const runtimeUrl = new URL(url);
  runtimeUrl.username = "community_scam_runtime_test";
  runtimeUrl.password = runtimePassword;
  runtimeDatabaseUrl = runtimeUrl.toString();
  runtimePrepared = createClient(runtimeDatabaseUrl);
  process.env.DATABASE_URL = runtimeDatabaseUrl;
  process.env.JUDGING_DATABASE_URL = runtimeDatabaseUrl;

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
    Buffer.from(JSON.stringify({ licensee: "Phase 17 Judge", expires_at: expiresAt })),
    privateKey,
  ).toString("base64");
  await activateLicense({ licensee: "Phase 17 Judge", expires_at: expiresAt, signature });
  application = createApp();
  return { client: prepared, runtimeClient: runtimePrepared, runtimeUrl: runtimeDatabaseUrl, app: application };
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
