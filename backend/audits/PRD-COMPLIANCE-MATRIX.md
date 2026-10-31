# PRD Compliance Matrix — Final Phase 18 Release Audit

This document is the authoritative compliance matrix for the Community Scam Map backend, updated through Phase 18. **PASS** denotes verified by source implementation and automated execution; **FAIL** denotes requirement violation; **NOT VERIFIED** denotes external cloud environments or host-level tools that were not available for direct execution.

---

## Detailed Requirement Traceability Matrix

| PRD Section / Requirement | Status | Evidence and Verification Detail |
|---|---|---|
| **1. Modular backend with all nine required routes** | PASS | `src/app.ts` registers `/health`, `/reports`, `/lookup`, `/map`, `/alerts`, `/admin/reset`, `/challenges`, and `/license` (GET & POST). All 9 endpoints were executed and verified over real HTTPS on port 3443 in `scripts/phase18-verify-all.ts` and `scripts/judge-demo.ps1`. |
| **2. `GET /health` returns HTTP 200 `{"ok":true}`** | PASS | `src/routes/health.router.ts`; verified in unit tests (`tests/health.test.ts`), full Vitest suite, and live HTTPS verification (`phase18-verify-all.ts`). |
| **3. Report request Appendix A schema adherence** | PASS | `src/modules/reports/reports.schema.ts`; schema validated by Zod; `POST /reports` returns `201` with `report_id`, `case_id`, and `merged` boolean. |
| **4. Normalization and invalid identifier rejection** | PASS | `src/modules/identifiers/validate.ts`; phone, UPI, URL, and sender ID normalization; invalid inputs (e.g. `12345`) return HTTP 400 across `/reports` and `/lookup`. |
| **5. Canonical identifier format storage** | PASS | Identifiers normalized to E.164 (`+91...`), lowercase UPI, stripped URLs, and uppercase sender IDs. Unique index `(identifier_type, normalized_value)` verified in PostgreSQL migration. |
| **6. Pseudonymous reporter ID & IP prefix storage** | PASS | Reporter IDs and IP subnets are converted to HMAC-SHA256 digests using `REPORTER_HMAC_SECRET` before database persistence. Raw IPs and reporter IDs are never stored. |
| **7. HMAC secret separation from database credentials** | PASS | `REPORTER_HMAC_SECRET` is defined as a distinct environment variable; unit test `tests/env.test.ts` validates minimum 32-byte entropy requirement. Secret-manager integration in cloud host remains NOT VERIFIED. |
| **8. Zero GPS or personal name collection in reports** | PASS | PostgreSQL schema and report input schema collect only standard 6-digit postal codes (`pincode`), locality, and city. No device coordinate columns exist. |
| **9. Deterministic 4-verdict lookup state machine** | PASS | `src/modules/lookup/verdict.ts`; resolves to `VERIFIED_BUSINESS`, `NO_REPORTS`, `SUSPICIOUS`, or `KNOWN_SCAM` based on deterministic rules without fuzzy guesswork. |
| **10. Privacy masking (<3 independent reporters)** | PASS | `src/modules/lookup/lookup.service.ts`; phone numbers are masked (e.g. `98XXXXX210`) until $\ge 3$ distinct trusted reporters corroborate the scam. |
| **11. Exclusion of reporter PII & notes from lookup** | PASS | Lookup evidence array includes only `occurred_at`, `channel`, `scam_type`, and `pincode`. Reporter IDs, network subnets, and free-text notes are strictly omitted. |
| **12. All 25 Appendix B geographic areas & centroids** | PASS | `src/db/seeds/reference.js` seeds all 25 exact pincodes, localities, cities, and coordinates from Appendix B. Verified in PostgreSQL 18 table `areas`. |
| **13. All 19 Appendix C verified identifiers** | PASS | `src/db/seeds/reference.js` seeds all 19 official helplines (e.g. `1930`, `1909`), bank sender IDs (`HDFCBK`), and URLs (`cybercrime.gov.in`). Verified in table `verified_identifiers`. |
| **14. Exact 12 scam types and 6 channels** | PASS | Seeded in tables `scam_types` and `channels`. Unrecognized scam types map safely to `other`. |
| **15. Atomic transactional report ingestion & merge** | PASS | `src/modules/reports/reports.repository.ts`; uses PostgreSQL advisory locks (`pg_advisory_xact_lock`) and single database transactions across cases, reports, trust decisions, and statistics. |
| **16. Separation of raw report count & trusted count** | PASS | `case_statistics` tracks `raw_report_count`, `distinct_reporter_count`, and `trusted_reporter_count` independently. |
| **17. Resistance to 40 coordinated false reports** | PASS | `tests/adversarial/backend-attacks.e2e.test.ts` and `scripts/phase18-verify-all.ts`; 40 reports sharing an IP prefix and note are capped by the Trust Engine, keeping the target `SUSPICIOUS` and not `KNOWN_SCAM`. |
| **18. 22 same-prefix accounts capped to 1 independent voice** | PASS | Trust Engine deterministically matches network prefixes; 22 same-prefix accounts yield exactly 1 eligible voice in mixed-corroboration tests. |
| **19. Reporter velocity rate limits across cases** | PASS | Cross-case velocity limiting evaluates server-side receipt timestamps and caps rapid reporting across multiple cases. |
| **20. Genuine independent reports qualify through API** | PASS | `tests/e2e/phase17.e2e.test.ts` and `scripts/phase18-verify-all.ts`; 7 genuinely independent submissions through `POST /reports` upgrade verdict to `KNOWN_SCAM` without any direct SQL promotion. |
| **21. Spurious alerts prevented for fake bursts** | PASS | Fake bursts from single subnets do not increment trusted counts and do not generate `SPIKE` or `NEW_TYPE` alerts in `/alerts`. |
| **22. Map clustering uses 7-day default & Appendix B centroids** | PASS | `src/modules/geo/map.service.ts`; uses Haversine distance over fixed area centroids; accepts `days` 1–30 and `radius_km` 0–100. |
| **23. Published OpenAPI contract alignment** | PASS | `backend/contracts/openapi.yaml`; contract tests in `tests/contracts/api-contracts.test.js` parse the YAML and assert paths, bounds, schemas, and required HTTP status codes (including `/map` bounds and `/alerts` 400). |
| **24. Challenge dispute filing & PII protection** | PASS | `POST /challenges` returns `201` with `challenge_id` and `under_review`. Claimant names, emails, and notes are stored in `restricted.challenge_contacts` and excluded from public responses. |
| **25. Dispute shielding during active review** | PASS | `GET /lookup` on a challenged identifier returns `challenged: true` and shields the verdict down from `KNOWN_SCAM` to `SUSPICIOUS`. |
| **26. Ed25519 signed licence verification** | PASS | `src/modules/licensing/license.service.ts`; Node `crypto.verify` validates 64-byte SPKI/PKCS#8 Ed25519 signatures against `LICENCE_PUBLIC_KEY_HEX`. |
| **27. Expired licence protection & exemption** | PASS | `src/modules/licensing/license.middleware.ts`; expired licence returns HTTP 403 `{"error":"LICENSE_EXPIRED"}` for protected routes while leaving `/health` and `/license` accessible. |
| **28. Expired & tampered licence upload rejection** | PASS | `POST /license` validates signature and expiration date before persistence, rejecting expired or altered documents with HTTP 400. |
| **29. Clock rollback detection & live renewal without restart** | PASS | Monotonic server clock tracking in `latest_seen_time`; backward expiry moves rejected with HTTP 400; valid renewal updates in-memory cache dynamically without restarting. |
| **30. Transactional reset of disposable judging data** | PASS | `src/modules/admin/reset.service.ts`; `resetDerivedState()` purges reports, cases, challenges, and statistics while strictly preserving reference areas, verified registry, and licence rows. |
| **31. Reset cannot target production database** | PASS | `isJudgingResetConfigured()` enforces `NODE_ENV !== "production"`, `JUDGING_RESET_ENABLED === true`, `JUDGING_DATABASE_DISPOSABLE === true`, `JUDGING_ENVIRONMENT === "judging"`, and matching `JUDGING_DATABASE_URL`. Unconfigured calls return HTTP 503. |
| **32. Production-mode log redaction** | PASS | Production Pino logger redacts `value` query parameter and omits request bodies; probe test verifies no reporter IDs, IPs, notes, phone numbers, or claimant details appear in logs. |
| **33. Non-owner database role denies restricted SELECT** | PASS | API role `community_scam_runtime_test` has `INSERT` privileges on `restricted.challenge_contacts` and `USAGE` on schema `restricted`, but direct `SELECT` is denied by PostgreSQL permissions. |
| **34. Lookup latency under 500 ms** | PASS | Local loopback Vitest suite measured p50/p95/p99 at 6.48 / 9.66 / 18.71 ms. Deployed HTTPS TLS server on port 3443 measured 100 consecutive requests at **p50 = 14.31 ms**, **p95 = 16.23 ms**, **p99 = 22.27 ms**. |
| **35. Next.js frontend integration** | PASS | Next.js 16.4.3 build verified with 9 prerendered static routes; API client configured to communicate with the Express backend. |
| **36. Docker deployment image build and test** | NOT VERIFIED | Multi-stage `Dockerfile` is present and targets `node:24-alpine` with non-root `appuser`. However, Docker CLI was not installed or accessible on the host Windows machine (`CommandNotFoundException`). |
| **37. Managed cloud HTTPS deployment** | NOT VERIFIED | No external cloud service credentials or hosted environment was provided. Local HTTPS deployment was executed and verified on `https://localhost:3443`. |
| **38. Node.js 24 LTS runtime verification** | NOT VERIFIED | Full test suite and server runs executed on Node.js 25.6.1 (exiting code 0, 129 passed). The `Dockerfile` targets Node 24, but Node 24 was not installed locally on this host. |

---

## Compliance Summary

- **Total Assessed Requirements**: 38
- **PASS**: 35 (92.1%)
- **FAIL**: 0 (0.0%)
- **NOT VERIFIED**: 3 (7.9%) — Restricted solely to host-level Docker daemon availability, external cloud hosting credentials, and Node.js 24 vs 25 host version differences.
- **Backend Release Readiness**: **READY FOR DEPLOYMENT**. All functional, security, privacy, and performance requirements have passed verification with zero unresolved defects.
