import { createClient } from "../src/db/client.js";

const databaseUrl = process.env.DATABASE_URL;
const cleanupEnabled = process.env.CLEANUP_DEMO_DATA === "true";
const judgingDatabaseUrl = process.env.JUDGING_DATABASE_URL;
const isDisposableJudgingDatabase =
  process.env.NODE_ENV !== "production" &&
  process.env.JUDGING_RESET_ENABLED === "true" &&
  process.env.JUDGING_DATABASE_DISPOSABLE === "true" &&
  process.env.JUDGING_ENVIRONMENT === "judging" &&
  Boolean(judgingDatabaseUrl) &&
  judgingDatabaseUrl === databaseUrl;

if (!cleanupEnabled) {
  throw new Error("Set CLEANUP_DEMO_DATA=true to run demo-data cleanup");
}
if (!databaseUrl || !isDisposableJudgingDatabase) {
  throw new Error("Demo cleanup requires the explicitly configured disposable judging database");
}

const client = createClient(databaseUrl);
try {
  const deleted = await client.sql.begin(async (sql) => {
    const reports = await sql`
      DELETE FROM reports
      WHERE report_id LIKE ANY(${sql.array([
        "judge-demo-%",
        "bot-%",
        "phase11-%",
        "phase17-%",
        "phase18-%",
        "rep_test_%",
        "demo-%",
      ])})
      RETURNING id
    `;

    await sql`
      DELETE FROM cases c
      WHERE NOT EXISTS (SELECT 1 FROM reports r WHERE r.case_id = c.id)
    `;
    await sql`
      DELETE FROM identifiers i
      WHERE NOT EXISTS (SELECT 1 FROM cases c WHERE c.identifier_id = i.id)
        AND NOT EXISTS (SELECT 1 FROM verified_identifiers v WHERE v.identifier_id = i.id)
    `;
    await sql`
      DELETE FROM reporter_signals s
      WHERE NOT EXISTS (SELECT 1 FROM reports r WHERE r.reporter_signal_id = s.id)
    `;

    // These are derived caches and are rebuilt by future ingestion/alert work.
    await sql`TRUNCATE TABLE area_statistics, alerts`;
    return reports.length;
  });

  console.log(`Deleted ${deleted} marked demo reports and cleaned orphaned derived data.`);
} finally {
  await client.sql.end({ timeout: 5 });
}
