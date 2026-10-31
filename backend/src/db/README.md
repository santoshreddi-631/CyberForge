# PostgreSQL database layer

The new database code is JavaScript. Phase 1's Express routes and OpenAPI contract are preserved. `client.js` replaces the old `client.ts` while retaining its exported functions.

Set `DATABASE_URL`, then run `npm run db:migrate` and `npm run db:seed`. Run migrations as one deployment job before starting API workers. Cooperative migration commands serialize through a PostgreSQL advisory lock; Drizzle's migration ledger prevents repeat application. SQL in `migrations/` is authoritative for database checks and indexes; the Drizzle declarations in `schema/` map application columns and relationships. Do not generate replacement migrations from these mappings without reviewing the existing SQL constraints. The build copies SQL and the migration journal into `dist/db/migrations/`.

`storeReport` is an internal persistence helper, not a new endpoint. It requires an already normalized identifier. One unique `(identifier_type, normalized_value)` maps to one case. It hashes `reporter_id` and `ip_prefix` before passing any identity values to SQL. It does not persist raw notes. Canonical input validation, note sanitization and trust evaluation belong to later ingestion work.

Provide `REPORTER_HMAC_SECRET` from a server secret manager, distinct from database credentials, and pass it to the helper. At least 32 bytes are required. Never put the secret in PostgreSQL or logs. Purpose labels separate reporter tokens from network tokens. HMACs resist dictionary matching by someone who obtains only the database; they remain linkable pseudonyms. Rotating the key requires an explicit linkage/re-key plan.

Raw report counts, distinct claimed reporter identities, eligible report counts and independent trusted reporter counts are separate fields. New decisions are pending and trusted counts remain zero until a future trust evaluator sets them. A case row lock serializes report/statistic writes. Counters are precomputed for cheap reads; the write helper recomputes raw/distinct counts over that case's indexed reports. Direct SQL writes can bypass this maintenance. Area statistics and alert storage reserve data structures but do not implement scoring or alerts.

The exact-match unique index and composite `(case_id, occurred_at)`, `(pincode, occurred_at)` and `(pincode, scam_type, occurred_at)` B-tree indexes support lookup and time windows. The partial eligible-decision index supports joins that omit pending/ignored reports. Indexes cost storage and insert work; no latency guarantee is asserted.

| Data | Classification and access |
|---|---|
| Appendix B areas/centroids; Appendix C verified identifiers and labels; scam/channel options | Public reference data, never reporter coordinates |
| Reports, identifier records, HMAC signals, decisions, counters and licence/latest-seen state | Internal; no new public route in Phase 2 |
| Claimant name, email and proof note | Restricted schema; PUBLIC has no schema/table privileges |
| HMAC secret | Server configuration only; never persisted |

Use a separate migration owner and a nonowner application role in deployment. Grant the application only the public tables it needs. Grant `USAGE`/table access on `restricted` only to a dispute administrator; never blanket-grant all schemas. Database owners/superusers can still access restricted data. No encryption-at-rest configuration or administrative authentication is implemented in this phase.

For integration tests, provide a local `TEST_DATABASE_URL` whose database name ends in `_test`. `npm test` runs all 30 tests, including integration tests. Tests intentionally reset `public`, `restricted` and `drizzle` in that dedicated database before/after running; never point them at valuable data. They reject remote hosts and non-test database names. `npm run test:db` runs the six database tests alone. Provision the test database using your PostgreSQL tools or a separate PostgreSQL container; tests do not borrow `DATABASE_URL`.

Unknown scam types map to `other`, per Appendix C. The six channel labels are exact, case-sensitive allowed values. Seed upserts are transactional and do not delete records.
