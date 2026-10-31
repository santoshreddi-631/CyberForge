import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createApp } from "../../src/app.ts";
import { closeDb } from "../../src/db/client.js";

const markers = {
  reporter: process.env.PHASE17_LOG_REPORTER!,
  prefix: process.env.PHASE17_LOG_PREFIX!,
  note: process.env.PHASE17_LOG_NOTE!,
  contactName: process.env.PHASE17_LOG_CONTACT_NAME!,
  contactEmail: process.env.PHASE17_LOG_CONTACT_EMAIL!,
  proof: process.env.PHASE17_LOG_PROOF!,
};
const phone = process.env.PHASE17_LOG_PHONE!;
const app = createApp([{
  method: "get",
  path: "/phase17-error",
  handler: (_request, _response, next) => next(new Error(markers.proof)),
}]);
const server = createServer(app);

async function main(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  try {
    const address = server.address();
    assert(address && typeof address !== "string");
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const report = await fetch(`${baseUrl}/reports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        report_id: `phase17-log-${markers.reporter}`,
        occurred_at: new Date(Date.now() - 90_000).toISOString(),
        reported_at: new Date().toISOString(),
        reporter_id: markers.reporter,
        ip_prefix: markers.prefix,
        channel: "Phone call",
        scam_type: "fake-customer-care",
        identifier_type: "phone",
        identifier_value: phone,
        pincode: "560102",
        locality: "HSR Layout",
        city: "Bengaluru",
        note: markers.note,
        has_screenshot: false,
        amount_lost_inr: 0,
      }),
    });
    assert.equal(report.status, 201);

    const lookup = await fetch(`${baseUrl}/lookup?type=phone&value=${encodeURIComponent(phone)}`);
    assert.equal(lookup.status, 200);

    const challenge = await fetch(`${baseUrl}/challenges`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier_type: "phone",
        identifier_value: phone,
        claimant_name: markers.contactName,
        contact_email: markers.contactEmail,
        proof_note: markers.proof,
      }),
    });
    assert.equal(challenge.status, 201);

    const validation = await fetch(`${baseUrl}/reports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reporter_id: markers.reporter, ip_prefix: markers.prefix, note: markers.note }),
    });
    assert.equal(validation.status, 400);

    const internalError = await fetch(`${baseUrl}/phase17-error`);
    assert.equal(internalError.status, 500);
    assert.deepEqual(await internalError.json(), { error: "Internal server error" });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await closeDb();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(error instanceof Error ? error.stack ?? error.message : "production log probe failed");
  process.exitCode = 1;
});
