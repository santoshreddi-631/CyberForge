import { describe, expect, it } from "vitest";
import {
  ANDROID_LOOKUP_TIMEOUT_MS,
  toAndroidRisk,
} from "../src/modules/lookup/android-contract.js";

describe("Android call-risk lookup contract", () => {
  it("uses a bounded timeout and keeps all four verdict states", () => {
    expect(ANDROID_LOOKUP_TIMEOUT_MS).toBe(300);
    for (const verdict of ["KNOWN_SCAM", "SUSPICIOUS", "NO_REPORTS", "VERIFIED_BUSINESS"] as const) {
      expect(toAndroidRisk(verdict).verdict).toBe(verdict);
    }
  });

  it("never treats NO_REPORTS or an unavailable lookup as safe", () => {
    expect(toAndroidRisk("NO_REPORTS")).toMatchObject({
      available: true,
      shouldWarn: true,
    });
    expect(toAndroidRisk(null, true)).toEqual({
      available: false,
      verdict: null,
      shouldWarn: true,
    });
  });

  it("does not warn for verified businesses", () => {
    expect(toAndroidRisk("VERIFIED_BUSINESS")).toMatchObject({
      available: true,
      shouldWarn: false,
    });
  });
});
