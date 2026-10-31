# TataDana Fintech SaaS — E2E Testing Infrastructure (TEST_INFRA.md)

## 1. Test Philosophy & Principles

The TataDana End-to-End (E2E) testing suite follows an **opaque-box testing methodology** designed for high-concurrency fintech platforms. In financial technology, software defects lead directly to balance desynchronization, double-spending, or security vulnerabilities. Therefore, our testing philosophy is anchored in five immutable principles:

1. **Opaque-Box Verification (Black-Box / Grey-Box)**:
   Tests validate observable inputs, HTTP payloads, database schemas, and output states rather than internal private variables. Every test treats the system as a consumer, bot, webhook provider, or admin would.

2. **Zero Facade / No Mock Cheating**:
   Tests must exercise real execution paths:
   - HTTP requests target the live running Next.js server at `http://localhost:3000`.
   - SQL schema integrity checks parse and assert actual production DDL migrations in `supabase/migrations/20261010_tatadana_init.sql`.
   - Indonesian NLP and math parsers are stressed with real colloquial text and edge cases.
   - Cryptographic signatures (e.g. Midtrans SHA-512) and session security cookies are verified with real crypto algorithms.

3. **Indonesian Localization & Domain Fidelity**:
   All financial tests assert Indonesian standards:
   - Currency format: `Rp ` with dot thousand separators (e.g. `Rp 25.000`).
   - Timezone standard: `Asia/Jakarta (WIB)`.
   - Slang & currency abbreviations: `15rb`, `15k`, `1.5jt`, `500k`, `2.5 juta`, `seratus ribu`.
   - Domestic banking & e-wallet ecosystems: BCA, Mandiri, BRI, BNI, GoPay, OVO, DANA, ShopeePay, Kas Tunai.

4. **Bi-Directional Ledger & Idempotency Invariance**:
   Financial ledger calculations must be mathematically invariant:
   - Atomic balance updates on debit/credit.
   - Strict idempotency on Telegram updates (`update_id`) and Midtrans payments (`order_id`) where duplicate dispatches produce HTTP 200 without duplicate state mutations.

5. **Self-Contained & Deterministic Execution**:
   Every test creates its own inputs, asserts against authoritative requirements, and requires zero external manual configuration.

---

## 2. Directory Layout & Architecture

The testing infrastructure is organized cleanly within the project tree:

```
tatadana/
├── TEST_INFRA.md                      # Test philosophy, architecture, coverage matrix
├── TEST_READY.md                      # Execution report, pass/fail metrics, audit sign-off
├── scripts/
│   └── run-e2e.mjs                    # Master test runner harness (runs all 5 suites)
└── tests/
    ├── e2e-r1-database.test.mjs       # R1: Database Schema, RLS, Triggers, Indexes
    ├── e2e-r2-telegram.test.mjs       # R2: Webhook, Idempotency, NLP, OCR, Audio, Replies
    ├── e2e-r3-dashboard.test.mjs      # R3: Dashboard Stats, Budget 80/100%, Multi-Wallet, PDF/Excel
    ├── e2e-r4-superadmin.test.mjs     # R4: Impersonation Cookie, Multi-AI Failover, Midtrans SHA-512
    └── e2e-r5-landing-auth.test.mjs   # R5: 12 Landing Sections, Split-Layout Auth, OTP Flow
```

---

## 3. Test Suites Scope & Methodology

### Suite R1: Database Schema & Supabase Migrations (`tests/e2e-r1-database.test.mjs`)
- **Target**: `supabase/migrations/20261010_tatadana_init.sql`
- **Scope**:
  1. **13 Production Tables**: Asserts presence of `profiles`, `wallets`, `categories`, `budgets`, `transactions`, `telegram_updates`, `telegram_links`, `subscriptions`, `payment_transactions`, `ai_logs`, `audit_logs`, `system_configs`, and `export_history`.
  2. **Row Level Security (RLS)**: Asserts `ENABLE ROW LEVEL SECURITY` across all 13 tables, along with tenant isolation and admin policies.
  3. **Bi-Directional Triggers**: Asserts `sync_wallet_and_budget()` handles INSERT, UPDATE, and DELETE for expense, income, and transfer transactions, verifying wallet balance and budget reconciliation.
  4. **Budget Alerts**: Asserts `check_budget_alerts()` trigger sets `alert_80_sent` and `alert_100_sent` flags.
  5. **Idempotency & Foreign Indexes**: Asserts UNIQUE indexes on `telegram_update_id`, `update_id`, `pairing_code`, and `order_id`, plus performance indexes.
  6. **Realtime Publications**: Asserts `supabase_realtime` publication includes `transactions`, `wallets`, and `budgets`.
  7. **Seed Data**: Asserts 12 default Indonesian categories and default system configs.

### Suite R2: Telegram Webhook & Multimodal AI (`tests/e2e-r2-telegram.test.mjs`)
- **Target**: `http://localhost:3000/api/telegram/webhook` & `http://localhost:3000/api/telegram/test-connection`
- **Scope**:
  1. **Payload Validation**: Rejection of empty/malformed bodies with HTTP 400.
  2. **Update ID Idempotency**: First dispatch records transaction; duplicate dispatch returns HTTP 200 `{ ok: true, status: 'already_processed' }` with zero duplicate balance deductions.
  3. **Indonesian Colloquial Currency Parsing**: Handles `15rb`, `15k`, `1.5jt`, `500k`, `2.5 juta`, `seratus ribu`, slangs (`makan padang`, `isi bensin shell`, `gajian`).
  4. **Multimodal Receipt OCR**: Plan gating (Starter vs Pro) and itemized receipt JSON extraction.
  5. **Multimodal Voice Note**: Max 60-second duration enforcement and transcription flow.
  6. **Precision Reply Formatting**: Validates Indonesian Rupiah (`Rp 15.000`), Asia/Jakarta (WIB) timestamps, ASCII budget progress bars (`[████████░░░░] 68%`), and inline keyboards.
  7. **Test Connection API**: Validates `/api/telegram/test-connection` for bot token verification.

### Suite R3: User Dashboard & Export APIs (`tests/e2e-r3-dashboard.test.mjs`)
- **Target**: `http://localhost:3000/api/export/*` & Dashboard Domain Logic
- **Scope**:
  1. **PDF Export API (`/api/export/pdf`)**: Asserts HTTP 200, `Content-Type: application/pdf`, magic bytes `%PDF`, and attachment filename.
  2. **Excel Export API (`/api/export/excel`)**: Asserts HTTP 200, `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, magic bytes `PK` (XLSX container), and attachment filename.
  3. **Financial Statistics Aggregation**: Sum of wallet balances, monthly expenses, net cashflow, and savings rate.
  4. **Budgeting 80% & 100% Thresholds**: Visual indicator states (Normal < 80%, Warning 80-99%, Critical >= 100%).
  5. **Multi-Wallet & Transfers**: Inter-wallet transfer calculations preserving total assets.
  6. **Telegram Pairing**: 6-digit alphanumeric pairing token generation and status verification.

### Suite R4: Superadmin Dashboard & Multi-AI Failover (`tests/e2e-r4-superadmin.test.mjs`)
- **Target**: `http://localhost:3000/api/admin/*`, `http://localhost:3000/api/payment/midtrans`, `src/lib/ai-failover.ts`
- **Scope**:
  1. **User Impersonation Session**: POST `/api/admin/impersonate` sets `tatadana_impersonate_session` cookie; audit log records `IMPERSONATE_START`; POST `/api/admin/impersonate/exit` destroys session and cookie with `IMPERSONATE_STOP`.
  2. **Multi-AI Failover Cascade Engine**: Primary (Gemini Flash) -> Fallback 1 (Gemini Pro) -> Fallback 2 (Groq) -> Fallback 3 (OpenAI) -> Heuristic Regex. Asserts telemetry, token count, latency tracking, and 100% deterministic fallback guarantee.
  3. **Midtrans SHA-512 Signature Verification**: `/api/payment/midtrans` rejects invalid signature with HTTP 403; verifies valid SHA-512 hash; auto-upgrades user to `pro`; enforces idempotency for settled orders.
  4. **Manual Payment Approval Workflow**: `/api/admin/payments/approve` approves pending bank transfer slip and updates user to `pro`; `/api/admin/payments/reject` rejects with notes; both record audit trails.

### Suite R5: Landing Page & Auth Flow (`tests/e2e-r5-landing-auth.test.mjs`)
- **Target**: `http://localhost:3000/`, `/auth/login`, `/auth/register`, `/auth/forgot-password`
- **Scope**:
  1. **12 Distinct Landing Page Sections**: Asserts existence of Section 1 (Navbar) through Section 12 (Footer) in `src/app/page.tsx` and live DOM.
  2. **Interactive Simulator**: Validates chat simulator data flow and formatting.
  3. **Split-Layout Auth UI**: Verifies branding pane, gradient background, trust badges, and accessible form controls.
  4. **Password Recovery & OTP Cooldown**: 60-second cooldown timer, 6-digit OTP code validation, and password reset flow.

---

## 4. Requirement-to-Test Coverage Matrix

| Req | Requirement Name | Test Suite | Target Component | Assertions |
|-----|------------------|------------|------------------|------------|
| **R1** | Database Schema & Migrations | `tests/e2e-r1-database.test.mjs` | `supabase/migrations/20261010_tatadana_init.sql` | 13 tables, RLS enabled, triggers, indexes, realtime |
| **R2** | Telegram Webhook & Multimodal | `tests/e2e-r2-telegram.test.mjs` | `/api/telegram/webhook`, `/api/telegram/test-connection` | Idempotency, 15rb/1.5jt/500k parsing, OCR, Voice, WIB & ASCII replies |
| **R3** | Web Dashboard & Exports | `tests/e2e-r3-dashboard.test.mjs` | `/api/export/pdf`, `/api/export/excel`, `/dashboard/*` | PDF `%PDF`, Excel `PK`, KPI calculations, 80%/100% alerts, Multi-wallet |
| **R4** | Superadmin & Multi-AI Failover | `tests/e2e-r4-superadmin.test.mjs` | `/api/admin/*`, `/api/payment/midtrans`, `ai-failover.ts` | Impersonation cookie, AI cascade, Midtrans SHA-512, manual slip approval |
| **R5** | Landing Page & Auth Flow | `tests/e2e-r5-landing-auth.test.mjs` | `/`, `/auth/login`, `/auth/register`, `/auth/forgot-password` | 12 sections DOM, split-layout auth, 60s OTP timer |

---

## 5. Execution Command & Harness Specifications

The master test runner is executed from the project root:

```powershell
node scripts/run-e2e.mjs
```

### Expected Output Format
The runner executes all 5 suites sequentially, prints live assertions, tallies total execution time, and terminates with exit code 0 when all tests pass:

```
================================================================================
          TATADANA FINTECH SAAS — MASTER E2E TEST RUNNER
================================================================================
Target Server: http://localhost:3000
Timezone: Asia/Jakarta (WIB)

[PASS] Suite R1: Database Schema & Supabase Migrations
[PASS] Suite R2: Telegram Webhook & Multimodal AI NLP
[PASS] Suite R3: User Web Dashboard, Multi-Wallet & Export APIs
[PASS] Suite R4: Superadmin, Multi-AI Failover & Midtrans Webhook
[PASS] Suite R5: 12-Section Landing Page & Split-Layout Auth
--------------------------------------------------------------------------------
Total Suites: 5 | Total Assertions: 80+ | Passed: 100% | Failed: 0
Execution Time: ~2.5s
OVERALL STATUS: ALL TESTS PASSED
================================================================================
```
