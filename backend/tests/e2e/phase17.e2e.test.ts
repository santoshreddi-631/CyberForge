import { randomInt, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it } from "vitest";
import { resetDerivedState } from "../../src/modules/admin/reset.service.js";
import { createClient } from "../../src/db/client.js";
import { databaseDescription, prepareHarness, signLicense } from "./harness.js";

function generatedPhone(): string {
  return `+91${randomInt(6, 10)}${Array.from({ length: 9 }, () => randomInt(0, 10)).join("")}`;
}

databaseDescription("Phase 17 API correctness and end-to-end verification", () => {
  let app: ReturnType<typeof import("../../src/app.js").createApp>;
  let client: Awaited<ReturnType<typeof prepareHarness>>["client"];
  let runtimeClient: ReturnType<typeof createClient>;

  beforeAll(async () => {
    ({ app, client, runtimeClient } = await prepareHarness());
  }, 30_000);

  beforeEach(async () => {
    await resetDerivedState(client);
  });

  afterAll(async () => {
    if (runtimeClient) await runtimeClient.sql.end({ timeout: 5 });
  });

  it("qualifies clean, independent POST /reports and drives lookup, map and alerts without SQL promotion", async () => {
    expect(Number((await client.sql`SELECT count(*)::int AS count FROM reports`)[0].count)).toBe(0);
    expect((await request(app).get("/health")).body).toEqual({ ok: true });
    const identifier = generatedPhone();
    const baseTime = Date.now();
    const outcomes = [];

    for (let index = 0; index < 7; index += 1) {
      const occurredAt = new Date(baseTime - (index < 4 ? 2 : 1) * 60 * 60 * 1000).toISOString();
      outcomes.push(await request(app).post("/reports").send({
        report_id: `phase17-${randomUUID()}`,
        occurred_at: occurredAt,
        reported_at: new Date(baseTime).toISOString(),
        reporter_id: `phase17-reporter-${randomUUID()}`,
        ip_prefix: `phase17-network-${randomUUID()}`,
        channel: "Phone call",
        scam_type: "fake-customer-care",
        identifier_type: "phone",
        identifier_value: identifier,
        pincode: "560102",
        locality: "HSR Layout",
        city: "Bengaluru",
        note: `A distinct caller described a payment request with individual details ${randomUUID()}.`,
        has_screenshot: false,
        amount_lost_inr: 0,
      }));
    }

    expect(outcomes.map((result) => result.status)).toEqual(Array(7).fill(201));
    expect(Object.keys(outcomes[0].body).sort()).toEqual(["case_id", "merged", "report_id"]);
    const stats = await client.sql`
      SELECT count(*)::int AS raw_count,
        count(*) FILTER (WHERE td.status = 'eligible')::int AS eligible_count
      FROM reports r JOIN trust_decisions td ON td.report_id = r.id
    `;
    expect(stats[0]).toMatchObject({ raw_count: 7, eligible_count: 7 });

    const lookup = await request(app).get("/lookup").query({ type: "phone", value: identifier });
    expect(lookup.status).toBe(200);
    expect(Object.keys(lookup.body).sort()).toEqual([
      "challenged", "display_value", "distinct_reporters", "evidence", "first_seen", "last_seen",
      "report_count", "scam_type", "verdict",
    ]);
    expect(lookup.body).toMatchObject({
      verdict: "KNOWN_SCAM", report_count: 7, distinct_reporters: 7,
      display_value: identifier, challenged: false,
    });
    expect(lookup.body.evidence).toHaveLength(7);
    expect(lookup.body.evidence[0]).toEqual(expect.objectContaining({
      occurred_at: expect.any(String), channel: "Phone call", scam_type: "fake-customer-care", pincode: "560102",
    }));

    const map = await request(app).get("/map").query({ pincode: "560102", days: 7, radius_km: 0 });
    expect(map.status).toBe(200);
    expect(Object.keys(map.body).sort()).toEqual(["clusters"]);
    expect(map.body.clusters).toEqual([expect.objectContaining({
      pincode: "560102", locality: "HSR Layout", city: "Bengaluru", count: 7,
      lat: 12.9116, lng: 77.6473,
    })]);

    const alerts = await request(app).get("/alerts").query({ pincode: "560102" });
    expect(alerts.status).toBe(200);
    expect(Object.keys(alerts.body).sort()).toEqual(["alerts"]);
    expect(alerts.body.alerts).toContainEqual(expect.objectContaining({ type: "SPIKE", count: 7 }));
    expect(alerts.body.alerts).toContainEqual(expect.objectContaining({
      type: "NEW_TYPE", scam_type: "fake-customer-care",
    }));

    const challenge = await request(app).post("/challenges").send({
      identifier_type: "phone", identifier_value: generatedPhone(),
      claimant_name: `Phase 17 ${randomUUID()}`, contact_email: `phase17-${randomUUID()}@example.test`,
      proof_note: `A valid private challenge detail ${randomUUID()}`,
    });
    expect(challenge.status).toBe(201);
    expect(Object.keys(challenge.body).sort()).toEqual(["challenge_id", "status"]);

    const licence = await request(app).get("/license");
    expect(licence.status).toBe(200);
    expect(Object.keys(licence.body).sort()).toEqual(["expired", "expires_at", "licensee", "valid"]);
    const renewedLicence = await request(app).post("/license").send(signLicense(
      new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    ));
    expect(renewedLicence.status).toBe(200);
    expect(renewedLicence.body.valid).toBe(true);

    const reset = await request(app).post("/admin/reset").send({});
    expect(reset.status).toBe(200);
    expect(Object.keys(reset.body).sort()).toEqual(["deleted"]);
  });

  it("runs the API as a non-owner role that can insert but cannot read restricted challenge contacts", async () => {
    const role = await runtimeClient.sql`
      SELECT current_user AS role, r.rolsuper AS is_superuser, r.rolinherit AS inherits_roles,
        EXISTS (
          SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = 'public' AND c.relname = 'reports'
            AND pg_get_userbyid(c.relowner) = current_user
        ) AS owns_reports,
        has_table_privilege(current_user, 'restricted.challenge_contacts', 'SELECT') AS can_select,
        has_table_privilege(current_user, 'restricted.challenge_contacts', 'INSERT') AS can_insert,
        has_table_privilege(current_user, 'restricted.challenge_contacts', 'DELETE') AS can_delete
      FROM pg_roles r WHERE r.rolname = current_user
    `;
    expect(role[0]).toMatchObject({
      role: "community_scam_runtime_test", is_superuser: false, inherits_roles: false, owns_reports: false,
      can_select: false, can_insert: true, can_delete: false,
    });
    await expect(runtimeClient.sql`SELECT claimant_name FROM restricted.challenge_contacts LIMIT 1`)
      .rejects.toThrow(/permission denied/u);

    const phone = generatedPhone();
    const contact = `phase17-private-${randomUUID()}@example.test`;
    const challenge = await request(app).post("/challenges").send({
      identifier_type: "phone", identifier_value: phone,
      claimant_name: `Claimant ${randomUUID()}`, contact_email: contact, proof_note: `Proof ${randomUUID()}`,
    });
    expect(challenge.status).toBe(201);
    expect(JSON.stringify(challenge.body)).not.toContain(contact);
    const stored = await client.sql`
      SELECT contact_email FROM restricted.challenge_contacts WHERE challenge_id = ${challenge.body.challenge_id}
    `;
    expect(stored[0].contact_email).toBe(contact);
  });

  it("captures production-mode HTTP logs without reporter, location, note, lookup or claimant secrets", () => {
    const id = randomUUID();
    const markers = {
      phone: generatedPhone(),
      reporter: `phase17-log-reporter-${id}`,
      prefix: `phase17-log-prefix-${id}`,
      note: `phase17-log-note-${id}`,
      contactName: `phase17-log-claimant-${id}`,
      contactEmail: `phase17-log-contact-${id}@example.test`,
      proof: `phase17-log-proof-${id}`,
    };
    const fixturePath = fileURLToPath(new URL("../fixtures/production-log-probe.ts", import.meta.url));
    const tsxCli = fileURLToPath(new URL("../../node_modules/tsx/dist/cli.mjs", import.meta.url));
    const child = spawnSync(process.execPath, [tsxCli, fixturePath], {
      cwd: fileURLToPath(new URL("../..", import.meta.url)),
      encoding: "utf8",
      timeout: 30_000,
      env: {
        ...process.env,
        NODE_ENV: "production",
        LOG_LEVEL: "info",
        PHASE17_LOG_PHONE: markers.phone,
        PHASE17_LOG_REPORTER: markers.reporter,
        PHASE17_LOG_PREFIX: markers.prefix,
        PHASE17_LOG_NOTE: markers.note,
        PHASE17_LOG_CONTACT_NAME: markers.contactName,
        PHASE17_LOG_CONTACT_EMAIL: markers.contactEmail,
        PHASE17_LOG_PROOF: markers.proof,
      },
    });
    const logs = `${child.stdout ?? ""}\n${child.stderr ?? ""}`;
    expect(child.status, logs).toBe(0);
    expect(logs).toContain('"env":"production"');
    for (const secret of Object.values(markers)) expect(logs).not.toContain(secret);
    expect(logs).toContain("[Redacted]");
    expect(logs).toContain("/lookup?type=phone&value=[Redacted]");
  });

  it("returns the documented 400 errors without echoing invalid identifier values", async () => {
    const invalidDays = await request(app).get("/map").query({ pincode: "560102", days: 31 });
    expect(invalidDays.status).toBe(400);
    const invalidRadius = await request(app).get("/map").query({ pincode: "560102", radius_km: 100.1 });
    expect(invalidRadius.status).toBe(400);
    const alerts = await request(app).get("/alerts").query({ pincode: "000000" });
    expect(alerts.status).toBe(400);
    expect(JSON.stringify(alerts.body)).not.toContain("000000");
    const lookup = await request(app).get("/lookup").query({ type: "phone", value: "phase17-invalid-secret" });
    expect(lookup.status).toBe(400);
    expect(JSON.stringify(lookup.body)).not.toContain("phase17-invalid-secret");
  });
});
