import { describe, expect, it } from "vitest";
import request from "supertest";
import { performance } from "node:perf_hooks";
import { createApp } from "../src/app.js";
import { haversineDistanceKm } from "../src/modules/geo/distance.js";
import { classifyMapSeverity } from "../src/modules/geo/severity.js";
import reference from "../src/db/seeds/reference.js";

describe("map geo algorithms", () => {
  it("contains all 25 PRD Appendix B areas with fixed centroids", () => {
    expect(reference.areas).toHaveLength(25);
    expect(reference.areas).toContainEqual(["560102", "HSR Layout", "Bengaluru", "12.9116", "77.6473"]);
    expect(reference.areas).toContainEqual(["682030", "Kakkanad", "Kochi", "10.0159", "76.3419"]);
    for (const area of reference.areas) {
      expect(area[0]).toMatch(/^\d{6}$/u);
      expect(Number(area[3])).toBeGreaterThanOrEqual(-90);
      expect(Number(area[3])).toBeLessThanOrEqual(90);
      expect(Number(area[4])).toBeGreaterThanOrEqual(-180);
      expect(Number(area[4])).toBeLessThanOrEqual(180);
    }
  });

  it("uses Haversine distance for fixed area centroids", () => {
    expect(haversineDistanceKm(
      { lat: 12.9116, lng: 77.6473 },
      { lat: 12.9116, lng: 77.6473 },
    )).toBe(0);
    expect(haversineDistanceKm(
      { lat: 12.9116, lng: 77.6473 },
      { lat: 12.9784, lng: 77.6408 },
    )).toBeGreaterThan(7);
    expect(haversineDistanceKm(
      { lat: 12.9116, lng: 77.6473 },
      { lat: 12.9784, lng: 77.6408 },
    )).toBeLessThan(8);
  });

  it.each([[1, "MED"], [4, "MED"], [5, "HIGH"], [9, "HIGH"], [10, "CRIT"], [100, "CRIT"]] as const)(
    "classifies %s eligible reports as %s",
    (count, severity) => {
      expect(classifyMapSeverity(count)).toBe(severity);
    },
  );

  it("rejects non-positive counts for severity", () => {
    expect(() => classifyMapSeverity(0)).toThrow();
    expect(() => classifyMapSeverity(1.5)).toThrow();
  });

  it("returns 400 for invalid map queries without database access", async () => {
    const response = await request(createApp()).get("/map?pincode=12345&days=0");
    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });

  it("keeps fixed-centroid filtering and severity computation fast", () => {
    const start = performance.now();
    for (let index = 0; index < 10000; index += 1) {
      haversineDistanceKm({ lat: 12.9116, lng: 77.6473 }, { lat: 12.9784, lng: 77.6408 });
      classifyMapSeverity(10);
    }
    expect(performance.now() - start).toBeLessThan(500);
  });
});
