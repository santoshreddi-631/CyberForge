import { z } from "zod";

export const identifierTypes = ["phone", "upi", "url", "sender_id"] as const;
export const identifierTypeSchema = z.enum(identifierTypes);
export type IdentifierType = z.infer<typeof identifierTypeSchema>;

export interface CanonicalIdentifier {
  type: IdentifierType;
  value: string;
}

export type IdentifierErrorCode =
  | "invalid_type"
  | "invalid_value"
  | "unsupported_format";

export interface IdentifierValidationError {
  code: IdentifierErrorCode;
  message: string;
  path: ["type" | "value"];
}

export type IdentifierValidationResult =
  | { success: true; data: CanonicalIdentifier }
  | { success: false; error: IdentifierValidationError };
