# Community Scam Map — Backend

Node.js 24 + Express 5 + TypeScript backend for the Community Scam Map hackathon project.

## Quick start

```bash
cd backend
cp .env.example .env          # Edit DATABASE_URL at minimum
npm install
npm run dev                   # Hot-reload on http://localhost:3001
```

```bash
curl http://localhost:3001/health
# {"ok":true}
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with hot-reload (tsx watch) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled output |
| `npm run lint` | ESLint |
| `npm run typecheck` | tsc --noEmit |
| `npm test` | Vitest (all tests) |
| `npm run test:coverage` | Vitest with V8 coverage |
| `npm run db:migrate` | Apply PostgreSQL migrations |
| `npm run db:seed` | Upsert Appendix B/C reference data |
| `npm run db:cleanup-demo` | Delete marked demo reports in an isolated judging database |
| `npm run license:issue` | Generate an offline demonstration licence/keypair |
| `npm run test:db:prepare` | Reset and seed a validated local `*_test` database |

## Environment variables

See [`.env.example`](.env.example) for all variables and documentation.

**Required:**
- `DATABASE_URL` — PostgreSQL connection string

For production also configure:

- `REPORTER_HMAC_SECRET` — at least 32 random bytes; never commit or log it.
- `LICENCE_PUBLIC_KEY_HEX` — Ed25519 public key only; keep the private signing
  key offline.
- `CORS_ORIGIN` — comma-separated trusted Next.js origin(s), not `*` in
  production.

`TEST_DATABASE_URL` is only for a disposable local database whose name ends in
`_test`. The application never uses it.

The normal `npm run dev` command uses HTTP and does not require TLS files. The
optional HTTPS demo reads `localhost-key.pem` and `localhost-cert.pem`; these
are local-only files and are intentionally ignored by Git. Generate a
development certificate/key pair locally before running `scripts/start-https.ts`
and never commit either file:

```powershell
openssl req -x509 -newkey rsa:2048 -nodes `
  -keyout localhost-key.pem -out localhost-cert.pem -days 365 `
  -subj "/CN=localhost"
```

`POST /admin/reset` is fail-closed unless `JUDGING_RESET_ENABLED=true`,
`JUDGING_DATABASE_DISPOSABLE=true`, `JUDGING_ENVIRONMENT=judging`, and
`JUDGING_DATABASE_URL` exactly matches `DATABASE_URL`. It is also rejected when
`NODE_ENV=production`; use a separate disposable judging deployment/database.
The database-name suffix is not used as the safety control.

For local judge cleanup, set `CLEANUP_DEMO_DATA=true` and run
`npm run db:cleanup-demo`. This command only runs in the explicitly configured
disposable judging database and deletes report IDs with known demo prefixes
(`judge-demo-`, `bot-`, `phase11-`, `phase17-`, `phase18-`, `rep_test_`, and
`demo-`). It preserves areas, scam types, channels, verified identifiers,
licence state, and the normalized schema.

## Architecture

```
src/
  config/       env.ts, logger.ts        — configuration, typed env, Pino
  db/           client.ts                — Drizzle ORM + postgres.js pool
  middleware/   error.middleware.ts       — centralised error + 404 handler
                logger.middleware.ts     — pino-http request logger
  routes/       health.router.ts         — GET /health
  app.ts                                 — Express app factory
  server.ts                             — entry point, graceful shutdown

contracts/
  openapi.yaml                          — OpenAPI 3.1 contract (source of truth)

tests/
  health.test.ts                        — health + middleware + stub tests
  env.test.ts                           — environment validation tests
```

## Frontend endpoint coverage

The Next.js frontend is wired to every product API:

| Backend endpoint | Frontend usage |
|---|---|
| `POST /reports` | Report form |
| `GET /lookup` | Lookup page and result links |
| `GET /api/v1/map` | Map page |
| `GET /alerts` | Alerts page |
| `POST /challenges` | Dispute form |

`GET /health`, `GET/POST /license`, and `POST /admin/reset` are operational or
judging endpoints and are intentionally not called by the public frontend.
`GET /map` remains as the legacy/contract-compatible alias; the frontend uses
the richer `/api/v1/map` response.

## Trust rules (anti-abuse)

> Full implementation in Phase 3. Summary for judges:

1. **Reporter/network pairing** — `reporter_id` and `ip_prefix` are HMACed. A deterministic maximum matching selects at most one report per reporter and one per network prefix for each trusted case. A shared connection can still submit reports, but contributes at most one eligible voice.
2. **Threshold gate** — `KNOWN_SCAM` requires at least 5 selected reporter/network voices, at least 3 network prefixes, 2 event-time buckets, and an evidence score of at least 0.65. Raw report count alone never triggers it.
3. **Velocity gate** — at most 3 reports from one HMACed reporter in the previous server-clock hour; subsequent reports receive `429`. A PostgreSQL advisory lock serializes this check across different identifiers.
4. **Event-time signals** — burst and note-concentration rules use `occurred_at`; map and alert windows also continue to use `occurred_at`. Caller-supplied `reported_at` does not control abuse limits.
5. **Junk rejection** — identifiers that fail normalization (e.g. "12345") receive `400`.
6. **Evidence and coordination** — substantive descriptions, screenshot presence, copied-note concentration, event-time spread, and concentrated fast bursts contribute to deterministic trust scoring. Exact normalized note matches are counted; this is not semantic similarity analysis.
7. **Challenge and registry precedence** — a verified identifier remains `VERIFIED_BUSINESS`; an identifier under review cannot become `KNOWN_SCAM`.

**Trade-off:** grouping a whole case to one eligible reporter per network reduces coordinated false positives, while retaining every submission for review and counts. It can undercount unrelated people sharing household, workplace or public Wi-Fi. Those reports still contribute raw case context, but they need corroboration from other network prefixes to cross the trust threshold.

## Licence system

The server uses Ed25519 signatures (Node.js `crypto` built-in).

```
Private key (your laptop) → signs {licensee, expires_at}
Public key (embedded in code) → verifies on every request
```

- `GET /license` — shows who it's licensed to and when it expires.
- `POST /license` — upload a new licence JSON; activates immediately, no restart.
- Expired: all endpoints except `/health` and `/license` return `403 {"error":"LICENSE_EXPIRED"}`.
- Clock-skew guard: server saves the highest `expires_at` it has ever seen and rejects licences that would roll it back.

## Deployment

```bash
docker build -t scammap-backend .
docker run -p 3001:3001 --env-file .env scammap-backend
```

### Render or Railway

1. Create a managed PostgreSQL database and keep its private connection URL.
2. Create a web service from this repository with `backend` as the root
   directory.
3. Build with `npm ci && npm run build`; start with `npm start`.
4. Configure `DATABASE_URL`, `REPORTER_HMAC_SECRET`,
   `LICENCE_PUBLIC_KEY_HEX`, `CORS_ORIGIN`, `NODE_ENV=production`, `HOST=0.0.0.0`,
   and `PORT` supplied by the platform.
5. Run migrations once from a deployment shell:

   ```bash
   npm run db:migrate
   npm run db:seed
   ```

6. Issue a licence offline with `npm run license:issue`, then POST the signed
   JSON to `/license` over HTTPS.
7. Verify `/health`, `/license`, `/lookup`, `/map`, and `/alerts` through the
   deployed HTTPS URL. Do not treat a deployment as verified until those
   requests succeed.

Do not set `LICENCE_PRIVATE_KEY_HEX` on the service. Keep the reset endpoint in
a dedicated non-production judging deployment/database; its route remains
unauthenticated for the PRD judging tool, but the application refuses reset
when the explicit disposable-environment controls are absent or invalid.

## PRD compliance notes

| PRD requirement | Implementation |
|---|---|
| No mandatory login | No auth middleware on any endpoint |
| Never store reporter name/phone/exact GPS | Only hashed `reporter_id` and `ip_prefix` stored |
| Mask numbers < 3 reporters | `display_value` logic in lookup service |
| Say "reported" not "scammer" | Enforced in response schema |
| No personal data in logs | Pino redaction list covers all sensitive fields |
| Lookup < 500 ms | Indexed query on normalised identifier |
| Report UX < 60 s | Single-screen form, no login required |

## Database and judge demonstration

The JavaScript database layer is documented in [src/db/README.md](src/db/README.md).
Configure `DATABASE_URL`, then run `npm run db:migrate` and `npm run db:seed`.
Set a separate local `TEST_DATABASE_URL` ending in `_test` before `npm test`.
The test runner resets that dedicated database's application schemas.
New database modules use JavaScript; the existing Phase 1 Express application is preserved.
See [the Phase 2 audit](audits/PHASE-02.md) for verified migration and test results.
Run the three-minute local demonstration with:

```powershell
.\scripts\judge-demo.ps1 -BaseUrl http://localhost:3001
```

See [PHASE-12.md](audits/PHASE-12.md) for deployment verification status,
reproducible commands, and known operational limitations.

## Optional Android call-risk integration

The backend intentionally does not intercept calls or add a second lookup API.
An Android `CallScreeningService` can call the existing
`GET /lookup?type=phone&value=...` endpoint, apply a client timeout of
300 ms, and use the conservative adapter in
`src/modules/lookup/android-contract.ts`.

The adapter preserves all four verdicts. `NO_REPORTS` means unknown, never
safe; a timeout or unavailable response is also treated conservatively. The
integration collects no audio, contact list, or call log. Native call
screening and user-facing blocking decisions belong in Kotlin and Android
platform APIs, not Express.

## Optional QR, SMS, and shared-link verification

The existing `/lookup` endpoint remains the only public verification API.
The frontend can submit an explicitly selected suspicious URL, UPI ID, or SMS
sender ID after applying the existing canonicalization rules. A future QR
scanner can pass a decoded `upi://pay?...` payload through
`parseUpiQrPayload`; it extracts only `pa` and discards merchant names, notes,
amounts, and all other payload fields. Android or browser clients own camera
scanning and SMS presentation; the backend never reads an SMS inbox or stores
message content.
