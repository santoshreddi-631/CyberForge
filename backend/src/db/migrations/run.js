const { migrate } = require('drizzle-orm/postgres-js/migrator');
async function runMigrations(client) {
    const lock = await client.sql.reserve();
    try {
        await lock`SELECT pg_advisory_lock(78120301)`;
        await migrate(client.db, { migrationsFolder: __dirname });
    } finally {
        try { await lock`SELECT pg_advisory_unlock(78120301)`; }
        finally { lock.release(); }
    }
}
if (require.main === module) {
    const { createClient } = require('../client.js');
    const client = createClient(process.env.DATABASE_URL);
    runMigrations(client).catch(() => { process.stderr.write('Migration failed; check database access and migration SQL.\n'); process.exitCode = 1; }).finally(() => client.sql.end());
}
module.exports = { runMigrations };
