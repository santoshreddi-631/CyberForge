import { sql } from "drizzle-orm";
import { getDb, createClient } from "../../db/client.js";

type DatabaseClient = ReturnType<typeof createClient>;

export async function resetDerivedState(client: DatabaseClient = getDb()): Promise<number> {
  return client.db.transaction(async (tx) => {
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
