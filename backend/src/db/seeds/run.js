const { sql } = require('drizzle-orm');
const schema = require('../schema/index.js');
const reference = require('./reference.js');
async function seed(client) {
    return client.db.transaction(async (tx) => {
        for (const [pincode, locality, city, lat, lng] of reference.areas) {
            await tx.insert(schema.areas).values({ pincode, locality, city, lat, lng }).onConflictDoUpdate({ target: schema.areas.pincode, set: { locality, city, lat, lng } });
        }
        await tx.insert(schema.scamTypes).values([...reference.scamTypes, 'other'].map(value => ({ value }))).onConflictDoNothing();
        await tx.insert(schema.channels).values(reference.channels.map(value => ({ value }))).onConflictDoNothing();
        for (const [identifierType, normalizedValue, label] of reference.verified) {
            const [identifier] = await tx.insert(schema.identifiers).values({ identifierType, normalizedValue }).onConflictDoUpdate({ target: [schema.identifiers.identifierType, schema.identifiers.normalizedValue], set: { normalizedValue: sql `excluded.normalized_value` } }).returning({ id: schema.identifiers.id });
            await tx.insert(schema.verifiedIdentifiers).values({ identifierId: identifier.id, label }).onConflictDoUpdate({ target: schema.verifiedIdentifiers.identifierId, set: { label } });
        }
        return { areas: reference.areas.length, verified: reference.verified.length, scamTypes: reference.scamTypes.length + 1, channels: reference.channels.length };
    });
}
if (require.main === module) {
    const { createClient } = require('../client.js');
    const client = createClient(process.env.DATABASE_URL);
    seed(client).then(result => process.stdout.write(JSON.stringify(result) + '\n')).catch(() => { process.stderr.write('Reference seed failed.\n'); process.exitCode = 1; }).finally(() => client.sql.end());
}
module.exports = { seed };
