import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getEnv, _resetEnvCache } from "../src/config/env.js";

afterEach(() => {
  _resetEnvCache();
});

describe("Environment validation", () => {
  beforeEach(() => {
    _resetEnvCache();
    // Set a clean baseline
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
    delete process.env.PORT;
    delete process.env.LOG_LEVEL;
    delete process.env.CORS_ORIGIN;
    delete process.env.LICENCE_PUBLIC_KEY_HEX;
    delete process.env.HOST;
  });

  it("accepts valid environment and returns typed config", () => {
    const env = getEnv();
    expect(env.NODE_ENV).toBe("test");
    expect(env.DATABASE_URL).toBe("postgres://user:pass@localhost:5432/db");
    expect(env.PORT).toBe(3001); // default
    expect(env.LOG_LEVEL).toBe("info"); // default
  });

  it("caches parsed env on subsequent calls", () => {
    const first = getEnv();
    const second = getEnv();
    expect(first).toBe(second); // same object reference
  });

  it("throws clearly when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    _resetEnvCache();
    expect(() => getEnv()).toThrow(/DATABASE_URL/);
  });

  it("throws clearly when DATABASE_URL is not a URL", () => {
    process.env.DATABASE_URL = "not-a-url";
    _resetEnvCache();
    expect(() => getEnv()).toThrow(/Invalid environment/);
  });

  it("throws clearly when PORT is out of range", () => {
    process.env.PORT = "99999";
    _resetEnvCache();
    expect(() => getEnv()).toThrow(/Invalid environment/);
  });

  it("throws clearly when NODE_ENV is not an allowed value", () => {
    process.env.NODE_ENV = "staging";
    _resetEnvCache();
    expect(() => getEnv()).toThrow(/Invalid environment/);
  });

  it("accepts LOG_LEVEL=silent", () => {
    process.env.LOG_LEVEL = "silent";
    _resetEnvCache();
    const env = getEnv();
    expect(env.LOG_LEVEL).toBe("silent");
  });

  it("defaults destructive judging reset controls to disabled", () => {
    const env = getEnv();
    expect(env.JUDGING_RESET_ENABLED).toBe(false);
    expect(env.JUDGING_DATABASE_DISPOSABLE).toBe(false);
    expect(env.JUDGING_DATABASE_URL).toBeUndefined();
  });
});
