import { createClient } from "../src/db/client.js";
import { runMigrations } from "../src/db/migrations/run.js";
import { seed } from "../src/db/seeds/run.js";

const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error("TEST_DATABASE_URL is required");
const parsed = new URL(url);
if (!parsed.pathname.endsWith("_test") || !["127.0.0.1", "localhost"].includes(parsed.hostname)) {
  throw new Error("Refusing to reset a non-local database or database not ending in _test");
}

const client = createClient(url);

async function main(): Promise<void> {
  try {
    await client.sql.unsafe(
      "DROP SCHEMA IF EXISTS restricted CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public",
    );
    await runMigrations(client);
    const result = await seed(client);
    process.stdout.write(JSON.stringify({ database: parsed.pathname.slice(1), ...result }) + "\n");
  } finally {
    await client.sql.end();
  }
}

void main();
