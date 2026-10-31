import { randomUUID } from "node:crypto";
import { beforeAll, beforeEach, expect, it } from "vitest";
import request from "supertest";
import { databaseDescription, prepareHarness } from "../e2e/harness.js";
import { resetDerivedState } from "../../src/modules/admin/reset.service.js";
import reference from "../../src/db/seeds/reference.js";

type ReportOverrides = {
  identifier_type?: "phone" | "upi" | "url" | "sender_id";
  reporter_id?: string;
  ip_prefix?: string;
  occurred_at?: string;
  reported_at?: string;
  pincode?: string;
  locality?: string;
  city?: string;
  note?: string;
};

function uniqueUrl(): string {
  return `https://${randomUUID()}.example.test`;
}

function reportBody(identifierValue: string, overrides: ReportOverrides = {}) {
  const occurredAt = overrides.occurred_at ?? new Date(Date.now() - 10 * 60_000).toISOString();
  const [pincode, locality, city] = reference.areas[0];
  return {
    report_id: randomUUID(),
    occurred_at: occurredAt,
    reported_at: overrides.reported_at ?? new Date().toISOString(),
    reporter_id: overrides.reporter_id ?? randomUUID(),
    ip_prefix: overrides.ip_prefix ?? `audit-network-${randomUUID()}`,
    channel: "Phone call",
    scam_type: "fake-customer-care",
    identifier_type: overrides.identifier_type ?? "url",
    identifier_value: identifierValue,
    pincode: overrides.pincode ?? pincode,
    locality: overrides.locality ?? locality,
    city: overrides.city ?? city,
    note: overrides.note ?? `A caller requested a specific payment after an unusual account warning ${randomUUID()}.`,
    has_screenshot: false,
    amount_lost_inr: 0,
  };
}

databaseDescription("Phase 16 API and database adversarial scenarios", () => {
  let app: ReturnType<typeof import("../../src/app.js").createApp>;
  let client: Awaited<ReturnType<typeof prepareHarness>>["client"];

  beforeAll(async () => {
    ({ app, client } = await prepareHarness());
  }, 30000);

  beforeEach(async () => {
    await resetDerivedState(client);
  });

  it("caps 22 same-prefix reporters while four independent networks can still corroborate", async () => {
    const target = uniqueUrl();
    const sharedPrefix = `coordinated-network-${randomUUID()}`;
    const attacks = await Promise.all(Array.from({ length: 22 }, (_, index) => request(app).post("/reports").send(
      reportBody(target, {
        reporter_id: randomUUID(),
        ip_prefix: sharedPrefix,
        occurred_at: new Date(Date.now() - (index * 2 + 2) * 60 * 60_000).toISOString(),
        note: `A distinct account gives a different incident detail with reference ${index} ${randomUUID()}.`,
      }),
    )));
    expect(attacks.every((response) => response.status === 201)).toBe(true);

    const genuine = await Promise.all(Array.from({ length: 4 }, (_, index) => request(app).post("/reports").send(
      reportBody(target, {
        reporter_id: randomUUID(),
        ip_prefix: `independent-network-${randomUUID()}`,
        occurred_at: new Date(Date.now() - (index * 3 + 1) * 60 * 60_000).toISOString(),
        note: [
          "A caller impersonated a bank worker and requested an urgent transfer to release a blocked account.",
          "A video caller threatened police action and demanded payment for an invented parcel problem.",
          "A fake support agent asked for a one time password and sent a payment request to my phone.",
          "A remote job offer required an advance deposit before any interview or work details were provided.",
        ][index],
      }),
    )));
    expect(genuine.every((response) => response.status === 201)).toBe(true);

    const lookup = await request(app).get("/lookup").query({ type: "url", value: target });
    expect(lookup.status).toBe(200);
    expect(lookup.body.verdict).toBe("KNOWN_SCAM");
    expect(lookup.body.report_count).toBe(5);
    expect(lookup.body.distinct_reporters).toBe(5);

    const maxEligiblePerPrefix = await client.sql`
      SELECT max(eligible_count)::int AS count
      FROM (
        SELECT count(*) AS eligible_count
        FROM reports r
        JOIN trust_decisions td ON td.report_id = r.id AND td.status = 'eligible'
        JOIN cases c ON c.id = r.case_id
        JOIN identifiers i ON i.id = c.identifier_id
        WHERE i.identifier_type = 'url' AND i.normalized_value = ${target}
        GROUP BY r.ip_prefix_hmac
      ) grouped
    `;
    expect(maxEligiblePerPrefix[0].count).toBe(1);
  });

  it("qualifies genuinely independent reporters through POST /reports without SQL promotion", async () => {
    const target = uniqueUrl();
    const notes = [
      "A caller claimed police had seized a parcel and demanded an immediate transfer to avoid arrest.",
      "A video call threatened arrest unless I paid a supposed customs release fee to a personal account.",
      "The caller used a fake court notice and asked for an OTP over a payment app before I could verify it.",
      "They said my electricity account would be disconnected and sent a payment link to restore service.",
      "A person impersonating a bank officer requested card verification and a transfer to a new beneficiary.",
      "The job offer required a deposit before work and came from an unknown number with no company address.",
      "The caller knew my name but could not answer basic account questions and demanded an immediate fee.",
    ];
    const responses = await Promise.all(notes.map((note, index) => request(app).post("/reports").send(
      reportBody(target, {
        reporter_id: randomUUID(),
        ip_prefix: `independent-network-${randomUUID()}`,
        occurred_at: new Date(Date.now() - (index * 2 + 1) * 60 * 60_000).toISOString(),
        note,
      }),
    )));

    expect(responses.every((response) => response.status === 201)).toBe(true);
    const lookup = await request(app).get("/lookup").query({ type: "url", value: target });
    expect(lookup.status).toBe(200);
    expect(lookup.body.verdict).toBe("KNOWN_SCAM");
    expect(lookup.body.distinct_reporters).toBe(7);
    expect(lookup.body.report_count).toBe(7);
  });

  it("limits one reporter across different identifiers even when reported_at is old or future", async () => {
    const reporter = randomUUID();
    const reportedTimes = [
      new Date(Date.now() - 365 * 24 * 60 * 60_000),
      new Date(Date.now() + 365 * 24 * 60 * 60_000),
      new Date(Date.now() - 730 * 24 * 60 * 60_000),
      new Date(Date.now() + 730 * 24 * 60 * 60_000),
    ];
    const responses = [];
    for (const reportedAt of reportedTimes) {
      responses.push(await request(app).post("/reports").send(reportBody(uniqueUrl(), {
        reporter_id: reporter,
        ip_prefix: `reporter-network-${randomUUID()}`,
        reported_at: reportedAt.toISOString(),
        occurred_at: new Date(reportedAt.getTime() - 60 * 60_000).toISOString(),
      })));
    }

    expect(responses.map((response) => response.status)).toEqual([201, 201, 201, 429]);
  });

  it("serializes concurrent velocity checks across different cases", async () => {
    const reporter = randomUUID();
    const responses = await Promise.all(Array.from({ length: 8 }, (_, index) => request(app).post("/reports").send(
      reportBody(uniqueUrl(), {
        reporter_id: reporter,
        ip_prefix: `concurrent-network-${index}`,
        reported_at: new Date(Date.now() + (index % 2 === 0 ? 365 : -365) * 24 * 60 * 60_000).toISOString(),
        occurred_at: new Date(Date.now() + (index % 2 === 0 ? 365 : -365) * 24 * 60 * 60_000 - 60 * 60_000).toISOString(),
      }),
    )));

    expect(responses.filter((response) => response.status === 201)).toHaveLength(3);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(5);
  });

  it("keeps verified identifiers protected from otherwise qualifying coordinated reports", async () => {
    const [verified] = await client.sql`
      SELECT i.identifier_type, i.normalized_value
      FROM verified_identifiers v
      JOIN identifiers i ON i.id = v.identifier_id
      ORDER BY i.identifier_type, i.normalized_value
      LIMIT 1
    `;
    const notes = [
      "A caller claimed police had seized a parcel and demanded an immediate transfer to avoid arrest.",
      "A video call threatened arrest unless I paid a supposed customs release fee to a personal account.",
      "The caller used a fake court notice and asked for an OTP over a payment app before I could verify it.",
      "They said my electricity account would be disconnected and sent a payment link to restore service.",
      "A person impersonating a bank officer requested card verification and a transfer to a new beneficiary.",
      "The job offer required a deposit before work and came from an unknown number with no company address.",
      "The caller knew my name but could not answer basic account questions and demanded an immediate fee.",
    ];
    const responses = await Promise.all(notes.map((note, index) => request(app).post("/reports").send(
      reportBody(verified.normalized_value, {
        identifier_type: verified.identifier_type,
        reporter_id: randomUUID(),
        ip_prefix: `verified-network-${randomUUID()}`,
        occurred_at: new Date(Date.now() - (index * 2 + 1) * 60 * 60_000).toISOString(),
        note,
      }),
    )));

    expect(responses.every((response) => response.status === 201)).toBe(true);
    const lookup = await request(app).get("/lookup").query({
      type: verified.identifier_type,
      value: verified.normalized_value,
    });
    expect(lookup.status).toBe(200);
    expect(lookup.body.verdict).toBe("VERIFIED_BUSINESS");
    const decisions = await client.sql`
      SELECT count(*)::int AS eligible_count
      FROM trust_decisions td
      JOIN reports r ON r.id = td.report_id
      JOIN cases c ON c.id = r.case_id
      JOIN identifiers i ON i.id = c.identifier_id
      WHERE i.identifier_type = ${verified.identifier_type}
        AND i.normalized_value = ${verified.normalized_value}
        AND td.status = 'eligible'
    `;
    expect(decisions[0].eligible_count).toBe(0);
  });

  it("keeps a fake shared-prefix burst out of both lookup and area alerts", async () => {
    const target = uniqueUrl();
    const sharedPrefix = `fake-network-${randomUUID()}`;
    const responses = await Promise.all(Array.from({ length: 22 }, (_, index) => request(app).post("/reports").send(
      reportBody(target, {
        reporter_id: randomUUID(),
        ip_prefix: sharedPrefix,
        occurred_at: new Date(Date.now() - (index * 2 + 2) * 60 * 60_000).toISOString(),
        note: `Different account reports a distinct payment detail ${index} ${randomUUID()}.`,
      }),
    )));
    expect(responses.every((response) => response.status === 201)).toBe(true);

    const lookup = await request(app).get("/lookup").query({ type: "url", value: target });
    expect(lookup.body.verdict).toBe("SUSPICIOUS");
    expect(lookup.body.report_count).toBe(0);
    const alerts = await request(app).get("/alerts").query({ pincode: reference.areas[0][0] });
    expect(alerts.status).toBe(200);
    expect(alerts.body.alerts).toEqual([]);
  });
});
