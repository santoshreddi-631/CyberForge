import { sql } from "drizzle-orm";
import { createClient } from "../../db/client.js";
import { canonicalizeIdentifier } from "../identifiers/validate.js";
import type { ChallengeRequest } from "./challenges.schema.js";

type DatabaseClient = ReturnType<typeof createClient>;

export class ChallengeValidationError extends Error {
  readonly code = "CHALLENGE_VALIDATION_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "ChallengeValidationError";
  }
}

export interface StoredChallenge {
  challengeId: string;
  status: "under_review";
}

function privateText(value: string): string {
  return value
    .normalize("NFKC")
    .split("")
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint >= 0x20 && codePoint !== 0x7f;
    })
    .join("")
    .replace(/\s+/gu, " ")
    .trim();
}

export async function submitChallenge(
  client: DatabaseClient,
  request: ChallengeRequest,
): Promise<StoredChallenge> {
  let normalizedValue: string;
  try {
    normalizedValue = canonicalizeIdentifier(request.identifier_type, request.identifier_value);
  } catch (error) {
    throw new ChallengeValidationError(error instanceof Error ? error.message : "Identifier value is invalid");
  }

  const claimantName = privateText(request.claimant_name);
  const proofNote = privateText(request.proof_note);
  if (!claimantName || !proofNote) {
    throw new ChallengeValidationError("Claimant details must not be empty");
  }

  return client.db.transaction(async (tx) => {
    await tx.execute(sql`
      SELECT pg_advisory_xact_lock(hashtext(${`${request.identifier_type}:${normalizedValue}`}))
    `);

    const [identifier] = await tx.execute(sql`
      INSERT INTO identifiers(identifier_type, normalized_value)
      VALUES (${request.identifier_type}, ${normalizedValue})
      ON CONFLICT(identifier_type, normalized_value)
      DO UPDATE SET normalized_value = excluded.normalized_value
      RETURNING id
    `);

    const [existing] = await tx.execute(sql`
      SELECT id, status
      FROM challenges
      WHERE identifier_id = ${identifier.id}
        AND status = 'under_review'
      ORDER BY created_at ASC
      LIMIT 1
    `);
    if (existing) {
      return {
        challengeId: String(existing.id),
        status: "under_review",
      };
    }

    const [challenge] = await tx.execute(sql`
      INSERT INTO challenges(identifier_id, status)
      VALUES (${identifier.id}, 'under_review')
      RETURNING id
    `);

    await tx.execute(sql`
      INSERT INTO restricted.challenge_contacts(
        challenge_id, claimant_name, contact_email, proof_note
      ) VALUES (
        ${challenge.id}, ${claimantName}, ${request.contact_email.trim()}, ${proofNote}
      )
    `);

    return {
      challengeId: String(challenge.id),
      status: "under_review",
    };
  });
}
