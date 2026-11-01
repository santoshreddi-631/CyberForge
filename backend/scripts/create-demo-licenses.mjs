import { createPrivateKey, sign } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const PRIV_KEY_HEX = "ff577f2a9a2deb9aef0b724431a6e278e095a89feb52a393b625a44e300bd234";

const privateDer = Buffer.concat([
  Buffer.from("302e020100300506032b657004220420", "hex"),
  Buffer.from(PRIV_KEY_HEX, "hex"),
]);
const privateKey = createPrivateKey({ key: privateDer, format: "der", type: "pkcs8" });

function issue(licensee, expiresAt) {
  const payload = { licensee, expires_at: new Date(expiresAt).toISOString() };
  const signature = sign(null, Buffer.from(JSON.stringify(payload), "utf8"), privateKey);
  return { ...payload, signature: signature.toString("base64") };
}

const dir = path.resolve(process.cwd(), "backend", "licenses");
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// 1. Five-minute trial licence
const trialLic = issue("Demo Bank - 5 Minute Evaluation", new Date(Date.now() + 5 * 60 * 1000).toISOString());
fs.writeFileSync(path.join(dir, "trial-5min-license.json"), JSON.stringify(trialLic, null, 2));

// 2. One-year production licence
const prodLic = issue("Demo Bank - 1 Year Production", new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString());
fs.writeFileSync(path.join(dir, "production-1year-license.json"), JSON.stringify(prodLic, null, 2));

console.log("Successfully generated:");
console.log("  backend/licenses/trial-5min-license.json");
console.log("  backend/licenses/production-1year-license.json");
