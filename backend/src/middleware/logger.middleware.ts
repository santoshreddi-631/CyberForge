import pinoHttp from "pino-http";
import { logger } from "../config/logger.js";

/**
 * HTTP request/response logger middleware.
 *
 * PRD Privacy rule 5: "No personal data in logs."
 * - Request bodies are never serialised (serializers omit them).
 * - Sensitive query params are redacted.
 * - Response bodies are never logged.
 */
export const httpLogger = pinoHttp({
  logger,

  // Never log request bodies
  serializers: {
    req(req) {
      return {
        id: req.id,
        method: req.method,
        // Redact the 'value' query param (contains phone/UPI/etc.)
        url: (req.url as string | undefined)?.replace(/([?&]value=)[^&]*/g, "$1[Redacted]"),
        headers: {
          host: (req.headers as Record<string, string>).host,
          "user-agent": (req.headers as Record<string, string>)["user-agent"],
          "content-type": (req.headers as Record<string, string>)["content-type"],
        },
      };
    },
    res(res) {
      return {
        statusCode: res.statusCode,
      };
    },
  },

  // Do not log health checks to avoid log noise
  autoLogging: {
    ignore: (req) => req.url === "/health",
  },
});
