import pino from "pino";
import { getEnv } from "../config/env.js";

/**
 * Application-wide Pino logger.
 *
 * Redaction paths ensure that even if an object containing sensitive fields
 * is passed to the logger, those values are replaced with "[Redacted]".
 *
 * PRD Privacy rule 5: "No personal data in logs."
 */
export const logger = pino({
  level: getEnv().LOG_LEVEL,
  redact: {
    paths: [
      'reporter_id', 'ip_prefix', 'reporter_hmac', 'ip_prefix_hmac',
      '*.reporter_hmac', '*.ip_prefix_hmac',
      'claimant_name', 'contact_email', 'proof_note',
      '*.claimant_name', '*.contact_email', '*.proof_note',
      'REPORTER_HMAC_SECRET', '*.REPORTER_HMAC_SECRET',
      // Reporter identity fields
      "*.reporter_id",
      "*.ip_prefix",
      "*.reporter_phone",
      "*.reporter_name",
      // Note content (may contain personal details)
      "*.note",
      // HTTP request body (never log raw bodies)
      "req.body",
      "request.body",
    ],
    censor: "[Redacted]",
  },
  // In development, use pino-pretty if available; fall back to JSON silently
  transport:
    getEnv().NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
  base: {
    service: "community-scam-map",
    env: getEnv().NODE_ENV,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

