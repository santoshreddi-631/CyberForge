import { expect, it, beforeAll } from "vitest";
import request from "supertest";
import { databaseDescription, percentile, prepareHarness } from "../e2e/harness.js";

databaseDescription("Phase 11 API latency benchmark", () => {
  let app: ReturnType<typeof import("../../src/app.js").createApp>;

  beforeAll(async () => {
    ({ app } = await prepareHarness());
  }, 30000);

  it("records lookup and report p50/p95/p99 evidence", async () => {
    const lookupDurations: number[] = [];
    const reportDurations: number[] = [];
    for (let index = 0; index < 20; index += 1) {
      const lookupStart = performance.now();
      const lookup = await request(app).get("/lookup").query({ type: "phone", value: "1930" });
      lookupDurations.push(performance.now() - lookupStart);
      expect(lookup.status).toBe(200);

      const reportStart = performance.now();
      const report = await request(app).post("/reports").send({
        report_id: `phase11-latency-${index}`,
        occurred_at: new Date(Date.now() - 60_000).toISOString(),
        reported_at: new Date().toISOString(),
        reporter_id: `latency-reporter-${index}`,
        ip_prefix: `192.0.2.${index}/24`,
        channel: "Something else",
        scam_type: "other",
        identifier_type: "url",
        identifier_value: `https://latency-${index}.example.test`,
        pincode: "560102",
        locality: "HSR Layout",
        city: "Bengaluru",
        note: "Latency fixture",
        has_screenshot: false,
        amount_lost_inr: 0,
      });
      reportDurations.push(performance.now() - reportStart);
      expect(report.status).toBe(201);
    }
    const result = {
      lookup_ms: { p50: percentile(lookupDurations, 0.5), p95: percentile(lookupDurations, 0.95), p99: percentile(lookupDurations, 0.99) },
      report_ms: { p50: percentile(reportDurations, 0.5), p95: percentile(reportDurations, 0.95), p99: percentile(reportDurations, 0.99) },
    };
    console.info("PHASE11_LATENCY", JSON.stringify(result));
    expect(result.lookup_ms.p99).toBeGreaterThan(0);
    expect(result.report_ms.p99).toBeGreaterThan(0);
  });
});
