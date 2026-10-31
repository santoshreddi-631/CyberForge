const postgres = require('postgres');
const { drizzle } = require('drizzle-orm/postgres-js');
const schema = require('./schema/index.js');
function createClient(url) {
    if (!url || !/^postgres(?:ql)?:/.test(url))
        throw new Error('A PostgreSQL DATABASE_URL is required');
    const sql = postgres(url, { max: 5, connect_timeout: 5, idle_timeout: 20, onnotice: () => { } });
    return { sql, db: drizzle(sql, { schema }) };
}
let client;
function getSql() { client ??= createClient(process.env.DATABASE_URL); return client.sql; }
function getDb() { getSql(); return client; }
async function pingDb() { try {
    await getSql() `SELECT 1`;
    return true;
}
catch {
    return false;
} }
async function closeDb() { if (client) {
    await client.sql.end({ timeout: 5 });
    client = undefined;
} }
function withTransaction(database, operation) { return database.transaction(operation); }
module.exports = { createClient, getSql, getDb, pingDb, closeDb, withTransaction };
