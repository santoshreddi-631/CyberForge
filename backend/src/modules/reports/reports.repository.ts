import { sql } from "drizzle-orm";
import { createClient } from "../../db/client.js";
import schema from "../../db/schema/index.js";
import { pseudonymize } from "../../db/signals.js";
import type { ReportRequest } from "./reports.schema.js";
import { evaluateTrust } from "../trust/trust-engine.js";
import { resolvePostalCoordinates } from "../geo/postal-lookup.js";

type DatabaseClient = ReturnType<typeof createClient>;

export class ReportValidationError extends Error {
  readonly code = "REPORT_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ReportValidationError";
  }
}

export class ReportRateLimitError extends Error {
  readonly code = "REPORT_RATE_LIMIT";

  constructor() {
    super("Too many reports from this reporter in the last hour");
    this.name = "ReportRateLimitError";
  }
}

export interface StoreReportInput extends ReportRequest {
  normalized_value: string;
  sanitized_note: string;
}

export interface StoredReport {
  reportId: string;
  caseId: string;
  merged: boolean;
  duplicate: boolean;
}

export async function storeReport(
  client: DatabaseClient,
  secret: string,
  input: StoreReportInput,
): Promise<StoredReport> {
  const signals = pseudonymize(secret, input.reporter_id, input.ip_prefix);

  return client.db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.report_id}))`);

    const [existing] = await tx
      .select({ reportId: schema.reports.reportId, caseId: schema.reports.caseId })
      .from(schema.reports)
      .where(sql`${schema.reports.reportId} = ${input.report_id}`)
      .limit(1);
    if (existing) {
      return {
        reportId: existing.reportId,
        caseId: existing.caseId,
        merged: true,
        duplicate: true,
      };
    }

    const [existingArea] = await tx
      .select({ locality: schema.areas.locality, city: schema.areas.city })
      .from(schema.areas)
      .where(sql`${schema.areas.pincode} = ${input.pincode}`)
      .limit(1);
    if (!existingArea) {
      const resolvedLocality = input.locality?.trim() || `Area ${input.pincode}`;
      const resolvedCity = input.city?.trim() || "India";
      const coords = resolvePostalCoordinates(input.pincode, resolvedCity);
      await tx
        .insert(schema.areas)
        .values({
          pincode: input.pincode,
          locality: resolvedLocality,
          city: resolvedCity,
          lat: coords.lat.toFixed(4),
          lng: coords.lng.toFixed(4),
        })
        .onConflictDoNothing();
    }

    const [identifier] = await tx
      .insert(schema.identifiers)
      .values({
        identifierType: input.identifier_type,
        normalizedValue: input.normalized_value,
      })
      .onConflictDoUpdate({
        target: [schema.identifiers.identifierType, schema.identifiers.normalizedValue],
        set: { normalizedValue: sql`excluded.normalized_value` },
      })
      .returning({ id: schema.identifiers.id });

    const [caseRow] = await tx
      .insert(schema.cases)
      .values({ identifierId: identifier.id })
      .onConflictDoUpdate({
        target: schema.cases.identifierId,
        set: { identifierId: sql`excluded.identifier_id` },
      })
      .returning({ id: schema.cases.id });

    await tx.execute(sql`SELECT id FROM cases WHERE id = ${caseRow.id} FOR UPDATE`);

    // Serialize this reporter's velocity check across different cases.
    await tx.execute(sql`
      SELECT pg_advisory_xact_lock(hashtextextended(${signals.reporterHmac}, 160183))
    `);

    const [reporter] = await tx
      .insert(schema.reporterSignals)
      .values({ reporterHmac: signals.reporterHmac })
      .onConflictDoUpdate({
        target: schema.reporterSignals.reporterHmac,
        set: { reporterHmac: sql`excluded.reporter_hmac` },
      })
      .returning({ id: schema.reporterSignals.id });

    const [velocity] = await tx.execute(sql`
      WITH receipt AS MATERIALIZED (SELECT clock_timestamp() AS received_at)
      SELECT count(*)::int AS count
      FROM reports, receipt
      WHERE reporter_signal_id = ${reporter.id}
        AND created_at >= (receipt.received_at - interval '1 hour')
        AND created_at <= receipt.received_at
    `);
    if (Number(velocity.count) >= 3) {
      throw new ReportRateLimitError();
    }

    const [report] = await tx.execute(sql`
      INSERT INTO reports(
        report_id, case_id, reporter_signal_id, ip_prefix_hmac,
        occurred_at, reported_at, pincode, scam_type, channel,
        sanitized_note, has_screenshot, amount_lost_inr, created_at
      ) VALUES (
        ${input.report_id}, ${caseRow.id}, ${reporter.id}, ${signals.ipPrefixHmac},
        ${input.occurred_at}, ${input.reported_at}, ${input.pincode}, ${input.scam_type},
        ${input.channel}, ${input.sanitized_note}, ${input.has_screenshot},
        ${input.amount_lost_inr.toFixed(2)}, clock_timestamp()
      )
      RETURNING id
    `);

    await tx.execute(sql`
      INSERT INTO trust_decisions(report_id) VALUES(${report.id})
    `);
    const reportRows = await tx.execute(sql`
      SELECT
        r.id, r.report_id, r.occurred_at, r.sanitized_note, r.has_screenshot,
        s.reporter_hmac, r.ip_prefix_hmac
      FROM reports r
      JOIN reporter_signals s ON s.id = r.reporter_signal_id
      WHERE r.case_id = ${caseRow.id}
      ORDER BY r.occurred_at ASC, r.id ASC
    `) as unknown as Array<{
      id: string;
      report_id: string;
      occurred_at: string;
      sanitized_note: string;
      has_screenshot: boolean;
      reporter_hmac: string;
      ip_prefix_hmac: string;
    }>;
    const [subject] = await tx.execute(sql`
      SELECT
        EXISTS (
          SELECT 1 FROM verified_identifiers v
          WHERE v.identifier_id = ${identifier.id}
        ) AS verified_business,
        EXISTS (
          SELECT 1 FROM challenges ch
          WHERE ch.identifier_id = ${identifier.id}
            AND ch.status = 'under_review'
        ) AS challenged
    `) as unknown as Array<{ verified_business: boolean; challenged: boolean }>;
    const evaluation = evaluateTrust(
      reportRows.map((row) => ({
        reportId: row.report_id,
        reporterKey: row.reporter_hmac,
        ipPrefixKey: row.ip_prefix_hmac,
        occurredAt: row.occurred_at,
        note: row.sanitized_note,
        hasScreenshot: row.has_screenshot,
        valid: true,
        duplicate: false,
      })),
      {
        verifiedBusiness: subject?.verified_business ?? false,
        challenged: subject?.challenged ?? false,
      },
    );
    const decisions = new Map(evaluation.reportDecisions.map((decision) => [decision.reportId, decision]));
    for (const row of reportRows) {
      const decision = decisions.get(row.report_id);
      if (!decision) continue;
      await tx.execute(sql`
        UPDATE trust_decisions
        SET status = ${decision.status},
            weight = ${decision.weight.toFixed(4)},
            reason_code = ${decision.reasons.join(" ") || "not_eligible"},
            algorithm_version = 'phase5-v1',
            decided_at = now()
        WHERE report_id = ${row.id}
      `);
    }
    await tx.execute(sql`
      INSERT INTO case_statistics(
        case_id, raw_report_count, distinct_reporter_count,
        independent_trusted_reporter_count, eligible_report_count
      )
      SELECT
        ${caseRow.id},
        count(*)::int,
        count(DISTINCT reporter_signal_id)::int,
        count(DISTINCT reporter_signal_id) FILTER (WHERE EXISTS (
          SELECT 1 FROM trust_decisions td2
          WHERE td2.report_id = reports.id AND td2.status = 'eligible'
        ))::int,
        count(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM trust_decisions td3
          WHERE td3.report_id = reports.id AND td3.status = 'eligible'
        ))::int
      FROM reports
      WHERE case_id = ${caseRow.id}
      ON CONFLICT(case_id) DO UPDATE SET
        raw_report_count = excluded.raw_report_count,
        distinct_reporter_count = excluded.distinct_reporter_count,
        independent_trusted_reporter_count = (
          SELECT count(DISTINCT r2.reporter_signal_id)::int
          FROM reports r2
          JOIN trust_decisions td2 ON td2.report_id = r2.id
          WHERE r2.case_id = ${caseRow.id} AND td2.status = 'eligible'
        ),
        eligible_report_count = (
          SELECT count(*)::int
          FROM reports r3
          JOIN trust_decisions td3 ON td3.report_id = r3.id
          WHERE r3.case_id = ${caseRow.id} AND td3.status = 'eligible'
        ),
        updated_at = now()
    `);

    return {
      reportId: input.report_id,
      caseId: caseRow.id,
      merged: false,
      duplicate: false,
    };
  });
}
