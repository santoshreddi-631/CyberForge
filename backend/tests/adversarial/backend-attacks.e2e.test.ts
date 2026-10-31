import { expect, it, beforeAll } from "vitest";
import request from "supertest";
import { databaseDescription, prepareHarness } from "../e2e/harness.js";

databaseDescription("Phase 11 API adversarial scenarios", () => {
  let app: ReturnType<typeof import("../../src/app.js").createApp>;

  beforeAll(async () => {
    ({ app } = await prepareHarness());
  }, 30000);

  it("does not turn a 40-report coordinated bakery attack into a known scam", async () => {
    const responses = await Promise.all(Array.from({ length: 40 }, (_, index) => request(app).post("/reports").send({
      report_id: `phase11-bakery-${index}`,
      occurred_at: new Date(Date.now() - index * 30_000).toISOString(),
      reported_at: new Date().toISOString(),
      reporter_id: `bakery-attacker-${index}`,
      ip_prefix: "198.51.100.0/24",
      channel: "Phone call",
      scam_type: "fake-customer-care",
      identifier_type: "phone",
      identifier_value: "+919876543212",
      pincode: "560102",
      locality: "HSR Layout",
      city: "Bengaluru",
      note: "This bakery is a scam.",
      has_screenshot: false,
      amount_lost_inr: 0,
    })));
    expect(responses.every((response) => response.status === 201)).toBe(true);
    const lookup = await request(app).get("/lookup").query({ type: "phone", value: "+919876543212" });
    expect(lookup.body.verdict).not.toBe("KNOWN_SCAM");
  });

  it("does not make fake bursts eligible for alerts", async () => {
    const alerts = await request(app).get("/alerts").query({ pincode: "560102" });
    expect(alerts.status).toBe(200);
    expect(alerts.body.alerts).toEqual([]);
  });

  it("does not treat 22 accounts on one IP prefix as independent corroboration", async () => {
    const responses = await Promise.all(Array.from({ length: 22 }, (_, index) => request(app).post("/reports").send({
      report_id: `phase11-wifi-${index}`,
      occurred_at: new Date(Date.now() - index * 120_000).toISOString(),
      reported_at: new Date().toISOString(),
      reporter_id: `wifi-account-${index}`,
      ip_prefix: "203.0.113.0/24",
      channel: "UPI request",
      scam_type: "upi-refund-qr",
      identifier_type: "upi",
      identifier_value: "bakery@okaxis",
      pincode: "560102",
      locality: "HSR Layout",
      city: "Bengaluru",
      note: `Coordinated Wi-Fi fixture ${index}`,
      has_screenshot: false,
      amount_lost_inr: 0,
    })));
    expect(responses.every((response) => response.status === 201)).toBe(true);
    const lookup = await request(app).get("/lookup").query({ type: "upi", value: "bakery@okaxis" });
    expect(lookup.body.verdict).not.toBe("KNOWN_SCAM");
  });

  it("enforces reporter velocity for six repeated submissions", async () => {
    const responses = await Promise.all(Array.from({ length: 6 }, (_, index) => request(app).post("/reports").send({
      report_id: `phase11-repeat-${index}`,
      occurred_at: new Date(Date.now() - index * 60_000).toISOString(),
      reported_at: new Date().toISOString(),
      reporter_id: "one-reporter",
      ip_prefix: "203.0.113.0/24",
      channel: "Phone call",
      scam_type: "otp-call",
      identifier_type: "phone",
      identifier_value: "+919876543213",
      pincode: "560102",
      locality: "HSR Layout",
      city: "Bengaluru",
      note: `Repeated report ${index}`,
      has_screenshot: false,
      amount_lost_inr: 0,
    })));
    expect(responses.filter((response) => response.status === 429).length).toBeGreaterThan(0);
  });
});
