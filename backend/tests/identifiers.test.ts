import { describe, expect, it } from "vitest";
import {
  normalizePhoneNumber,
  normalizeSmsSenderId,
  normalizeUpiId,
  normalizeUrl,
} from "../src/modules/identifiers/normalize.js";
import { validateIdentifier } from "../src/modules/identifiers/validate.js";

describe("identifier canonicalization", () => {
  it.each([
    ["+91 98765 43210", "+919876543210"],
    ["09876543210", "+919876543210"],
    ["98765-43210", "+919876543210"],
    ["919876543210", "+919876543210"],
    ["+91 80 4100 2233", "+918041002233"],
    ["1800 1600", "18001600"],
    ["1 8 6 0 4 1 9 5 5 5 5", "18604195555"],
    ["1930", "1930"],
  ])("normalizes phone %s", (input, expected) => {
    expect(normalizePhoneNumber(input)).toBe(expected);
  });

  it("rejects arbitrary short numbers", () => {
    expect(validateIdentifier("phone", "12345")).toMatchObject({
      success: false,
      error: { code: "unsupported_format", path: ["value"] },
    });
  });

  it("normalizes UPI IDs without collapsing meaningful characters", () => {
    expect(normalizeUpiId(" Ravi12 @ OKAXIS ")).toBe("ravi12@okaxis");
    expect(normalizeUpiId("ravi12@okaxis")).toBe("ravi12@okaxis");
    expect(validateIdentifier("upi", "x@y@z").success).toBe(false);
  });

  it("canonicalizes links without network access", () => {
    expect(normalizeUrl("http://www.sbi-kyc.in/pay?utm=sms")).toBe("https://sbi-kyc.in/pay");
    expect(normalizeUrl("https://sbi-kyc.in/pay/")).toBe("https://sbi-kyc.in/pay");
    expect(normalizeUrl("https://example.com/a?x=1#fragment")).toBe("https://example.com/a");
    expect(validateIdentifier("url", "https://exa mple.com").success).toBe(false);
  });

  it.each([
    ["VM-HDFCBK", "HDFCBK"],
    ["AD-HDFCBK", "HDFCBK"],
    ["hdfcbk", "HDFCBK"],
  ])("normalizes sender %s", (input, expected) => {
    expect(normalizeSmsSenderId(input)).toBe(expected);
  });

  it("returns structured errors for malformed type and value", () => {
    expect(validateIdentifier("email", "a@b")).toEqual({
      success: false,
      error: {
        code: "invalid_type",
        message: "Identifier type must be phone, upi, url, or sender_id",
        path: ["type"],
      },
    });
    expect(validateIdentifier("phone", "１２３４５")).toMatchObject({
      success: false,
      error: { code: "unsupported_format" },
    });
  });

  it("matches all seeded verified aliases to their canonical keys", () => {
    expect(normalizePhoneNumber("1800 1600")).toBe("18001600");
    expect(normalizePhoneNumber("+91 80 4100 2233")).toBe("+918041002233");
    expect(normalizeUpiId("freshbakes@okaxis")).toBe("freshbakes@okaxis");
    expect(normalizeUrl("https://www.cybercrime.gov.in/")).toBe("https://cybercrime.gov.in");
    expect(normalizeSmsSenderId("VM-HDFCBK")).toBe("HDFCBK");
  });
});
