import { z } from "zod";
import {
  identifierTypeSchema,
  type IdentifierType,
  type IdentifierValidationResult,
} from "./identifier.types.js";
import { normalizeIdentifier } from "./normalize.js";

export const identifierInputSchema = z.object({
  type: identifierTypeSchema,
  value: z.string().trim().min(1, "Identifier value is required"),
});

export function validateIdentifier(type: unknown, value: unknown): IdentifierValidationResult {
  const typeResult = identifierTypeSchema.safeParse(type);
  if (!typeResult.success) {
    return {
      success: false,
      error: {
        code: "invalid_type",
        message: "Identifier type must be phone, upi, url, or sender_id",
        path: ["type"],
      },
    };
  }

  const valueResult = z.string().safeParse(value);
  if (!valueResult.success || !valueResult.data.trim()) {
    return {
      success: false,
      error: {
        code: "invalid_value",
        message: "Identifier value must be a non-empty string",
        path: ["value"],
      },
    };
  }

  try {
    return {
      success: true,
      data: { type: typeResult.data, value: normalizeIdentifier(typeResult.data, valueResult.data) },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "unsupported_format",
        message: error instanceof Error ? error.message : "Identifier value is invalid",
        path: ["value"],
      },
    };
  }
}

export function canonicalizeIdentifier(type: IdentifierType, value: string): string {
  const result = validateIdentifier(type, value);
  if (!result.success) {
    throw new Error(result.error.message);
  }
  return result.data.value;
}
