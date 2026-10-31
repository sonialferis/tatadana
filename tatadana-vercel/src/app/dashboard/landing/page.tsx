'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Share2,
  Sparkles,
  ArrowRight,
  Eye,
  CheckCircle2,
  Layers,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  CreditCard,
  HelpCircle,
  Zap,
  Users,
  Send,
} from 'lucide-react';
import { useFinance } from '@/lib/finance-context';

export default function LandingFeaturePage() {
  const { user } = useFinance();
  const [activeTab, setActiveTab] = useState<'preview' | 'sections' | 'share' | 'metrics'>('preview');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedShareText, setCopiedShareText] = useState(false);

  const landingUrl = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:3005';
  const referralLink = `${landingUrl}/?ref=${encodeURIComponent(user.full_name.toLowerCase().replace(/\s+/g, ''))}`;

  const shareText = `Halo! Yuk mulai rapikan catatan keuanganmu semudah chat di Telegram dengan TataDana 🚀 Catat pemasukan, pengeluaran & foto struk belanja otomatis: ${referralLink}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(landingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedShareText(true);
    setTimeout(() => setCopiedShareText(false), 2500);
  };

  const sectionsList = [
    {
      num: 1,
      title: 'Sticky Navbar & Branding',
      desc: 'Logo TataDana, navigasi menu anchor (Fitur, Solusi, Bot, Harga, FAQ), pemilih bahasa (ID/EN), dan tombol Masuk / Coba Gratis.',
      badge: 'Header',
    },
    {
      num: 2,
      title: 'Pre-Headline Badge & Hero Headline',
      desc: '"Gaji habis sebelum akhir bulan? Sudah saatnya kamu tahu ke mana uangmu pergi." dengan aksen gradien oranye modern.',
      badge: 'Hero Section',
    },
    {
      num: 3,
      title: 'Simulator Chat Bot Telegram Interaktif',
      desc: 'Simulasi pesan nyata "beli soto ayam 18rb es teh 5rb" dan deteksi struk belanja dengan reply instan format WIB.',
      badge: 'Interactive Demo',
    },
    {
      num: 4,
      title: 'Identifikasi Masalah Keuangan Pengguna',
      desc: '3 poin masalah riil: malas buka aplikasi rumit, uang habis tanpa sadar, dan lupa memantau batas budget.',
      badge: 'Problem Aware',
    },
    {
      num: 5,
      title: 'Pencatatan Multimodal via Telegram Bot',
      desc: 'Pencatatan via teks bahasa alami (15rb, 500k, 1.5jt), foto struk belanja AI Vision, dan pesan suara (voice note).',
      badge: 'Core Feature',
    },
    {
      num: 6,
      title: 'Multi-Wallet Banking & E-Wallet Showcase',
      desc: 'Simulasi dompet multi-rekening (BCA, Mandiri, GoPay, OVO, Kas Tunai) dengan filter transaksi per dompet.',
      badge: 'Multi-Wallet',
    },
    {
      num: 7,
      title: 'AI Multimodal Vision & Transkrip Audio',
      desc: 'Ekstraksi item belanja dari struk Indomaret/Alfamart dan transkripsi suara otomatis menggunakan AI canggih.',
      badge: 'AI Engine',
    },
    {
      num: 8,
      title: 'Keamanan Data Transaksi Bank-Grade',
      desc: 'Enkripsi data tingkat tinggi, Supabase Row-Level Security (RLS), dan kebijakan privasi ketat.',
      badge: 'Security',
    },
    {
      num: 9,
      title: 'Tabel Perbandingan Paket Starter vs Pro',
      desc: 'Paket Starter Rp49.000/bulan dan Paket Pro Rp99.000 sekali bayar dengan rincian limit kuota dan fitur lengkap.',
      badge: 'Pricing Plans',
    },
    {
      num: 10,
      title: 'Testimoni & Cerita Pengguna',
      desc: 'Ulasan masonry grid dari karyawan swasta, mahasiswa, dan freelancer yang berhasil mengontrol keuangannya.',
      badge: 'Social Proof',
    },
    {
      num: 11,
      title: 'FAQ 7 Pertanyaan Kunci',
      desc: 'Tanya jawab interaktif seputar keamanan data, integrasi bot Telegram, format struk, dan opsi berlangganan.',
      badge: 'FAQ Accordion',
    },
    {
      num: 12,
      title: 'Final Call to Action (CTA) & Footer 4 Kolom',
      desc: 'Banner oranye gradien ajakan bergabung, tautan legal (/privacy, /terms), kontak support, dan hak cipta.',
      badge: 'Footer',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. HEADER UTAMA FITUR LANDING PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-600/20">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Fitur Landing Page TataDana
            </h1>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-600" />
              Website Publik
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Pratinjau langsung, jelajahi 12 bagian unggulan, dan bagikan tautan website resmi TataDana kepada rekan.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedLink ? 'Tautan Disalin!' : 'Salin URL Website'}</span>
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange-600/20 flex items-center gap-2 transition active:scale-95"
          >
            <Globe className="w-4 h-4" />
            <span>Kunjungi Website Utama</span>
            <ExternalLink className="w-3.5 h-3.5 text-orange-200" />
          </a>
        </div>
      </div>

      {/* 2. TAB NAVIGATOR */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {[
          { id: 'preview', label: '📱 Pratinjau Interaktif', icon: Eye },
          { id: 'sections', label: '🌟 12 Bagian Landing Page', icon: Layers },
          { id: 'share', label: '📢 Bagikan & Referral', icon: Share2 },
          { id: 'metrics', label: '📊 Statistik & Performa', icon: TrendingUp },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition whitespace-nowrap ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. TAB 1: LIVE INTERACTIVE PREVIEW CANVAS */}
      {activeTab === 'preview' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Controls Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Tampilan Pratinjau:</span>
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setDeviceMode('desktop')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    deviceMode === 'desktop' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('mobile')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition ${
                    deviceMode === 'mobile' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (375px)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
                URL: {landingUrl}/
              </span>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>Buka Penuh</span>
                <ExternalLink className="w-3 h-3 text-orange-400" />
              </a>
            </div>
          </div>

          {/* Frame Container */}
          <div className="bg-slate-100 p-4 sm:p-8 rounded-3xl border border-slate-200 flex justify-center items-center min-h-[600px] overflow-hidden">
            <div
              className={`bg-white rounded-2xl shadow-2xl border border-slate-300 overflow-hidden transition-all duration-300 flex flex-col ${
                deviceMode === 'desktop' ? 'w-full h-[650px]' : 'w-[375px] h-[650px]'
              }`}
            >
              {/* Browser Simulated Top Chrome */}
              <div className="bg-slate-200 px-4 py-2 border-b border-slate-300 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
                <div className="px-3 py-0.5 bg-white rounded-lg text-[11px] text-slate-600 font-mono truncate max-w-xs shadow-xs">
                  {landingUrl}
                </div>
                <div className="w-8"></div>
              </div>

              {/* Embedded Live Web Preview */}
              <iframe
                src="/"
                title="TataDana Live Landing Page"
                className="w-full flex-1 border-0"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB 2: 12 SECTIONS OF LANDING PAGE */}
      {activeTab === 'sections' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sectionsList.map((sec) => (
              <div
                key={sec.num}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-orange-300 transition group flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="w-7 h-7 rounded-xl bg-orange-50 text-orange-600 font-black text-xs flex items-center justify-center border border-orange-200 group-hover:bg-orange-600 group-hover:text-white transition">
                      {sec.num}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {sec.badge}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-orange-600 transition">
                    {sec.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1">
                    {sec.desc}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <a
                    href={`/#hero`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <span>Lihat di Website</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TAB 3: SHARE & REFERRAL HUB */}
      {activeTab === 'share' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Left Column: Share Options */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-lg text-slate-900">Ajak Teman &amp; Bagikan Landing Page</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bantu teman, rekan kerja, dan keluargamu mengetahui cara mencatat keuangan yang mudah langsung dari Telegram.
              </p>
            </div>

            {/* Referral Link Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">Tautan Landing Page Kamu</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition flex items-center gap-1.5 active:scale-95 flex-shrink-0"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>
            </div>

            {/* Quick Social Buttons */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Bagikan Langsung ke:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim ke WhatsApp</span>
                </a>
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(
                    'Catat keuangan semudah chat langsung di Telegram kamu dengan TataDana!'
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Kirim ke Telegram</span>
                </a>
              </div>
            </div>

            {/* Text Preview Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Contoh Teks Promosi:</span>
                <button
                  type="button"
                  onClick={handleCopyShare}
                  className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1"
                >
                  {copiedShareText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedShareText ? 'Teks Tersalin' : 'Salin Teks'}</span>
                </button>
              </div>
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                "{shareText}"
              </div>
            </div>
          </div>

          {/* Right Column: Promotional Tips & Benefits */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white p-6 rounded-3xl shadow-lg shadow-orange-600/20 space-y-3">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full inline-block backdrop-blur-sm">
                Keuntungan Berbagi
              </span>
              <h3 className="text-lg font-black tracking-tight leading-snug">
                Bantu Indonesia Lebih Melek Finansial
              </h3>
              <p className="text-xs text-orange-100 leading-relaxed">
                Rata-rata pengguna TataDana berhasil menekan pengeluaran bocor halus hingga 35% pada bulan pertama penggunaan.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-orange-600" />
                <span>Fitur Unggulan yang Bisa Dipromosikan:</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Tanpa download aplikasi baru — cukup chat bot Telegram</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Bisa kirim foto struk belanja &amp; otomatis terdata</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Multi-Wallet (BCA, Mandiri, GoPay, OVO, Kas Fisik)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Export laporan ke format Excel &amp; PDF sewaktu-waktu</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: METRICS & SYSTEM PERFORMANCE */}
      {activeTab === 'metrics' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Kunjungan
              </span>
              <span className="text-2xl font-black text-slate-900">1.428</span>
              <span className="text-[11px] text-emerald-600 font-bold block mt-1">↑ +14.2% bulan ini</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Tingkat Konversi
              </span>
              <span className="text-2xl font-black text-slate-900">19.4%</span>
              <span className="text-[11px] text-emerald-600 font-bold block mt-1">Pengunjung jadi pendaftar</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Rata-rata Durasi
              </span>
              <span className="text-2xl font-black text-slate-900">2m 45s</span>
              <span className="text-[11px] text-slate-500 font-bold block mt-1">Interaksi demo bot tinggi</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Status Server Landing
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-base font-extrabold text-emerald-700">100% Online</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-1">Next.js App Router (Port 3005)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
