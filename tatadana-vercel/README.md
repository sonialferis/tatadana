# 💰 TataDana — Indonesian Fintech SaaS & Multimodal Telegram Bot

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Telegram Bot](https://img.shields.io/badge/Telegram-Bot%20API-24A1DE?style=for-the-badge&logo=telegram)](https://core.telegram.org/bots)
[![Vercel Ready](https://img.shields.io/badge/Vercel-Deploy%20Ready-000000?style=for-the-badge&logo=vercel)](https://vercel.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**TataDana** adalah platform SaaS manajemen keuangan pribadi & UMKM Indonesia dengan integrasi bot Telegram multimodal bertenaga AI (Google Gemini 1.5 Flash), database Supabase PostgreSQL dengan Row-Level Security (RLS), pelacakan multi-rekening/e-wallet (BCA, Mandiri, GoPay, OVO, ShopeePay, DANA), sistem budgeting 3-tier otomatis (80%/100%), dan gateway pembayaran Midtrans (QRIS & Virtual Account).

---

## 🚀 Fitur Unggulan

- 🤖 **Multimodal Telegram Bot**:
  - Catat pengeluaran & pemasukan via bahasa alami Indonesia (*"beli sate 25rb"*, *"kopi 18k"*, *"gajian 7.5jt"*).
  - OCR struk belanja otomatis dari foto via Google Gemini Vision.
  - Transkripsi voice note bahasa Indonesia langsung menjadi pencatatan keuangan.
  - Perintah bot cepat: `/saldo`, `/budget`, `/hari_ini`, `/bulan_ini`, `/sheet`.
  - Sistem deduplikasi pesan (*idempotency*) berbasis `update_id`.
- 📊 **Web Dashboard Real-time (Next.js 14 App Router)**:
  - 4 KPI utama, grafik tren arus kas, dan diagram distribusi pengeluaran.
  - Filter transaksi multi-parameter, pencarian instan, dan pagination.
  - Ekspor laporan keuangan ke format **PDF resmi (jsPDF)** dan **Excel (.xlsx)**.
  - Budgeting dinamis dengan indikator warna visual: Hijau (<80%), Kuning (80-99%), Merah (≥100%).
  - Multi-wallet & transfer antar dompet/bank tanpa selisih ledger.
- 🛡️ **Superadmin Panel & AI Failover**:
  - User Impersonation Session aman untuk customer support.
  - Multi-AI Failover 5-Tier (Gemini Flash → Gemini Pro → Groq → OpenAI → Indonesian Heuristic).
  - Verifikasi signature Midtrans SHA-512 & persetujuan transfer manual.
- 🇮🇩 **100% Standar Regulasi Indonesia**:
  - Format mata uang Rupiah (`Rp 15.000`).
  - Standar waktu WIB (`Asia/Jakarta`).
  - Kepatuhan UU PDP (Perlindungan Data Pribadi).

---

## 📂 Struktur Repositori

```
tatadana/
├── src/
│   ├── app/
│   │   ├── page.tsx               # Landing page 12 bagian interaktif
│   │   ├── layout.tsx             # Root layout & providers
│   │   ├── admin/                 # Superadmin dashboard
│   │   ├── auth/                  # Otentikasi split-layout (Login, Register, OTP)
│   │   ├── dashboard/             # Dashboard user (Transaksi, Budget, Laporan, Dompet, Settings)
│   │   └── api/                   # Serverless API routes (Telegram Webhook, Midtrans, Export, AI)
│   ├── components/                # Komponen UI reusable & Tata AI floating chat
│   └── lib/                       # Domain logic, AI failover, formatters, Telegram client, Supabase
├── public/                        # Static assets
├── supabase/
│   └── migrations/
│       └── 20261010_tatadana_init.sql # Skema 13 tabel PostgreSQL, RLS, & Trigger balance
├── next.config.mjs                # Konfigurasi Next.js untuk Vercel
├── .env.example                   # Contoh konfigurasi environment variables
├── package.json                   # Dependencies & npm scripts
└── tsconfig.json                  # Konfigurasi TypeScript
```

---

## 🛠️ Panduan Deploy ke Vercel (Langkah demi Langkah)

### 1. Push ke GitHub
```bash
# Inisialisasi Git jika belum
git init
git add .
git commit -m "feat: initial commit TataDana production-ready"

# Hubungkan ke repository GitHub Anda
git branch -M main
git remote add origin https://github.com/USERNAME_ANDA/tatadana.git
git push -u origin main
```

### 2. Import ke Vercel
1. Buka [Vercel Dashboard](https://vercel.com/dashboard) dan login.
2. Klik **Add New...** -> **Project**.
3. Pilih repository GitHub `tatadana` yang baru saja Anda push, lalu klik **Import**.
4. Di bagian **Framework Preset**, Vercel akan otomatis mendeteksi **Next.js**.
5. Buka bagian **Environment Variables** dan masukkan variabel dari tabel di bawah.
6. Klik tombol **Deploy**.

---

## 🔐 Konfigurasi Environment Variables di Vercel

Tambahkan variabel-variabel berikut pada menu **Project Settings -> Environment Variables** di Vercel:

| Nama Variabel | Wajib? | Contoh / Sumber Nilai | Deskripsi |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Ya** | `https://xxxx.supabase.co` | URL project dari dashboard Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Ya** | `eyJhbGciOi...` | Anon/Public API Key dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Ya** | `eyJhbGciOi...` | Service Role Key (Rahasia) dari Supabase |
| `SUPABASE_STORAGE_BUCKET` | Opsional | `tatadana-reports` | Nama bucket storage di Supabase |
| `TELEGRAM_BOT_TOKEN` | **Ya** | `8992878861:AAHCKkq...` | Token bot dari BotFather di Telegram |
| `WEBHOOK_BASE_URL` | **Ya** | `https://tatadana-anda.vercel.app` | URL domain publik Vercel Anda |
| `GEMINI_API_KEY` | **Ya** | `AIzaSy...` | API Key Google Gemini (AI Studio) |
| `OPENAI_API_KEY` | Opsional | `sk-proj-...` | API Key OpenAI (untuk failover tier) |
| `DEFAULT_AI_PROVIDER` | Opsional | `gemini` | Pilihan provider AI utama |
| `MIDTRANS_SERVER_KEY` | Opsional | `SB-Mid-server-xxxx` | Server Key dari Midtrans Sandbox/Prod |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Opsional | `SB-Mid-client-xxxx` | Client Key dari Midtrans Sandbox/Prod |
| `MIDTRANS_IS_PRODUCTION` | Opsional | `false` | Status production Midtrans (`false`/`true`) |
| `NEXT_PUBLIC_APP_URL` | **Ya** | `https://tatadana-anda.vercel.app` | URL utama website di Vercel |
| `APP_TIMEZONE` | Opsional | `Asia/Jakarta` | Zona waktu aplikasi (WIB) |
| `DATA_ENCRYPTION_KEY` | **Ya** | `kunci-rahasia-32-karakter-acak!` | Enkripsi cookie impersonation & session |

---

## 🗄️ Menyiapkan Database Supabase

1. Buat project baru di [Supabase Console](https://database.new).
2. Buka menu **SQL Editor** di sidebar kiri.
3. Buka file `supabase/migrations/20261010_tatadana_init.sql` di repository ini, salin seluruh isinya, dan tempelkan ke SQL Editor Supabase.
4. Klik tombol **Run**. Seluruh 13 tabel relasional, fungsi trigger saldo, alert limit, indeks performa, dan RLS policies akan aktif secara otomatis.

---

## 🤖 Menghubungkan Webhook Bot Telegram

Setelah aplikasi berhasil ter-deploy di Vercel:

### Opsi A: Otomatis via Dashboard TataDana
1. Buka URL web Vercel Anda: `https://domain-anda.vercel.app/dashboard/settings`
2. Di bagian **Integrasi Telegram Bot**, masukkan token bot dari @BotFather.
3. Klik **Tes Koneksi & Pasang Webhook**. Webhook akan didaftarkan otomatis ke Telegram API!

### Opsi B: Manual via Browser / cURL
Ganti `<TOKEN_BOT>` dan `<VERCEL_URL>` dengan milik Anda:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN_BOT>/setWebhook?url=https://<VERCEL_URL>/api/telegram/webhook"
```
Jika berhasil, Telegram akan mengembalikan respon:
```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

---

## 💻 Menjalankan di Lokal (Development)

```bash
# 1. Install dependencies
npm install

# 2. Salin environment file
cp .env.example .env.local
# Sesuaikan isi .env.local dengan kunci API Anda

# 3. Jalankan development server
npm run dev
# Buka http://localhost:3000

# 4. (Opsional) Jalankan polling bot Telegram untuk lokal testing
npm run bot:poll
```

---

## 📄 Lisensi
Hak Cipta © 2026 TataDana Team. Dilindungi Undang-Undang.
