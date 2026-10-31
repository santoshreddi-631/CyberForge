# Community Scam Map — Verified API Contract

This document specifies the exact, verified HTTP API contracts between the Community Scam Map frontend and backend, grounded in the original PRD (`PRD_Community_Scam_Map.pdf`) and the backend OpenAPI specification (`backend/contracts/openapi.yaml`).

Base URL: `http://localhost:3001` (configured via `NEXT_PUBLIC_API_BASE_URL` in frontend).

---

## 1. GET /health

Liveness probe for health checkers and load balancers. Always reachable (even when licence is expired or database is initializing).

- **Method:** `GET`
- **Route:** `/health`
- **Headers:** `Accept: application/json`
- **Request Body:** None
- **Response Status:** `200 OK`
- **Response JSON:**
  ```json
  {
    "ok": true
  }
  ```

---

## 2. POST /reports

Submits an individual citizen scam incident report. Normalized and pseudonymized server-side.

- **Method:** `POST`
- **Route:** `/reports`
- **Headers:** `Content-Type: application/json`, `Accept: application/json`
- **Request JSON:**
  ```json
  {
    "report_id": "rep_000123",
    "occurred_at": "2026-10-27T18:21:04.000Z",
    "reported_at": "2026-10-27T18:40:04.000Z",
    "reporter_id": "r_7c2d91aa",
    "ip_prefix": "103.21.58",
    "channel": "Phone call",
    "scam_type": "digital-arrest",
    "identifier_type": "phone",
    "identifier_value": "+91 98765 43210",
    "pincode": "560102",
    "locality": "HSR Layout",
    "city": "Bengaluru",
    "note": "Optional incident note (never leaked)",
    "has_screenshot": false,
    "amount_lost_inr": 0
  }
  ```
- **Field Constraints:**
  - `channel`: `"Phone call" | "SMS or WhatsApp" | "QR code" | "Fake website" | "UPI request" | "Something else"`
  - `identifier_type`: `"phone" | "upi" | "url" | "sender_id"`
  - `pincode`: 6-digit Indian postal code (`^\d{6}$`)
  - `reported_at`: ISO datetime, must not precede `occurred_at`
- **Response Status:** `201 Created`
- **Response JSON:**
  ```json
  {
    "report_id": "rep_000123",
    "case_id": "case_abc123",
    "merged": true
  }
  ```
- **Error Responses:**
  - `400 Bad Request`: `{ "error": "<validation message>" }` (e.g. invalid phone/UPI/URL format)
  - `403 Forbidden`: `{ "error": "LICENSE_EXPIRED" }`
  - `429 Too Many Requests`: `{ "error": "Rate limit exceeded" }` (>3 reports/hour from reporter)

---

## 3. GET /lookup

Queries an identifier against the Community Scam Map defense grid.

- **Method:** `GET`
- **Route:** `/lookup`
- **Query Parameters:**
  - `type` (required): `"phone" | "upi" | "url" | "sender_id"`
  - `value` (required): Raw or normalized identifier string (URL-encoded)
- **Response Status:** `200 OK`
- **Response JSON:**
  ```json
  {
    "verdict": "KNOWN_SCAM",
    "report_count": 8,
    "distinct_reporters": 5,
    "first_seen": "2026-10-20T10:15:00.000Z",
    "last_seen": "2026-10-27T18:21:04.000Z",
    "scam_type": "digital-arrest",
    "display_value": "+91 98765 43210",
    "evidence": [
      {
        "occurred_at": "2026-10-27T18:21:04.000Z",
        "channel": "Phone call",
        "scam_type": "digital-arrest",
        "pincode": "560102"
      }
    ],
    "challenged": false
  }
  ```
- **Permitted Verdicts:**
  - `KNOWN_SCAM`: ≥5 independent voices across ≥3 prefixes & 2 time buckets with evidence score ≥0.65
  - `SUSPICIOUS`: Some signals or reports exist, but below `KNOWN_SCAM` threshold
  - `NO_REPORTS`: Identifier is valid syntax, but zero reports exist (advisory shown: absence of reports ≠ safe)
  - `VERIFIED_BUSINESS`: Official bank/telecom/government entity on PRD verified registry
- **Privacy Guarantees:**
  - `display_value` is masked until ≥3 distinct reporters corroborate (e.g., `98XXXXX210`, `r***@okaxis`)
  - Reporter identities, IPs, and notes are never returned in public responses.

---

## 4. GET /map

Returns 7-day clustered scam intelligence aggregated by postal area centroid.

- **Method:** `GET`
- **Route:** `/map`
- **Query Parameters:**
  - `pincode` (required): 6-digit Indian postal code (`^\d{6}$`)
  - `days` (optional, default: 7): 1–30
  - `radius_km` (optional, default: 2): 0–100 km
- **Response Status:** `200 OK`
- **Response JSON:**
  ```json
  {
    "clusters": [
      {
        "pincode": "560102",
        "locality": "HSR Layout",
        "city": "Bengaluru",
        "count": 14,
        "top_scam_type": "upi-refund-qr",
        "severity": "CRIT",
        "lat": 12.9116,
        "lng": 77.6473
      }
    ]
  }
  ```
- **Privacy Guarantees:**
  - Coordinates are area centroids from PRD Appendix B reference data; never reporter GPS locations.
  - Severity: `"CRIT" | "HIGH" | "MED"`

---

## 5. GET /alerts

Returns high-priority threat warnings for a postal area.

- **Method:** `GET`
- **Route:** `/alerts`
- **Query Parameters:**
  - `pincode` (required): 6-digit postal code (`^\d{6}$`)
- **Response Status:** `200 OK`
- **Response JSON:**
  ```json
  {
    "alerts": [
      {
        "type": "SPIKE",
        "pincode": "560102",
        "window": "24h",
        "count": 8,
        "baseline_per_day": 2.1
      },
      {
        "type": "NEW_TYPE",
        "pincode": "560102",
        "scam_type": "digital-arrest",
        "window": "24h"
      }
    ]
  }
  ```
- **Alert Types:**
  - `SPIKE`: Reports in last 24h ≥ 2× daily average of prior 7 days AND ≥ 5 reports
  - `NEW_TYPE`: Scam category seen in last 24h not seen in prior 30 days for that area

---

## 6. POST /challenges

Allows a legitimate business to dispute a flagged identifier.

- **Method:** `POST`
- **Route:** `/challenges`
- **Request JSON:**
  ```json
  {
    "identifier_type": "phone",
    "identifier_value": "+91 80 4100 2233",
    "claimant_name": "Fresh Bakes",
    "contact_email": "owner@freshbakes.test",
    "proof_note": "GSTIN registration certificate attached for Indiranagar outlet."
  }
  ```
- **Response Status:** `201 Created`
- **Response JSON:**
  ```json
  {
    "challenge_id": "chl_abc123",
    "status": "under_review"
  }
  ```
- **Status Values:** `"under_review" | "resolved_verified" | "resolved_rejected"`
- **Privacy & Precedence:** Contact email and proof note are restricted; under-review identifiers are never returned as `KNOWN_SCAM`.

---

## 7. GET /license

Displays licence activation status and expiry timestamp. Always reachable, even when expired.

- **Method:** `GET`
- **Route:** `/license`
- **Response Status:** `200 OK`
- **Response JSON:**
  ```json
  {
    "licensee": "Demo Bank",
    "expires_at": "2026-11-15T10:05:00.000Z",
    "valid": true,
    "expired": false
  }
  ```

---

## 8. POST /license

Updates and activates a digitally signed licence file immediately without requiring a server restart.

- **Method:** `POST`
- **Route:** `/license`
- **Request JSON:**
  ```json
  {
    "licensee": "Demo Bank",
    "expires_at": "2026-12-31T23:59:59.000Z",
    "signature": "base64_or_hex_ed25519_signature"
  }
  ```
- **Response Status:** `200 OK`
- **Response JSON:** Same schema as `GET /license`.
- **Validation Rules:**
  - Ed25519 signature verified with embedded/configured public key.
  - Rejects signatures over past timestamps or clock rollbacks.

---

## 9. POST /admin/reset

Disposable test harness reset endpoint. Deletes all user-submitted reports, cases, and challenges while preserving reference and verified entity data.

- **Method:** `POST`
- **Route:** `/admin/reset`
- **Response Status:** `200 OK` (when running in judging environment) or `503 Service Unavailable` (fail-closed in non-judging / production environments).
- **Response JSON:**
  ```json
  {
    "deleted": 42
  }
  ```

