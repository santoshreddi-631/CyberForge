import { describe, expect, it } from "vitest";
import { parseUpiQrPayload } from "../src/modules/identifiers/qr.js";
import { normalizeSmsSenderId, normalizeUrl } from "../src/modules/identifiers/normalize.js";

describe("optional QR, SMS, and shared-link verification", () => {
  it("extracts and canonicalizes only the UPI payee", () => {
    expect(parseUpiQrPayload(
      "upi://pay?pa=FreshBakes%40OKAXIS&pn=Fresh%20Bakes&am=1250&tn=private-order",
    )).toEqual({
      type: "upi",
      value: "freshbakes@okaxis",
    });
  });

  it.each([
    "",
    "https://example.com/qr",
    "upi://pay",
    "upi://pay?pa=bad",
    "upi://pay?pa=a%40okaxis&pa=b%40okaxis",
    "upi://evil?pa=freshbakes%40okaxis",
    "upi://pay?pa=freshbakes%40okaxis#fragment",
  ])("rejects malformed or unsupported QR payload %s", (payload) => {
    expect(() => parseUpiQrPayload(payload)).toThrow();
  });

  it("reuses URL and sender canonicalization without retaining message content", () => {
    expect(normalizeUrl("http://www.example.test/suspicious?message=private")).toBe(
      "https://example.test/suspicious",
    );
    expect(normalizeSmsSenderId("VM-HDFCBK")).toBe("HDFCBK");
    const result = parseUpiQrPayload("upi://pay?pa=freshbakes%40okaxis&tn=secret");
    expect(JSON.stringify(result)).not.toContain("secret");
  });
});
