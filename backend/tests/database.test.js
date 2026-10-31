import { beforeAll, afterAll, it, expect } from 'vitest';
import { randomUUID, randomBytes } from 'node:crypto';
import { URL } from 'node:url';
import { createClient } from '../src/db/client.js';
import { runMigrations } from '../src/db/migrations/run.js';
import { seed } from '../src/db/seeds/run.js';
import reference from '../src/db/seeds/reference.js';
import { pseudonymize } from '../src/db/signals.js';
import { storeReport, storeChallenge, observeTime } from '../src/db/records.js';
import { submitChallenge } from '../src/modules/challenges/challenges.service.ts';
import { resetDerivedState } from '../src/modules/admin/reset.service.ts';
const url = process.env.TEST_DATABASE_URL;
if (!url)
    throw new Error('Set TEST_DATABASE_URL to a disposable local database ending in _test');
const parsed = new URL(url);
if (!parsed.pathname.endsWith('_test') || !['127.0.0.1', 'localhost'].includes(parsed.hostname))
    throw new Error('Refusing destructive reset outside local *_test database');
process.env.DATABASE_URL = url;
process.env.JUDGING_RESET_ENABLED = 'true';
process.env.JUDGING_DATABASE_URL = url;
process.env.JUDGING_DATABASE_DISPOSABLE = 'true';
process.env.JUDGING_ENVIRONMENT = 'judging';
const client = createClient(url);
const secret = randomBytes(32).toString('hex');
async function reset() { await client.sql.unsafe('DROP SCHEMA IF EXISTS restricted CASCADE; DROP SCHEMA IF EXISTS drizzle CASCADE; DROP SCHEMA public CASCADE; CREATE SCHEMA public'); }
beforeAll(async () => { await reset(); await runMigrations(client); await Promise.all([runMigrations(client), runMigrations(client)]); await seed(client); await seed(client); }, 30000);
afterAll(async () => { try {
    await reset();
}
finally {
    await client.sql.end();
} });
it('runs migrations from empty database and records them once', async () => {
    const [row] = await client.sql `SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations`;
    expect(row.count).toBe(1);
});
it('seeds every Appendix B and C row exactly and idempotently', async () => {
    const areas = await client.sql `SELECT pincode,locality,city,lat,lng FROM areas ORDER BY pincode`;
    expect(areas.map(r => [r.pincode, r.locality, r.city, r.lat, r.lng])).toEqual([...reference.areas].sort((a, b) => a[0].localeCompare(b[0])));
    expect(areas).toHaveLength(25);
    const verified = await client.sql `SELECT i.identifier_type,i.normalized_value,v.label FROM verified_identifiers v JOIN identifiers i ON i.id=v.identifier_id ORDER BY i.identifier_type,i.normalized_value`;
    expect(verified.map(r => [r.identifier_type, r.normalized_value, r.label])).toEqual([...reference.verified].sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1])));
    expect(verified).toHaveLength(19);
    expect((await client.sql `SELECT value FROM channels ORDER BY value`).map(r => r.value)).toEqual([...reference.channels].sort());
    expect((await client.sql `SELECT value FROM scam_types ORDER BY value`).map(r => r.value)).toEqual([...reference.scamTypes, 'other'].sort());
    expect(reference.normalizeScamType(randomUUID())).toBe('other');
    expect(() => reference.validateChannel(randomUUID())).toThrow();
});
it('enforces exact identifier uniqueness and foreign keys', async () => {
    const value = 'https://' + randomUUID() + '.example.test';
    await client.sql `INSERT INTO identifiers(identifier_type,normalized_value) VALUES('url',${value})`;
    await expect(client.sql `INSERT INTO identifiers(identifier_type,normalized_value) VALUES('url',${value})`).rejects.toMatchObject({ code: '23505' });
    await expect(client.sql `INSERT INTO cases(identifier_id) VALUES(${randomUUID()})`).rejects.toMatchObject({ code: '23503' });
});
it('stores only keyed signals, merges cases, and separates raw from trusted counts', async () => {
    const reporter = randomUUID(), prefix = randomUUID();
    const input = { report_id: randomUUID(), reporter_id: reporter, ip_prefix: prefix, identifier_type: 'url', normalized_value: 'https://' + randomUUID() + '.example.test', occurred_at: '2026-10-27T18:21:04+05:30', reported_at: '2026-10-27T18:40:04+05:30', pincode: reference.areas[0][0], scam_type: reference.scamTypes[0], channel: reference.channels[0] };
    const a = await storeReport(client, secret, input);
    const b = await storeReport(client, secret, { ...input, report_id: randomUUID() });
    expect(a.caseId).toBe(b.caseId);
    const [stats] = await client.sql `SELECT * FROM case_statistics WHERE case_id=${a.caseId}`;
    expect(stats.raw_report_count).toBe(2);
    expect(stats.distinct_reporter_count).toBe(1);
    expect(stats.independent_trusted_reporter_count).toBe(0);
    const rows = await client.sql `SELECT r.*,s.reporter_hmac FROM reports r JOIN reporter_signals s ON s.id=r.reporter_signal_id WHERE r.case_id=${a.caseId}`;
    expect(JSON.stringify(rows)).not.toContain(reporter);
    expect(JSON.stringify(rows)).not.toContain(prefix);
    expect(rows[0].reporter_hmac).toBe(pseudonymize(secret, reporter, prefix).reporterHmac);
    expect(new Date(rows[0].occurred_at).toISOString()).toBe(new Date(input.occurred_at).toISOString());
    expect(await client.sql `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND column_name IN ('reporter_id','ip_prefix','latitude','longitude')`).toHaveLength(0);
    await expect(storeReport(client, secret, { ...input, report_id: randomUUID(), normalized_value: 'https://rollback.example.test', pincode: '000000' })).rejects.toBeDefined();
    expect(await client.sql `SELECT id FROM identifiers WHERE normalized_value='https://rollback.example.test'`).toHaveLength(0);
    const challenge = await storeChallenge(client, { identifierId: (await client.sql `SELECT identifier_id FROM cases WHERE id=${a.caseId}`)[0].identifier_id, claimantName: 'Test business', contactEmail: 'test@example.test', proofNote: 'Test proof' });
    expect(await client.sql `SELECT id FROM challenges WHERE id=${challenge}`).toHaveLength(1);
    expect(await client.sql `SELECT 1 FROM pg_namespace n,aclexplode(n.nspacl) a WHERE n.nspname='restricted' AND a.grantee=0`).toHaveLength(0);
});
it('HMACs are deterministic, keyed and separated by purpose', () => {
    const value = randomUUID();
    const a = pseudonymize(secret, value, value);
    expect(a).toEqual(pseudonymize(secret, value, value));
    expect(a.reporterHmac).not.toBe(a.ipPrefixHmac);
    expect(a.reporterHmac).not.toBe(pseudonymize(randomBytes(32).toString('hex'), value, value).reporterHmac);
    expect(() => pseudonymize('short', value, value)).toThrow();
});
it('latest seen time cannot move backwards and indexes support windows', async () => {
    const later = '2026-10-31T12:00:00Z';
    await observeTime(client, later);
    expect(new Date(await observeTime(client, '2026-10-30T12:00:00Z')).toISOString()).toBe(new Date(later).toISOString());
    const indexes = await client.sql `SELECT indexname FROM pg_indexes WHERE tablename='reports'`;
    expect(indexes.map(r => r.indexname)).toContain('reports_area_type_time_idx');
});
it('deduplicates concurrent disputes and keeps claimant data restricted', async () => {
    const request = {
        identifier_type: 'phone',
        identifier_value: '+91 80 4100 2233',
        claimant_name: 'Fresh Bakes',
        contact_email: 'owner@example.test',
        proof_note: 'Business proof',
    };
    const results = await Promise.all([
        submitChallenge(client, request),
        submitChallenge(client, { ...request, claimant_name: 'Fresh Bakes Duplicate' }),
    ]);
    expect(results[0]).toEqual(results[1]);
    const challenges = await client.sql `SELECT id,status FROM challenges WHERE identifier_id=(SELECT id FROM identifiers WHERE identifier_type='phone' AND normalized_value='+918041002233')`;
    expect(challenges).toHaveLength(1);
    expect(challenges[0].status).toBe('under_review');
    const contacts = await client.sql `SELECT claimant_name,contact_email,proof_note FROM restricted.challenge_contacts WHERE challenge_id=${results[0].challengeId}`;
    expect(contacts).toHaveLength(1);
    expect(contacts[0].contact_email).toBe('owner@example.test');
    expect(JSON.stringify(results)).not.toContain('owner@example.test');
});
it('resets report-derived state while preserving reference data and licence state', async () => {
    await client.sql `INSERT INTO license_state(id,licensee,expires_at,signature) VALUES(1,'Judge','2027-01-01T00:00:00Z','test-signature') ON CONFLICT(id) DO NOTHING`;
    const deleted = await resetDerivedState(client);
    expect(deleted).toBeGreaterThanOrEqual(1);
    expect(await client.sql `SELECT id FROM reports`).toHaveLength(0);
    expect(await client.sql `SELECT id FROM cases`).toHaveLength(0);
    expect(await client.sql `SELECT id FROM challenges`).toHaveLength(0);
    expect(await client.sql `SELECT id FROM license_state WHERE id=1`).toHaveLength(1);
    expect(await client.sql `SELECT pincode FROM areas`).toHaveLength(25);
    expect(await client.sql `SELECT identifier_id FROM verified_identifiers`).toHaveLength(19);
});
