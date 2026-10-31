import { describe, expect, it } from "vitest";
import { sanitizeNote, reportRequestSchema } from "../src/modules/reports/reports.schema.js";

const validReport = {
  report_id: "rep_000123",
  occurred_at: "2026-10-27T18:21:04+05:30",
  reported_at: "2026-10-27T18:40:04+05:30",
  reporter_id: "r_7c2d91aa",
  ip_prefix: "103.21.58",
  channel: "Phone call",
  scam_type: "digital-arrest",
  identifier_type: "phone",
  identifier_value: "+91 98765 43210",
  pincode: "560102",
  locality: "HSR Layout",
  city: "Bengaluru",
};

describe("report request validation", () => {
  it("accepts the exact PRD shape and applies optional defaults", () => {
    expect(reportRequestSchema.parse(validReport)).toMatchObject({
      report_id: "rep_000123",
      has_screenshot: false,
      amount_lost_inr: 0,
    });
  });

  it("rejects reports whose timestamps are reversed", () => {
    expect(() => reportRequestSchema.parse({
      ...validReport,
      reported_at: "2026-10-27T18:20:04+05:30",
    })).toThrow(/reported_at must not be earlier/);
  });

  it("rejects invalid required fields and negative loss amounts", () => {
    expect(() => reportRequestSchema.parse({
      ...validReport,
      pincode: "12345",
      amount_lost_inr: -1,
    })).toThrow();
  });

  it("sanitizes stored note content without retaining control characters", () => {
    expect(sanitizeNote("  Caller\u0000 said:\n pay now  ")).toBe("Caller said: pay now");
    expect(sanitizeNote(null)).toBe("");
  });
});
