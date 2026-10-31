import { readFileSync } from "node:fs";
import { fileURLToPath, URL as NodeURL } from "node:url";
import { describe, expect, it } from "vitest";
import yaml from "js-yaml";

const openApiPath = fileURLToPath(new NodeURL("../../contracts/openapi.yaml", import.meta.url));
const api = yaml.load(readFileSync(openApiPath, "utf8"));
const schemas = api.components.schemas;

const fields = (schema) => Object.keys(schema.properties).sort();
const operation = (path, method) => api.paths[path][method];
const bodySchema = (path, method) => operation(path, method).requestBody.content["application/json"].schema;

describe("Appendix A OpenAPI contract", () => {
  it("documents every PRD endpoint and its method", () => {
    expect(Object.keys(api.paths).sort()).toEqual([
      "/admin/reset", "/alerts", "/challenges", "/health", "/license", "/lookup", "/map", "/reports",
    ]);
    expect(Object.keys(api.paths["/license"]).sort()).toEqual(["get", "post"]);
    for (const [path, method] of [
      ["/health", "get"], ["/reports", "post"], ["/lookup", "get"], ["/map", "get"],
      ["/alerts", "get"], ["/admin/reset", "post"], ["/challenges", "post"], ["/license", "get"],
      ["/license", "post"],
    ]) expect(operation(path, method)).toBeDefined();
  });

  it("matches Appendix A report, lookup, map, alert, challenge and licence fields", () => {
    expect(fields(schemas.ReportRequest)).toEqual([
      "amount_lost_inr", "channel", "city", "has_screenshot", "identifier_type", "identifier_value",
      "ip_prefix", "locality", "note", "occurred_at", "pincode", "report_id", "reported_at",
      "reporter_id", "scam_type",
    ]);
    expect(schemas.ReportRequest.required.sort()).toEqual([
      "channel", "city", "identifier_type", "identifier_value", "ip_prefix", "locality", "occurred_at",
      "pincode", "report_id", "reported_at", "reporter_id", "scam_type",
    ]);
    expect(schemas.ReportResponse.required.sort()).toEqual(["case_id", "merged", "report_id"]);
    expect(fields(schemas.LookupResponse)).toEqual([
      "challenged", "display_value", "distinct_reporters", "evidence", "first_seen", "last_seen",
      "report_count", "scam_type", "verdict",
    ]);
    expect(schemas.LookupResponse.required.sort()).toEqual(fields(schemas.LookupResponse));
    expect(fields(schemas.LookupEvidence)).toEqual(["channel", "occurred_at", "pincode", "scam_type"]);
    expect(fields(schemas.MapCluster)).toEqual([
      "city", "count", "lat", "lng", "locality", "pincode", "severity", "top_scam_type",
    ]);
    expect(fields(schemas.AlertsResponse)).toEqual(["alerts"]);
    expect(fields(schemas.ChallengeRequest)).toEqual([
      "claimant_name", "contact_email", "identifier_type", "identifier_value", "proof_note",
    ]);
    expect(schemas.ChallengeResponse.required.sort()).toEqual(["challenge_id", "status"]);
    expect(fields(schemas.LicenceFile)).toEqual(["expires_at", "licensee", "signature"]);
    expect(fields(schemas.LicenceStatus)).toEqual(["expired", "expires_at", "licensee", "valid"]);
    expect(schemas.ScamType.enum).toEqual([
      "digital-arrest", "fake-kyc-link", "upi-refund-qr", "investment-group", "courier-customs",
      "job-offer", "lottery-prize", "loan-app-harassment", "electricity-disconnection",
      "fake-customer-care", "otp-call", "sextortion",
    ]);
    expect(schemas.ScamType.description).toContain("treated as \"other\"");
    expect(schemas.Channel.enum).toEqual([
      "Phone call", "SMS or WhatsApp", "QR code", "Fake website", "UPI request", "Something else",
    ]);
  });

  it("publishes query requirements, chosen map bounds and all runtime error statuses", () => {
    expect(operation("/health", "get").responses).toHaveProperty("200");
    expect(operation("/reports", "post").responses).toHaveProperty("201");
    expect(operation("/reports", "post").responses).toHaveProperty("400");
    expect(operation("/lookup", "get").parameters.map(({ name, required }) => [name, required])).toEqual([
      ["type", true], ["value", true],
    ]);
    expect(operation("/lookup", "get").responses).toHaveProperty("200");
    expect(operation("/lookup", "get").responses).toHaveProperty("400");
    const mapParameters = Object.fromEntries(operation("/map", "get").parameters.map((parameter) => [parameter.name, parameter]));
    expect(mapParameters.pincode.schema.pattern).toBe("^\\d{6}$");
    expect(mapParameters.days.schema).toMatchObject({ default: 7, minimum: 1, maximum: 30 });
    expect(mapParameters.radius_km.schema).toMatchObject({ default: 2, minimum: 0, maximum: 100 });
    expect(operation("/alerts", "get").responses).toHaveProperty("400");
    expect(operation("/map", "get").responses).toHaveProperty("400");
    expect(operation("/reports", "post").responses).toHaveProperty("429");
    expect(operation("/admin/reset", "post").responses).toHaveProperty("200");
    expect(operation("/admin/reset", "post").responses).toHaveProperty("503");
    expect(operation("/challenges", "post").responses).toHaveProperty("201");
    expect(operation("/license", "get").responses).toHaveProperty("200");
    expect(operation("/license", "post").responses).toHaveProperty("200");
    expect(operation("/license", "post").responses).toHaveProperty("400");
    expect(bodySchema("/reports", "post").$ref).toBe("#/components/schemas/ReportRequest");
    expect(bodySchema("/challenges", "post").$ref).toBe("#/components/schemas/ChallengeRequest");
    expect(bodySchema("/license", "post").$ref).toBe("#/components/schemas/LicenceFile");
  });
});
