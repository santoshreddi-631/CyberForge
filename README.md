# ScamWatch — 

India's Citizen Cyber Fraud Defense Grid — A unified, privacy-first platform connecting community scam reporting, real-time threat intelligence lookup, regional alert aggregation, and geospatial cluster analysis.

---

## 1. Project Overview

The **ScamWatch** platform () enables Indian citizens to report scam incidents and verify suspicious phone numbers, UPI handles, phishing URLs, and SMS sender IDs without mandatory login or authentication.

Key architectural pillars:
- **Zero Privacy Leakage:** Reporter identities (HMAC-SHA256 pseudonymized), raw notes, and exact GPS coordinates are strictly internal. Public responses aggregate data by postal code (PIN) centroids and mask raw identifiers until confirmed by multiple independent reports.
- **Backend Trust Engine:** Deterministic anti-abuse algorithms require corroboration across multiple independent networks (HMAC IP prefixes) and time buckets with evidence scoring before classifying an entity as `KNOWN_SCAM`.
- **Digital Licence Verification:** Offline Ed25519 cryptographic signatures verify tenant licences dynamically with rollback protection via `GET /license` and `POST /license` without application downtime.
- **Full-Stack Integration:** Next.js 16 frontend with Tailwind CSS and React 19 seamlessly communicating with an Express 5 + TypeScript backend backed by PostgreSQL.

---

## 2. Prerequisites

- **Node.js:** v20.x or v22.x+ (tested on Node.js v20.20.1)
- **PostgreSQL:** v15+ or v18+ (tested on PostgreSQL 18.x)
- **Git**

---

## 3. Project Structure

```
CyberForge/
├── contracts/
│   └── api-contract.md             # Verified HTTP contract documentation
├── backend/
│   ├── contracts/
│   │   └── openapi.yaml            # OpenAPI 3.1 specification (source of truth)
│   ├── src/
│   │   ├── app.ts                  # Express application factory & middleware stack
│   │   ├── server.ts               # HTTP server entry point & graceful shutdown
│   │   ├── config/                 # Environment validation (Zod) & Pino logger
│   │   ├── db/                     # Drizzle ORM client, schemas, migrations, seeds
│   │   ├── middleware/             # Error handling, logging, licence enforcement
│   │   └── modules/                # Reports, Lookup, Geo Map, Alerts, Challenges, Trust
│   ├── scripts/                    # Database seeding, license issuance, E2E verifier
│   ├── tests/                      # Vitest test suites (19 suites, 129 tests)
│   ├── .env.example                # Example backend environment variables
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js App Router (/, /lookup, /report, /map, /alerts, /disputes)
│   │   ├── components/             # Reusable UI & page container components
│   │   ├── hooks/                  # Bilingual localization & responsive hooks
│   │   ├── lib/                    # API client, contracts, constants, validators
│   │   └── types/                  # TypeScript contract & domain definitions
│   ├── public/                     # Static icons and assets
│   ├── .env.example                # Example frontend environment variables
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
├── PRD_Community_Scam_Map.pdf       # Original PRD source of truth
└── README.md                       # Local development and operational guide
```

---

## 4. Environment Setup

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and configure:

```bash
cd backend
cp .env.example .env
```

Example configuration (`backend/.env`):
```env
NODE_ENV=development
PORT=3001
HOST=0.0.0.0
DATABASE_URL=postgres://postgres:root@localhost:5432/cyberforge
LICENCE_PUBLIC_KEY_HEX=e77a71563a83cdc06d91629dee5360ec2e4e4fbd919887b0e0d696a1b75cc952
CORS_ORIGIN=*
LOG_LEVEL=info
REPORTER_HMAC_SECRET=your_32_byte_secret_here_replace_with_random_bytes
TEST_DATABASE_URL=postgres://postgres:root@127.0.0.1:5432/cyberforge_test
```

### Frontend (`frontend/.env.local`)
Create or edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

---

## 5. Database Setup and Migrations

1. Ensure PostgreSQL is running on `localhost:5432`.
2. Create the development and test databases:
   ```sql
   CREATE DATABASE cyberforge;
   CREATE DATABASE cyberforge_test;
   ```
3. Run Drizzle database migrations:
   ```bash
   cd backend
   npm run db:migrate
   ```
4. Seed reference data (25 postal area centroids from PRD Appendix B and 19 verified official entities from Appendix C):
   ```bash
   npm run db:seed
   ```

---

## 6. How to Run Locally

### Terminal 1 — Start Backend
```bash
cd backend
npm run dev
```
Backend runs with hot-reload at: **http://localhost:3001**
- Health check: `http://localhost:3001/health` -> `{"ok":true}`
- License check: `http://localhost:3001/license`

### Terminal 2 — Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs at: **http://localhost:3000**

---

## 7. Connecting Every Page to Backend

| Route | Page | Backend Integration | Notes |
|---|---|---|---|
| `/` | **Home** | Client-side routing to `/lookup`, `/report`, `/map`, `/alerts` | Floating Paths background preserved; no fabricated counters |
| `/lookup` | **Lookup** | `GET /lookup?type=<type>&value=<val>` | Returns exact verdicts (`KNOWN_SCAM`, `SUSPICIOUS`, `NO_REPORTS`, `VERIFIED_BUSINESS`); masks unconfirmed data |
| `/report` | **Report** | `POST /reports` | Validates incident data, records pseudonymized reports, returns `{ report_id, case_id, merged }` |
| `/map` | **Scam Map** | `GET /map?pincode=560102&days=7&radius_km=2` | Displays aggregated 7-day clusters at area centroids without leaking reporter GPS |
| `/alerts` | **Alerts** | `GET /alerts?pincode=<pincode>` | Surfaces documented `SPIKE` (≥2× baseline & ≥5) and `NEW_TYPE` warnings |
| `/disputes`| **Disputes** | `POST /challenges` | Submits business challenges, returns `under_review`, hides private contact fields |

---

## 8. Verification & Testing

### Frontend Checks
```bash
cd frontend
npm run lint         # ESLint check (0 errors, 0 warnings)
npx tsc --noEmit     # TypeScript typecheck (0 errors)
npm run build        # Production Next.js build
```

### Backend Test Suite
```bash
cd backend
npm test             # Vitest test suite (19 test files, 129 tests passed)
```

### End-to-End Integration Verification
Verifies all 5 user flows (Flows A through E) against real application routes and database:
```bash
cd backend
npx tsx scripts/e2e-integration-verify.ts
# Result: 36 PASSED, 0 FAILED
```

---

## 9. API Documentation

- **Contract Reference:** [`contracts/api-contract.md`](contracts/api-contract.md)
- **OpenAPI 3.1 Specification:** [`backend/contracts/openapi.yaml`](backend/contracts/openapi.yaml)

---

## 10. Deployment Instructions

### Container Deployment (Docker)
```bash
cd backend
docker build -t scammap-backend .
docker run -p 3001:3001 --env-file .env scammap-backend
```

### Production Platform (Render / Railway / Cloud)
1. Provision a managed PostgreSQL instance and set `DATABASE_URL`.
2. Deploy `backend` with `npm ci && npm run build` and `npm start`.
3. Set `CORS_ORIGIN` to your trusted production frontend URL.
4. Deploy `frontend` (e.g. Vercel) with `NEXT_PUBLIC_API_BASE_URL` pointing to your backend URL.
5. Execute `npm run db:migrate` and `npm run db:seed` during deployment setup.
