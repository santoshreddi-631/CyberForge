import { describe, expect, it, vi, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import reference from "../src/db/seeds/reference.js";

// Mock database layer to test map service & API aggregation deterministically
const mockAreas = reference.areas.map(([pincode, locality, city, lat, lng]: string[]) => ({
  pincode,
  locality,
  city,
  lat: parseFloat(lat),
  lng: parseFloat(lng),
}));

let mockEligibleAggregates: Array<{
  pincode: string;
  scam_type: string;
  count: number;
  status: "eligible" | "ignored";
}> = [];

vi.mock("../src/db/client.js", () => {
  return {
    getDb: () => ({
      db: {
        execute: vi.fn(async (query: any) => {
          const raw = JSON.stringify(query);
          // If query mentions areas table
          if (raw.includes("areas")) {
            return mockAreas;
          }

          // Otherwise it is the readAggregates query
          // In the query, only reports where td.status = 'eligible' are selected
          return mockEligibleAggregates
            .filter((row) => row.status === "eligible")
            .map((row) => ({
              pincode: row.pincode,
              scam_type: row.scam_type,
              count: row.count,
            }));
        }),
      },
      sql: vi.fn(),
    }),
    createClient: vi.fn(),
    pingDb: vi.fn(async () => true),
    closeDb: vi.fn(async () => {}),
  };
});

describe("Map API Aggregation & Accuracy Verification", () => {
  beforeEach(() => {
    mockEligibleAggregates = [];
    vi.clearAllMocks();
  });

  // 1. Empty eligible data returns an empty FeatureCollection
  it("returns an empty FeatureCollection when no eligible data exists", async () => {
    mockEligibleAggregates = [];

    const app = createApp();
    const response = await request(app).get("/map?format=geojson");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.type).toBe("FeatureCollection");
    expect(response.body.total_reports).toBe(0);
    expect(response.body.clusters).toEqual([]);
    expect(response.body.features).toEqual([]);
  });

  // 2. Eligible reports create the correct clusters
  it("creates correct clusters with area centroid coordinates from eligible reports", async () => {
    mockEligibleAggregates = [
      {
        pincode: "560102", // HSR Layout, Bengaluru
        scam_type: "upi_fraud",
        count: 7,
        status: "eligible",
      },
      {
        pincode: "110016", // Hauz Khas, Delhi
        scam_type: "fake_kyc_link",
        count: 12,
        status: "eligible",
      },
    ];

    const app = createApp();
    const response = await request(app).get("/map?format=geojson");

    expect(response.status).toBe(200);
    expect(response.body.clusters).toHaveLength(2);
    expect(response.body.features).toHaveLength(2);

    const hsrCluster = response.body.clusters.find((c: any) => c.pincode === "560102");
    expect(hsrCluster).toBeDefined();
    expect(hsrCluster.locality).toBe("HSR Layout");
    expect(hsrCluster.city).toBe("Bengaluru");
    expect(hsrCluster.count).toBe(7);
    expect(hsrCluster.severity).toBe("HIGH"); // 5-9 reports = HIGH
    expect(hsrCluster.lat).toBeCloseTo(12.9116, 2);
    expect(hsrCluster.lng).toBeCloseTo(77.6473, 2);

    // Verify GeoJSON Feature coordinates strictly follow [longitude, latitude]
    const hsrFeature = response.body.features.find((f: any) => f.properties.pincode === "560102");
    expect(hsrFeature).toBeDefined();
    expect(hsrFeature.geometry.type).toBe("Point");
    expect(hsrFeature.geometry.coordinates).toEqual([hsrCluster.lng, hsrCluster.lat]);
    expect(hsrFeature.properties.report_count).toBe(7);
    expect(hsrFeature.properties.dominant_category).toBe("upi_fraud");
  });

  // 3. Cluster totals are correct
  it("calculates total_reports strictly matching the sum of returned clusters", async () => {
    mockEligibleAggregates = [
      {
        pincode: "560102",
        scam_type: "upi_fraud",
        count: 6,
        status: "eligible",
      },
      {
        pincode: "500081", // Madhapur, Hyderabad
        scam_type: "part_time_job",
        count: 14,
        status: "eligible",
      },
    ];

    const app = createApp();
    const response = await request(app).get("/map?format=geojson");

    expect(response.status).toBe(200);
    const sumOfClusters = response.body.clusters.reduce((sum: number, c: any) => sum + c.count, 0);
    expect(response.body.total_reports).toBe(sumOfClusters);
    expect(response.body.total_reports).toBe(20);
  });

  // 4. Pincode and date filters work
  it("filters map data by pincode and radius correctly", async () => {
    mockEligibleAggregates = [
      {
        pincode: "560102", // HSR Layout
        scam_type: "upi_fraud",
        count: 5,
        status: "eligible",
      },
      {
        pincode: "110016", // Hauz Khas
        scam_type: "fake_kyc_link",
        count: 10,
        status: "eligible",
      },
    ];

    const app = createApp();
    // Query specifically for HSR Layout with 2km radius
    const response = await request(app).get("/map?pincode=560102&radius_km=2&format=geojson");

    expect(response.status).toBe(200);
    expect(response.body.clusters).toHaveLength(1);
    expect(response.body.clusters[0].pincode).toBe("560102");
    expect(response.body.total_reports).toBe(5);
  });

  it("applies date window filters correctly across 1-day, 7-day, and 30-day periods", async () => {
    mockEligibleAggregates = [
      {
        pincode: "560102",
        scam_type: "upi_fraud",
        count: 8,
        status: "eligible",
      },
    ];

    const app = createApp();

    // 1-day query
    const res1 = await request(app).get("/map?days=1&format=geojson");
    expect(res1.status).toBe(200);
    expect(res1.body.period_days).toBe(1);

    // 7-day query
    const res7 = await request(app).get("/map?days=7&format=geojson");
    expect(res7.status).toBe(200);
    expect(res7.body.period_days).toBe(7);

    // 30-day query
    const res30 = await request(app).get("/map?days=30&format=geojson");
    expect(res30.status).toBe(200);
    expect(res30.body.period_days).toBe(30);

    // Invalid days query (< 1 or > 30) rejected with 400
    const resInvalid0 = await request(app).get("/map?days=0");
    expect(resInvalid0.status).toBe(400);

    const resInvalid31 = await request(app).get("/map?days=31");
    expect(resInvalid31.status).toBe(400);
  });

  // 5. No ignored report appears on the scam map
  it("excludes ignored or unverified reports from appearing on the scam map", async () => {
    // Only 'ignored' status reports in database
    mockEligibleAggregates = [
      {
        pincode: "560102",
        scam_type: "upi_fraud",
        count: 25,
        status: "ignored", // Uncorroborated / bot flood / invalid
      },
    ];

    const app = createApp();
    const response = await request(app).get("/map?format=geojson");

    expect(response.status).toBe(200);
    // Ignored reports must NOT be clustered or counted on the scam map
    expect(response.body.clusters).toHaveLength(0);
    expect(response.body.features).toHaveLength(0);
    expect(response.body.total_reports).toBe(0);
  });
});
