# Phase 17 — API Correctness and End-to-End Verification

## A. What was built

Added a clean-database API flow test proving seven genuinely independent reports become eligible through normal `POST /reports` ingestion, then drive the expected `/lookup`, `/map`, and `/alerts` results without SQL trust promotion. Reconciled OpenAPI with `/map` runtime bounds, documented the selected bounds, added the missing `/alerts` 400 response, and added parsed OpenAPI contract tests. Captured real production-mode Pino output and verified sensitive request values and error messages are absent. The integration API now runs as a non-owner PostgreSQL role that can insert challenge contacts but cannot read them.

## B. Why this approach was chosen

Appendix A defines `/map` defaults but no numeric maxima. The implementation already accepts 1–30 days and 0–100 km, so OpenAPI now documents those bounds; 30 days and 100 km limit query work, while zero radius supports a single-centroid result. Contract tests parse the OpenAPI document and assert request/response fields, routes, enums, bounds, and required status codes so documentation drift fails CI.

The genuine reporting test uses the application’s existing transaction and Trust Engine through HTTP. Manually changing trust rows would only test lookup aggregation, not report ingestion or trust decisions. The integration harness keeps a separate admin connection for test setup and gives the API its own non-owner role, allowing a real PostgreSQL permission-denial check instead of a mocked access assertion.

## C. Main code locations

| Repository path | Main class or function | Purpose |
|---|---|---|
| `backend/contracts/openapi.yaml` | `/map`, `/alerts`, and component schemas | Documents the runtime map bounds, the alert 400 response, and Appendix A fields/statuses. |
| `backend/src/middleware/error.middleware.ts` | `errorMiddleware` | Logs only safe error class/status metadata instead of raw exception messages or stacks. |
| `backend/src/db/roles/runtime-role.sql` | runtime role grants | Provisions the non-owner API role with public-table access and insert-only access to restricted contacts. |
| `backend/tests/contracts/api-contracts.test.js` | Appendix A OpenAPI tests | Parses OpenAPI and fails when paths, schemas, fields, bounds, enums, or required statuses drift. |
| `backend/tests/e2e/phase17.e2e.test.ts` | Phase 17 integration suite | Verifies real report qualification, API responses, runtime role permissions, and validation errors. |
| `backend/tests/e2e/harness.ts` | `prepareHarness` | Creates a disposable runtime role, applies test grants, and initializes the API against it. |
| `backend/tests/fixtures/production-log-probe.ts` | `main` | Starts a production-mode Express server and sends report, lookup, challenge, validation-error, and internal-error requests for log capture. |

Supporting documentation: `backend/src/db/README.md`, `backend/audits/PRD-COVERAGE.md`, and `backend/audits/PRD-COMPLIANCE-MATRIX.md`.

## D. Algorithms and data structures

No new trust algorithm was added. Phase 16’s deterministic Trust Engine remains the source of eligibility decisions.

The API contract test parses OpenAPI YAML into an object tree and compares required path methods, schema property sets, enums, query bounds, and status codes with the Appendix A inventory. It runs in O(S) time and memory for document size S. Parsing the document, rather than grepping YAML text, ensures malformed YAML and structural drift fail the test.

The role check uses PostgreSQL’s privilege catalog/functions (`has_table_privilege`) plus a real denied `SELECT`. This verifies the effective access of the role used by API connections, not only the intended grant script.

## E. Data flow

1. The integration harness drops and recreates only the guarded local `_test` database schema, then applies migrations and reference seeds.
2. It creates a random-password, `NOSUPERUSER`, `NOINHERIT` runtime role and gives that role the grants used by the API.
3. The test confirms the database contains zero reports.
4. Seven reports with generated reporter and network signals are sent through `POST /reports`.
5. The normal ingestion transaction stores reports, evaluates trust, and updates decisions and statistics.
6. `GET /lookup` returns `KNOWN_SCAM`; `/map` returns the eligible area cluster; `/alerts` returns the spike and new-type alerts.
7. A separate child process runs with `NODE_ENV=production`, sends requests with unique sensitive markers, and its captured Pino output is checked for disclosure.

## F. Test evidence

Test environment: Node.js **25.6.1**, PostgreSQL **18**, disposable database `community_phase17_test` on `127.0.0.1:55439`.

Exact commands:

```powershell
$env:TEST_DATABASE_URL='postgres://postgres@127.0.0.1:55439/community_phase17_test'
$env:DATABASE_URL=$env:TEST_DATABASE_URL
npx vitest run tests/e2e/phase17.e2e.test.ts tests/contracts/api-contracts.test.js
npm test
npm run typecheck
npm run lint
npm run build
```

The role-grant script was separately applied to the same disposable database:

```powershell
$pg='C:\Program Files\PostgreSQL\18\bin'
& "$pg\psql.exe" -h 127.0.0.1 -p 55439 -U postgres -d community_phase17_test -v ON_ERROR_STOP=1 -f src/db/roles/runtime-role.sql
```

Results:

- Focused Phase 17 integration and contract run: **2 files passed, 7 tests passed**.
- Complete suite: **19 test files passed, 129 tests passed, 0 failed, 0 skipped**.
- Typecheck, lint, and build all exited with status 0.
- `GET /health`: HTTP 200, exact body `{"ok":true}`.
- Seven independent report submissions: all HTTP 201; database showed **7 raw / 7 eligible** with no SQL trust-decision update.
- `GET /lookup`: HTTP 200, `KNOWN_SCAM`, `report_count: 7`, `distinct_reporters: 7`.
- `GET /map?pincode=560102&days=7&radius_km=0`: HTTP 200, one cluster with count 7 and Appendix B centroid `12.9116, 77.6473`.
- `GET /alerts?pincode=560102`: HTTP 200, returned both `SPIKE` with count 7 and `NEW_TYPE` for `fake-customer-care`.
- `days=31`, `radius_km=100.1`, and unsupported alert pincode: HTTP 400.
- Captured production-mode logs included a lookup URL with `value=[Redacted]`; reporter ID, IP-prefix marker, note, lookup phone, claimant name, contact email, proof note, and a secret embedded in an internal exception were absent. The internal-error response was exactly `{"error":"Internal server error"}`.
- The API role was `community_scam_runtime_test`: `rolsuper=false`, `rolinherit=false`, not owner of `public.reports`; `SELECT` and `DELETE` on `restricted.challenge_contacts` were false, `INSERT` true. A real direct `SELECT` failed with PostgreSQL permission denied. The challenge endpoint inserted the contact, and the privileged test connection confirmed it was stored while the API response omitted it.
- Final full-suite local latency output: lookup p50/p95/p99 **5.415/6.307/17.614 ms**; report p50/p95/p99 **17.887/25.268/54.044 ms**. An earlier full run in this phase observed report p99 **2034.413 ms**, so report latency varied substantially between local runs. The PRD’s stated sub-500 ms target applies to lookup. These figures are not production capacity claims.
- The grant script ran successfully. PostgreSQL reported both `community_scam_app` and the test API role as non-superuser, non-inheriting roles with no `SELECT` and with `INSERT` on `restricted.challenge_contacts` (`f|f|f|t`).

Early focused runs exposed incorrect sorted-field expectations, a licence renewal expiry that attempted to move backwards, child-process module setup and a silent inherited log level. These test-harness issues were corrected, and the production probe now closes its database pool. The final focused and full runs above passed.

## G. Security and privacy

Report payloads contain the PRD’s reporter ID and IP-prefix signal, report note, and identifier value. The request logger continues to omit bodies and redact the lookup `value` query parameter. Production-mode tests use generated markers and confirm these values do not appear in captured stdout. Error middleware no longer serializes thrown exception messages/stacks; it logs only an error class and, for known application errors, the status code.

Challenge claimant name, contact email, and proof note remain stored in `restricted.challenge_contacts`. The API role receives `USAGE` on `restricted` and `INSERT` on that table, but no `SELECT`, `UPDATE`, or `DELETE`; `PUBLIC` has no schema/table privileges. The challenge endpoint can submit contacts and public responses omit them. Migration/database owners and superusers can still access restricted rows. The deployment grant script was run against the temporary database. The live production PostgreSQL role and hosted log sink were not available for inspection.

## H. PRD coverage

Completed and tested in this phase:

- Appendix A API routes, request/response fields, enum references, and required success/error statuses are covered by parsed OpenAPI contract tests and real HTTP checks.
- `/map` OpenAPI bounds match runtime validation: `days` 1–30, `radius_km` 0–100; defaults remain 7 and 2.
- `/alerts` documents and returns HTTP 400 for invalid or unsupported pincodes.
- Independent reports become trusted through normal API behavior and the resulting eligible reports drive lookup, map, and alert responses.
- Production-mode Pino output does not expose tested reporter, network, note, lookup, claimant, or exception values.
- The API runtime role cannot directly read restricted challenge contacts.

Updated traceability: `backend/audits/PRD-COVERAGE.md` and `backend/audits/PRD-COMPLIANCE-MATRIX.md`.

Remaining gaps: the live production database role and hosted logging configuration were unavailable; public HTTPS deployment was not part of this phase; the test runtime was Node 25.6.1 rather than Node 24. Report p99 varied from 54 ms to 2034 ms in local runs and merits a separate performance investigation, though no PRD report-ingestion latency target was specified.

## I. Judge demonstration (30–60 seconds)

From `backend/`, point `TEST_DATABASE_URL` and `DATABASE_URL` at a disposable local PostgreSQL database whose name ends in `_test`, then run:

```powershell
npx vitest run tests/e2e/phase17.e2e.test.ts tests/contracts/api-contracts.test.js
```

Expected observations: the E2E starts with zero report rows; seven API submissions return 201 and qualify without SQL promotion; lookup says `KNOWN_SCAM` with seven eligible reporters; the map cluster shows count 7 at the Appendix B centroid; alerts include `SPIKE` and `NEW_TYPE`; the runtime role’s private-contact SELECT is denied; captured production logs omit all sensitive markers. The contract tests pass with the documented `/map` bounds and `/alerts` 400 status.

## J. Final status

**PASS — Phase 17 implementation and local verification complete.** All requested local tests, typecheck, lint, and build passed. Remaining limitations are the uninspected live production role/log sink, Node 24 runtime verification, public deployment verification, and the observed local report-ingestion p99 noted above.
