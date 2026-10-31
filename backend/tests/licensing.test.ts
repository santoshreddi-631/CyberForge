import { describe, expect, it, afterEach } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import request from "supertest";
import { createApp } from "../src/app.js";
import {
  licenseCanonicalPayload,
  verifyLicenseSignature,
} from "../src/modules/licensing/license.service.js";

function publicKeyHex(publicKey: ReturnType<typeof generateKeyPairSync>["publicKey"]): string {
  return publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
}

afterEach(() => {
  delete process.env.LICENSE_ENFORCEMENT_TEST;
});

describe("signed licence primitives", () => {
  it("verifies canonical Ed25519 signatures and rejects tampering", () => {
    const pair = generateKeyPairSync("ed25519");
    const document = {
      licensee: "Judge",
      expires_at: "2027-01-01T00:00:00.000Z",
      signature: "",
    };
    document.signature = sign(null, licenseCanonicalPayload(document.licensee, document.expires_at), pair.privateKey)
      .toString("base64");
    const key = publicKeyHex(pair.publicKey);

    expect(verifyLicenseSignature(document, key)).toBe(true);
    expect(verifyLicenseSignature({ ...document, licensee: "Tampered" }, key)).toBe(false);
    expect(verifyLicenseSignature({ ...document, signature: "invalid" }, key)).toBe(false);
  });
});

describe("licence route exemptions", () => {
  it("keeps health and licence status reachable without a database licence row", async () => {
    const app = createApp();
    expect((await request(app).get("/health")).status).toBe(200);
    const response = await request(app).get("/license");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      valid: false,
      expired: false,
    });
  });

  it("rejects malformed licence documents with 400", async () => {
    const response = await request(createApp()).post("/license").send({
      licensee: "Judge",
      expires_at: "not-a-date",
      signature: "bad",
    });
    expect(response.status).toBe(400);
  });
});
