import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { createApp } from "../src/app.js";
import { getEnv } from "../src/config/env.js";
import { logger } from "../src/config/logger.js";
import { closeDb } from "../src/db/client.js";

const certPath = path.resolve(process.cwd(), "localhost-cert.pem");
const keyPath = path.resolve(process.cwd(), "localhost-key.pem");

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  console.error("Missing TLS certificate/key:", certPath, keyPath);
  process.exit(1);
}

const key = fs.readFileSync(keyPath);
const cert = fs.readFileSync(certPath);

const env = getEnv();
const app = createApp();

const httpsPort = Number(process.env.HTTPS_PORT || 3443);
const server = https.createServer({ key, cert }, app);

server.listen(httpsPort, env.HOST, () => {
  logger.info({ port: httpsPort, host: env.HOST, env: env.NODE_ENV }, " HTTPS server started");
  console.log(`HTTPS server listening on https://${env.HOST}:${httpsPort}`);
});

async function shutdown(signal: string): Promise<void> {
  server.close(async () => {
    await closeDb();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
