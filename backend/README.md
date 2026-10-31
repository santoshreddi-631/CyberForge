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

## Environment variables

See [`.env.example`](.env.example) for all variables and documentation.

**Required:**
- `DATABASE_URL` — PostgreSQL connection string

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

## Trust rules (anti-abuse)

> Full implementation in Phase 3. Summary for judges:

1. **IP deduplication** — `ip_prefix` is hashed; many reports from the same `/24` subnet in a short window count as one voice.
2. **Reporter deduplication** — `reporter_id` is hashed; one person reporting six times is 1 distinct reporter.
3. **Velocity gate** — >3 reports from the same hashed reporter within 1 hour → 429.
4. **Junk rejection** — identifiers that fail normalisation (e.g. "12345") → 400.
5. **Note diversity** — a copy-pasted note carries less weight than a unique one (Jaccard similarity check).
6. **Threshold gate** — `KNOWN_SCAM` requires ≥5 distinct trusted reporters; raw counts alone never trigger it.
7. **Challenge lock** — a number under business dispute is never `KNOWN_SCAM` while under review.

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

Or push to **Render / Railway / Fly.io** (free tier):
1. Connect your Git repository.
2. Set the environment variables from `.env.example`.
3. The `Dockerfile` handles the rest.

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

# Phase 2 database commands

The JavaScript database layer is documented in [src/db/README.md](src/db/README.md).
Configure `DATABASE_URL`, then run `npm run db:migrate` and `npm run db:seed`.
Set a separate local `TEST_DATABASE_URL` ending in `_test` before `npm test`.
The test runner resets that dedicated database's application schemas.
New database modules use JavaScript; the existing Phase 1 Express application is preserved.
See [the Phase 2 audit](audits/PHASE-02.md) for verified migration and test results.

