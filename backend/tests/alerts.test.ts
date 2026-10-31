import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import {
  calculateAlertWindows,
  dailyAverage,
  findNewTypes,
  qualifiesForSpike,
} from "../src/modules/alerts/alert-rules.js";

describe("alert rules", () => {
  it("detects a genuine spike at the exact PRD boundary", () => {
    expect(qualifiesForSpike({ currentCount: 5, historicalCount: 14 })).toBe(true);
    expect(dailyAverage(14, 7)).toBe(2);
  });

  it("does not detect normal traffic", () => {
    expect(qualifiesForSpike({ currentCount: 4, historicalCount: 14 })).toBe(false);
    expect(qualifiesForSpike({ currentCount: 5, historicalCount: 21 })).toBe(false);
  });

  it("handles zero historical baseline without division by zero", () => {
    expect(qualifiesForSpike({ currentCount: 5, historicalCount: 0 })).toBe(true);
    expect(dailyAverage(0, 7)).toBe(0);
  });

  it("detects only scam types new in the current window", () => {
    expect(findNewTypes(["job-offer", "digital-arrest", "job-offer"], ["digital-arrest", "otp-call"]))
      .toEqual(["job-offer"]);
  });

  it("excludes the current window from historical baselines", () => {
    const windows = calculateAlertWindows(new Date("2026-10-31T12:00:00.000Z"));
    expect(windows.currentStart.toISOString()).toBe("2026-10-30T12:00:00.000Z");
    expect(windows.baselineStart.toISOString()).toBe("2026-10-23T12:00:00.000Z");
    expect(windows.historyStart.toISOString()).toBe("2026-09-30T12:00:00.000Z");
  });

  it("uses half-open time boundaries", () => {
    const windows = calculateAlertWindows(new Date("2026-10-31T12:00:00.000Z"));
    expect(new Date("2026-10-30T12:00:00.000Z") >= windows.currentStart).toBe(true);
    expect(new Date("2026-10-31T12:00:00.000Z") >= windows.currentEnd).toBe(true);
  });

  it("returns 400 for malformed alert queries", async () => {
    const response = await request(createApp()).get("/alerts?pincode=12345");
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});
