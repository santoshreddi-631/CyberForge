import { sql } from "drizzle-orm";
import { getDb, createClient } from "../../db/client.js";
import { canonicalizeIdentifier } from "../identifiers/validate.js";
import type { IdentifierType } from "../identifiers/identifier.types.js";
import { maskIdentifier } from "./masking.js";
import { classifyLookup } from "./verdict.js";

type DatabaseClient = ReturnType<typeof createClient>;

interface IdentifierRow {
  identifier_id: string;
  case_id: string | null;
  verified: boolean;
  challenged: boolean;
  label: string | null;
}

interface StatisticsRow {
  raw_report_count: number;
  eligible_report_count: number;
  distinct_eligible_reporters: number;
  first_seen: string | null;
  last_seen: string | null;
}

interface EvidenceRow {
  occurred_at: string;
  channel: string;
  scam_type: string;
  pincode: string;
}

export interface LookupResponse {
  verdict: "KNOWN_SCAM" | "SUSPICIOUS" | "NO_REPORTS" | "VERIFIED_BUSINESS";
  report_count: number;
  distinct_reporters: number;
  first_seen: string | null;
  last_seen: string | null;
  scam_type: string | null;
  display_value: string;
  evidence: EvidenceRow[];
  challenged: boolean;
  business_name?: string;
}

async function findIdentifier(client: DatabaseClient, type: IdentifierType, value: string): Promise<IdentifierRow | null> {
  const [row] = await client.db.execute(sql`
    SELECT
      i.id AS identifier_id,
      c.id AS case_id,
      (v.identifier_id IS NOT NULL) AS verified,
      EXISTS (
        SELECT 1 FROM challenges ch
        WHERE ch.identifier_id = i.id AND ch.status = 'under_review'
      ) AS challenged,
      v.label
    FROM identifiers i
    LEFT JOIN cases c ON c.identifier_id = i.id
    LEFT JOIN verified_identifiers v ON v.identifier_id = i.id
    WHERE i.identifier_type = ${type}
      AND i.normalized_value = ${value}
    LIMIT 1
  `);
  return (row as unknown as IdentifierRow | undefined) ?? null;
}

async function readStatistics(client: DatabaseClient, caseId: string | null): Promise<StatisticsRow> {
  if (!caseId) {
    return {
      raw_report_count: 0,
      eligible_report_count: 0,
      distinct_eligible_reporters: 0,
      first_seen: null,
      last_seen: null,
    };
  }
  const [row] = await client.db.execute(sql`
    SELECT
      count(r.id)::int AS raw_report_count,
      count(r.id) FILTER (WHERE td.status = 'eligible')::int AS eligible_report_count,
      count(DISTINCT r.reporter_signal_id) FILTER (WHERE td.status = 'eligible')::int
        AS distinct_eligible_reporters,
      min(r.occurred_at) FILTER (WHERE td.status = 'eligible') AS first_seen,
      max(r.occurred_at) FILTER (WHERE td.status = 'eligible') AS last_seen
    FROM reports r
    LEFT JOIN trust_decisions td ON td.report_id = r.id
    WHERE r.case_id = ${caseId}
  `);
  return row as unknown as StatisticsRow;
}

async function readScamType(client: DatabaseClient, caseId: string | null): Promise<string | null> {
  if (!caseId) return null;
  const [eligibleRow] = await client.db.execute(sql`
    SELECT r.scam_type, count(*)::int AS count
    FROM reports r
    JOIN trust_decisions td ON td.report_id = r.id AND td.status = 'eligible'
    WHERE r.case_id = ${caseId}
    GROUP BY r.scam_type
    ORDER BY count DESC, r.scam_type ASC
    LIMIT 1
  `);
  if ((eligibleRow as { scam_type?: string } | undefined)?.scam_type) {
    return (eligibleRow as { scam_type: string }).scam_type;
  }
  const [rawRow] = await client.db.execute(sql`
    SELECT r.scam_type, count(*)::int AS count
    FROM reports r
    WHERE r.case_id = ${caseId}
    GROUP BY r.scam_type
    ORDER BY count DESC, r.scam_type ASC
    LIMIT 1
  `);
  return (rawRow as { scam_type?: string } | undefined)?.scam_type ?? null;
}

async function readEvidence(client: DatabaseClient, caseId: string | null): Promise<EvidenceRow[]> {
  if (!caseId) return [];
  const rows = await client.db.execute(sql`
    SELECT r.occurred_at, r.channel, r.scam_type, r.pincode
    FROM reports r
    JOIN trust_decisions td ON td.report_id = r.id AND td.status = 'eligible'
    WHERE r.case_id = ${caseId}
    ORDER BY r.occurred_at DESC
    LIMIT 10
  `);
  return rows as unknown as EvidenceRow[];
}

export async function lookupIdentifier(
  type: IdentifierType,
  rawValue: string,
): Promise<LookupResponse> {
  const canonicalValue = canonicalizeIdentifier(type, rawValue);
  const client = getDb();
  const identifier = await findIdentifier(client, type, canonicalValue);
  const statistics = await readStatistics(client, identifier?.case_id ?? null);
  const verdict = classifyLookup({
    verified: identifier?.verified ?? false,
    challenged: identifier?.challenged ?? false,
    rawReportCount: statistics.raw_report_count,
    eligibleReportCount: statistics.eligible_report_count,
    distinctEligibleReporters: statistics.distinct_eligible_reporters,
  });
  const display_value = maskIdentifier(type, canonicalValue);
  const isMasked = statistics.distinct_eligible_reporters < 3;
  const evidence = await readEvidence(client, identifier?.case_id ?? null);

  return {
    verdict,
    report_count: statistics.eligible_report_count,
    distinct_reporters: statistics.distinct_eligible_reporters,
    first_seen: statistics.first_seen,
    last_seen: statistics.last_seen,
    scam_type: await readScamType(client, identifier?.case_id ?? null),
    display_value: isMasked ? display_value : canonicalValue,
    evidence,
    challenged: identifier?.challenged ?? false,
    ...(identifier?.label ? { business_name: identifier.label } : {}),
  };
}
