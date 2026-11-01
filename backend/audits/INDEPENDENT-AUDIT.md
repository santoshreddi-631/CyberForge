#  — Independent Backend Audit

**Audit outcome: FAIL for release readiness.** The Express application and PostgreSQL implementation are real and most local integration checks pass. The release is not safe to call complete because the unauthenticated reset is not isolated from production data, expired signed licences can be submitted successfully, and the anti-abuse controls have bypass gaps. Public deployment over HTTPS was not available to verify.

## Scope and method

I read the complete 14-page `PRD_Community_Scam_Map.pdf`, including Appendices A–C, then inspected the current routes, controllers, services, SQL migration, reference seed, middleware, test harness and adversarial tests. I made no application-code changes. I created the four requested audit documents and adjusted the root `.gitignore` so only these new deliverables are visible; existing phase audits remain ignored.

The API and database tests ran against a new PostgreSQL 18 database named `community_audit_test`, bound to `127.0.0.1:55439` in a disposable system-temp cluster. Test setup explicitly refuses a remote database or a database whose name does not end in `_test`; the E2E harness and database suite reset schemas in that database. The cluster was stopped and its temporary files removed after the run.

## Architecture and implementation map

Express routes are registered in [src/app.ts](../src/app.ts): `GET /health`, `POST /reports`, `GET /lookup`, `GET /map`, `GET /alerts`, `POST /admin/reset`, `POST /challenges`, and both `/license` methods. No product endpoint is only a placeholder. The application is a modular monolith with route/controller/service/repository boundaries, Drizzle/PostgreSQL persistence, and no separate services.

| Feature | Main implementation | Main function |
|---|---|---|
| App and routes | `backend/src/app.ts` | `createApp` |
| Health | `backend/src/routes/health.router.ts` | route handler at line 19 |
| Report validation and ingestion | `backend/src/modules/reports/reports.controller.ts`, `reports.service.ts` | `createReportController`, `ingestReport` |
| Report transaction and trust writes | `backend/src/modules/reports/reports.repository.ts` | `storeReport` |
| Identifier normalization | `backend/src/modules/identifiers/normalize.ts`, `validate.ts` | `normalizeIdentifier`, `canonicalizeIdentifier` |
| Trust rules | `backend/src/modules/trust/trust-engine.ts`, `trust-signals.ts` | `evaluateTrust`, `buildTrustSignals` |
| Lookup and masking | `backend/src/modules/lookup/lookup.service.ts`, `masking.ts` | `lookupIdentifier`, `maskIdentifier` |
| Map | `backend/src/modules/geo/map.service.ts`, `distance.ts` | `getMapClusters`, `haversineDistanceKm` |
| Alerts | `backend/src/modules/alerts/alerts.service.ts`, `alert-rules.ts` | `getAlerts`, `qualifiesForSpike`, `calculateAlertWindows` |
| Challenges | `backend/src/modules/challenges/challenges.service.ts` | `submitChallenge` |
| Licences | `backend/src/modules/licensing/license.service.ts` | `verifyLicenseSignature`, `activateLicense`, `getLicenseStatus` |
| Reset | `backend/src/modules/admin/reset.service.ts` | `resetDerivedState` |
| Database and reference data | `backend/src/db/migrations/0000_database.sql`, `src/db/seeds/reference.js` | DDL and static PRD reference rows |

## API and database findings

All nine PRD endpoints are registered and the database-backed E2E suite sends HTTP requests to all of them. It checks health's exact response, report creation and identifier validation, all lookup verdicts, map and alert results, challenge privacy, licence expiry/renewal, and reset behavior. Reference values in the seed were compared with Appendix B/C: all 25 area tuples and all 19 canonical verified identifiers match. The 12 scam names plus the `other` fallback and all six report channels are present. The tests also run migrations twice from an empty schema and seed twice.

The SQL migration uses UUID primary keys, `timestamptz`, foreign keys, check constraints, unique keys, and indexes for normalized identifier, case/time, area/time, area/type/time, reporter/time and network/time access. Challenge contact data is in `restricted.challenge_contacts`; PUBLIC privileges are revoked. PostgreSQL owner/superuser privileges can still read that schema, and no production least-privilege role was configured or verified.

The published OpenAPI contract and runtime validation differ for `/map`: OpenAPI allows `days` through 90 and `radius_km` from 0.1, while the controller allows 1–30 days and 0–100 km. `/alerts` returns 400 for an unsupported pincode, but the OpenAPI response list omits that status. The PRD itself specifies the map defaults and the 25 required areas, but no 90-day maximum; this is still a concrete runtime-versus-published-contract inconsistency that must be resolved against the PRD before changing either side.

## Adversarial results and limits

The passing adversarial API tests submitted 40 reports against one target from one supplied IP prefix; lookup did not return `KNOWN_SCAM`. They also submitted 22 supplied reporter IDs on one prefix; those did not qualify as independent corroboration. Six submissions with one reporter generated one or more `429` responses. Junk phone input such as `12345` returned `400`. The alert attack test returned an empty alert list for ignored fake reports. Verified identifiers and an under-review challenge were exercised through lookup.

The positive genuine-report test is weaker than the phase report implies: the trust unit test calls `evaluateTrust` directly, while the API E2E case manually updates database trust decisions to `eligible` before checking a known-scam verdict. No test proves that a set of independent reports, submitted through `POST /reports`, becomes eligible through the integrated trust engine. This is **NOT VERIFIED** end to end.

The trust engine requires five distinct reporter HMACs, three distinct IP-prefix HMACs, two event-time buckets and an evidence score threshold. It detects exact normalized duplicate notes and fast bursts. However, it does not collapse multiple reporter IDs sharing one prefix into a single voice. A sufficiently large same-prefix group can contribute multiple eligible reporter decisions if enough other prefixes satisfy the overall three-prefix gate. The test covers the all-one-prefix case only. `reports.repository.ts` also uses the client-supplied `reported_at` as both ends of the hourly velocity query; a client can choose an old/future timestamp window. The existing six-report test uses current timestamps and one case, so it does not cover timestamp spoofing or concurrent submissions for different cases.

## Privacy and security

- **Reporter ID and IP prefix:** `pseudonymize` uses HMAC-SHA256 with purpose-separated labels and a server secret, and SQL receives only the HMACs. Database tests verify raw `reporter_id`/`ip_prefix` values do not appear in stored rows. This is materially stronger than an unkeyed hash, but stable HMACs remain linkable and key rotation needs a data plan.
- **Location:** report schema and SQL contain a pincode, not reporter latitude/longitude. Appendix B coordinates are seeded area centroids. Database tests verify there are no reporter coordinate columns.
- **Public lookup:** response construction returns masked identifiers until at least three eligible reporters, and evidence omits reporter IDs, prefixes and notes. Tests cover the phone mask and privacy boundary.
- **Challenge contacts:** contact details are written to a restricted schema and are absent from the public response. Production role isolation remains unverified.
- **Logs:** Pino HTTP serializers omit bodies and redact the `value` query parameter; Pino redaction covers listed sensitive keys. No test captures production-mode log output while sending sensitive payloads, so the “no personal data in logs” runtime requirement is **NOT VERIFIED**.
- **Reset:** `POST /admin/reset` is public and `resetDerivedState` deletes every report and challenge without checking environment, database name, or deployment mode. The README tells operators to add a platform/network restriction and dedicated judge database, but no such proxy/cloud policy exists in the repository and no live deployment was inspected. Any caller reaching the current app can delete stored report data. **FAIL** against the requested production-data safety check.
- **Licence:** Ed25519 signature verification is implemented with Node crypto, and the expired-license middleware test gets `403 {"error":"LICENSE_EXPIRED"}` on lookup while health/license remain reachable. But `activateLicense` does not reject a correctly signed licence whose `expires_at` is already in the past; it stores it and responds `200` with `valid:false`. Loading a stored licence also does not re-verify its signature. The expired-upload case was not tested. **FAIL** for accepting only a valid, unexpired licence document.

## Algorithms and performance

1. **Composite B-tree exact lookup.** PostgreSQL unique index `(identifier_type, normalized_value)` enforces one canonical identifier per type and supports O(log n) exact key lookup, followed by matching-row work. It is deterministic and concurrency-safe; each write pays index maintenance cost. The query plan and large-table performance were not measured.
2. **HMAC pseudonymization.** `pseudonymize(secret, reporterId, ipPrefix)` produces separate fixed-width HMAC-SHA256 values under the secret. It is O(input bytes), resists offline guessing when only the database leaks, and avoids storing the raw signals. It still permits same-person linkage and relies on secret storage and controlled rotation.
3. **Transactional report merge and trust recomputation.** `storeReport` uses an advisory lock for report ID, identifier/case upserts and a case row lock, then inserts the report, recomputes decisions and statistics inside a transaction. A failed write rolls back all related records. Work is O(n) in reports already in that case per new report; repeated writes to a high-volume case can become expensive. The velocity check is not globally serialized across different cases and trusts request time.
4. **Trust signal evaluation.** `buildTrustSignals` uses maps/sets to deduplicate report IDs, reporter HMACs and IP HMACs; it sorts event timestamps then uses a sliding window to find the maximum burst. Complexity is O(n log n) time and O(n) memory. It is deterministic and explains decisions, but exact-note equality is weaker than semantic/copy similarity, client-supplied signals are not independently authenticated (the PRD requires the test tool to supply them), and the per-prefix contribution flaw above remains.
5. **Map distance and aggregation.** `getMapClusters` compares a selected area centroid with the 25 seeded centroids using Haversine distance (O(A), A=25), then SQL groups eligible reports by area/type inside the requested event-time window. It never uses reporter GPS. The map is intentionally coarse and depends on the seed data.
6. **Alert windows.** `calculateAlertWindows` creates current-24-hour, prior-seven-day baseline and prior-30-day type windows. SQL counts only eligible reports; `qualifiesForSpike` checks at least five and at least twice the baseline. The rules are deterministic; historical result quality depends on correct trust decisions and event timestamps.
7. **Ed25519 licence verification.** `verifyLicenseSignature` verifies the canonical `{licensee, expires_at}` JSON bytes. The primitive is constant-time at the cryptographic operation level and avoids a server private key. Expired signed inputs and database-row verification are the gaps above.

The independent HTTP smoke pass started Express on an ephemeral loopback port and sent **100 sequential `fetch` requests** through the real HTTP listener to `/lookup`, backed by PostgreSQL. It measured **p50 2.991 ms, p95 3.861 ms, p99 4.828 ms**. The automated 20-request Supertest benchmark also passed (p50 6.0614 ms, p95 7.1729 ms, p99 19.1173 ms). Both are below the PRD's 500 ms target on the local fixture. Neither establishes production network latency, concurrent capacity or performance at production data volume.

## Test evidence

Runtime was Node.js **25.6.1**, not the requested Node 24 LTS. PostgreSQL was 18. The full test suite passed after creating the disposable database:

```powershell
$env:TEST_DATABASE_URL='postgres://postgres@127.0.0.1:55439/community_audit_test'
$env:DATABASE_URL=$env:TEST_DATABASE_URL
npm test
npm run typecheck
npm run lint
npm run build
```

Result: **16 test files passed; 111 tests passed, 0 failed, 0 skipped.** The run printed the lookup latency figures above. Additional checks:

```powershell
$pg = 'C:\Program Files\PostgreSQL\18\bin'
& "$pg\initdb.exe" -D $data -U postgres -A trust --no-locale
& "$pg\pg_ctl.exe" -D $data -o "-h 127.0.0.1 -p 55439" -l (Join-Path $data 'postgres.log') start
& "$pg\createdb.exe" -h 127.0.0.1 -p 55439 -U postgres community_audit_test
npx tsx .tmp-single-http.ts  # temporary direct-fetch smoke script; generated and removed during audit
```

Typecheck, lint and build exited 0. The direct smoke script included a guard requiring a local host and a database name ending in `_test`; it applied migration/seed, sent fetch requests, then reset the smoke report. The isolated PostgreSQL cluster was stopped and removed.

The database suite ran empty-schema migrations and repeat migration/seed operations. A separate temporary direct-HTTP smoke script exercised health, report, lookup, map, alerts, challenge, verified lookup, licence GET/renewal POST and reset against the same disposable database; its final reset removed the smoke report. It observed `200 {"ok":true}`, report `201` with the three contract keys, lookup `200`, map `200 {"clusters":[]}`, alerts `200 {"alerts":[]}`, challenge `201 {"challenge_id":...,"status":"under_review"}`, licence GET/POST `200`, and reset `200 {"deleted":1}`. The smoke captured development Pino output: request bodies were absent and lookup `value` was redacted. No public HTTPS deployment or production database was available; deployment is **NOT VERIFIED**.

Initial non-elevated `npm test` could not bind local Supertest ports (`EACCES`) and had no `TEST_DATABASE_URL`; it was not treated as a product failure. Re-running with loopback access and the disposable database produced the passing result above.

## Priority findings

1. **P0 — reset data boundary:** make the public judge reset point only at a dedicated disposable judging database or enforce a verified deployment-level isolation rule; add a negative test proving production configuration cannot invoke it.
2. **P1 — licence upload validity:** reject already-expired signed documents and verify persisted licence signatures when loading state; add endpoint tests for expired, tampered, renewed and expired-protected-route behavior.
3. **P1 — trust and rate-limit integrity:** do not use caller-controlled `reported_at` as the velocity clock; serialize reporter-level velocity checks across cases; cap contributions per IP-prefix in the trust decision; add mixed-prefix, spoofed-time and cross-case concurrency API tests. Keep the PRD’s judge-supplied identity inputs in mind when designing the boundary.
4. **P1 — prove genuine reporting through the public API:** add a fresh-database E2E case that posts varied independent reports and observes the resulting verdict without direct SQL updates.
5. **P2 — contract consistency:** reconcile `/map` accepted bounds and `/alerts` error statuses with Appendix A and publish the same rules in OpenAPI and runtime schemas.
6. **P2 — deployment and observability:** configure and verify a public HTTPS endpoint, production PostgreSQL least-privilege access to restricted contacts, and production-mode log capture/redaction.
7. **P2 — runtime compatibility:** repeat build and tests on Node 24 LTS; this audit ran on Node 25.6.1.

### Final status

**FAIL.** Most API/database tests pass locally and the required reference datasets match the PRD. Release readiness is blocked by reset isolation, expired licence acceptance, anti-abuse gaps and the unverified public deployment. No implementation fixes were made during this audit.
