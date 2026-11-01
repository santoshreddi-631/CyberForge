import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { logger } from "./config/logger.js";
import { closeDb } from "./db/client.js";

/**
 * Application entry point.
 *
 * Responsibilities:
 * 1. Validate environment variables (getEnv() throws on failure).
 * 2. Create and start the Express HTTP server.
 * 3. Register graceful shutdown handlers for SIGTERM and SIGINT.
 *
 * Design decision: The server creation is isolated in app.ts so tests can
 * import createApp() without binding to a port.
 */
async function main(): Promise<void> {
  // Fail fast if env is invalid
  const env = getEnv();

  // ── Auto-migrate and seed database on startup (for Free Tier cloud deploys) ──
  try {
    const { getDb } = await import("./db/client.js");
    const { runMigrations } = await import("./db/migrations/run.js");
    const { seed } = await import("./db/seeds/run.js");

    const client = getDb();
    logger.info("Executing database schema migrations...");
    await runMigrations(client);
    logger.info("Executing reference data seed...");
    await seed(client);
    logger.info("Database schema and seeds are ready");
  } catch (dbErr) {
    logger.error({ err: dbErr }, "Database auto-migration/seed error on startup");
  }

  const app = createApp();

  const server = app.listen(env.PORT, env.HOST, () => {
    logger.info(
      { port: env.PORT, host: env.HOST, env: env.NODE_ENV },
      "Community Scam Map server started"
    );
  });

  // ── Graceful shutdown ---------------------------------
  async function shutdown(signal: string): Promise<void> {
    logger.info({ signal }, "Shutdown signal received");

    server.close(async () => {
      logger.info("HTTP server closed");
      await closeDb();
      logger.info("Shutdown complete");
      process.exit(0);
    });

    // Force exit if shutdown takes too long
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10_000).unref();
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception – shutting down");
    void shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.fatal({ reason }, "Unhandled promise rejection – shutting down");
    void shutdown("unhandledRejection");
  });
}

main().catch((err: unknown) => {
  // Logger may not be initialised yet — write to stderr directly
  process.stderr.write(`Fatal startup error: ${String(err)}\n`);
  process.exit(1);
});



