# Phase 16 — Trust Engine Hardening

**Status: PASS.** The existing deterministic Trust Engine was hardened; no ML/LLM, new endpoint, API field, table, migration or dependency was added. The complete suite passed against a disposable PostgreSQL 18 database.

## What changed

The independent audit found that reporter IDs sharing one IP prefix could each become eligible if enough other prefixes existed, and report velocity used caller-supplied `reported_at`. The implementation now selects eligible corroboration through deterministic reporter/network matching and enforces velocity with PostgreSQL server time under a reporter-keyed transaction lock.

Reports from shared networks remain accepted and stored. For a given case, however, a network prefix can contribute at most one eligible report. This reduces coordinated groups' influence without discarding their submissions. The trade-off is that unrelated people sharing household, workplace or public Wi-Fi may be represented by one trusted voice and need corroboration from other networks.

## Trust algorithm

### Independent reporter/network selection

1. Discard invalid, explicitly duplicate and repeated `report_id` inputs for trust evaluation. Raw report rows are retained by ingestion.
2. Normalize each note for scoring and calculate evidence quality: base 0.50; +0.25 for at least 24 characters and 5 tokens; otherwise +0.10 for a nonempty note; +0.05 for a screenshot; +0.10 for a previously trusted reporter if that signal is supplied. Cap quality at 1.0.
3. Build a bipartite graph. One side contains reporter HMACs; the other contains IP-prefix HMACs. Each reporter/prefix pair is an edge. For repeated submissions on the same pair, choose the representative by evidence quality, token count, earliest `occurred_at`, then report ID for deterministic ties.
4. Run deterministic augmenting-path maximum matching, with capacity one for each reporter and one for each IP-prefix key. A selected report is one independent voice. A reporter switching prefixes remains one voice; many reporter IDs on one prefix remain one voice.
5. Require at least **5 matched voices**, **3 distinct IP prefixes**, **2 event-time buckets of 60 minutes**, evidence score **at least 0.65**, and no coordinated burst. A verified identifier or an under-review challenge blocks eligibility.
6. Evidence score is 50% average quality among matched reports, 25% matched-voice diversity scaled to the five-voice threshold, and 25% prefix diversity scaled to the three-prefix threshold. A coordinated burst subtracts 0.20; concentrated-prefix risk subtracts a further 0.20 when it coincides with a burst. A burst is at least 12 reports in 60 minutes with concentrated-prefix or copied-note evidence. A prefix is concentrated at five reports and a share of at least 50%. Exact normalized note equality is used for copied-note ratio; this is not semantic text similarity.
7. If trusted, persist only the selected matching representatives as eligible; all other reports remain ignored for public trusted counts. Raw report count, distinct raw reporter count and eligible counts remain separate.

The maximum matching is deterministic and has O(VE) worst-case time for V reporter vertices and E reporter/prefix pairs, plus sorting for deterministic ordering; memory is O(V + E + N), where N is reports. This is more work than counting distinct IDs, but it prevents either side of the reporter/network relationship from manufacturing extra votes. Evidence representative ties are stable, so the same input yields the same decision.

### Velocity enforcement

`storeReport` first takes a PostgreSQL transaction advisory lock derived from the reporter HMAC. The lock is shared across all identifiers and all app connections. Once acquired, the transaction reads a materialized `clock_timestamp()` value and counts reports for that reporter whose database `created_at` falls in the preceding hour. At three prior reports, the next request receives the existing `429` response. New rows set `created_at` using PostgreSQL `clock_timestamp()`; client-supplied `reported_at` is not part of the limit. The transaction lock makes the check and insert serial for concurrent requests from one reporter.

`reported_at` remains stored and validated against `occurred_at` as before. `occurred_at` remains the event-time source for trust buckets, map windows and alert windows; those semantics and API request/response fields are unchanged.

## Adversarial results

| Scenario | Observed result |
|---|---|
| 22 generated reporter IDs on one generated shared prefix, plus 4 independent reporters on separate prefixes | All 26 submissions returned 201. The lookup became `KNOWN_SCAM` with 5 eligible reports and 5 distinct eligible reporters: exactly one from the shared prefix plus four independent reports. Database check confirmed no prefix had more than one eligible report. |
| 22 generated reporters on one prefix without independent corroboration | All submissions were stored; lookup stayed `SUSPICIOUS` with `report_count: 0`; area alerts were empty. |
| Seven genuinely independent reporters through `POST /reports` | Lookup became `KNOWN_SCAM`, with 7 distinct eligible reporters. No test SQL promotion was used. |
| One reporter across four different identifier cases; `reported_at` alternated between years-old and years-future | Statuses were `201, 201, 201, 429`; client timestamps did not reset the hourly quota. |
| Eight concurrent reports from one reporter across eight different cases, with old/future `reported_at` values | Exactly 3 returned 201 and 5 returned 429. |
| Seven coordinated reports against a registry identifier, with distinct reporter and prefix signals and qualifying evidence | Reports were accepted, but lookup remained `VERIFIED_BUSINESS` and the database contained zero eligible decisions for that identifier. |
| Fake shared-prefix reports and alert generation | No eligible fake reports, no `KNOWN_SCAM`, and no area alert. |

All scenario reporter IDs, report IDs, prefixes and unverified identifiers are generated at runtime. The verified-registry test queries a seeded Appendix C row rather than encoding a known phone number.

## Files changed

| Repository path | Function or change |
|---|---|
| `backend/src/modules/trust/trust.types.ts` | Adds the effective matched `independentVoiceCount` signal and per-prefix capacity policy type. |
| `backend/src/modules/trust/trust-policy.ts` | Sets maximum eligible contribution to one report per prefix per case; existing reporter, network, evidence and time thresholds remain. |
| `backend/src/modules/trust/trust-signals.ts` | Adds deterministic representative selection and maximum matching; scores only matched evidence. |
| `backend/src/modules/trust/trust-engine.ts` | Requires matched voices and persists only distinct reporter/prefix representatives as eligible. |
| `backend/src/modules/reports/reports.repository.ts` | Serializes rate checks by reporter HMAC, uses PostgreSQL `clock_timestamp()`/`created_at`, and retains `reported_at` only as report data. |
| `backend/tests/adversarial/trust-engine.test.ts` | Covers shared-prefix cap, one reporter switching prefixes, and matching behavior. |
| `backend/tests/adversarial/backend-attacks.e2e.test.ts` | Adds six real API/database adversarial cases, including genuine trust qualification and cross-case concurrency. |
| `backend/README.md` | Documents the actual network cap, thresholds, server-time rate limiting and false-positive trade-off. |
| `.gitignore` | Exposes the requested Phase 16 audit file while retaining ignore rules for older phase audits. |

No migration was needed: the schema already stores reporter and prefix HMACs and server-created `created_at`. No API contract changed.

## Test evidence

PostgreSQL 18 ran locally on loopback. The database was named `community_phase16_test`; integration tests verified the host is local and the database name ends in `_test`. Exact full-suite command:

```powershell
$env:TEST_DATABASE_URL='postgres://postgres@127.0.0.1:55439/community_phase16_test'
$env:DATABASE_URL=$env:TEST_DATABASE_URL
npm test
```

Result: **17 test files passed; 122 tests passed; 0 failed; 0 skipped.** The full run included database migrations, seeds, existing E2E and trust tests, the new adversarial scenarios, and the lookup/report latency test. The latency test printed lookup p50/p95/p99 of 6.0519/6.7241/18.9288 ms and report p50/p95/p99 of 19.0766/25.5918/50.9811 ms on this local run; these are test-environment observations, not production capacity claims.

Additional commands:

```powershell
npx vitest run tests/adversarial/backend-attacks.e2e.test.ts tests/adversarial/trust-engine.test.ts
npm run typecheck
npm run lint
npm run build
```

Focused adversarial/trust run: **2 files, 19 tests passed**. Typecheck, lint and build each exited 0. Vitest printed its existing Vite CJS API deprecation warning; it did not fail the run.

## Remaining risks

- One eligible voice per prefix can undercount distinct people on a shared network. Their raw reports remain available, but a group behind one NAT alone cannot create multiple trusted voices.
- Reporter IDs and IP prefixes arrive in the PRD request body. HMAC protects persisted values but cannot prove a sender's supplied identity is truthful; this matches the judge contract and remains an inherent unauthenticated-input limitation.
- The matching and trust score are deterministic heuristics, not identity verification. New fraud patterns may require policy tuning and additional adversarial tests.
- Reported event timestamps remain client supplied by design for judging; implausible `occurred_at` values can still affect event-time windows and require separate validation policy if the PRD changes.

### Final status

**PASS — Phase 16 complete.** Shared-prefix trust contribution is capped by maximum matching; hourly rate limiting uses server-side database time and serializes across cases; the expanded API/database adversarial suite and all regression checks passed.
