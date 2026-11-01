const postgres = require('postgres');
const dotenv = require('dotenv');
const path = require('node:path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('Error: DATABASE_URL is not set.');
  process.exit(1);
}

const sql = postgres(dbUrl, {
  ssl: dbUrl.includes('render.com') || dbUrl.includes('neon') || dbUrl.includes('supabase') ? 'require' : false,
  connect_timeout: 10,
});

async function main() {
  try {
    const tableArg = process.argv[2];

    if (tableArg) {
      console.log(`\n--- Inspecting Table: ${tableArg} ---`);
      const rows = await sql`SELECT * FROM ${sql(tableArg)} LIMIT 10`;
      console.table(rows);
      return;
    }

    console.log('\n================ DATABASE TABLES OVERVIEW ================');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name NOT LIKE 'pg_%'
        AND table_name != '__drizzle_migrations'
      ORDER BY table_name;
    `;

    if (tables.length === 0) {
      console.log('No public tables found. Have migrations been run?');
      return;
    }

    const summaries = [];
    for (const { table_name } of tables) {
      const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM ${sql(table_name)}`;
      summaries.push({ 'Table Name': table_name, 'Row Count': count });
    }

    console.table(summaries);
    console.log('Tip: Run `npm run db:inspect -- <table_name>` to view records inside a table.\n');
  } catch (err) {
    console.error('Database connection / query failed:', err.message);
  } finally {
    await sql.end();
  }
}

main();
