import { sql } from "drizzle-orm";
import { getDb, createClient } from "../../db/client.js";
import { getEnv } from "../../config/env.js";

type DatabaseClient = ReturnType<typeof createClient>;
type TransactionClient = { execute: (query: unknown) => Promise<unknown[]> };

export class ResetUnavailableError extends Error {
  readonly code = "RESET_UNAVAILABLE";

  constructor() {
    super("Reset is available only in the configured disposable judging environment");
    this.name = "ResetUnavailableError";
  }
}

export function isJudgingResetConfigured(): boolean {
  const env = getEnv();
  return (
    env.NODE_ENV !== "production" &&
    env.JUDGING_RESET_ENABLED === true &&
    env.JUDGING_DATABASE_DISPOSABLE === true &&
    env.JUDGING_ENVIRONMENT === "judging" &&
    Boolean(env.JUDGING_DATABASE_URL) &&
    env.JUDGING_DATABASE_URL === env.DATABASE_URL
  );
}

export async function resetDerivedState(client?: DatabaseClient): Promise<number> {
  if (!isJudgingResetConfigured()) throw new ResetUnavailableError();
  const database = client ?? getDb();
  return database.db.transaction(async (tx: TransactionClient) => {
    const deleted = await tx.execute(sql`DELETE FROM reports RETURNING id`);
    await tx.execute(sql`DELETE FROM challenges`);
    await tx.execute(sql`DELETE FROM case_statistics`);
    await tx.execute(sql`DELETE FROM area_statistics`);
    await tx.execute(sql`DELETE FROM alerts`);
    await tx.execute(sql`DELETE FROM cases`);
    await tx.execute(sql`DELETE FROM reporter_signals`);
    await tx.execute(sql`
      DELETE FROM identifiers i
      WHERE NOT EXISTS (
        SELECT 1 FROM verified_identifiers v
        WHERE v.identifier_id = i.id
      )
    `);
    return deleted.length;
  });
}
