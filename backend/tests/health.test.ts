import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { AppError, asyncHandler } from "../src/middleware/error.middleware.js";

// ── Environment stub ──────────────────────────────────────────────────────────
// We set required env vars before importing anything that calls getEnv().
// DATABASE_URL is needed by the schema but the app never actually connects
// during unit tests (no DB calls happen in Phase 1 routes).
beforeEach(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgres://test:test@localhost:5432/testdb";
  process.env.PORT = "3099";
  process.env.LOG_LEVEL = "silent";
});

afterEach(() => {
  vi.resetModules();
});

describe("GET /health", () => {
  it("returns HTTP 200", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });

  it('returns exactly {"ok":true}', async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.body).toEqual({ ok: true });
  });

  it("returns Content-Type application/json", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    expect(res.headers["content-type"]).toMatch(/application\/json/);
  });
});

describe("Application middleware", () => {
  it("sets security headers via Helmet", async () => {
    const app = createApp();
    const res = await request(app).get("/health");
    // Helmet sets X-Content-Type-Options among others
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });

  it("returns 404 for unknown routes", async () => {
    const app = createApp();
    const res = await request(app).get("/this-does-not-exist");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("returns 404 with error field (no internal detail leakage)", async () => {
    const app = createApp();
    const res = await request(app).delete("/health");
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
    // Must not expose stack traces or internal messages
    expect(JSON.stringify(res.body)).not.toContain("at ");
  });
});

describe("Error handling", () => {
  it("returns JSON error body (not stack trace) for unknown routes", async () => {
    // Verify 404 for unknown routes has a clean JSON body with no internal leakage
    const app = createApp();
    const res = await request(app).get("/definitely-does-not-exist-xyz");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
    // Must NOT contain any stack trace or internal path info
    expect(JSON.stringify(res.body)).not.toMatch(/at [A-Z]/);
    expect(JSON.stringify(res.body)).not.toContain("node_modules");
    expect(JSON.stringify(res.body)).not.toContain("Error:");
  });

  it("AppError propagates correct status code and message", async () => {
    // Use static imports to ensure instanceof check works in same module scope
    const app = createApp([{
      method: "get",
      path: "/test-app-error",
      handler: asyncHandler(() => { throw new AppError(422, "unprocessable"); }),
    }]);

    const res = await request(app).get("/test-app-error");
    expect(res.status).toBe(422);
    expect(res.body).toEqual({ error: "unprocessable" });
  });

  it("generic Error produces 500 without leaking details", async () => {
    const app = createApp([{
      method: "get",
      path: "/test-crash",
      handler: asyncHandler(() => { throw new Error("database credentials leaked"); }),
    }]);

    const res = await request(app).get("/test-crash");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Internal server error" });
    expect(JSON.stringify(res.body)).not.toContain("database credentials");
  });
});
