import type { Request, Response, NextFunction, ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger.js";

/**
 * Shape of a well-formed error response.
 * PRD: error replies use {"error": "..."} format.
 */
interface ErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * Custom application error with an associated HTTP status code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly expose: boolean;

  constructor(statusCode: number, message: string, expose = true) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.expose = expose;
  }
}

/**
 * Centralised Express error handler.
 *
 * Rules:
 * 1. ZodError  → 400 with field-level messages (validation failures).
 * 2. AppError  → the status code the thrower specified.
 * 3. Everything else → 500 with a generic message (no internal details leaked).
 *
 * PRD Security: "Unexpected errors do not leak internal details."
 * PRD API: error replies use {"error": "..."}.
 */
export const errorMiddleware: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // ── Zod validation errors ───────────────────────────────────────────────
  if (err instanceof ZodError) {
    const details = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    res.status(400).json({ error: "Validation error", details } satisfies ErrorResponse);
    return;
  }

  // ── Known application errors ────────────────────────────────────────────
  if (err instanceof AppError) {
    if (!err.expose || err.statusCode >= 500) {
      logger.error({ err }, "Application error");
    }
    res.status(err.statusCode).json({ error: err.message } satisfies ErrorResponse);
    return;
  }

  // ── Unexpected errors – never expose internals ──────────────────────────
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" } satisfies ErrorResponse);
};

/**
 * 404 handler — placed after all routes.
 */
export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` } satisfies ErrorResponse);
}

/**
 * Wraps a route handler so that any thrown error or rejected promise is
 * forwarded to the centralised error handler via next().
 *
 * Express 5 natively forwards async rejections, but synchronous throws in
 * dynamically-added routes (e.g. during tests) still need this wrapper.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = fn(req, res, next);
      if (result instanceof Promise) {
        result.catch(next);
      }
    } catch (err) {
      next(err);
    }
  };
}
