import { config } from "dotenv";
config();

import { ingestReport } from "../src/modules/reports/reports.service.js";
import { getDb } from "../src/db/client.js";
import { getMapData } from "../src/modules/geo/map.service.js";

async function main() {
  const now = new Date();
  const occurredAt = new Date(now.getTime() - 1000 * 60 * 15).toISOString(); // 15 mins ago
  const reportedAt = now.toISOString();

  // Synthetic report definition following strict constraints:
  // - Area: HSR Layout, Bengaluru (560102)
  // - Scam category: upi-refund-qr
  // - Description: Fictional message asking recipient to scan QR code to receive refund
  // - Fully fictional identifier using reserved example namespace
  // - Identified with "demo-" prefix recognised by cleanup-demo-data.ts
  const syntheticReportPayload = {
    report_id: `demo-synthetic-hsr-upi-${Date.now()}`,
    occurred_at: occurredAt,
    reported_at: reportedAt,
    reporter_id: "demo-reporter-synthetic-hsr-001",
    ip_prefix: "198.51.100.0/24", // RFC 5737 TEST-NET-2 documentation subnet
    channel: "QR code" as const,
    scam_type: "upi-refund-qr",
    identifier_type: "upi" as const,
    identifier_value: "fictional.refund.sample@exampleupi",
    pincode: "560102",
    locality: "HSR Layout",
    city: "Bengaluru",
    note: "A fictional message asks the recipient to scan a QR code to receive a refund. Scanning it may instead initiate a payment. [SYNTHETIC DEMO ENTRY]",
    has_screenshot: false,
    amount_lost_inr: 0,
  };

  console.log("=== INGESTING SYNTHETIC REPORT VIA PRODUCTION INGESTION PIPELINE ===");
  console.log("Payload:", JSON.stringify(syntheticReportPayload, null, 2));

  // 1. Ingest via the existing service and persistence pipeline
  const stored = await ingestReport(syntheticReportPayload);
  console.log("\nIngestion Result:", stored);

  // 2. Query database record and trust decision
  const client = getDb();
  const [reportRecord] = await client.sql`
    SELECT
      r.id,
      r.report_id,
      r.pincode,
      r.scam_type,
      r.channel,
      r.sanitized_note,
      r.amount_lost_inr,
      r.created_at,
      i.identifier_type,
      i.normalized_value,
      td.status AS trust_status,
      td.weight AS trust_weight,
      td.reason_code AS trust_reason_code,
      td.algorithm_version,
      td.decided_at
    FROM reports r
    JOIN cases c ON c.id = r.case_id
    JOIN identifiers i ON i.id = c.identifier_id
    LEFT JOIN trust_decisions td ON td.report_id = r.id
    WHERE r.report_id = ${syntheticReportPayload.report_id}
  `;

  console.log("\n=== DATABASE RECORD INSERTED ===");
  console.log(JSON.stringify(reportRecord, null, 2));

  // 3. Query GET /map for HSR Layout
  console.log("\n=== QUERYING MAP INTELLIGENCE (GET /map) FOR HSR LAYOUT ===");
  const mapData = await getMapData({
    pincode: "560102",
    days: 7,
    radiusKm: 2,
  });

  const matchingCluster = mapData.clusters.find((c) => c.pincode === "560102");
  console.log("Map Query Success:", mapData.success);
  console.log("Map Total Reports in Area:", mapData.total_reports);
  console.log("HSR Layout Cluster:", matchingCluster ?? "NO CLUSTER (Area clear of eligible clusters)");

  const appearsOnMap = Boolean(matchingCluster);
  console.log("\nDoes report appear on public map?", appearsOnMap);

  if (!appearsOnMap) {
    console.log(
      "\nExplanation of Trust Engine Decision:\n" +
      `Trust Status: '${reportRecord.trust_status}'\n` +
      `Reason: '${reportRecord.trust_reason_code}'\n` +
      "The trust engine deliberately requires a minimum of 5 independent reporters and 3 independent IP prefixes spanning multiple time buckets before any identifier is classified as KNOWN_SCAM or included in public map cluster aggregations (td.status = 'eligible'). " +
      "A single uncorroborated report is safely stored in the database with status 'ignored', preventing competitor-bombing or single-voice map manipulation."
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Failed to ingest synthetic report:", err);
  process.exit(1);
});

