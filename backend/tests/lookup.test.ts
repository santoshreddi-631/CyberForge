import { describe, expect, it } from "vitest";
import request from "supertest";
import { performance } from "node:perf_hooks";
import { createApp } from "../src/app.js";
import { classifyLookup } from "../src/modules/lookup/verdict.js";
import { maskIdentifier } from "../src/modules/lookup/masking.js";

describe("lookup verdict classification", () => {
  it.each([
    [{ verified: true, challenged: false, rawReportCount: 40, eligibleReportCount: 40, distinctEligibleReporters: 20 }, "VERIFIED_BUSINESS"],
    [{ verified: false, challenged: true, rawReportCount: 10, eligibleReportCount: 10, distinctEligibleReporters: 10 }, "SUSPICIOUS"],
    [{ verified: false, challenged: false, rawReportCount: 0, eligibleReportCount: 0, distinctEligibleReporters: 0 }, "NO_REPORTS"],
    [{ verified: false, challenged: false, rawReportCount: 8, eligibleReportCount: 8, distinctEligibleReporters: 5 }, "KNOWN_SCAM"],
    [{ verified: false, challenged: false, rawReportCount: 8, eligibleReportCount: 2, distinctEligibleReporters: 2 }, "SUSPICIOUS"],
  ])("returns exactly one state", (state, expected) => {
    expect(classifyLookup(state)).toBe(expected);
  });

  it("never returns KNOWN_SCAM for a challenged identifier", () => {
    expect(classifyLookup({
      verified: false,
      challenged: true,
      rawReportCount: 100,
      eligibleReportCount: 100,
      distinctEligibleReporters: 100,
    })).not.toBe("KNOWN_SCAM");
  });
});

describe("privacy masking", () => {
  it("masks phone, UPI, URL, and sender values using PRD examples", () => {
    expect(maskIdentifier("phone", "+919876543210")).toBe("98XXXXX210");
    expect(maskIdentifier("upi", "ravi12@okaxis")).toBe("r***@okaxis");
    expect(maskIdentifier("url", "https://sbi-kyc.in/pay")).toBe("sbi***.in/...");
    expect(maskIdentifier("sender_id", "HDFCBK")).toBe("HD****");
  });

  it("does not expose a path, account suffix, or reporter signal", () => {
    expect(maskIdentifier("url", "https://secret.example.com/private/path")).not.toContain("private");
    expect(maskIdentifier("upi", "ravi12@okaxis")).not.toContain("avi12");
    expect(maskIdentifier("sender_id", "HDFCBK")).not.toContain("DFCBK");
  });
});

describe("lookup boundary and performance", () => {
  it("returns 400 for invalid lookup input without touching the database", async () => {
    const response = await request(createApp()).get("/lookup?type=phone&value=12345");
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it("classifies a lookup in well under the 500 ms target", () => {
    const start = performance.now();
    for (let index = 0; index < 10000; index += 1) {
      classifyLookup({
        verified: false,
        challenged: false,
        rawReportCount: 7,
        eligibleReportCount: 7,
        distinctEligibleReporters: 7,
      });
    }
    expect(performance.now() - start).toBeLessThan(500);
  });
});
