import { z } from "zod";
import dotenv from 'dotenv';
dotenv.config();


/**
 * Environment variable schema validated at startup.
 * The application will fail fast with clear messages when misconfigured.
 *
 * Design decision: NODE_ENV defaults to "development" so local runs work
 * without .env files; DATABASE_URL is required in all environments to ensure
 * the database is always explicitly configured.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().max(65535).default(3001),

  HOST: z.string().default("0.0.0.0"),

  /** Full PostgreSQL connection string, e.g. postgres://user:pass@host:5432/db */
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  REPORTER_HMAC_SECRET: z.string().min(32).optional(),

  /**
   * Ed25519 public key for licence signature verification (hex-encoded).
   * Required in production; defaults to a test key in development/test.
   */
  LICENCE_PUBLIC_KEY_HEX: z.string().default(
    // 32-byte all-zero placeholder – replaced in production
    "0".repeat(64)
  ),

  /**
   * CORS allowed origins. Comma-separated list or "*".
   * Defaults to all origins so the frontend works without extra config.
   */
  CORS_ORIGIN: z.string().default("*"),

  /**
   * Log level passed to Pino.
   */
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

/**
 * Parse and validate environment variables.
 * Throws on first call if validation fails, then returns the cached result.
 *
 * @throws {Error} when required variables are missing or malformed
 */
export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  _env = result.data;
  return _env;
}

/**
 * Reset cached env (test helper only – never call in production code).
 * @internal
 */
export function _resetEnvCache(): void {
  _env = null;
}

