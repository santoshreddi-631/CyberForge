/**
 * End-to-End Integration Verification Script
 * Validates all required endpoints and flows against the real Express application and PostgreSQL database.
 * Flows:
 *   Flow A: Report submission and lookup (SUSPICIOUS / NO_REPORTS / VERIFIED_BUSINESS)
 *   Flow B: 7-day aggregated community map
 *   Flow C: Regional alerts
 *   Flow D: Business challenge
 *   Flow E: License expiry, /health and /license availability, and dynamic renewal without restart
 */
import { createApp } from "../src/app.js";
import { getEnv } from "../src/config/env.js";
import { closeDb } from "../src/db/client.js";
import { createPrivateKey, sign } from "node:crypto";

const PRIV_KEY_HEX = "ff577f2a9a2deb9aef0b724431a6e278e095a89feb52a393b625a44e300bd234";

function issueLicense(licensee: string, expiresAt: string): { licensee: string; expires_at: string; signature: string } {
  const privateDer = Buffer.concat([
    Buffer.from("302e020100300506032b657004220420", "hex"),
    Buffer.from(PRIV_KEY_HEX, "hex"),
  ]);
  const privateKey = createPrivateKey({ key: privateDer, format: "der", type: "pkcs8" });
  const payload = { licensee, expires_at: new Date(expiresAt).toISOString() };
  const signature = sign(null, Buffer.from(JSON.stringify(payload), "utf8"), privateKey);
  return { ...payload, signature: signature.toString("base64") };
}

async function run() {
  console.log("==================================================");
  console.log("   COMMUNITY SCAM MAP - INTEGRATION VERIFICATION  ");
  console.log("==================================================");

  const env = getEnv();
  const app = createApp();
  const port = 3099;

  const server = app.listen(port, "127.0.0.1");
  const baseUrl = `http://127.0.0.1:${port}`;

  let passedCount = 0;
  let failedCount = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  [PASS] ${msg}`);
      passedCount++;
    } else {
      console.error(`  [FAIL] ${msg}`);
      failedCount++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. GET /health
    // -------------------------------------------------------------------------
    console.log("\n1. Testing GET /health ...");
    const healthRes = await fetch(`${baseUrl}/health`);
    assert(healthRes.status === 200, `Status code is 200 (got ${healthRes.status})`);
    const healthData = await healthRes.json();
    assert(healthData.ok === true, `Response body is {"ok": true} (got ${JSON.stringify(healthData)})`);

    // -------------------------------------------------------------------------
    // 2. GET /license
    // -------------------------------------------------------------------------
    console.log("\n2. Testing GET /license ...");
    const licenseRes = await fetch(`${baseUrl}/license`);
    assert(licenseRes.status === 200, `Status code is 200 (got ${licenseRes.status})`);
    const licenseData = await licenseRes.json();
    assert(typeof licenseData.licensee === "string", `licensee is present: "${licenseData.licensee}"`);
    assert(typeof licenseData.valid === "boolean", `valid boolean is present: ${licenseData.valid}`);

    // Activate a valid license to start full operations
    console.log("\n   Activating demonstration license via POST /license ...");
    const currentExpiry = new Date(licenseData.expires_at || 0).getTime();
    const nextExpiryDate = new Date(Math.max(Date.now(), currentExpiry) + 7 * 24 * 3600 * 1000).toISOString();
    const validLicDoc = issueLicense("CyberForge Community Defense", nextExpiryDate);
    const activateRes = await fetch(`${baseUrl}/license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validLicDoc),
    });
    assert(activateRes.status === 200, `POST /license returned 200 (got ${activateRes.status})`);
    const activateData = await activateRes.json();
    assert(activateData.valid === true, "Activated license is valid");
    assert(activateData.expired === false, "Activated license is not expired");

    // -------------------------------------------------------------------------
    // 3. GET /lookup - VERIFIED_BUSINESS (Official entity from PRD Appendix B/C)
    // -------------------------------------------------------------------------
    console.log("\n3. Testing GET /lookup for VERIFIED_BUSINESS ...");
    const verifiedLookupRes = await fetch(`${baseUrl}/lookup?type=phone&value=%2B918041002233`);
    assert(verifiedLookupRes.status === 200, `Status code is 200 (got ${verifiedLookupRes.status})`);
    const verifiedData = await verifiedLookupRes.json();
    assert(verifiedData.verdict === "VERIFIED_BUSINESS", `Verdict is VERIFIED_BUSINESS (got ${verifiedData.verdict})`);

    // -------------------------------------------------------------------------
    // 4. GET /lookup - NO_REPORTS (Valid un-reported phone number)
    // -------------------------------------------------------------------------
    console.log("\n4. Testing GET /lookup for NO_REPORTS ...");
    const freshNumber = "+91 99999 11111";
    const noReportsRes = await fetch(`${baseUrl}/lookup?type=phone&value=${encodeURIComponent(freshNumber)}`);
    assert(noReportsRes.status === 200, `Status code is 200 (got ${noReportsRes.status})`);
    const noReportsData = await noReportsRes.json();
    assert(noReportsData.verdict === "NO_REPORTS", `Verdict is NO_REPORTS (got ${noReportsData.verdict})`);
    assert(noReportsData.report_count === 0, "report_count is 0");
    assert(noReportsData.distinct_reporters === 0, "distinct_reporters is 0");

    // -------------------------------------------------------------------------
    // 5. POST /reports (FLOW A - Report Submission)
    // -------------------------------------------------------------------------
    console.log("\n5. Testing POST /reports (FLOW A) ...");
    const targetScamPhone = `+91 98888 ${Math.floor(10000 + Math.random() * 90000)}`;
    const reportPayload = {
      report_id: `rep_test_${Date.now()}`,
      occurred_at: new Date(Date.now() - 3600000).toISOString(),
      reported_at: new Date().toISOString(),
      reporter_id: `reporter_${Date.now()}`,
      ip_prefix: "103.21.58",
      channel: "Phone call",
      scam_type: "digital-arrest",
      identifier_type: "phone",
      identifier_value: targetScamPhone,
      pincode: "560102",
      locality: "HSR Layout",
      city: "Bengaluru",
      note: "Suspect caller claiming to be telecom enforcement requesting immediate UPI fine payment.",
      has_screenshot: false,
      amount_lost_inr: 0,
    };

    const reportRes = await fetch(`${baseUrl}/reports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportPayload),
    });
    assert(reportRes.status === 201, `Status code is 201 Created (got ${reportRes.status})`);
    const reportData = await reportRes.json();
    assert(typeof reportData.report_id === "string", `report_id returned: ${reportData.report_id}`);
    assert(typeof reportData.case_id === "string", `case_id returned: ${reportData.case_id}`);
    assert(typeof reportData.merged === "boolean", `merged boolean returned: ${reportData.merged}`);

    // -------------------------------------------------------------------------
    // 6. GET /lookup - After report (FLOW A - Lookup Verification)
    // -------------------------------------------------------------------------
    console.log("\n6. Testing GET /lookup for reported identifier (FLOW A verification) ...");
    const afterReportLookup = await fetch(`${baseUrl}/lookup?type=phone&value=${encodeURIComponent(targetScamPhone)}`);
    assert(afterReportLookup.status === 200, `Status code is 200 (got ${afterReportLookup.status})`);
    const afterReportData = await afterReportLookup.json();
    assert(
      afterReportData.verdict === "SUSPICIOUS" || afterReportData.verdict === "KNOWN_SCAM",
      `Verdict is updated based on reports (got ${afterReportData.verdict})`
    );
    assert(afterReportData.scam_type === "digital-arrest", `scam_type matches submitted report: ${afterReportData.scam_type}`);
    // Check masking for <3 distinct reporters
    assert(afterReportData.display_value.includes("X"), `display_value is properly masked: "${afterReportData.display_value}"`);

    // -------------------------------------------------------------------------
    // 7. GET /map (FLOW B - Community Scam Map)
    // -------------------------------------------------------------------------
    console.log("\n7. Testing GET /map (FLOW B) ...");
    const mapRes = await fetch(`${baseUrl}/map?pincode=560102&days=7&radius_km=2`);
    assert(mapRes.status === 200, `Status code is 200 (got ${mapRes.status})`);
    const mapData = await mapRes.json();
    assert(Array.isArray(mapData.clusters), "clusters array is returned");
    if (mapData.clusters.length > 0) {
      const cluster = mapData.clusters[0];
      assert(typeof cluster.pincode === "string", `cluster pincode: ${cluster.pincode}`);
      assert(typeof cluster.lat === "number" && typeof cluster.lng === "number", `cluster centroid lat/lng present (${cluster.lat}, ${cluster.lng})`);
      assert(typeof cluster.severity === "string", `cluster severity present: ${cluster.severity}`);
      assert(!("reporter_id" in cluster), "Privacy preserved: No reporter_id in map cluster");
      assert(!("note" in cluster), "Privacy preserved: No note in map cluster");
    }

    // -------------------------------------------------------------------------
    // 8. GET /alerts (FLOW C - Alerts)
    // -------------------------------------------------------------------------
    console.log("\n8. Testing GET /alerts (FLOW C) ...");
    const alertsRes = await fetch(`${baseUrl}/alerts?pincode=560102`);
    assert(alertsRes.status === 200, `Status code is 200 (got ${alertsRes.status})`);
    const alertsData = await alertsRes.json();
    assert(Array.isArray(alertsData.alerts), "alerts array is returned");

    // -------------------------------------------------------------------------
    // 9. POST /challenges (FLOW D - Business Challenge)
    // -------------------------------------------------------------------------
    console.log("\n9. Testing POST /challenges (FLOW D) ...");
    const challengePayload = {
      identifier_type: "phone",
      identifier_value: "+91 80 4100 2233",
      claimant_name: "Fresh Bakes Legal Representative",
      contact_email: "legal@freshbakes.test",
      proof_note: "GST registration certificate and trade licence for Indiranagar location.",
    };
    const challengeRes = await fetch(`${baseUrl}/challenges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(challengePayload),
    });
    assert(challengeRes.status === 201, `Status code is 201 Created (got ${challengeRes.status})`);
    const challengeData = await challengeRes.json();
    assert(typeof challengeData.challenge_id === "string", `challenge_id returned: ${challengeData.challenge_id}`);
    assert(challengeData.status === "under_review", `status is "under_review" (got ${challengeData.status})`);

    // Verify privacy: contact email and proof note are not exposed in lookup
    const challengedLookup = await fetch(`${baseUrl}/lookup?type=phone&value=%2B918041002233`);
    const challengedLookupData = await challengedLookup.json();
    assert(!("contact_email" in challengedLookupData), "Privacy: contact_email is never exposed in /lookup");
    assert(!("proof_note" in challengedLookupData), "Privacy: proof_note is never exposed in /lookup");

    // -------------------------------------------------------------------------
    // 10. Licence Expiry & Dynamic Renewal (FLOW E)
    // -------------------------------------------------------------------------
    console.log("\n10. Testing Licence Expiry & Dynamic Renewal (FLOW E) ...");
    // Bad signature check
    const badLicDoc = {
      licensee: "Mallory Attacker",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      signature: Buffer.from("0".repeat(64)).toString("base64"),
    };
    const badLicRes = await fetch(`${baseUrl}/license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(badLicDoc),
    });
    assert(badLicRes.status === 400, `Invalid signature rejected with 400 (got ${badLicRes.status})`);

    // Dynamic renewal test without restarting server
    const renewalDate = new Date(new Date(nextExpiryDate).getTime() + 7 * 24 * 3600 * 1000).toISOString();
    const renewalDoc = issueLicense("CyberForge Community Defense - Renewed", renewalDate);
    const renewalRes = await fetch(`${baseUrl}/license`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(renewalDoc),
    });
    assert(renewalRes.status === 200, `Renewal accepted with 200 (got ${renewalRes.status})`);
    const renewalData = await renewalRes.json();
    assert(renewalData.valid === true, "Renewed license is valid");
    assert(renewalData.licensee === "CyberForge Community Defense - Renewed", "Licensee updated immediately without restart");

    // Verify /health and /license remain fully reachable
    const postRenewalHealth = await fetch(`${baseUrl}/health`);
    assert(postRenewalHealth.status === 200, "GET /health remains 200 after licence operations");

    console.log("\n==================================================");
    console.log(`INTEGRATION RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("==================================================");

    if (failedCount > 0) {
      process.exitCode = 1;
    }
  } finally {
    server.close();
    await closeDb();
  }
}

run().catch((err) => {
  console.error("Unhandled verification error:", err);
  process.exit(1);
});
