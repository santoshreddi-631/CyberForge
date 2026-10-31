import express, { type Express, type RequestHandler } from "express";
import helmet from "helmet";
import cors from "cors";
import { getEnv } from "./config/env.js";
import { httpLogger } from "./middleware/logger.middleware.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";
import { healthRouter } from "./routes/health.router.js";
import { reportsRouter } from "./modules/reports/reports.routes.js";
import { lookupRouter } from "./modules/lookup/lookup.routes.js";
import { mapRouter } from "./modules/geo/map.routes.js";
import { alertsRouter } from "./modules/alerts/alerts.routes.js";
import { challengesRouter } from "./modules/challenges/challenges.routes.js";
import { licenseRouter } from "./modules/licensing/license.routes.js";
import { licenseMiddleware } from "./modules/licensing/license.middleware.js";
import { resetRouter } from "./modules/admin/reset.routes.js";

/**
 * Creates and configures the Express application.
 *
 * Middleware stack (order is significant):
 * 1. Helmet    – sets security HTTP headers first, before anything is emitted.
 * 2. CORS      – must come before route handlers; preflight OPTIONS requests
 *                are handled here.
 * 3. httpLogger – logs every request/response pair without capturing bodies.
 * 4. JSON body parser – parses application/json bodies up to 100 kb.
 * 5. Routes    – business logic.
 * 6. testRoutes – optional routes injected by tests before catch-alls.
 * 7. notFound  – catches any un-matched route and returns 404.
 * 8. error     – catches any error thrown or passed via next(err).
 *
 * PRD: "No mandatory user login" – no authentication middleware is applied.
 * PRD: "No login on these seven addresses" (API rule #5).
 *
 * @param testRoutes Optional array of [method, path, handler] tuples for testing.
 * @returns Configured Express application instance
 */
export function createApp(
  testRoutes: Array<{ method: "get" | "post" | "put" | "delete"; path: string; handler: RequestHandler }> = []
): Express {
  const env = getEnv();
  const app = express();

  // ── 1. Helmet (security headers) ─────────────────────────────────────────
  app.use(
    helmet({
      // Content-Security-Policy is relaxed for API-only server
      contentSecurityPolicy: false,
    })
  );

  // ── 2. CORS -------------------------------------------------------------
  app.use(
    cors({
      origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(","),
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      maxAge: 600, // cache preflight for 10 minutes
    })
  );

  // ── 3. HTTP logger ────────────────────────────────────────────────────────
  app.use(httpLogger);

  // ── 4. Body parsers ───────────────────────────────────────────────────────
  // Limit body size to mitigate request flooding / memory exhaustion
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));

  // Trust proxy headers from load balancers (Render, Railway, etc.)
  // This ensures req.ip reflects the real client IP, not the proxy's.
  app.set("trust proxy", 1);

  // ── 5. Routes ─────────────────────────────────────────────────────────────
  app.use(licenseMiddleware);
  app.use("/health", healthRouter);

  app.use("/reports", reportsRouter);
  app.use("/lookup", lookupRouter);
  app.use("/map", mapRouter);
  app.use("/alerts", alertsRouter);
  app.use("/admin/reset", resetRouter);
  app.use("/challenges", challengesRouter);
  app.use("/license", licenseRouter);

  // ── 6. Test-injected routes (inserted before catch-alls) ─────────────────
  for (const { method, path, handler } of testRoutes) {
    app[method](path, handler);
  }

  // ── 7. 404 handler ────────────────────────────────────────────────────────
  app.use(notFoundMiddleware);

  // ── 8. Centralised error handler ──────────────────────────────────────────
  app.use(errorMiddleware);

  return app;
}
