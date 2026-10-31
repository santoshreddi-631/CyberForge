import { expect, it, beforeAll } from "vitest";
import request from "supertest";
import { databaseDescription, markReportsEligible, prepareHarness, signLicense } from "./harness.js";
import { resetLicenseCache } from "../../src/modules/licensing/license.service.js";

databaseDescription("Phase 11 backend integration", () => {
  let app: ReturnType<typeof import("../../src/app.js").createApp>;
  let client: Awaited<ReturnType<typeof prepareHarness>>["client"];

  beforeAll(async () => {
    ({ app, client } = await prepareHarness());
  }, 30000);

  it("exercises identifier validation, report idempotency, lookup verdicts, and privacy masking", async () => {
    const invalid = await request(app).get("/lookup").query({ type: "phone", value: "12345" });
    expect(invalid.status).toBe(400);

    const unknown = await request(app).get("/lookup").query({ type: "phone", value: "+91 98765 43210" });
    expect(unknown.status).toBe(200);
    expect(unknown.body.verdict).toBe("NO_REPORTS");

    const report = {
      report_id: "phase11-idempotent-1",
      occurred_at: new Date(Date.now() - 60_000).toISOString(),
      reported_at: new Date().toISOString(),
      reporter_id: "phase11-reporter-1",
      ip_prefix: "198.51.100.0/24",
      channel: "Phone call",
      scam_type: "fake-customer-care",
      identifier_type: "phone",
      identifier_value: "+91 98765 43210",
      pincode: "560102",
      locality: "HSR Layout",
      city: "Bengaluru",
      note: "The caller requested an urgent transfer.",
      has_screenshot: false,
      amount_lost_inr: 0,
    };
    const first = await request(app).post("/reports").send(report);
    const duplicate = await request(app).post("/reports").send(report);
    expect(first.status).toBe(201);
    expect(duplicate.status).toBe(201);
    expect(duplicate.body).toMatchObject({ report_id: report.report_id, merged: true });

    await markReportsEligible(client, first.body.case_id);
    const suspicious = await request(app).get("/lookup").query({ type: "phone", value: "09876543210" });
    expect(suspicious.body.verdict).toBe("SUSPICIOUS");
    expect(suspicious.body.display_value).toBe("98XXXXX210");
    expect(suspicious.body).not.toHaveProperty("reporter_id");
    expect(JSON.stringify(suspicious.body)).not.toContain("urgent transfer");
  });

  it("returns verified, known-scam, challenged, and no-report verdicts", async () => {
    const verified = await request(app).get("/lookup").query({ type: "phone", value: "1930" });
    expect(verified.body.verdict).toBe("VERIFIED_BUSINESS");

    const identifier = "+919876543211";
    let caseId = "";
    for (let index = 0; index < 5; index += 1) {
      const response = await request(app).post("/reports").send({
        report_id: `phase11-known-${index}`,
        occurred_at: new Date(Date.now() - (index + 1) * 3_600_000).toISOString(),
        reported_at: new Date().toISOString(),
        reporter_id: `independent-${index}`,
        ip_prefix: `203.0.${index}.0/24`,
        channel: "Phone call",
        scam_type: "fake-customer-care",
        identifier_type: "phone",
        identifier_value: identifier,
        pincode: "560102",
        locality: "HSR Layout",
        city: "Bengaluru",
        note: `Independent account ${index} reports a payment request.`,
        has_screenshot: false,
        amount_lost_inr: 0,
      });
      expect(response.status).toBe(201);
      caseId = response.body.case_id;
    }
    await markReportsEligible(client, caseId);
    const known = await request(app).get("/lookup").query({ type: "phone", value: identifier });
    expect(known.body.verdict).toBe("KNOWN_SCAM");

    const challenge = await request(app).post("/challenges").send({
      identifier_type: "phone",
      identifier_value: identifier,
      claimant_name: "Test business",
      contact_email: "owner@example.test",
      proof_note: "Business registration proof",
    });
    expect(challenge.status).toBe(201);
    expect(challenge.body).toMatchObject({ status: "under_review" });
    const duplicateChallenge = await request(app).post("/challenges").send({
      identifier_type: "phone",
      identifier_value: "09876543211",
      claimant_name: "Test business duplicate",
      contact_email: "other@example.test",
      proof_note: "Additional proof",
    });
    expect(duplicateChallenge.status).toBe(201);
    expect(duplicateChallenge.body.challenge_id).toBe(challenge.body.challenge_id);
    const challenged = await request(app).get("/lookup").query({ type: "phone", value: identifier });
    expect(challenged.body.challenged).toBe(true);
    expect(challenged.body.verdict).not.toBe("KNOWN_SCAM");
  });

  it("aggregates trusted map data and deterministic alerts", async () => {
    const base = Date.now();
    for (let index = 0; index < 5; index += 1) {
      const occurred = new Date(base - index * 60_000);
      const response = await request(app).post("/reports").send({
        report_id: `phase11-alert-${index}`,
        occurred_at: occurred.toISOString(),
        reported_at: new Date(base).toISOString(),
        reporter_id: `alert-reporter-${index}`,
        ip_prefix: `192.0.2.${index}/24`,
        channel: "SMS or WhatsApp",
        scam_type: "job-offer",
        identifier_type: "sender_id",
        identifier_value: "VM-AXISBK",
        pincode: "560102",
        locality: "HSR Layout",
        city: "Bengaluru",
        note: `A distinct alert report ${index}.`,
        has_screenshot: false,
        amount_lost_inr: 0,
      });
      expect(response.status).toBe(201);
    }
    await markReportsEligible(client);
    const map = await request(app).get("/map").query({ pincode: "560102", days: 7, radius_km: 2 });
    expect(map.status).toBe(200);
    expect(map.body.clusters[0]).toMatchObject({ pincode: "560102", lat: 12.9116, lng: 77.6473 });
    const alerts = await request(app).get("/alerts").query({ pincode: "560102" });
    expect(alerts.status).toBe(200);
    expect(alerts.body.alerts.some((alert: { type: string }) => alert.type === "SPIKE")).toBe(true);
    expect(alerts.body.alerts.some((alert: { type: string }) => alert.type === "NEW_TYPE")).toBe(true);
  });

  it("renews a licence and resets derived state while preserving reference data", async () => {
    process.env.LICENSE_ENFORCEMENT_TEST = "1";
    const expired = signLicense(new Date(Date.now() - 60_000).toISOString());
    await client.sql`UPDATE license_state SET expires_at = ${expired.expires_at}::timestamptz, signature = ${expired.signature}`;
    resetLicenseCache();
    const blocked = await request(app).get("/lookup").query({ type: "phone", value: "1930" });
    expect(blocked.status).toBe(403);
    expect(blocked.body).toEqual({ error: "LICENSE_EXPIRED" });
    expect((await request(app).get("/health")).status).toBe(200);
    expect((await request(app).get("/license")).status).toBe(200);

    const renewed = signLicense(new Date(Date.now() + 86_400_000).toISOString());
    const renewal = await request(app).post("/license").send(renewed);
    expect(renewal.status).toBe(200);
    expect(renewal.body.valid).toBe(true);
    const reset = await request(app).post("/admin/reset").send({});
    expect(reset.status).toBe(200);
    expect(reset.body.deleted).toBeGreaterThan(0);
    expect((await client.sql`SELECT count(*)::int AS count FROM areas`)[0].count).toBe(25);
    expect((await client.sql`SELECT count(*)::int AS count FROM verified_identifiers`)[0].count).toBe(19);
    expect((await client.sql`SELECT count(*)::int AS count FROM license_state`)[0].count).toBe(1);
    delete process.env.LICENSE_ENFORCEMENT_TEST;
  });
});
