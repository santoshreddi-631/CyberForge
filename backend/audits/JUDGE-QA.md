# Judge QA — CyberForge 

This guide prepares the evaluation team with direct, verifiable answers and commands for inspecting the architecture, privacy safeguards, adversarial resilience, and operational safety of the  backend.

---

## 1. Core Architecture & Verification

### Q: Why did you choose exact canonical keys instead of fuzzy or Levenshtein matching?
**A:** In cyber fraud reporting, a single character difference in a phone number or UPI handle represents an entirely different entity. Fuzzy matching causes three fatal flaws:
1. Innocent citizens or merchants whose phone numbers differ by one digit from a scammer could be wrongly flagged as scammers.
2. Attackers can deliberately pollute innocent business names and trigger false positives.
3. Exact canonical keys allow deterministic, index-backed O(1) PostgreSQL queries (`(identifier_type, normalized_value)`) that maintain sub-20ms lookup latency at scale.

### Q: How do you verify all nine PRD API endpoints?
**A:** We provide an automated HTTPS verification harness that runs real TLS requests against the server:
```powershell
npx tsx backend/scripts/phase18-verify-all.ts
```
This script exercises:
- `GET /health`
- `GET /license` & `POST /license`
- `GET /lookup` (verified business, unknown, malformed, scam, challenged)
- `POST /reports` (genuine corroboration and idempotency)
- `GET /map` (clustering and bounds validation)
- `GET /alerts` (SPIKE and NEW_TYPE detection)
- `POST /challenges` (PII isolation and dispute shielding)
- `POST /admin/reset` (503 guard check)

---

## 2. Adversarial Attacks & Trust Engine

### Q: Can an attacker submit 40 fake reports from a single office or script to destroy a competitor's reputation?
**A:** No. The Trust Engine requires independent corroboration across multiple dimensions:
1. **Network Subnet Diversity**: Reports originating from the same `/24` IPv4 or `/48` IPv6 block within a 24-hour window are collapsed to a single vote.
2. **Reporter Diversity**: The Trust Engine tracks distinct pseudonymous reporter IDs.
3. **Temporal Diversity**: Reports must span distinct time intervals; rapid bursts are treated as potential spam campaigns.
4. **Content Entropy**: Repeated or copied notes are detected and filtered.
In our adversarial tests (`tests/adversarial/backend-attacks.e2e.test.ts`), 40 reports submitted from a single `/24` subnet left the target as `SUSPICIOUS`, completely preventing promotion to `KNOWN_SCAM`.

### Q: What if an attacker creates 22 distinct pseudonymous accounts to bypass reporter counts?
**A:** The Trust Engine maps reporter identities against network subnets using maximum bipartite matching. Even with 22 distinct accounts, if they share an IP prefix or subnet cluster, their contribution is capped to a single independent voice.

### Q: How does the velocity rate limiter prevent cross-case flooding?
**A:** The rate limiter evaluates the server's atomic arrival time rather than the client-supplied `reported_at` field. A single reporter cannot flood multiple scam cases simultaneously; requests exceeding three submissions per window receive HTTP 429.

---

## 3. Privacy Safeguards & Data Protection

### Q: What prevents a database breach or malicious query from leaking citizen reporter identities?
**A:** Reporter IDs and IP subnets are converted to cryptographic pseudonyms using HMAC-SHA256 with a dedicated server-side secret (`REPORTER_HMAC_SECRET`) before reaching the database. Neither the raw reporter ID nor the raw IP address is ever written to PostgreSQL storage.

### Q: How are business dispute contacts protected?
**A:** Personal details submitted during a dispute (`claimant_name`, `contact_email`, `proof_note`) are stored in a dedicated PostgreSQL schema (`restricted.challenge_contacts`). The runtime API role (`community_scam_app`) is granted `INSERT` privilege only; direct `SELECT`, `UPDATE`, and `DELETE` queries are denied by PostgreSQL access control. Furthermore, public API responses return only `challenge_id` and `under_review`, completely stripping contact details.

### Q: Are phone numbers and query values protected in logs?
**A:** Yes. In production mode (`NODE_ENV=production`), the Pino HTTP logger:
1. Redacts the `value` query parameter in lookup URLs to `value=[Redacted]`.
2. Omits request and response bodies from HTTP access logs.
3. Catches unhandled exceptions and logs only the error class and status code, preventing SQL error messages or stack traces from leaking to stdout.

---

## 4. Licensing & Operational Control

### Q: Where is the licence private signing key kept?
**A:** The private Ed25519 signing key is kept strictly offline on the authority machine. The server environment receives only the 32-byte hex-encoded public key (`LICENCE_PUBLIC_KEY_HEX`).

### Q: Can a licence be renewed without restarting the backend service?
**A:** Yes. When a new licence document is submitted via `POST /license`, the service verifies the Ed25519 signature, commits the new expiry to `license_state` in a database transaction, and immediately invalidates the in-memory licence cache. All subsequent requests recognize the renewed status instantly without dropping active connections.

### Q: What prevents an attacker from uploading an expired licence or rolling the clock backward?
**A:** 
1. `POST /license` validates that `expires_at > now()`, rejecting already-expired documents with HTTP 400.
2. The service enforces monotonic clock tracking via `latest_seen_time` and rejects any renewal where the expiry date is earlier than the currently active licence (`Licence expiry cannot move backwards`).

---

## 5. Judging Reset & Environment Isolation

### Q: How do you guarantee `POST /admin/reset` cannot delete production data?
**A:** The reset service enforces a fail-closed guard function (`isJudgingResetConfigured()`):
```typescript
export function isJudgingResetConfigured(): boolean {
  const env = getEnv();
  return (
    env.NODE_ENV !== "production" &&
    env.JUDGING_RESET_ENABLED === true &&
    env.JUDGING_DATABASE_DISPOSABLE === true &&
    env.JUDGING_ENVIRONMENT === "judging" &&
    Boolean(env.JUDGING_DATABASE_URL) &&
    env.JUDGING_DATABASE_URL === env.DATABASE_URL
  );
}
```
If any flag is absent or if `NODE_ENV === "production"`, the endpoint immediately throws `ResetUnavailableError` (HTTP 503) without executing any database statements.

### Q: Does a judging reset delete verified businesses or geographic areas?
**A:** No. `resetDerivedState()` uses a selective transaction that deletes only citizen reports, cases, alerts, challenges, and derived statistics. Seeded geographic areas (25 areas) and official verified helplines (19 identifiers) remain completely untouched.

---

## 6. Performance & Scalability

### Q: What is the lookup latency under real HTTPS?
**A:** Over 100 consecutive HTTPS requests tested on port 3443:
- **p50**: 14.31 ms
- **p95**: 16.23 ms
- **p99**: 22.27 ms
This is well within the PRD's sub-500 ms SLA and leaves substantial headroom for network latency.
