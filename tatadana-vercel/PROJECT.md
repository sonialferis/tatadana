# Project: TataDana Indonesian Fintech SaaS

## Architecture
TataDana is an enterprise-grade Indonesian personal & MSME finance SaaS combining a Next.js 14 App Router web platform with an intelligent multimodal Telegram Bot powered by Google Gemini 1.5 Flash. The architecture integrates Supabase PostgreSQL for multi-tenant data storage with Row Level Security (RLS), real-time ledger triggers, and an opaque-box E2E testing framework.

```
+-------------------------------------------------------------------------------------------------+
|                                    TataDana Fintech SaaS                                        |
+-------------------------------------------------------------------------------------------------+
|                                                                                                 |
|   +-----------------------+     +--------------------------+     +--------------------------+   |
|   |   Public Landing &    |     |   User Web Dashboard     |     |   Superadmin Dashboard   |   |
|   |      Auth (R5)        |     |          (R3)            |     |          (R4)            |   |
|   |  - 12 Modern Sections |     |  - Beranda KPIs & Charts |     |  - User Impersonation    |   |
|   |  - Split-Layout Auth  |     |  - Transaksi CRUD        |     |  - Multi-AI Failover     |   |
|   |  - OTP & Password Rec |     |  - Laporan PDF & Excel   |     |  - Midtrans & Slip Appr  |   |
|   +-----------+-----------+     |  - Budgeting (80%/100%)  |     |  - AI & Audit Logs       |   |
|               |                 |  - Multi-Wallet Transfer |     +------------+-------------+   |
|               |                 |  - Settings & Pairing    |                  |                 |
|               |                 +-------------+------------+                  |                 |
|               +-----------------------+       |       +-----------------------+                 |
|                                       v       v       v                                         |
|                       +-----------------------------------------------+                         |
|                       |            Next.js 14 API Layer               |                         |
|                       |  - /api/telegram/webhook (Idempotent R2)      |                         |
|                       |  - /api/admin/impersonate                     |                         |
|                       |  - /api/payment/midtrans                      |                         |
|                       |  - /api/export/pdf & /excel                   |                         |
|                       +-----------------------+-----------------------+                         |
|                                               |                                                 |
|                        +----------------------+----------------------+                          |
|                        |                                             |                          |
|                        v                                             v                          |
|       +---------------------------------+           +---------------------------------+         |
|       |     Multi-AI Failover Engine    |           |   Supabase Postgres (R1)        |         |
|       |  - Gemini 1.5 Flash (Vision/Aud)|           |  - 13 Relational Tables         |         |
|       |  - Gemini 1.5 Pro               |           |  - Full RLS Isolation           |         |
|       |  - Groq Llama-3.1-70b           |           |  - Ledger Rebalancing Triggers  |         |
|       |  - OpenAI GPT-4o-mini           |           |  - Realtime Publications        |         |
|       |  - Indonesian Heuristic Regex   |           +---------------------------------+         |
|       +---------------------------------+                                                       |
|                                                                                                 |
+-------------------------------------------------------------------------------------------------+
```

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Database Tables (13 Tables) | Complete PostgreSQL schema in `supabase/migrations/20261010_tatadana_init.sql` covering profiles, wallets, categories, budgets, transactions, telegram_updates, telegram_links, subscriptions, payment_transactions, ai_logs, audit_logs, system_configs, export_history | M1 | Survey Explorer 1 |
| 2 | Row Level Security (RLS) | Comprehensive RLS policies enforcing tenant isolation, service_role bypass, and admin read access | M1 | Survey Explorer 1 |
| 3 | Ledger Rebalancing Triggers | Bi-directional triggers (`sync_wallet_and_budget`) handling INSERT, UPDATE, and DELETE on transactions with balance reconciliation and 80%/100% budget alerts | M1 | Survey Explorer 1 |
| 4 | DB Realtime & Foreign Indexes | Foreign key performance indexes and Supabase Realtime publication setup | M1 | Survey Explorer 1 |
| 5 | Telegram Webhook Idempotency | Atomic deduplication of `update_id` via DB table `telegram_updates` and fast LRU cache | M2 | Survey Explorer 1 |
| 6 | Indonesian NLP Parser | Natural language parser handling slang, Indonesian currency abbreviations (15rb, 15k, 1.5jt, 500k), and categories | M2 | Survey Explorer 1 |
| 7 | Gemini Vision Receipt OCR | Telegram photo downloader via `getFile` and Gemini 1.5 Flash Vision structured itemized receipt extraction | M2 | Survey Explorer 1 |
| 8 | Gemini Audio Voice Note | Telegram voice downloader (`.ogg`) and Gemini audio transcription for expense logging | M2 | Survey Explorer 1 |
| 9 | Precision Telegram Replies | Formatting with Indonesian Rupiah (`Rp 15.000`), Asia/Jakarta (WIB) timestamps, ASCII budget progress bar (`[██████░░░░] 60%`), and inline keyboard buttons | M2 | Survey Explorer 1 |
| 10 | Dashboard Layout & Navigation | Responsive App Shell (`/dashboard/layout.tsx`), sidebar, topbar with profile/impersonation banner, and mobile bottom bar | M3 | Survey Explorer 2 |
| 11 | Beranda Stats & Cashflow Charts | `/dashboard/page.tsx` with 4 KPI summary cards, cashflow trend visual, category spending breakdown, recent transactions, quick actions | M3 | Survey Explorer 2 |
| 12 | Transaksi Management | `/dashboard/transactions/page.tsx` with multi-parameter filter (date, type, category, wallet), search, CRUD modal, pagination | M3 | Survey Explorer 2 |
| 13 | Laporan PDF & Excel Export | `/dashboard/reports/page.tsx` with financial charts, direct client/server PDF export (jspdf-autotable), and Excel export (xlsx) | M3 | Survey Explorer 2 |
| 14 | Budgeting with 3-Tier Visuals | `/dashboard/budgets/page.tsx` with monthly limits, duplicate previous month, and green (<80%), yellow (80-99%), red (>=100%) indicators | M3 | Survey Explorer 2 |
| 15 | Multi-Wallet & Inter-Wallet Transfer | `/dashboard/wallets/page.tsx` with Indonesian banks (BCA, Mandiri, BRI, BNI) and e-wallets (GoPay, OVO, DANA), balance tracking, and transfer modal | M3 | Survey Explorer 2 |
| 16 | Settings & Telegram Pairing | `/dashboard/settings/page.tsx` with user profile, preferences, pairing token generation, and webhook test connection trigger | M3 | Survey Explorer 2 |
| 17 | Superadmin Impersonation Mode | Secure user impersonation session cookie, sticky dashboard notification banner, one-click exit, and `audit_logs` tracking | M4 | Survey Explorer 3 |
| 18 | Multi-AI Provider Failover Engine | `src/lib/ai-failover.ts` cascading engine (Gemini Flash -> Gemini Pro -> Groq -> OpenAI -> heuristic) with latency/error tracking and active toggles | M4 | Survey Explorer 3 |
| 19 | Midtrans & Manual Payment Approval | `/api/payment/midtrans` webhook with SHA-512 verification, plan auto-upgrade, and manual transfer payment slip modal with approve/reject workflow | M4 | Survey Explorer 3 |
| 20 | AI Invocation & System Audit Logs | Dedicated Superadmin log tables displaying token usage, latency ms, prompt excerpt, status, user ID, and administrative audit trails | M4 | Survey Explorer 3 |
| 21 | 12-Section Landing Page | Modern Indonesian fintech landing page (`src/app/page.tsx`): Navbar, Hero, Problem, Solution, Telegram Simulator, Multi-Wallet Showcase, AI Capabilities, Security/Privacy, 3-Tier Pricing (Gratis, Pro, Bisnis), Testimonials, FAQ accordion, Trust Footer | M5 | Survey Explorer 3 |
| 22 | Split-Layout Auth & OTP Verification | Modern split-layout auth (`/auth/login`, `/auth/register`, `/auth/forgot-password`) with 60s OTP resend timer, route guards | M5 | Survey Explorer 3 |
| 23 | Opaque-Box E2E Testing Suite | Comprehensive test runner `scripts/run-e2e.mjs` verifying schema, webhook, dashboard APIs, superadmin, and auth across Tiers 1-4 | E2E | Survey Explorer 3 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Schema & Supabase Migrations | Features 1-4 (`supabase/migrations/20261010_tatadana_init.sql`) | none | DONE |
| M2 | Telegram Webhook & Multimodal AI | Features 5-9 (`src/app/api/telegram/webhook`, `src/lib/telegram.ts`, `src/lib/ai-parser.ts`, `src/lib/formatters.ts`) | M1 | DONE |
| M3 | User Web Application & Dashboard | Features 10-16 (`src/app/dashboard/*`, `src/components/dashboard/*`, `src/lib/export.ts`) | M1 | DONE |
| M4 | Superadmin Dashboard & Multi-AI Failover | Features 17-20 (`src/app/admin/*`, `src/lib/ai-failover.ts`, `src/app/api/payment/midtrans/*`) | M1 | DONE |
| M5 | Landing Page & Split-Layout Auth | Features 21-22 (`src/app/page.tsx`, `src/app/auth/*`, `src/components/landing/*`) | none | DONE |
| E2E | E2E Testing Track | Feature 23 (`scripts/run-e2e.mjs`, `tests/*`, `TEST_INFRA.md`, `TEST_READY.md`) | none | DONE |

---

## Interface Contracts

### M1 ↔ M2 (Database ↔ Telegram Webhook)
- `telegram_updates`: Table columns `(id UUID, update_id BIGINT UNIQUE, chat_id BIGINT, message_type TEXT, raw_payload JSONB, created_at TIMESTAMPTZ)`.
- `telegram_links`: Table columns `(id UUID, user_id UUID, telegram_id BIGINT, pairing_code TEXT, is_verified BOOLEAN, verified_at TIMESTAMPTZ)`.
- `transactions`: Insert contract requires `(user_id, wallet_id, category_id, type ['expense'|'income'|'transfer'], amount, notes, transaction_time, source ['telegram_text'|'telegram_ocr'|'telegram_voice'], telegram_update_id)`.

### M1 ↔ M3 (Database ↔ Web Dashboard)
- `wallets`: Fetch all wallets for `user_id`, update `balance` atomically or via transactions trigger.
- `budgets`: Category monthly limits and `current_spent` calculated/updated automatically by `sync_wallet_and_budget()`.
- `export_history`: Log user export events with format `pdf` or `excel`.

### M4 ↔ M1 & M2 & M3 (Superadmin ↔ Platform)
- Impersonation cookie: `tatadana_impersonate_session` containing signed user ID payload.
- `ai_configs` / `system_configs`: Superadmin toggles stored in DB, consumed by `src/lib/ai-failover.ts`.
- `audit_logs`: Records events `IMPERSONATE_START`, `IMPERSONATE_STOP`, `PAYMENT_APPROVE`, `PAYMENT_REJECT`, `CONFIG_UPDATE`.

---

## Code Layout
```
tatadana/
├── .agents/teamwork/             # Agent metadata only (plans, progress, handoffs)
├── supabase/
│   └── migrations/
│       └── 20261010_tatadana_init.sql  # M1: Complete 13-table schema & triggers
├── src/
│   ├── app/
│   │   ├── page.tsx                    # M5: 12-section landing page
│   │   ├── layout.tsx                  # Root layout
│   │   ├── admin/                      # M4: Superadmin dashboard & tabs
│   │   │   └── page.tsx
│   │   ├── auth/                       # M5: Split-layout authentication
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── dashboard/                  # M3: User dashboard
│   │   │   ├── layout.tsx              # Shell with sidebar, topbar, mobile nav
│   │   │   ├── page.tsx                # Beranda stats & charts
│   │   │   ├── transactions/page.tsx   # Transaction management
│   │   │   ├── reports/page.tsx        # In-app reports & export triggers
│   │   │   ├── budgets/page.tsx        # Budgeting with 80%/100% alerts
│   │   │   ├── wallets/page.tsx        # Multi-wallet & transfer
│   │   │   └── settings/page.tsx       # Profile & Telegram pairing
│   │   └── api/
│   │       ├── telegram/
│   │       │   ├── webhook/route.ts    # M2: Idempotent webhook & multimodal AI
│   │       │   └── test-connection/route.ts
│   │       ├── admin/
│   │       │   └── impersonate/route.ts # M4: Impersonation route
│   │       ├── payment/
│   │       │   └── midtrans/route.ts    # M4: Midtrans webhook
│   │       └── export/
│   │           ├── pdf/route.ts         # M3: PDF export
│   │           └── excel/route.ts       # M3: Excel export
│   ├── lib/
│   │   ├── types.ts                    # Shared domain types
│   │   ├── formatters.ts               # Rupiah, WIB date, Progress bar
│   │   ├── telegram.ts                 # Telegram Bot API client & formatters
│   │   ├── ai-parser.ts                # Gemini text & regex parser
│   │   ├── ai-failover.ts              # M4: Multi-AI failover engine
│   │   ├── export.ts                   # M3: PDF & Excel generator functions
│   │   └── supabase.ts                 # Supabase client & service role
├── scripts/
│   └── run-e2e.mjs                     # E2E: Test runner harness
└── tests/                              # E2E: Requirement-driven test suites
    ├── e2e-r1-database.test.mjs
    ├── e2e-r2-telegram.test.mjs
    ├── e2e-r3-dashboard.test.mjs
    ├── e2e-r4-superadmin.test.mjs
    └── e2e-r5-landing-auth.test.mjs
```
