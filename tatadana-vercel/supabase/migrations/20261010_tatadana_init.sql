-- ==============================================================================
-- TATADANA INDONESIAN FINTECH SAAS - COMPREHENSIVE PRODUCTION MIGRATION
-- Migration: 20261010_tatadana_init.sql
-- Timezone Standard: Asia/Jakarta (WIB)
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- AUTH SCHEMA & HELPER FUNCTIONS (FOR PORTABLE LOCAL & SUPABASE EXECUTION)
-- ==============================================================================
CREATE SCHEMA IF NOT EXISTS auth;

-- Define auth.uid() function if not already present
CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Define auth.role() function if not already present
CREATE OR REPLACE FUNCTION auth.role() 
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('request.jwt.claim.role', true), '');
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Ensure auth.users stub exists for foreign key references in standalone environments
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT,
    phone TEXT,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- HELPER TRIGGERS & UTILITY FUNCTIONS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW() AT TIME ZONE 'Asia/Jakarta';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Admin and service role authorization check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==============================================================================
-- 1. PROFILES (USER PROFILE & TELEGRAM / NOTIFICATION PREFERENCES)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone_number TEXT UNIQUE,
    phone_verified BOOLEAN DEFAULT FALSE,
    telegram_id BIGINT UNIQUE,
    telegram_username TEXT,
    telegram_bot_token_encrypted TEXT,
    telegram_connected BOOLEAN DEFAULT FALSE,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'business')),
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
    default_currency TEXT DEFAULT 'IDR',
    reminder_enabled BOOLEAN DEFAULT TRUE,
    reminder_frequency INTEGER DEFAULT 1 CHECK (reminder_frequency IN (1, 2)),
    reminder_time_1 TIME DEFAULT '08:00:00',
    reminder_time_2 TIME DEFAULT '20:00:00',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 2. WALLETS (DOMPET & REKENING KEUANGAN MULTI-SOURCE)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('cash', 'bank', 'ewallet', 'investment', 'other')),
    account_number TEXT,
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN DEFAULT FALSE,
    color TEXT DEFAULT '#ea580c',
    icon TEXT DEFAULT 'wallet',
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

DROP TRIGGER IF EXISTS trg_wallets_updated_at ON public.wallets;
CREATE TRIGGER trg_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 3. CATEGORIES (KATEGORI PENGELUARAN & PEMASUKAN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- NULL = Kategori Sistem Global
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '📌',
    color TEXT NOT NULL DEFAULT '#ea580c',
    type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_global_name_type 
ON public.categories(name, type) WHERE user_id IS NULL;

-- ==============================================================================
-- 4. BUDGETS (ANGGARAN BULANAN PER KATEGORI & ALERT TRACKING)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    monthly_limit NUMERIC(15, 2) NOT NULL CHECK (monthly_limit > 0),
    current_spent NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    alert_80_sent BOOLEAN DEFAULT FALSE,
    alert_100_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT uq_budgets_user_cat_month_year UNIQUE (user_id, category_id, month, year)
);

DROP TRIGGER IF EXISTS trg_budgets_updated_at ON public.budgets;
CREATE TRIGGER trg_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 5. TRANSACTIONS (BUKU KAS UTAMA: PENGELUARAN, PEMASUKAN & TRANSFER)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE RESTRICT,
    to_wallet_id UUID REFERENCES public.wallets(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    notes TEXT,
    transaction_time TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    source TEXT NOT NULL DEFAULT 'web' CHECK (source IN ('web', 'telegram_text', 'telegram_ocr', 'telegram_voice', 'api')),
    telegram_update_id BIGINT UNIQUE,
    is_ocr BOOLEAN DEFAULT FALSE,
    ocr_items JSONB DEFAULT '[]'::jsonb,
    voice_duration_seconds INTEGER,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ==============================================================================
-- 6. TELEGRAM UPDATES (WEBHOOK IDEMPOTENCY LEDGER)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.telegram_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    update_id BIGINT UNIQUE NOT NULL,
    chat_id BIGINT NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    message_type TEXT,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'processed' CHECK (status IN ('received', 'processing', 'processed', 'failed')),
    error_message TEXT,
    processed_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ==============================================================================
-- 7. TELEGRAM LINKS (PAIRING TOKEN & DEEP-LINK VERIFIKASI)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.telegram_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    telegram_id BIGINT,
    pairing_code TEXT UNIQUE NOT NULL,
    verification_code TEXT GENERATED ALWAYS AS (pairing_code) STORED,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    code_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ==============================================================================
-- 8. SUBSCRIPTIONS (STATUS PAKET PENGGUNA)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro', 'business')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'expired', 'pending')),
    start_date TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    end_date TIMESTAMPTZ,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 9. PAYMENT TRANSACTIONS (MIDTRANS & TRANSFER MANUAL SLIP)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    order_id TEXT UNIQUE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('midtrans', 'manual_transfer')),
    payment_type TEXT GENERATED ALWAYS AS (payment_method) STORED,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'settlement', 'capture', 'deny', 'expire', 'cancel', 'refund')),
    payment_status TEXT GENERATED ALWAYS AS (status) STORED,
    proof_url TEXT,
    proof_image_url TEXT GENERATED ALWAYS AS (proof_url) STORED,
    notes TEXT,
    admin_notes TEXT GENERATED ALWAYS AS (notes) STORED,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    midtrans_transaction_id TEXT,
    midtrans_response JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

DROP TRIGGER IF EXISTS trg_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER trg_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 10. AI LOGS (TELEMETRI & AUDIT MULTI-AI GEMINI/OPENAI/GROQ/HEURISTIC)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    model_name TEXT NOT NULL,
    model TEXT GENERATED ALWAYS AS (model_name) STORED,
    provider TEXT NOT NULL CHECK (provider IN ('gemini', 'openai', 'groq', 'heuristic', 'deepseek')),
    prompt_excerpt TEXT,
    response_excerpt TEXT,
    tokens_used INTEGER DEFAULT 0,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    cost_estimate_idr NUMERIC(10, 2) DEFAULT 0.00,
    latency_ms INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('success', 'fail', 'failed', 'fallback')),
    operation_type TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ==============================================================================
-- 11. AUDIT LOGS (JEJAK AKTIVITAS SUPERADMIN & KEAMANAN SISTEM)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ==============================================================================
-- 12. SYSTEM CONFIGS (KONFIGURASI PLATFORM, FAILOVER & PEMBAYARAN)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_configs (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

DROP TRIGGER IF EXISTS trg_system_configs_updated_at ON public.system_configs;
CREATE TRIGGER trg_system_configs_updated_at
BEFORE UPDATE ON public.system_configs
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 13. EXPORT HISTORY (RIWAYAT GENERASI DOKUMEN PDF, EXCEL & CSV)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.export_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    format TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'xlsx', 'csv')),
    row_count INTEGER DEFAULT 0,
    file_name TEXT NOT NULL,
    file_path TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Asia/Jakarta')
);

-- ==============================================================================
-- COMPATIBILITY VIEWS
-- ==============================================================================
CREATE OR REPLACE VIEW public.subscription_orders AS
SELECT 
    id,
    user_id,
    order_id,
    'pro'::text AS plan,
    amount,
    payment_method AS payment_type,
    status AS payment_status,
    proof_url AS proof_image_url,
    notes AS admin_notes,
    reviewed_by AS approved_by,
    created_at,
    updated_at
FROM public.payment_transactions;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES ON ALL 13 TABLES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy" ON public.profiles 
FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles insert policy" ON public.profiles;
CREATE POLICY "Profiles insert policy" ON public.profiles 
FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles 
FOR UPDATE USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Profiles delete policy" ON public.profiles;
CREATE POLICY "Profiles delete policy" ON public.profiles 
FOR DELETE USING (public.is_admin());

-- 2. Wallets Policies
DROP POLICY IF EXISTS "Wallets select policy" ON public.wallets;
CREATE POLICY "Wallets select policy" ON public.wallets 
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Wallets insert policy" ON public.wallets;
CREATE POLICY "Wallets insert policy" ON public.wallets 
FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Wallets update policy" ON public.wallets;
CREATE POLICY "Wallets update policy" ON public.wallets 
FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Wallets delete policy" ON public.wallets;
CREATE POLICY "Wallets delete policy" ON public.wallets 
FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 3. Categories Policies
DROP POLICY IF EXISTS "Categories select policy" ON public.categories;
CREATE POLICY "Categories select policy" ON public.categories 
FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Categories insert policy" ON public.categories;
CREATE POLICY "Categories insert policy" ON public.categories 
FOR INSERT WITH CHECK ((auth.uid() = user_id AND user_id IS NOT NULL) OR public.is_admin());

DROP POLICY IF EXISTS "Categories update policy" ON public.categories;
CREATE POLICY "Categories update policy" ON public.categories 
FOR UPDATE USING ((auth.uid() = user_id AND user_id IS NOT NULL) OR public.is_admin())
WITH CHECK ((auth.uid() = user_id AND user_id IS NOT NULL) OR public.is_admin());

DROP POLICY IF EXISTS "Categories delete policy" ON public.categories;
CREATE POLICY "Categories delete policy" ON public.categories 
FOR DELETE USING ((auth.uid() = user_id AND user_id IS NOT NULL) OR public.is_admin());

-- 4. Budgets Policies
DROP POLICY IF EXISTS "Budgets select policy" ON public.budgets;
CREATE POLICY "Budgets select policy" ON public.budgets 
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Budgets insert policy" ON public.budgets;
CREATE POLICY "Budgets insert policy" ON public.budgets 
FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Budgets update policy" ON public.budgets;
CREATE POLICY "Budgets update policy" ON public.budgets 
FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Budgets delete policy" ON public.budgets;
CREATE POLICY "Budgets delete policy" ON public.budgets 
FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 5. Transactions Policies
DROP POLICY IF EXISTS "Transactions select policy" ON public.transactions;
CREATE POLICY "Transactions select policy" ON public.transactions 
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Transactions insert policy" ON public.transactions;
CREATE POLICY "Transactions insert policy" ON public.transactions 
FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Transactions update policy" ON public.transactions;
CREATE POLICY "Transactions update policy" ON public.transactions 
FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Transactions delete policy" ON public.transactions;
CREATE POLICY "Transactions delete policy" ON public.transactions 
FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 6. Telegram Updates Policies
DROP POLICY IF EXISTS "Telegram updates select policy" ON public.telegram_updates;
CREATE POLICY "Telegram updates select policy" ON public.telegram_updates 
FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Telegram updates insert policy" ON public.telegram_updates;
CREATE POLICY "Telegram updates insert policy" ON public.telegram_updates 
FOR INSERT WITH CHECK (public.is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Telegram updates update policy" ON public.telegram_updates;
CREATE POLICY "Telegram updates update policy" ON public.telegram_updates 
FOR UPDATE USING (public.is_admin() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Telegram updates delete policy" ON public.telegram_updates;
CREATE POLICY "Telegram updates delete policy" ON public.telegram_updates 
FOR DELETE USING (public.is_admin());

-- 7. Telegram Links Policies
DROP POLICY IF EXISTS "Telegram links select policy" ON public.telegram_links;
CREATE POLICY "Telegram links select policy" ON public.telegram_links 
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Telegram links insert policy" ON public.telegram_links;
CREATE POLICY "Telegram links insert policy" ON public.telegram_links 
FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Telegram links update policy" ON public.telegram_links;
CREATE POLICY "Telegram links update policy" ON public.telegram_links 
FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Telegram links delete policy" ON public.telegram_links;
CREATE POLICY "Telegram links delete policy" ON public.telegram_links 
FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- 8. Subscriptions Policies
DROP POLICY IF EXISTS "Subscriptions select policy" ON public.subscriptions;
CREATE POLICY "Subscriptions select policy" ON public.subscriptions 
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Subscriptions insert policy" ON public.subscriptions;
CREATE POLICY "Subscriptions insert policy" ON public.subscriptions 
FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Subscriptions update policy" ON public.subscriptions;
CREATE POLICY "Subscriptions update policy" ON public.subscriptions 
FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Subscriptions delete policy" ON public.subscriptions;
CREATE POLICY "Subscriptions delete policy" ON public.subscriptions 
FOR DELETE USING (public.is_admin());

-- 9. Payment Transactions Policies
DROP POLICY IF EXISTS "Payment transactions select policy" ON public.payment_transactions;
CREATE POLICY "Payment transactions select policy" ON public.payment_transactions 
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Payment transactions insert policy" ON public.payment_transactions;
CREATE POLICY "Payment transactions insert policy" ON public.payment_transactions 
FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Payment transactions update policy" ON public.payment_transactions;
CREATE POLICY "Payment transactions update policy" ON public.payment_transactions 
FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Payment transactions delete policy" ON public.payment_transactions;
CREATE POLICY "Payment transactions delete policy" ON public.payment_transactions 
FOR DELETE USING (public.is_admin());

-- 10. AI Logs Policies
DROP POLICY IF EXISTS "AI logs select policy" ON public.ai_logs;
CREATE POLICY "AI logs select policy" ON public.ai_logs 
FOR SELECT USING (public.is_admin() OR (auth.uid() = user_id AND user_id IS NOT NULL));

DROP POLICY IF EXISTS "AI logs insert policy" ON public.ai_logs;
CREATE POLICY "AI logs insert policy" ON public.ai_logs 
FOR INSERT WITH CHECK (public.is_admin() OR (auth.uid() = user_id AND user_id IS NOT NULL));

DROP POLICY IF EXISTS "AI logs update policy" ON public.ai_logs;
CREATE POLICY "AI logs update policy" ON public.ai_logs 
FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "AI logs delete policy" ON public.ai_logs;
CREATE POLICY "AI logs delete policy" ON public.ai_logs 
FOR DELETE USING (public.is_admin());

-- 11. Audit Logs Policies
DROP POLICY IF EXISTS "Audit logs select policy" ON public.audit_logs;
CREATE POLICY "Audit logs select policy" ON public.audit_logs 
FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Audit logs insert policy" ON public.audit_logs;
CREATE POLICY "Audit logs insert policy" ON public.audit_logs 
FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Audit logs update policy" ON public.audit_logs;
CREATE POLICY "Audit logs update policy" ON public.audit_logs 
FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Audit logs delete policy" ON public.audit_logs;
CREATE POLICY "Audit logs delete policy" ON public.audit_logs 
FOR DELETE USING (public.is_admin());

-- 12. System Configs Policies
DROP POLICY IF EXISTS "System configs select policy" ON public.system_configs;
CREATE POLICY "System configs select policy" ON public.system_configs 
FOR SELECT USING (auth.role() = 'authenticated' OR public.is_admin());

DROP POLICY IF EXISTS "System configs manage policy" ON public.system_configs;
CREATE POLICY "System configs manage policy" ON public.system_configs 
FOR ALL USING (public.is_admin());

-- 13. Export History Policies
DROP POLICY IF EXISTS "Export history select policy" ON public.export_history;
CREATE POLICY "Export history select policy" ON public.export_history 
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Export history insert policy" ON public.export_history;
CREATE POLICY "Export history insert policy" ON public.export_history 
FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Export history update policy" ON public.export_history;
CREATE POLICY "Export history update policy" ON public.export_history 
FOR UPDATE USING (auth.uid() = user_id OR public.is_admin())
WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Export history delete policy" ON public.export_history;
CREATE POLICY "Export history delete policy" ON public.export_history 
FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- ==============================================================================
-- DATABASE TRIGGERS
-- ==============================================================================

-- 1. Bi-directional sync_wallet_and_budget() trigger
CREATE OR REPLACE FUNCTION public.sync_wallet_and_budget()
RETURNS TRIGGER AS $$
DECLARE
    v_month INTEGER;
    v_year INTEGER;
    v_old_month INTEGER;
    v_old_year INTEGER;
BEGIN
    -- STEP 1: REVERT OLD ROW on UPDATE or DELETE
    IF (TG_OP IN ('UPDATE', 'DELETE')) THEN
        v_old_month := EXTRACT(MONTH FROM OLD.transaction_time);
        v_old_year := EXTRACT(YEAR FROM OLD.transaction_time);

        IF (OLD.type = 'expense') THEN
            UPDATE public.wallets 
            SET balance = balance + OLD.amount, 
                updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = OLD.wallet_id;

            IF OLD.category_id IS NOT NULL THEN
                UPDATE public.budgets 
                SET current_spent = GREATEST(0.00, current_spent - OLD.amount), 
                    updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
                WHERE user_id = OLD.user_id 
                  AND category_id = OLD.category_id 
                  AND month = v_old_month 
                  AND year = v_old_year;
            END IF;

        ELSIF (OLD.type = 'income') THEN
            UPDATE public.wallets 
            SET balance = balance - OLD.amount, 
                updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = OLD.wallet_id;

        ELSIF (OLD.type = 'transfer') AND (OLD.to_wallet_id IS NOT NULL) THEN
            UPDATE public.wallets 
            SET balance = balance + OLD.amount, 
                updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = OLD.wallet_id;

            UPDATE public.wallets 
            SET balance = balance - OLD.amount, 
                updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = OLD.to_wallet_id;
        END IF;
    END IF;

    -- STEP 2: APPLY NEW ROW on INSERT or UPDATE
    IF (TG_OP IN ('INSERT', 'UPDATE')) THEN
        v_month := EXTRACT(MONTH FROM NEW.transaction_time);
        v_year := EXTRACT(YEAR FROM NEW.transaction_time);

        IF (NEW.type = 'expense') THEN
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, 
                updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.wallet_id;

            IF NEW.category_id IS NOT NULL THEN
                UPDATE public.budgets 
                SET current_spent = current_spent + NEW.amount, 
                    updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
                WHERE user_id = NEW.user_id 
                  AND category_id = NEW.category_id 
                  AND month = v_month 
                  AND year = v_year;
            END IF;

        ELSIF (NEW.type = 'income') THEN
            UPDATE public.wallets 
            SET balance = balance + NEW.amount, 
                updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.wallet_id;

        ELSIF (NEW.type = 'transfer') AND (NEW.to_wallet_id IS NOT NULL) THEN
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, 
                updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.wallet_id;

            UPDATE public.wallets 
            SET balance = balance + NEW.amount, 
                updated_at = NOW() AT TIME ZONE 'Asia/Jakarta'
            WHERE id = NEW.to_wallet_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_wallet_and_budget ON public.transactions;
CREATE TRIGGER trg_sync_wallet_and_budget
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.sync_wallet_and_budget();

-- 2. Budget Alerts Trigger: check_budget_alerts()
CREATE OR REPLACE FUNCTION public.check_budget_alerts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.monthly_limit > 0 THEN
        -- Check 80% limit threshold
        IF (NEW.current_spent >= NEW.monthly_limit * 0.8) THEN
            NEW.alert_80_sent := TRUE;
        ELSE
            NEW.alert_80_sent := FALSE;
        END IF;

        -- Check 100% limit threshold
        IF (NEW.current_spent >= NEW.monthly_limit) THEN
            NEW.alert_100_sent := TRUE;
        ELSE
            NEW.alert_100_sent := FALSE;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_budget_alerts ON public.budgets;
CREATE TRIGGER trg_check_budget_alerts
BEFORE INSERT OR UPDATE OF current_spent, monthly_limit ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.check_budget_alerts();

-- 3. New User Auto-Provisioning: handle_new_user()
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_profile_id UUID;
BEGIN
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'Pengguna TataDana'
    );
    
    INSERT INTO public.profiles (
        id, 
        full_name, 
        phone_number,
        plan, 
        role,
        default_currency,
        reminder_enabled
    )
    VALUES (
        NEW.id, 
        v_full_name, 
        NEW.phone,
        'starter', 
        'user',
        'IDR',
        TRUE
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO v_profile_id;

    IF v_profile_id IS NULL THEN
        v_profile_id := NEW.id;
    END IF;

    -- Provision initial wallets
    INSERT INTO public.wallets (
        user_id, 
        name, 
        type, 
        balance, 
        is_default, 
        color, 
        icon
    )
    VALUES 
        (v_profile_id, 'Kas Utama', 'cash', 0.00, TRUE, '#0284c7', 'wallet'),
        (v_profile_id, 'Rekening BCA', 'bank', 0.00, FALSE, '#10b981', 'credit-card')
    ON CONFLICT DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- INDEXES & PERFORMANCE OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_bot_token_encrypted ON public.profiles(telegram_bot_token_encrypted) WHERE telegram_bot_token_encrypted IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_is_default ON public.wallets(user_id, is_default);

CREATE INDEX IF NOT EXISTS idx_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);

CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category ON public.budgets(category_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month_year ON public.budgets(user_id, month, year);

CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, transaction_time DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_wallet ON public.transactions(to_wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_update_id ON public.transactions(telegram_update_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);

CREATE INDEX IF NOT EXISTS idx_telegram_updates_update_id ON public.telegram_updates(update_id);
CREATE INDEX IF NOT EXISTS idx_telegram_updates_chat_id ON public.telegram_updates(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_updates_user ON public.telegram_updates(user_id);

CREATE INDEX IF NOT EXISTS idx_telegram_links_user ON public.telegram_links(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_links_pairing_code ON public.telegram_links(pairing_code);
CREATE INDEX IF NOT EXISTS idx_telegram_links_telegram_id ON public.telegram_links(telegram_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_user ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user ON public.ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON public.ai_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_logs_provider ON public.ai_logs(provider);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_history_user ON public.export_history(user_id);
CREATE INDEX IF NOT EXISTS idx_export_history_created_at ON public.export_history(created_at DESC);

-- ==============================================================================
-- DEFAULT SEED DATA
-- ==============================================================================

-- 1. Default Global Categories
INSERT INTO public.categories (name, emoji, color, type, is_default) VALUES
('Makanan & Minuman', '🍜', '#f97316', 'expense', TRUE),
('Transportasi', '🚗', '#0284c7', 'expense', TRUE),
('Hiburan & Santai', '🎮', '#8b5cf6', 'expense', TRUE),
('Tagihan & Utilitas', '🏠', '#ef4444', 'expense', TRUE),
('Kesehatan & Obat', '💊', '#10b981', 'expense', TRUE),
('Belanja Harian', '👕', '#ec4899', 'expense', TRUE),
('Pendidikan & Buku', '📚', '#f59e0b', 'expense', TRUE),
('Investasi & Tabungan', '📈', '#3b82f6', 'expense', TRUE),
('Sedekah & Zakat', '🤲', '#10b981', 'expense', TRUE),
('Gaji & Penghasilan', '💰', '#22c55e', 'income', TRUE),
('Freelance & Usaha', '💼', '#14b8a6', 'income', TRUE),
('Investasi & Bunga', '💵', '#84cc16', 'income', TRUE)
ON CONFLICT (name, type) WHERE user_id IS NULL DO NOTHING;

-- 2. System Configurations (Multi-AI Failover, Limits, Payments, Bot)
INSERT INTO public.system_configs (key, value, description) VALUES
('ai_provider_failover', '{
    "primary": "gemini",
    "fallbacks": ["openai", "groq", "heuristic"],
    "timeout_ms": 5000,
    "active_providers": {
        "gemini": true,
        "openai": true,
        "groq": true,
        "heuristic": true
    }
}'::jsonb, 'Multi-AI cascade order and failover configuration'),

('transaction_limits', '{
    "starter_monthly_limit": 50,
    "pro_monthly_limit": -1,
    "max_voice_seconds": 60,
    "ocr_enabled_plans": ["pro", "business"]
}'::jsonb, 'Plan limits and multimodal feature gating'),

('payment_methods', '{
    "midtrans_enabled": true,
    "manual_transfer_enabled": true,
    "bank_accounts": [
        {"bank": "BCA", "account": "8801234567", "name": "PT TataDana Fintech Solusi"},
        {"bank": "Mandiri", "account": "1370098765432", "name": "PT TataDana Fintech Solusi"}
    ]
}'::jsonb, 'Available payment channels and company bank accounts'),

('telegram_bot', '{
    "bot_username": "TataDanaBot",
    "pairing_url": "https://t.me/TataDanaBot?start=",
    "rate_limit_per_minute": 30
}'::jsonb, 'Telegram bot parameters and pairing URL')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, description = EXCLUDED.description, updated_at = NOW() AT TIME ZONE 'Asia/Jakarta';

-- ==============================================================================
-- REALTIME PUBLICATIONS SETUP
-- ==============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'transactions' AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'wallets' AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'budgets' AND schemaname = 'public'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
    END IF;
END $$;
