import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import reference from "../src/db/seeds/reference.js";
import { normalizeIdentifier } from "../src/modules/identifiers/normalize.js";
import { challengeRequestSchema } from "../src/modules/challenges/challenges.schema.js";

describe("Phase 9 registry coverage", () => {
  it("contains every seeded Appendix C registry entry", () => {
    expect(reference.verified).toHaveLength(19);
    for (const [type, value] of reference.verified) {
      expect(normalizeIdentifier(type, value)).toBe(value);
    }
  });

  it("canonicalizes the official aliases and test business identifiers", () => {
    expect(normalizeIdentifier("phone", "+91 80 4100 2233")).toBe("+918041002233");
    expect(normalizeIdentifier("phone", "1800 1600")).toBe("18001600");
    expect(normalizeIdentifier("sender_id", "VM-HDFCBK")).toBe("HDFCBK");
    expect(normalizeIdentifier("url", "https://www.cybercrime.gov.in/")).toBe(
      "https://cybercrime.gov.in",
    );
    expect(normalizeIdentifier("upi", "FreshBakes @ OKAXIS")).toBe("freshbakes@okaxis");
  });
});

describe("challenge request validation and privacy boundary", () => {
  it("accepts exactly the public challenge request fields", () => {
    expect(challengeRequestSchema.parse({
      identifier_type: "phone",
      identifier_value: "+91 80 4100 2233",
      claimant_name: "Fresh Bakes",
      contact_email: "owner@example.com",
      proof_note: "GST certificate and shop licence attached.",
    })).toMatchObject({
      identifier_type: "phone",
      claimant_name: "Fresh Bakes",
    });
  });

  it("rejects malformed identifiers and private contact fields are not returned", async () => {
    const invalid = await request(createApp()).post("/challenges").send({
      identifier_type: "phone",
      identifier_value: "12345",
      claimant_name: "Fresh Bakes",
      contact_email: "owner@example.com",
      proof_note: "Proof",
    });
    expect(invalid.status).toBe(400);

    const malformed = await request(createApp()).post("/challenges").send({
      identifier_type: "phone",
      identifier_value: "+918041002233",
      claimant_name: "Fresh Bakes",
      contact_email: "not-an-email",
      proof_note: "Proof",
    });
    expect(malformed.status).toBe(400);
    expect(JSON.stringify(malformed.body)).not.toContain("not-an-email");
  });
});
