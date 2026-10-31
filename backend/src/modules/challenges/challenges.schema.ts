import { z } from "zod";
import { identifierTypeSchema } from "../identifiers/identifier.types.js";

export const challengeRequestSchema = z.object({
  identifier_type: identifierTypeSchema,
  identifier_value: z.string().trim().min(1, "identifier_value is required").max(2048),
  claimant_name: z.string().trim().min(1, "claimant_name is required").max(200),
  contact_email: z.string().trim().email("contact_email must be a valid email address").max(320),
  proof_note: z.string().trim().min(1, "proof_note is required").max(5000),
});

export type ChallengeRequest = z.infer<typeof challengeRequestSchema>;
