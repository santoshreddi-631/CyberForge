import { createClient } from "../src/db/client.js";
import { resetDerivedState } from "../src/modules/admin/reset.service.js";
import { _resetEnvCache } from "../src/config/env.js";

async function main() {
  const testUrl = "postgres://postgres:S%40nthuu631@127.0.0.1:5432/cyberforge_test";
  process.env.DATABASE_URL = testUrl;
  process.env.JUDGING_DATABASE_URL = testUrl;
  process.env.JUDGING_RESET_ENABLED = "true";
  process.env.JUDGING_DATABASE_DISPOSABLE = "true";
  process.env.JUDGING_ENVIRONMENT = "judging";
  process.env.NODE_ENV = "development";
  _resetEnvCache();

  const client = createClient(testUrl);
  const deleted = await resetDerivedState(client);
  console.log("Reset executed successfully on disposable database! Deleted reports count:", deleted);

  const areas = await client.sql`SELECT count(*)::int as count FROM areas`;
  const verified = await client.sql`SELECT count(*)::int as count FROM verified_identifiers`;
  console.log("Reference seeds preserved after reset: areas =", areas[0].count, "verified =", verified[0].count);
  await client.sql.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Reset test failed:", err);
  process.exit(1);
});
