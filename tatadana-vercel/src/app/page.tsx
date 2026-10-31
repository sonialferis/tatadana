'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Wallet,
  FileSpreadsheet,
  Zap,
  TrendingUp,
  Receipt,
  Play,
  Check,
  X,
  CreditCard,
  Building2,
  Camera,
  Mic,
  Lock,
  Globe,
  HelpCircle,
  Menu,
  RotateCcw,
  Send,
  Sliders,
  DollarSign,
  Smartphone,
  PieChart,
  ArrowRightLeft,
  CheckCircle,
  FileText,
  Clock,
  Layers,
  Award,
  BadgeCheck,
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [language, setLanguage] = useState<'ID' | 'EN'>('ID');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('tatadana_auth_role');
      const email = localStorage.getItem('tatadana_user_email') || localStorage.getItem('tatadana_admin_email');
      if (role && email) {
        setIsLoggedIn(true);
      }
    }
  }, []);

  // Interactive Bot Demo Simulator State
  const [demoInput, setDemoInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [demoChat, setDemoChat] = useState<Array<{ sender: 'user' | 'bot'; text: string; rawHtml?: boolean }>>([
    { sender: 'user', text: 'beli soto ayam 18rb es teh 5rb' },
    {
      sender: 'bot',
      rawHtml: true,
      text: `📅 Sabtu, 10 Okt 2026 — 12:30 WIB
💸 <b>Pengeluaran tercatat!</b>
├ Nominal : <b>Rp 23.000</b>
├ Kategori : 🍜 Makanan & Minuman
├ Dompet : 👛 BCA (Default)
├ Catatan : beli soto ayam 18rb es teh 5rb
└ Saldo : <b>Rp 14.827.000</b>

📊 <b>Budget Makanan bulan ini:</b>
[██████████████░░░░░░] 70.0% — sisa Rp 600.000
<i>💡 Hemat ya, pengeluaran kuliner sudah di atas rata-rata minggu lalu!</i>`,
    },
  ]);

  // Interactive Multi-Wallet Demo State
  const [activeWalletTab, setActiveWalletTab] = useState<'bank' | 'ewallet' | 'all'>('all');
  const [transferDemoSuccess, setTransferDemoSuccess] = useState(false);

  // Helper function to dispatch simulated message
  const triggerSimulation = (inputText: string) => {
    if (!inputText.trim()) return;
    setIsSimulating(true);

    const userInput = inputText.trim();
    const updatedChat = [...demoChat, { sender: 'user' as const, text: userInput }];
    setDemoChat(updatedChat);
    setDemoInput('');

    setTimeout(() => {
      let botResponse = '';
      const lower = userInput.toLowerCase();

      if (userInput.includes('Foto Struk') || lower.includes('struk') || lower.includes('ocr')) {
        botResponse = `📅 Sabtu, 10 Okt 2026 — 12:35 WIB
🧾 <b>Struk Terverifikasi via Gemini 1.5 Flash Vision!</b>
├ Merchant : 🏪 Indomaret Point Sudirman
├ Nominal : <b>Rp 68.500</b>
├ Rincian :
│  • Roti Sisir Mentega : Rp 14.500
│  • Susu UHT Cokelat 1L : Rp 21.000
│  • Air Mineral 600ml x2 : Rp 8.000
│  • Deterjen Konsentrat : Rp 25.000
├ Kategori : 🛒 Belanja Harian & Bulanan
├ Dompet : 👛 BCA (Default)
└ Saldo : <b>Rp 14.758.500</b>

📊 <b>Budget Belanja Harian:</b>
[██████████░░░░░░░░░░] 52.0% — sisa Rp 480.000
<i>💡 4 item berhasil diekstrak otomatis dan disimpan ke Supabase.</i>`;
      } else if (userInput.includes('Voice Note') || lower.includes('voice') || lower.includes('audio')) {
        botResponse = `📅 Sabtu, 10 Okt 2026 — 12:36 WIB
🎙️ <b>Transkripsi Voice Note Berhasil!</b>
├ Ucapan : <i>"Bayar servis motor ganti oli seratus tiga puluh lima ribu"</i>
├ Nominal : <b>Rp 135.000</b>
├ Kategori : 🔧 Servis & Perawatan
├ Dompet : 👛 Kas Tunai
└ Saldo Kas : <b>Rp 865.000</b>

📊 <b>Budget Kendaraan & Servis:</b>
[█████████████░░░░░░░] 65.0% — sisa Rp 165.000
<i>💡 Audio diproses instan dengan Gemini Multimodal Audio.</i>`;
      } else if (lower.includes('gajian') || lower.includes('bonus') || lower.includes('income')) {
        botResponse = `📅 Sabtu, 10 Okt 2026 — 12:32 WIB
💰 <b>Pemasukan tercatat!</b>
├ Nominal : <b>Rp 6.500.000</b>
├ Kategori : 💼 Gaji & Penghasilan
├ Dompet : 👛 BCA (Default)
└ Saldo baru : <b>Rp 21.327.000</b>

💪 <i>Mantap! Jangan lupa sisihkan minimal 20% (Rp 1.300.000) untuk tabungan darurat & investasi ya.</i>`;
      } else if (lower.includes('kopi') || lower.includes('susu') || lower.includes('starbucks')) {
        botResponse = `📅 Sabtu, 10 Okt 2026 — 12:33 WIB
💸 <b>Pengeluaran tercatat!</b>
├ Nominal : <b>Rp 22.000</b>
├ Kategori : ☕ Kopi & Kafe
├ Dompet : 👛 GoPay
└ Saldo : <b>Rp 828.000</b>

📊 <b>Budget Kafe & Nongkrong:</b>
[████████████████░░░░] 80.0% — sisa Rp 50.000
⚠️ <i>Peringatan Budget: Anggaran kopi kamu sudah mencapai 80%! Rem jajan sampai akhir bulan.</i>`;
      } else {
        // Generic parser
        botResponse = `📅 Sabtu, 10 Okt 2026 — 12:34 WIB
💸 <b>Pengeluaran tercatat!</b>
├ Nominal : <b>Rp 50.000</b>
├ Kategori : 🛍️ Pengeluaran Harian
├ Dompet : 👛 BCA (Default)
├ Catatan : ${userInput}
└ Saldo : <b>Rp 14.777.000</b>

📊 <b>Budget Pengeluaran Harian:</b>
[███████████████░░░░░] 75.0% — sisa Rp 250.000
<i>💡 Transaksi berhasil dicatat dan disinkronkan ke Web Dashboard.</i>`;
      }

      setDemoChat([...updatedChat, { sender: 'bot', text: botResponse, rawHtml: true }]);
      setIsSimulating(false);
    }, 450);
  };

  const handleSendDemo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoInput.trim() || isSimulating) return;
    triggerSimulation(demoInput);
  };

  const handleSimulateTransfer = () => {
    setTransferDemoSuccess(true);
    setTimeout(() => setTransferDemoSuccess(false), 3000);
  };

  const faqs = [
    {
      q: 'Bagaimana cara kerja pencatatan via Telegram?',
      a: 'Setelah mendaftar dan menghubungkan bot @TataDana_bot dengan token pairing dari dashboard web, Anda cukup mengirim pesan obrolan natural seperti "makan siang 25rb" atau kirim foto struk belanja. Bot kami otomatis mengurai nominal, kategori, dan dompet secara real-time dalam hitungan milidetik.',
    },
    {
      q: 'Apakah bisa pakai foto struk di paket Starter?',
      a: 'Fitur input transaksi via foto struk belanja (AI Vision OCR) khusus tersedia untuk pengguna paket Pro. Pada paket Starter, Anda tetap dapat mencatat pengeluaran secara mudah melalui chat teks natural dan rekaman suara (voice note) Telegram hingga 50 transaksi per bulan.',
    },
    {
      q: 'Bagaimana keamanan data transaksi saya di TataDana?',
      a: 'Sangat aman. TataDana menggunakan Row Level Security (RLS) di PostgreSQL Supabase, memastikan seluruh data transaksi terisolasi total dan hanya bisa diakses oleh akun Anda. Seluruh token Telegram dan payload data dienkripsi dengan standar AES-256 dan tunduk pada Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022).',
    },
    {
      q: 'Bagaimana AI Vision membaca foto struk belanja?',
      a: 'Kami mengintegrasikan Google Gemini 1.5 Flash Vision. Saat Anda mengirim foto struk Indomaret, Alfamart, restoran, atau SPBU ke Telegram, AI mengekstrak nama toko, tanggal, daftar item, harga per item, dan total nominal secara otomatis tanpa perlu Anda ketik ulang.',
    },
    {
      q: 'Apakah TataDana memerlukan PIN atau kata sandi mobile banking saya?',
      a: 'Sama sekali TIDAK! TataDana menganut prinsip Zero Banking Credential. Kami tidak pernah meminta username, password, nomor kartu ATM, atau PIN mobile banking Anda. Pencatatan berbasis laporan mandiri dan struk belanja, sehingga 100% aman dari risiko kebocoran perbankan.',
    },
    {
      q: 'Bank dan dompet digital apa saja yang didukung? Bisakah transfer antar dompet?',
      a: 'TataDana mendukung seluruh bank nasional (BCA, Mandiri, BRI, BNI, Bank Jago, Blu, CIMB) dan e-wallet populer Indonesia (GoPay, OVO, DANA, ShopeePay, LinkAja, serta Kas Tunai). Anda dapat mengatur saldo awal masing-masing dan mencatat transfer antar-dompet dengan saldo yang otomatis disinkronkan.',
    },
    {
      q: 'Bagaimana cara kerja AI Financial Advisor dan peringatan budget 80%/100%?',
      a: 'Sistem memantau pengeluaran bulanan Anda terhadap pagu anggaran per kategori. Saat pengeluaran menyentuh 80% dari batas budget, bot Telegram akan langsung mengirimkan peringatan dini ramah. Jika menembus 100%, sistem memberikan rekomendasi taktis agar keuangan Anda tetap seimbang.',
    },
    {
      q: 'Bagaimana cara ekspor laporan ke PDF dan Excel? Apakah datanya bisa di-backup?',
      a: 'Pengguna paket Pro dan Bisnis dapat mengunduh laporan keuangan berformat PDF resmi atau lembar kerja Excel (.xlsx) sekali klik langsung dari Web Dashboard. Dokumen disusun rapi dengan tabel transaksi, ringkasan arus kas, dan grafik pengeluaran per kategori.',
    },
    {
      q: 'Metode pembayaran apa saja yang diterima untuk berlangganan paket Pro & Bisnis?',
      a: 'Kami menerima pembayaran otomatis via Midtrans terverifikasi QRIS (bisa scan dari semua bank/e-wallet), GoPay, ShopeePay, dan Virtual Account (BCA, Mandiri, BNI, BRI), serta opsi transfer bank manual dengan konfirmasi instan.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white">
      {/* =========================================================================
          SECTION 1: HEADER / NAVBAR (STICKY, LOGO, NAVIGATION, LANG, CTA)
          ========================================================================= */}
      <header
        id="navbar"
        data-section="1"
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 transition-all"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo TataDana */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 font-bold text-lg group-hover:scale-105 transition transform">
              TD
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-950">
              Tata<span className="text-orange-600">Dana</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-orange-600 transition">Fitur</a>
            <a href="#solusi" className="hover:text-orange-600 transition">Solusi</a>
            <a href="#telegram-showcase" className="hover:text-orange-600 transition">Bot Telegram</a>
            <a href="#multi-wallet" className="hover:text-orange-600 transition">Bank &amp; Dompet</a>
            <a href="#ai-multimodal" className="hover:text-orange-600 transition">AI Multimodal</a>
            <a href="#keamanan" className="hover:text-orange-600 transition">Keamanan</a>
            <a href="#harga" className="hover:text-orange-600 transition">Harga</a>
            <a href="#faq" className="hover:text-orange-600 transition">FAQ</a>
          </nav>

          {/* Right Header Actions */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Language Selector */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-[11px] font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setLanguage('ID')}
                className={`px-2 py-1 rounded transition ${
                  language === 'ID' ? 'bg-white text-orange-600 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('EN')}
                className={`px-2 py-1 rounded transition ${
                  language === 'EN' ? 'bg-white text-orange-600 shadow-sm' : 'hover:text-slate-900'
                }`}
              >
                EN
              </button>
            </div>

            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <span>Ke Dashboard TataDana</span>
                <ArrowRight className="w-3.5 h-3.5 text-orange-400" />
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-orange-600 transition"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-600/20 transition active:scale-95 flex items-center gap-1.5"
                >
                  <span>Coba Gratis</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-bold text-white bg-slate-900 rounded-xl"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="px-3 py-1.5 text-xs font-bold text-orange-600"
              >
                Masuk
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
              <a href="#fitur" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded">Fitur</a>
              <a href="#solusi" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded">Solusi</a>
              <a href="#telegram-showcase" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded">Bot Telegram</a>
              <a href="#multi-wallet" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded">Bank &amp; Dompet</a>
              <a href="#ai-multimodal" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded">AI Multimodal</a>
              <a href="#keamanan" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded">Keamanan</a>
              <a href="#harga" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded">Harga</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-slate-50 rounded">FAQ</a>
            </div>
            <div className="pt-2 flex gap-2">
              <Link
                href="/auth/register"
                className="w-full py-2.5 text-center text-xs font-bold text-white bg-orange-600 rounded-xl"
              >
                Coba Gratis Sekarang
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          SECTION 2: HERO SECTION (HEADLINE, VALUE PROP, CTAS, LIVE DASHBOARD PREVIEW)
          ========================================================================= */}
      <section
        id="hero"
        data-section="2"
        className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center"
      >
        {/* Pre-headline pill badge — Part 7 specification verbatim */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-orange-600" />
          <span>✨ Catat keuangan langsung dari Telegram</span>
        </div>

        {/* Impactful Indonesian Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Gaji habis sebelum akhir bulan?{' '}
          <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
            Sudah saatnya kamu tahu
          </span>{' '}
          ke mana uangmu pergi.
        </h1>

        {/* Sub-headline — Part 7 specification verbatim */}
        <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram atau foto struk — sisanya kami yang urus.
        </p>

        {/* CTA Buttons — Part 7 specification verbatim */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2 text-sm active:scale-95"
          >
            Mulai Gratis Sekarang
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#telegram-showcase"
            className="w-full sm:w-auto px-8 py-3.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-300 transition flex items-center justify-center gap-2 text-sm shadow-sm"
          >
            Lihat cara kerjanya →
          </a>
        </div>

        {/* Trust bullets */}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Gratis 50 Transaksi/Bulan
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Tanpa Kartu Kredit
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Terdaftar Kominfo PSE RI
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Keamanan Data Row Level Security
          </span>
        </div>

        {/* Interactive Dashboard Preview Widget */}
        <div className="mt-14 max-w-4xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500"></div>
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
              <span className="text-xs font-mono text-slate-400 pl-2">tatadana.app/dashboard • Live Sync (WIB)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Supabase Realtime Aktif
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs text-slate-400">Total Saldo Terkonsolidasi</span>
              <p className="text-2xl font-extrabold text-white mt-1">Rp 14.820.000</p>
              <span className="text-[11px] text-emerald-400 font-medium">▲ +12.4% vs bulan lalu</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs text-slate-400">Pengeluaran Bulan Ini (Okt 2026)</span>
              <p className="text-2xl font-extrabold text-orange-400 mt-1">Rp 3.450.000</p>
              <span className="text-[11px] text-slate-400 font-mono">48 transaksi tercatat</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60">
              <span className="text-xs text-slate-400">Kesehatan Budget</span>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">Terkontrol (69%)</p>
              <span className="text-[11px] text-slate-400">Sisa kuota aman Rp 1.550.000</span>
            </div>
          </div>

          {/* Budget progress bar visual preview */}
          <div className="mt-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-300">🍜 Kuliner &amp; Makanan (BCA): 70% Terpakai</span>
              <span className="font-mono text-orange-400">Rp 1.400.000 / Rp 2.000.000</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full" style={{ width: '70%' }}></div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Notifikasi: <i>&ldquo;Peringatan 80% akan dikirim ke Telegram jika belanja Rp 200.000 lagi&rdquo;</i></span>
              <span className="text-slate-400 font-mono">Status: Aman</span>
            </div>
          </div>
        </div>

        {/* Hero Section Video Placeholder — Part 7 */}
        {/* TODO: ganti dengan video asli setelah tersedia */}
        <div className="mt-8 max-w-2xl mx-auto p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/30 flex-shrink-0 cursor-pointer hover:scale-105 transition">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">Demo Video Walkthrough (1 Menit)</span>
              <h4 className="font-extrabold text-sm text-slate-900">Lihat Betapa Mudahnya Mencatat Finansial via Bot Telegram</h4>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg flex-shrink-0">
            01:15
          </span>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: PROBLEM STATEMENT (PUSING CATAT MANUAL, STRUK NUMPUK, EXCEL)
          ========================================================================= */}
      <section
        id="problem"
        data-section="3"
        className="py-20 bg-white border-y border-slate-200"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-orange-600 font-bold text-xs tracking-wider uppercase">Dilema Finansial</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
              Pusing Catat Keuangan Manual? Struk Numpuk, Excel Ribet?
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
              Banyak orang berniat hemat tapi gagal di tengah jalan. Masalahnya bukan karena Anda boros, melainkan alat pencatatan yang ada terlalu menyiksa rutinitas harian.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Problem Card 1 */}
            <div className="p-6 rounded-2xl bg-orange-50/40 border border-orange-100 hover:border-orange-200 transition text-left flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-extrabold flex items-center justify-center text-sm mb-4">
                  01
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  &ldquo;Buka aplikasi keuangan? Nanti dulu deh...&rdquo;
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Aplikasi ribet bikin malas mencatat. Harus login, scan sidik jari, buka 5 sub-menu, pilih dompet, isi kategori. Terlalu makan waktu saat sedang antre di kasir.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-orange-100/60 text-[11px] font-semibold text-rose-600">
                Akibat: Akhirnya malas catat, uang menguap tanpa jejak.
              </div>
            </div>

            {/* Problem Card 2 */}
            <div className="p-6 rounded-2xl bg-orange-50/40 border border-orange-100 hover:border-orange-200 transition text-left flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-extrabold flex items-center justify-center text-sm mb-4">
                  02
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  &ldquo;Kok uangnya habis ya? Padahal kayak tidak beli apa-apa&rdquo;
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Pengeluaran kecil tak tercatat (bocor halus). Kopi kekinian 25rb, parkir 5rb, jajan gorengan 15rb. Pengeluaran receh ini tembus jutaan rupiah per bulan.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-orange-100/60 text-[11px] font-semibold text-rose-600">
                Akibat: Gaji selalu ludes sebelum pertengahan bulan.
              </div>
            </div>

            {/* Problem Card 3 */}
            <div className="p-6 rounded-2xl bg-orange-50/40 border border-orange-100 hover:border-orange-200 transition text-left flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-extrabold flex items-center justify-center text-sm mb-4">
                  03
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  &ldquo;Udah niat bikin budget, tapi seminggu lupa&rdquo;
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Budget tak dipantau sama saja tak ada budget. Tabel spreadsheet di laptop terlalu kaku dan tidak pernah dibuka saat sedang nongkrong di luar.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-orange-100/60 text-[11px] font-semibold text-rose-600">
                Akibat: Budget awal bulan tinggal angan-angan semata.
              </div>
            </div>

            {/* Problem Card 4 */}
            <div className="p-6 rounded-2xl bg-orange-50/40 border border-orange-100 hover:border-orange-200 transition text-left flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 font-extrabold flex items-center justify-center text-sm mb-4">
                  04
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-snug">
                  Struk Belanja Numpuk Jadi Sampah
                </h3>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                  Struk belanja Indomaret, Alfamart, dan struk bensin menumpuk kusut di kantong. Tulisan termalnya pudar sebelum sempat dicatat ke pembukuan.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-orange-100/60 text-[11px] font-semibold text-rose-600">
                Akibat: Rincian belanja keluarga dan usaha hilang tak berbekas.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: CORE VALUE PROPOSITION & SOLUTION (SOLUSI FINANSIAL BERBASIS AI)
          ========================================================================= */}
      <section
        id="solusi"
        data-section="4"
        className="py-20 bg-slate-50"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-orange-600 font-bold text-xs tracking-wider uppercase">Introducing TataDana</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
              Bagaimana kalau mencatat keuangan semudah kirim pesan ke teman?
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
              Introducing TataDana: Solusi manajemen finansial berbasis AI Telegram tanpa ribet. Cukup kirim chat atau foto struk, sisanya kami yang bereskan.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Zero Friction Chat</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Cukup ketik kalimat santai seperti &ldquo;nasi padang 25rb&rdquo; atau &ldquo;gajian 6jt&rdquo;. AI memahami slang dan singkatan nominal lokal dalam 300ms.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">AI Vision &amp; Voice OCR</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Jepret struk belanja mart atau kirim voice note saat menyetir. Google Gemini 1.5 Flash mengekstrak item rincian dan nominal seketika.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                <Wallet className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Multi-Wallet Indonesia</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Kelola saldo BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, dan Tunai di satu dasbor. Lengkap dengan pencatatan transfer antar dompet otomatis.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">Budget Guard Proaktif</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Peringatan otomatis saat pengeluaran kategori mencapai 80% dan 100%. Dilengkapi saran taktis AI Financial Advisor langsung di chat Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: INTERACTIVE TELEGRAM BOT SHOWCASE (SIMULATOR CHAT, OCR, VOICE)
          ========================================================================= */}
      <div id="fitur" className="scroll-mt-20"></div>
      <section
        id="telegram-showcase"
        data-section="5"
        className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-orange-600 font-bold text-xs tracking-wider uppercase">Coba Interaktif</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
            Simulasi Chat Bot Telegram @TataDana_bot
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Klik tombol contoh atau ketik kalimat pengeluaran Anda sendiri. Rasakan bagaimana bot membalas secara presisi dengan format Rupiah dan progress bar asli!
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Telegram Chat Frame (7 Columns) */}
          <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-2xl">
            {/* Header Bot */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-bold text-base shadow">
                  🤖
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-sm">TataDana Bot</h4>
                    <BadgeCheck className="w-4 h-4 text-sky-400 fill-current" />
                  </div>
                  <p className="text-xs text-emerald-400">● bot aktif online (WIB)</p>
                </div>
              </div>
              <span className="text-xs font-mono text-slate-400">@TataDana_bot</span>
            </div>

            {/* Quick Test Chips */}
            <div className="py-2.5 flex flex-wrap gap-1.5 border-b border-slate-800/80">
              <span className="text-[10px] text-slate-400 self-center pr-1">Tes cepat:</span>
              <button
                type="button"
                onClick={() => triggerSimulation('beli soto 15rb')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition"
              >
                🍜 beli soto 15rb
              </button>
              <button
                type="button"
                onClick={() => triggerSimulation('kopi susu 22k')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition"
              >
                ☕ kopi susu 22k
              </button>
              <button
                type="button"
                onClick={() => triggerSimulation('gajian 6.5jt')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition"
              >
                💰 gajian 6.5jt
              </button>
              <button
                type="button"
                onClick={() => triggerSimulation('bensin 50rb')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition"
              >
                🚗 bensin 50rb
              </button>
              <button
                type="button"
                onClick={() => triggerSimulation('📷 [Foto Struk Belanja Indomaret Rp 68.500]')}
                className="px-2.5 py-1 rounded-lg bg-orange-600/30 text-orange-300 hover:bg-orange-600/40 text-[11px] font-semibold transition"
              >
                📷 Demo Foto Struk
              </button>
              <button
                type="button"
                onClick={() => triggerSimulation('🎙️ [Voice Note: Servis motor 135rb]')}
                className="px-2.5 py-1 rounded-lg bg-amber-600/30 text-amber-300 hover:bg-amber-600/40 text-[11px] font-semibold transition"
              >
                🎙️ Demo Voice Note
              </button>
            </div>

            {/* Chat History Container */}
            <div className="py-4 space-y-3.5 h-88 overflow-y-auto font-sans text-xs">
              {demoChat.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender === 'user' ? (
                    <div className="bg-orange-600 text-white px-3.5 py-2 rounded-2xl rounded-tr-sm max-w-[85%] shadow-md">
                      {m.text}
                    </div>
                  ) : (
                    <div
                      className="bg-slate-800 border border-slate-700/80 text-amber-200 p-3.5 rounded-2xl rounded-tl-sm max-w-[92%] font-mono text-[11px] leading-relaxed shadow"
                      dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, '<br/>') }}
                    />
                  )}
                </div>
              ))}
              {isSimulating && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 text-slate-400 p-2.5 rounded-2xl text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                    <span>TataDana bot sedang mengetik...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendDemo} className="mt-3 flex gap-2">
              <input
                type="text"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                placeholder="Ketik: bakso 25rb / martabak 35k / gajian 7jt..."
                className="flex-1 bg-slate-950 border border-slate-700 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-orange-500 placeholder-slate-500"
              />
              <button
                type="submit"
                disabled={isSimulating}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Kirim</span>
              </button>
            </form>
          </div>

          {/* Feature Highlights beside chat (5 Columns) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md">
              <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-600" />
                Fitur Unggulan Telegram Bot
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                Bot TataDana dirancang tanpa latensi dengan engine multimodal Google Gemini 1.5 Flash.
              </p>

              <div className="mt-4 space-y-3.5 text-xs text-slate-700">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Format Waktu Indonesia Barat (WIB):</span>
                    <p className="text-slate-600">Header tanggal dan waktu otomatis disesuaikan dengan zona waktu Asia/Jakarta.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">ASCII Budget Progress Bar:</span>
                    <p className="text-slate-600">Langsung melihat visual persentase anggaran terpakai seperti <code>[████████░░░░] 68%</code>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Multimodal OCR &amp; Voice:</span>
                    <p className="text-slate-600">Bisa kirim foto struk belanjaan mart atau rekaman suara bahasa Indonesia.</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Idempoten &amp; Anti-Duplikasi:</span>
                    <p className="text-slate-600">Jaminan tidak ada transaksi tercatat ganda jika koneksi Telegram mengalami retry.</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Username resmi: @TataDana_bot</span>
                <Link
                  href="/auth/register"
                  className="px-3.5 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg text-xs font-bold transition"
                >
                  Hubungkan Sekarang →
                </Link>
              </div>
            </div>

            {/* Quick Tip Pill */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-200 text-xs text-orange-950 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                💡
              </div>
              <p className="leading-snug">
                <b>Tips Cepat:</b> Anda juga bisa mengetik <code>/laporan</code> di bot Telegram untuk mendapatkan rangkuman pengeluaran mingguan tanpa harus login ke browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: MULTI-WALLET & INDONESIAN BANKING SHOWCASE
          ========================================================================= */}
      <section
        id="multi-wallet"
        data-section="6"
        className="py-20 bg-white border-y border-slate-200"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-orange-600 font-bold text-xs tracking-wider uppercase">Ekosistem Finansial</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
              Terhubung dengan Ekosistem Perbankan &amp; Dompet Digital Indonesia
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
              Pantau seluruh rekening bank dan saldo e-wallet favoritmu dalam satu dasbor terpadu. Pisahkan rekening kebutuhan pribadi dengan dana operasional bisnis.
            </p>
          </div>

          {/* Indonesian Banking & E-Wallet Logo Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3.5 mb-12">
            {[
              { name: 'BCA', desc: 'Bank Central Asia', color: 'bg-blue-50 border-blue-200 text-blue-700' },
              { name: 'Mandiri', desc: 'Bank Mandiri', color: 'bg-amber-50 border-amber-200 text-amber-800' },
              { name: 'BRI', desc: 'Bank Rakyat Indonesia', color: 'bg-sky-50 border-sky-200 text-sky-800' },
              { name: 'BNI', desc: 'Bank Negara Indonesia', color: 'bg-teal-50 border-teal-200 text-teal-800' },
              { name: 'Bank Jago', desc: 'Bank Digital', color: 'bg-purple-50 border-purple-200 text-purple-700' },
              { name: 'Blu by BCA', desc: 'Digital Banking', color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
              { name: 'GoPay', desc: 'Dompet Digital', color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
              { name: 'OVO', desc: 'E-Wallet', color: 'bg-indigo-50 border-indigo-200 text-indigo-700' },
              { name: 'DANA', desc: 'Dompet Digital', color: 'bg-blue-50 border-blue-200 text-blue-800' },
              { name: 'ShopeePay', desc: 'E-Wallet', color: 'bg-orange-50 border-orange-200 text-orange-700' },
              { name: 'LinkAja', desc: 'BUMN E-Wallet', color: 'bg-rose-50 border-rose-200 text-rose-700' },
              { name: 'Kas Tunai', desc: 'Dompet Fisik', color: 'bg-slate-100 border-slate-300 text-slate-800' },
            ].map((b, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border ${b.color} flex flex-col items-center justify-center text-center shadow-sm hover:scale-105 transition transform`}
              >
                <div className="font-extrabold text-sm tracking-tight">{b.name}</div>
                <span className="text-[10px] opacity-75 mt-0.5">{b.desc}</span>
              </div>
            ))}
          </div>

          {/* Interactive Multi-Wallet Aggregator Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
              <div>
                <span className="text-xs text-slate-400">Total Saldo Terkonsolidasi</span>
                <div className="text-3xl font-extrabold text-white mt-1">Rp 24.650.000</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSimulateTransfer}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Simulasi Transfer Antar-Dompet</span>
                </button>
              </div>
            </div>

            {transferDemoSuccess && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Transfer Rp 500.000 dari BCA ke GoPay berhasil dicatat! Saldo otomatis tersinkronisasi.</span>
              </div>
            )}

            {/* Wallet Rows Preview */}
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">BCA Utama</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px]">Default</span>
                </div>
                <div className="text-lg font-extrabold text-white mt-2">Rp 14.820.000</div>
                <span className="text-[10px] text-slate-400">Rekening Gaji &amp; Tagihan</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Mandiri Bisnis</span>
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Usaha</span>
                </div>
                <div className="text-lg font-extrabold text-white mt-2">Rp 5.200.000</div>
                <span className="text-[10px] text-slate-400">Modal Operasional UMKM</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">GoPay Harian</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">E-Wallet</span>
                </div>
                <div className="text-lg font-extrabold text-white mt-2">
                  {transferDemoSuccess ? 'Rp 1.350.000' : 'Rp 850.000'}
                </div>
                <span className="text-[10px] text-slate-400">Transport &amp; GoFood</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/70">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white">Kas Tunai Fisik</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-600 text-slate-200 text-[10px]">Cash</span>
                </div>
                <div className="text-lg font-extrabold text-white mt-2">Rp 3.780.000</div>
                <span className="text-[10px] text-slate-400">Dompet &amp; Uang Cash</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: AI MULTIMODAL FEATURES (GEMINI VISION OCR, VOICE, TEXT NLP)
          ========================================================================= */}
      <section
        id="ai-multimodal"
        data-section="7"
        className="py-20 bg-slate-50"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-orange-600 font-bold text-xs tracking-wider uppercase">Kecerdasan Buatan Terkini</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
              AI Multimodal Canggih: Teks, Vision OCR &amp; Audio
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
              Didukung oleh Google Gemini 1.5 Flash Vision &amp; Groq Llama 3.1 dengan cascading failover engine untuk menjamin ketersediaan 99.9%.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Indonesian NLP */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-5">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  NLP Bahasa Indonesia Alami
                </h3>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                  Memahami singkatan mata uang lokal (`15rb`, `15k`, `1.5jt`, `500k`, `seratus ribu`) serta bahasa gaul harian (&ldquo;nongkrong di senopati 125rb pake gopay&rdquo;). Otomatis memetakan ke 9+ kategori standar Indonesia.
                </p>

                <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                  <span className="text-slate-400">Input:</span> &ldquo;isi bensin shell 100rb&rdquo;<br />
                  <span className="text-orange-600 font-bold">Hasil:</span> Nominal Rp 100.000, Kat: Transportasi
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <Check className="w-4 h-4" />
                <span>Latensi rata-rata &lt; 250ms</span>
              </div>
            </div>

            {/* Feature 2: Gemini Vision Receipt OCR */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold mb-5">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  Gemini 1.5 Flash Vision OCR
                </h3>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                  Cukup kirim foto struk belanja Indomaret, Alfamart, SPBU, atau restoran. AI menganalisis gambar, mendeteksi nama toko, tanggal, item rincian, dan total belanja tanpa perlu disalin manual.
                </p>

                <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                  <span className="text-slate-400">Input:</span> 📷 Foto struk belanjaan mart<br />
                  <span className="text-amber-600 font-bold">Hasil:</span> Ekstrak 5 baris item + Total tagihan
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <Check className="w-4 h-4" />
                <span>Mendukung struk thermal pudar</span>
              </div>
            </div>

            {/* Feature 3: Audio Transcription */}
            <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-5">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">
                  Transkripsi Voice Note Instan
                </h3>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                  Sedang mengemudi atau tangan penuh barang belanjaan? Tekan tombol Voice Note Telegram dan sebutkan pengeluaran Anda. AI mentranskrip ucapan bahasa Indonesia dan mengonversinya menjadi entri transaksi.
                </p>

                <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                  <span className="text-slate-400">Input:</span> 🎙️ &ldquo;Beli martabak manis 35 ribu&rdquo;<br />
                  <span className="text-emerald-600 font-bold">Hasil:</span> Nominal Rp 35.000, Kat: Kuliner
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
                <Check className="w-4 h-4" />
                <span>Format audio Telegram .ogg</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: SECURITY, PRIVACY & DATA COMPLIANCE (ENCRYPTION, RLS, UU PDP)
          ========================================================================= */}
      <section
        id="keamanan"
        data-section="8"
        className="py-20 bg-white border-y border-slate-200"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-orange-600 font-bold text-xs tracking-wider uppercase">Privasi Tanpa Kompromi</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
              Keamanan Finansial Kelas Perbankan &amp; Kepatuhan UU PDP
            </h2>
            <p className="text-slate-600 mt-3 text-sm sm:text-base leading-relaxed">
              Data finansial adalah privasi tertinggi. Kami menerapkan standar perlindungan berjenjang untuk memastikan kerahasiaan transaksi Anda.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">PostgreSQL RLS</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Row Level Security aktif pada seluruh 13 tabel database Supabase. Pengguna hanya dapat membaca dan mengubah baris data miliknya sendiri.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Enkripsi AES-256</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Seluruh token webhook Telegram, pairing code, dan payload audit dienkripsi saat diam (at-rest) dan saat transit dengan TLS 1.3.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Kepatuhan UU PDP</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Sesuai dengan regulasi UU Perlindungan Data Pribadi No. 27/2022 dan ISO/IEC 27001. Data Anda tidak pernah dijual atau dibagikan ke pihak ketiga.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-left">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Zero Banking Credentials</h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Kami tidak pernah meminta PIN, kata sandi mobile banking, atau nomor kartu kredit. 100% bebas dari risiko pembobolan rekening bank.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: PRICING (TOGGLE BULANAN / SEKALI BAYAR, 2 KOLOM STARTER | PRO)
          ========================================================================= */}
      <section
        id="harga"
        data-section="9"
        className="py-20 bg-slate-50"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-orange-600 font-bold text-xs tracking-wider uppercase">Investasi Finansial Cerdas</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
              Pilihan Paket Transparan Sesuai Kebutuhan
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Mulai hemat tanpa komitmen rumit. Pilih paket Starter bulanan atau TataDana Pro sekali bayar seumur hidup.
            </p>

            {/* Billing Toggle (Part 7: toggle bulanan/sekali bayar) */}
            <div className="mt-6 inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-sm">
              <button
                type="button"
                onClick={() => setBillingPeriod('monthly')}
                className={`px-5 py-2 text-xs font-bold rounded-lg transition ${
                  billingPeriod === 'monthly'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingPeriod('annual')}
                className={`px-5 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  billingPeriod === 'annual'
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>Sekali Bayar (Lifetime)</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-extrabold">
                  Paling Hemat ⭐
                </span>
              </button>
            </div>
          </div>

          {/* 2 Kolom (Starter | Pro) Sesuai Part 7 & Part 6 */}
          <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
            {/* TIER 1: STARTER */}
            <div className={`p-8 rounded-3xl bg-white border shadow-sm flex flex-col justify-between transition ${
              billingPeriod === 'monthly' ? 'border-orange-400 ring-2 ring-orange-400/20' : 'border-slate-200'
            }`}>
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-extrabold text-xl text-slate-900">Gratis / Starter</h3>
                  <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-semibold">
                    Pemula &amp; Karyawan
                  </span>
                </div>
                <div className="mb-4">
                  <span className="text-4xl font-extrabold text-slate-950">Rp 49.000</span>
                  <span className="text-slate-500 text-xs"> / bulan</span>
                  <div className="text-[11px] text-emerald-600 mt-0.5 font-semibold">Tersedia kuota coba gratis 50 transaksi</div>
                </div>
                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Pilihan tepat untuk karyawan dan mahasiswa yang ingin membiasakan pencatatan keuangan rutin via chat Telegram.
                </p>

                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Catat transaksi via teks Telegram</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Dashboard web lengkap &amp; statistik</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Maksimal 50 transaksi / bulan</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Maksimal 3 wallet, 5 kategori budget</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Laporan ringkasan bulanan (tanpa export)</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <span>TIDAK ada input via foto struk</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <X className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    <span>TIDAK ada AI Financial Advisor</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/auth/register"
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition text-center block"
                >
                  Mulai dengan Starter
                </Link>
              </div>
            </div>

            {/* TIER 2: TATA DANA PRO */}
            <div className="p-8 rounded-3xl bg-white border-2 border-orange-500 shadow-xl flex flex-col justify-between relative overflow-hidden ring-2 ring-orange-500/20">
              <div className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-extrabold uppercase px-4 py-1 rounded-bl-xl tracking-wider">
                Paling Populer ⭐
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-extrabold text-xl text-slate-900">TataDana Pro</h3>
                  <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">
                    Sekali Bayar Seumur Hidup
                  </span>
                </div>

                <div className="mb-4">
                  <div>
                    <span className="text-4xl font-extrabold text-slate-950">Rp 99.000</span>
                    <span className="text-orange-600 font-bold text-xs ml-1">Sekali Bayar</span>
                    <div className="text-[11px] text-emerald-600 mt-0.5 font-semibold">Lifetime access tanpa biaya bulanan</div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Solusi komprehensif tanpa batas dengan bantuan AI Vision OCR, AI Financial Advisor, dan ekspor laporan.
                </p>

                <ul className="space-y-3 text-xs text-slate-700">
                  <li className="flex items-center gap-2 font-bold text-slate-900">
                    <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span>Unlimited transaksi tanpa batas</span>
                  </li>
                  <li className="flex items-center gap-2 font-bold text-orange-700">
                    <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span>Scan Foto Struk Belanja (AI Gemini Vision)</span>
                  </li>
                  <li className="flex items-center gap-2 font-bold text-orange-700">
                    <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span>AI Financial Advisor &amp; Peringatan Budget 80%/100%</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span>Unlimited Dompet Bank &amp; E-Wallet</span>
                  </li>
                  <li className="flex items-center gap-2 font-semibold text-slate-900">
                    <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span>Export Unlimited PDF &amp; Excel (.xlsx)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <span>Pengingat harian custom hingga 2x sehari</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <Link
                  href="/auth/register?plan=pro"
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition text-center block shadow-lg shadow-orange-600/25"
                >
                  Pilih Paket Pro Sekarang →
                </Link>
              </div>
            </div>
          </div>

          {/* Opsi Tambahan untuk Bisnis / UMKM */}
          <div className="mt-8 max-w-4xl mx-auto p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                UMKM
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-slate-900">
                  Butuh fitur kasir &amp; multi-user untuk toko atau kafe? Pilih Paket Bisnis / UMKM
                </h4>
                <p className="text-[11px] text-slate-500">
                  Mendukung hingga 5 staf kasir, pemisahan rekening bisnis vs pribadi, dan laporan laba/rugi standar SAK EMKM mulai Rp 99.000 / bulan.
                </p>
              </div>
            </div>
            <Link
              href="/auth/register?plan=business"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex-shrink-0 text-center"
            >
              Lihat Paket Bisnis UMKM →
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 10: INDONESIAN USER TESTIMONIALS (DIVERSE LOCAL PERSONAS)
          ========================================================================= */}
      <section
        id="testimoni"
        data-section="10"
        className="py-20 bg-white border-y border-slate-200"
      >
        {/* Testimoni masonry grid — Part 7 */}
        {/* TODO: ganti dengan testimoni asli setelah ada beta user */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-orange-600 font-bold text-xs tracking-wider uppercase">Cerita Pengguna Nyata</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
              Dipercaya Ribuan Pengguna &amp; Pelaku Usaha di Indonesia
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Bagaimana TataDana mengubah kebiasaan finansial para profesional, freelancer, dan pemilik UMKM di tanah air.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white font-extrabold flex items-center justify-center text-sm shadow">
                    DA
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Dimas Anggoro</h4>
                    <p className="text-[11px] text-slate-500">Software Engineer • Jakarta Selatan</p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;Dulu selalu malas buka app keuangan setelah makan siang di kantor. Sekarang tinggal chat bot sambil jalan balik ke meja kerja: &lsquo;makan siang 28rb&rsquo;. Begitu cek akhir bulan, semua saldo BCA dan GoPay langsung sinkron presisi.&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-orange-600 font-semibold">
                ★ ★ ★ ★ ★ Paket Pro Pengguna 8 Bulan
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-white font-extrabold flex items-center justify-center text-sm shadow">
                    SA
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Siti Aisyah</h4>
                    <p className="text-[11px] text-slate-500">Freelance UI/UX Designer • Bandung</p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;Fitur Multi-Wallet nya penyelamat! Penghasilan dari klien luar negeri bisa saya pisah dengan rekening kebutuhan dapur. Saya tidak pernah lagi salah ambil jatah uang tabungan untuk belanja konsumtif.&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-orange-600 font-semibold">
                ★ ★ ★ ★ ★ Paket Pro Pengguna 1 Tahun
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white font-extrabold flex items-center justify-center text-sm shadow">
                    HP
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Hendra Pratama</h4>
                    <p className="text-[11px] text-slate-500">Owner Kafe Kopi Sudut • Yogyakarta</p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;Paket UMKM TataDana ngebantu banget pantau belanja bahan baku harian kafe saya. Cukup foto struk belanja grosir, item-itemnya langsung diekstrak sama AI Vision. Tiap akhir bulan tinggal export ke Excel untuk hitung laba bersih.&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-orange-600 font-semibold">
                ★ ★ ★ ★ ★ Paket Bisnis UMKM
              </div>
            </div>

            {/* Testimonial 4 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-extrabold flex items-center justify-center text-sm shadow">
                    RF
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Rizky Febrian</h4>
                    <p className="text-[11px] text-slate-500">Marketing Executive • Surabaya</p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;Peringatan budget 80% di chat Telegram benar-benar penyelamat dompet saya. Pas belanja online keterusan, langsung dapat notif pengingat. Saya jadi bisa rem pengeluaran sebelum kantong jebol.&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-orange-600 font-semibold">
                ★ ★ ★ ★ ★ Paket Pro Pengguna 6 Bulan
              </div>
            </div>

            {/* Testimonial 5 */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 text-white font-extrabold flex items-center justify-center text-sm shadow">
                    MI
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Maya Indah</h4>
                    <p className="text-[11px] text-slate-500">Ibu Rumah Tangga &amp; Online Seller • Semarang</p>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed italic">
                  &ldquo;Nggak perlu ngerti akuntansi atau Excel rumit. Pas belanja di pasar tradisional cukup rekam voice note di Telegram, otomatis dicatat. Pengeluaran rumah tangga jadi transparan dan bisa di-download PDF nya.&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] text-orange-600 font-semibold">
                ★ ★ ★ ★ ★ Paket Pro Pengguna 9 Bulan
              </div>
            </div>

            {/* Summary Stat Box */}
            <div className="p-6 rounded-2xl bg-orange-600 text-white shadow-md flex flex-col justify-between">
              <div>
                <h4 className="font-extrabold text-2xl tracking-tight">98.4%</h4>
                <p className="text-xs text-orange-100 mt-1">Tingkat kepuasan pengguna aktif harian</p>
                <div className="mt-4 space-y-2 text-xs text-orange-100">
                  <p>✓ Lebih dari 120.000 transaksi tercatat setiap bulan</p>
                  <p>✓ Penghematan rata-rata 24% dari kebocoran jajan mikro</p>
                  <p>✓ Dukungan pelanggan lokal responsif via WhatsApp &amp; Telegram</p>
                </div>
              </div>
              <div className="mt-6">
                <Link
                  href="/auth/register"
                  className="w-full py-2.5 bg-white text-orange-600 hover:bg-orange-50 font-bold rounded-xl text-xs text-center block transition"
                >
                  Bergabung Sekarang Gratis →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 11: FAQ ACCORDION (7+ FREQUENTLY ASKED QUESTIONS)
          ========================================================================= */}
      <section
        id="faq"
        data-section="11"
        className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center mb-14">
          <span className="text-orange-600 font-bold text-xs tracking-wider uppercase">Pusat Bantuan &amp; FAQ</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 mt-1">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-slate-600 text-sm mt-2">
            Punya pertanyaan mengenai bot Telegram, keamanan data, atau integrasi bank? Temukan jawabannya di bawah ini.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-2xl bg-white overflow-hidden transition shadow-sm"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-bold text-sm sm:text-base text-slate-900 flex justify-between items-center hover:text-orange-600 transition"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                    activeFaq === idx ? 'rotate-180 text-orange-600' : ''
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          FINAL CTA: BACKGROUND GRADIENT ORANGE (PART 7 SPECIFICATION)
          ========================================================================= */}
      <section
        id="final-cta"
        className="py-20 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white text-center relative overflow-hidden"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-sm mb-5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            Langkah Awal Finansial Terkontrol
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Mulai kendalikan keuanganmu hari ini
          </h2>
          <p className="mt-4 text-orange-100 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Bergabunglah dengan ribuan karyawan, freelancer, dan keluarga muda yang kini mencatat pengeluaran semudah mengirim pesan chat Telegram.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-white text-orange-600 hover:bg-orange-50 font-extrabold rounded-xl shadow-xl transition active:scale-95 text-sm"
            >
              Mulai Gratis Sekarang →
            </Link>
            <a
              href="#telegram-showcase"
              className="w-full sm:w-auto px-8 py-3.5 bg-orange-700/60 hover:bg-orange-700 text-white font-bold rounded-xl border border-white/20 transition text-sm flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Coba Demo Telegram Bot</span>
            </a>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 12: TRUST & COMPLIANCE FOOTER (KOMINFO PSE, ISO 27001, QRIS, LEGAL)
          ========================================================================= */}
      <footer
        id="footer"
        data-section="12"
        className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Trust, Security & Compliance Badges Bar */}
          <div className="pb-12 mb-12 border-b border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center font-bold">
                🇮🇩
              </div>
              <div>
                <h5 className="font-bold text-xs text-white">Kominfo PSE RI</h5>
                <p className="text-[10px] text-slate-400">Terdaftar Resmi No. 00892/DJAI.PSE</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-white">ISO/IEC 27001</h5>
                <p className="text-[10px] text-slate-400">Standar Manajemen Keamanan Data</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center font-bold">
                QR
              </div>
              <div>
                <h5 className="font-bold text-xs text-white">Standar QRIS BI</h5>
                <p className="text-[10px] text-slate-400">Pembayaran Nasional Bank Indonesia</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h5 className="font-bold text-xs text-white">UU PDP No. 27/2022</h5>
                <p className="text-[10px] text-slate-400">Kepatuhan Perlindungan Data Pribadi</p>
              </div>
            </div>
          </div>

          {/* 4-Column Navigation Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs">
            {/* Kolom 1: Profil Brand */}
            <div className="col-span-2 md:col-span-1 space-y-3.5">
              <div className="flex items-center gap-2.5 text-white font-extrabold text-lg">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-xs text-white shadow">
                  TD
                </div>
                <span>TataDana Indonesia</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Platform SaaS manajemen keuangan pribadi dan UMKM terpadu di Indonesia. Terintegrasi langsung dengan Telegram Bot berbasis AI Multimodal.
              </p>
              <div className="pt-2 flex items-center gap-2 text-emerald-400 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Semua Sistem Normal (WIB)</span>
              </div>
            </div>

            {/* Kolom 2: Produk & Fitur */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Produk &amp; Ekosistem</h5>
              <ul className="space-y-1.5 text-slate-400">
                <li><a href="#telegram-showcase" className="hover:text-white transition">Telegram Bot @TataDana_bot</a></li>
                <li><a href="#ai-multimodal" className="hover:text-white transition">Gemini Vision OCR Struk</a></li>
                <li><a href="#ai-multimodal" className="hover:text-white transition">Transkripsi Voice Note</a></li>
                <li><a href="#multi-wallet" className="hover:text-white transition">Multi-Wallet Indonesia</a></li>
                <li><a href="/dashboard" className="hover:text-white transition">Web Dashboard Beranda</a></li>
                <li><a href="#harga" className="hover:text-white transition">Paket Pro &amp; Bisnis UMKM</a></li>
              </ul>
            </div>

            {/* Kolom 3: Perusahaan & Sumber Daya */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Perusahaan &amp; Panduan</h5>
              <ul className="space-y-1.5 text-slate-400">
                <li><span className="hover:text-white cursor-pointer transition">Tentang TataDana</span></li>
                <li><span className="hover:text-white cursor-pointer transition">Panduan Menghubungkan Bot</span></li>
                <li><span className="hover:text-white cursor-pointer transition">Blog Edukasi Finansial</span></li>
                <li><span className="hover:text-white cursor-pointer transition">Karir &amp; Magang</span></li>
                <li><span className="hover:text-white cursor-pointer transition">Press Kit &amp; Media</span></li>
              </ul>
            </div>

            {/* Kolom 4: Legalitas & Kontak */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-white uppercase tracking-wider text-[11px]">Legalitas &amp; Bantuan</h5>
              <ul className="space-y-1.5 text-slate-400">
                <li><span className="hover:text-white cursor-pointer transition">Kebijakan Privasi (/privacy)</span></li>
                <li><span className="hover:text-white cursor-pointer transition">Syarat &amp; Ketentuan (/terms)</span></li>
                <li><span className="hover:text-white cursor-pointer transition">Standar Keamanan RLS</span></li>
                <li><span className="hover:text-white cursor-pointer transition">Kontak CS: support@tatadana.app</span></li>
                <li><span className="hover:text-white cursor-pointer transition">WhatsApp CS: +62 812-3456-7890</span></li>
              </ul>
            </div>
          </div>

          {/* Copyright & WIB notice */}
          <div className="mt-12 pt-8 border-t border-slate-900 text-center text-slate-500 text-[11px] leading-relaxed">
            <p>© {new Date().getFullYear()} PT TataDana Finansial Digital Indonesia. Hak Cipta Dilindungi Undang-Undang.</p>
            <p className="mt-1 text-slate-600">Waktu Operasional Standar Indonesia: Asia/Jakarta (WIB). Terdaftar PSE Kominfo RI.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
