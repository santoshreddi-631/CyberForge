import { afterEach, describe, expect, it } from "vitest";
import { _resetEnvCache } from "../src/config/env.js";
import { isJudgingResetConfigured, resetDerivedState, ResetUnavailableError } from "../src/modules/admin/reset.service.js";

afterEach(() => {
  delete process.env.JUDGING_RESET_ENABLED;
  delete process.env.JUDGING_DATABASE_URL;
  delete process.env.JUDGING_DATABASE_DISPOSABLE;
  delete process.env.JUDGING_ENVIRONMENT;
  process.env.NODE_ENV = "test";
  _resetEnvCache();
});

describe("judging reset isolation", () => {
  it("fails closed when judging configuration is absent", () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://localhost:5432/cyberforge_test";
    _resetEnvCache();
    expect(isJudgingResetConfigured()).toBe(false);
  });

  it("rejects production even when all judging flags are present", () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://localhost:5432/cyberforge_test";
    process.env.JUDGING_RESET_ENABLED = "true";
    process.env.JUDGING_DATABASE_URL = process.env.DATABASE_URL;
    process.env.JUDGING_DATABASE_DISPOSABLE = "true";
    process.env.JUDGING_ENVIRONMENT = "judging";
    _resetEnvCache();
    expect(isJudgingResetConfigured()).toBe(false);
  });

  it("refuses destructive reset before opening a database in production", async () => {
    process.env.NODE_ENV = "production";
    process.env.DATABASE_URL = "postgresql://localhost:5432/cyberforge_test";
    process.env.JUDGING_RESET_ENABLED = "true";
    process.env.JUDGING_DATABASE_URL = process.env.DATABASE_URL;
    process.env.JUDGING_DATABASE_DISPOSABLE = "true";
    process.env.JUDGING_ENVIRONMENT = "judging";
    _resetEnvCache();
    await expect(resetDerivedState()).rejects.toBeInstanceOf(ResetUnavailableError);
  });

  it("requires an explicit disposable judging database configuration", () => {
    process.env.NODE_ENV = "test";
    process.env.DATABASE_URL = "postgresql://localhost:5432/cyberforge_test";
    process.env.JUDGING_RESET_ENABLED = "true";
    process.env.JUDGING_DATABASE_URL = "postgresql://localhost:5432/cyberforge_test";
    process.env.JUDGING_DATABASE_DISPOSABLE = "true";
    process.env.JUDGING_ENVIRONMENT = "judging";
    _resetEnvCache();
    expect(isJudgingResetConfigured()).toBe(true);

    process.env.JUDGING_DATABASE_URL = "postgresql://localhost:5432/other_test";
    _resetEnvCache();
    expect(isJudgingResetConfigured()).toBe(false);
  });
});
