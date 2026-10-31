import { createPrivateKey, generateKeyPairSync, sign } from "node:crypto";

const licensee = process.argv[2] ?? "CyberForge Demonstration";
const expiresAt = process.argv[3] ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
const privateKeyHex = process.env.LICENCE_PRIVATE_KEY_HEX;

if (!privateKeyHex) {
  const pair = generateKeyPairSync("ed25519");
  const publicDer = pair.publicKey.export({ type: "spki", format: "der" });
  const privateDer = pair.privateKey.export({ type: "pkcs8", format: "der" });
  process.stdout.write(JSON.stringify({
    message: "Generated demonstration key pair. Keep the private key offline.",
    public_key_hex: publicDer.subarray(-32).toString("hex"),
    private_key_hex: privateDer.subarray(-32).toString("hex"),
  }, null, 2) + "\n");
  process.exit(0);
}

if (!/^[0-9a-f]{64}$/iu.test(privateKeyHex)) {
  throw new Error("LICENCE_PRIVATE_KEY_HEX must contain 32 bytes");
}
const privateDer = Buffer.concat([
  Buffer.from("302e020100300506032b657004220420", "hex"),
  Buffer.from(privateKeyHex, "hex"),
]);
const privateKey = createPrivateKey({ key: privateDer, format: "der", type: "pkcs8" });
const payload = { licensee, expires_at: new Date(expiresAt).toISOString() };
const signature = sign(null, Buffer.from(JSON.stringify(payload), "utf8"), privateKey);
process.stdout.write(JSON.stringify({ ...payload, signature: signature.toString("base64") }, null, 2) + "\n");
