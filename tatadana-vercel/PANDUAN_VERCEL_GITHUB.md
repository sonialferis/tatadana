# 🚀 Panduan Lengkap Deploy TataDana ke GitHub & Vercel

Panduan praktis dan terperinci dalam Bahasa Indonesia untuk mengunggah proyek **TataDana Fintech SaaS** ke GitHub dan mendeploynya ke Vercel hingga Telegram Bot & Supabase berjalan 100%.

---

## 📦 DAFTAR ISI
1. [Cara Membuat / Menjalankan File ZIP](#1-cara-membuat--menjalankan-file-zip)
2. [Cara Push Proyek ke GitHub](#2-cara-push-proyek-ke-github)
3. [Cara Import Repository ke Vercel](#3-cara-import-repository-ke-vercel)
4. [Daftar Environment Variables di Vercel](#4-daftar-environment-variables-di-vercel)
5. [Inisialisasi Database Supabase](#5-inisialisasi-database-supabase)
6. [Konfigurasi Webhook Telegram Bot](#6-konfigurasi-webhook-telegram-bot)
7. [Checklist Pengujian Pasca-Deploy](#7-checklist-pengujian-pasca-deploy)

---

## 1. Cara Membuat / Menjalankan File ZIP

Kami telah menyediakan skrip otomatis untuk menghasilkan file `tatadana-vercel.zip` yang bersih (bebas dari `node_modules`, `.next`, cache, dan file sensitif `.env.local`):

### Cara 1: Dobel Klik (Paling Cepat di Windows)
1. Buka folder: `C:\Users\Administrator\.gemini\antigravity\scratch\`
2. Klik ganda (double click) file: **`BUAT_FILE_ZIP_VERCEL.bat`**
3. File zip bernama **`tatadana-vercel.zip`** akan langsung terbuat dalam beberapa detik!

### Cara 2: Lewat PowerShell Manual
Jika ingin menjalankan dari terminal PowerShell:
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\Administrator\.gemini\antigravity\scratch\create_zip.ps1"
```

---

## 2. Cara Push Proyek ke GitHub

### Opsi 1: Klik Ganda PUSH_TO_GITHUB.bat (Paling Praktis)
1. Buka folder `C:\Users\Administrator\.gemini\antigravity\scratch\`
2. Klik ganda **`PUSH_TO_GITHUB.bat`**
3. Masukkan URL repository GitHub Anda (contoh: `https://github.com/username/tatadana.git`)
4. Skrip akan otomatis menginisialisasi Git, menambahkan file produksi, dan melakukan push ke branch `main`.

### Opsi 2: Lewat Git Terminal Manual
Buka terminal (PowerShell atau Git Bash) di folder proyek:
```bash
cd "C:\Users\Administrator\.gemini\antigravity\scratch\tatadana"

# 1. Inisialisasi Git
git init

# 2. Tambahkan semua file (file node_modules dan .next otomatis diabaikan oleh .gitignore)
git add .

# 3. Lakukan commit perdana
git commit -m "feat: initial commit TataDana siap deploy Vercel"

# 4. Ganti branch utama ke main
git branch -M main

# 5. Hubungkan ke repository GitHub Anda (buat repo baru di https://github.com/new)
git remote add origin https://github.com/USERNAME_ANDA/tatadana.git

# 6. Push kode ke GitHub
git push -u origin main
```

### Opsi B: Lewat GitHub Desktop
1. Buka aplikasi **GitHub Desktop**.
2. Pilih menu **File** -> **Add Local Repository**.
3. Pilih folder `C:\Users\Administrator\.gemini\antigravity\scratch\tatadana`.
4. Masukkan ringkasan commit: `feat: deploy TataDana`.
5. Klik **Publish repository** ke akun GitHub Anda.

---

## 3. Cara Import Repository ke Vercel

1. Buka browser dan kunjungi [Vercel Dashboard](https://vercel.com/dashboard).
2. Login menggunakan akun GitHub Anda.
3. Klik tombol **Add New...** di pojok kanan atas, lalu pilih **Project**.
4. Cari repositori **`tatadana`** dari daftar repositori GitHub Anda, lalu klik **Import**.
5. Konfigurasi Project:
   - **Framework Preset**: `Next.js` (terdeteksi otomatis).
   - **Root Directory**: `./` (biarkan default).
   - **Build Command**: `next build` (default).
   - **Output Directory**: `.next` (default).
   - **Install Command**: `npm install` (default).
6. **JANGAN LANGSUNG KLIK DEPLOY!** Buka bagian **Environment Variables** terlebih dahulu dan ikuti langkah di Bagian 4.
7. Setelah Environment Variables diisi, klik tombol **Deploy**.
8. Tunggu proses build selesai (~1-2 menit). Aplikasi Anda akan langsung aktif dengan domain HTTPS (contoh: `https://tatadana-fintech.vercel.app`).

---

## 4. Daftar Environment Variables di Vercel

Pada halaman pengaturan Vercel (**Project Settings -> Environment Variables**), tambahkan variabel-variabel penting berikut:

| Key | Tipe | Contoh Nilai | Keterangan |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Wajib | `https://xyzproject.supabase.co` | URL project Supabase Anda |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Wajib | `eyJhbGciOiJIUzI1Ni...` | Kunci anonim/publik Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Wajib | `eyJhbGciOiJIUzI1Ni...` | Kunci service role (rahasia server) |
| `SUPABASE_STORAGE_BUCKET` | Opsional | `tatadana-reports` | Nama bucket storage di Supabase |
| `TELEGRAM_BOT_TOKEN` | Wajib | `8992878861:AAHCKkqhwMg0mT7...` | Token bot dari BotFather di Telegram |
| `WEBHOOK_BASE_URL` | Wajib | `https://tatadana-fintech.vercel.app` | Domain Vercel Anda (tanpa garis miring di akhir) |
| `GEMINI_API_KEY` | Wajib | `AIzaSyB123456789...` | API Key dari Google AI Studio |
| `DEFAULT_AI_PROVIDER` | Opsional | `gemini` | Provider default AI |
| `OPENAI_API_KEY` | Opsional | `sk-proj-xxxx` | Cadangan failover AI tier 4 |
| `MIDTRANS_SERVER_KEY` | Opsional | `SB-Mid-server-xxxx` | Server Key Midtrans Sandbox/Production |
| `NEXT_PUBLIC_MIDTRANS_CLIENT_KEY` | Opsional | `SB-Mid-client-xxxx` | Client Key Midtrans Sandbox/Production |
| `MIDTRANS_IS_PRODUCTION` | Opsional | `false` | `false` untuk Sandbox, `true` untuk Prod |
| `NEXT_PUBLIC_APP_URL` | Wajib | `https://tatadana-fintech.vercel.app` | URL publik website |
| `APP_TIMEZONE` | Opsional | `Asia/Jakarta` | Timezone WIB |
| `DATA_ENCRYPTION_KEY` | Wajib | `kunci-rahasia-minimal-32-karakter-acak!` | Enkripsi session cookie impersonation |

> 💡 **Tips Vercel**: Anda dapat mencentang ketiga lingkungan (**Production**, **Preview**, **Development**) saat menambahkan masing-masing variabel agar tidak perlu mengetik ulang.

---

## 5. Inisialisasi Database Supabase

Agar fitur penyimpanan transaksi, saldo dompet, dan autentikasi berfungsi:
1. Buat akun & project di [Supabase](https://supabase.com).
2. Di dashboard Supabase, buka tab **SQL Editor** (ikon terminal di menu sebelah kiri).
3. Buka file skema database di repository ini:
   `supabase/migrations/20261010_tatadana_init.sql`
4. Salin seluruh isi SQL tersebut, tempelkan di SQL Editor Supabase, lalu klik tombol **Run**.
5. Skema 13 tabel PostgreSQL, fungsi trigger penyesuaian saldo dompet, pencegah saldo minus, dan alert limit budget 80%/100% akan terpasang sempurna.

---

## 6. Konfigurasi Webhook Telegram Bot

Agar bot Telegram merespon chat pengguna secara real-time via Vercel serverless:

### Metode 1: Lewat Web Dashboard TataDana (Sangat Mudah)
1. Buka website Anda yang sudah ter-deploy di Vercel:
   `https://tatadana-fintech.vercel.app/dashboard/settings`
2. Masuk ke kartu **Integrasi Telegram Bot**.
3. Masukkan **Token Bot** Anda dari @BotFather.
4. Klik **Tes Koneksi & Pasang Webhook**.
5. Sistem TataDana akan otomatis mendaftarkan webhook ke Telegram API!

### Metode 2: Lewat Browser / cURL Manual
Cukup buka URL berikut di tab browser Anda (ganti `<BOT_TOKEN>` dan `<VERCEL_DOMAIN>`):
```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://<VERCEL_DOMAIN>/api/telegram/webhook
```
**Contoh:**
```
https://api.telegram.org/bot8992878861:AAHCKkqhwMg0mT7Luvgdk17ovBaWTUEMVgY/setWebhook?url=https://tatadana-fintech.vercel.app/api/telegram/webhook
```
Jika sukses, browser akan menampilkan pesan JSON:
```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

---

## 7. Checklist Pengujian Pasca-Deploy

Setelah seluruh langkah di atas selesai, lakukan verifikasi cepat:
- [ ] Buka halaman utama: `https://domain-anda.vercel.app` (Landing page 12 section harus tampil rapi).
- [ ] Buka dashboard: `https://domain-anda.vercel.app/dashboard` (KPI, grafik, dan saldo dompet tampil).
- [ ] Uji Telegram Bot: Buka bot Telegram Anda, kirim command `/start` atau pesan transaksi:
  - Ketik: `beli kopi kenangan 22rb`
  - Bot harus membalas dalam hitungan detik dengan rincian saldo dan kategori pengeluaran!
- [ ] Kirim command `/saldo` di Telegram untuk mengecek saldo dompet live.
- [ ] Coba ekspor laporan PDF atau Excel di menu Laporan dashboard.

Selamat! TataDana Fintech SaaS Anda telah resmi aktif di Vercel & Telegram! 🚀
