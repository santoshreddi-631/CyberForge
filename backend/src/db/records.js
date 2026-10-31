const { pseudonymize } = require('./signals.js');
const { normalizeScamType, validateChannel } = require('./seeds/reference.js');
// Internal persistence interface: identifierValue must already be canonical.
// Raw notes are deliberately not accepted; sanitization belongs to ingestion.
async function storeReport(client, secret, input) {
    const signals = pseudonymize(secret, input.reporter_id, input.ip_prefix);
    const channel = validateChannel(input.channel);
    const type = normalizeScamType(input.scam_type);
    return client.sql.begin(async (sql) => {
        const [identifier] = await sql `INSERT INTO identifiers(identifier_type,normalized_value) VALUES(${input.identifier_type},${input.normalized_value}) ON CONFLICT(identifier_type,normalized_value) DO UPDATE SET normalized_value=excluded.normalized_value RETURNING id`;
        const [caseRow] = await sql `INSERT INTO cases(identifier_id) VALUES(${identifier.id}) ON CONFLICT(identifier_id) DO UPDATE SET identifier_id=excluded.identifier_id RETURNING id`;
        await sql `SELECT id FROM cases WHERE id=${caseRow.id} FOR UPDATE`;
        const [reporter] = await sql `INSERT INTO reporter_signals(reporter_hmac) VALUES(${signals.reporterHmac}) ON CONFLICT(reporter_hmac) DO UPDATE SET reporter_hmac=excluded.reporter_hmac RETURNING id`;
        const [report] = await sql `INSERT INTO reports(report_id,case_id,reporter_signal_id,ip_prefix_hmac,occurred_at,reported_at,pincode,scam_type,channel,has_screenshot,amount_lost_inr) VALUES(${input.report_id},${caseRow.id},${reporter.id},${signals.ipPrefixHmac},${input.occurred_at},${input.reported_at},${input.pincode},${type},${channel},${input.has_screenshot ?? false},${input.amount_lost_inr ?? 0}) RETURNING id`;
        await sql `INSERT INTO trust_decisions(report_id) VALUES(${report.id})`;
        await sql `INSERT INTO case_statistics(case_id,raw_report_count,distinct_reporter_count) SELECT ${caseRow.id},count(*),count(DISTINCT reporter_signal_id) FROM reports WHERE case_id=${caseRow.id} ON CONFLICT(case_id) DO UPDATE SET raw_report_count=excluded.raw_report_count,distinct_reporter_count=excluded.distinct_reporter_count,updated_at=now()`;
        return { id: report.id, caseId: caseRow.id };
    });
}
async function storeChallenge(client, { identifierId, claimantName, contactEmail, proofNote }) {
    return client.sql.begin(async (sql) => {
        const [row] = await sql `INSERT INTO challenges(identifier_id) VALUES(${identifierId}) RETURNING id`;
        await sql `INSERT INTO restricted.challenge_contacts(challenge_id,claimant_name,contact_email,proof_note) VALUES(${row.id},${claimantName},${contactEmail},${proofNote})`;
        return row.id;
    });
}
async function observeTime(client, time) {
    const [row] = await client.sql `INSERT INTO latest_seen_time(id,latest_seen_at) VALUES(1,${time}) ON CONFLICT(id) DO UPDATE SET latest_seen_at=greatest(latest_seen_time.latest_seen_at,excluded.latest_seen_at) RETURNING latest_seen_at`;
    return row.latest_seen_at;
}
module.exports = { storeReport, storeChallenge, observeTime };
