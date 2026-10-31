import { getDb } from "../../db/client.js";
import { canonicalizeIdentifier } from "../identifiers/validate.js";
import { getEnv } from "../../config/env.js";
import { normalizeScamType } from "../../db/seeds/reference.js";
import {
  ReportValidationError,
  storeReport,
  type StoredReport,
} from "./reports.repository.js";
import { sanitizeNote, type ReportRequest } from "./reports.schema.js";

export async function ingestReport(request: ReportRequest): Promise<StoredReport> {
  const env = getEnv();
  if (!env.REPORTER_HMAC_SECRET) {
    throw new Error("REPORTER_HMAC_SECRET is required to ingest reports");
  }

  let normalizedValue: string;
  try {
    normalizedValue = canonicalizeIdentifier(request.identifier_type, request.identifier_value);
  } catch (error) {
    throw new ReportValidationError(error instanceof Error ? error.message : "Identifier value is invalid");
  }
  return storeReport(getDb(), env.REPORTER_HMAC_SECRET, {
    ...request,
    scam_type: normalizeScamType(request.scam_type),
    normalized_value: normalizedValue,
    sanitized_note: sanitizeNote(request.note),
  });
}
