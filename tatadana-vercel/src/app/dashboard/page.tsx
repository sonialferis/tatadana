'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Target,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  Receipt,
  MessageSquare,
  AlertTriangle,
  ArrowLeftRight,
  FileSpreadsheet,
  FileText,
  Send,
  Eye,
  EyeOff,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Check,
  ChevronRight,
  X,
  Bot,
} from 'lucide-react';
import { useFinance } from '@/lib/finance-context';
import { formatRupiah, formatTanggalWIB } from '@/lib/formatters';

export default function DashboardOverviewPage() {
  const {
    user,
    wallets,
    transactions,
    budgets,
    categories,
    hideBalance,
    toggleHideBalance,
    setQuickAddOpen,
  } = useFinance();

  // Period Filter: harian, mingguan, bulanan, tahunan, custom
  const [period, setPeriod] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan' | 'custom'>('bulanan');
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-10-31');
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Formatting balance helper considering privacy mode
  const displayAmount = (amt: number) => {
    return hideBalance ? 'Rp ••••••••' : formatRupiah(amt);
  };

  // Filter transactions dynamically by selected period
  const filteredTransactions = useMemo(() => {
    const now = new Date('2026-10-10T12:00:00+07:00'); // Standard simulation context
    return transactions.filter((t) => {
      const txDate = new Date(t.transaction_time);
      if (period === 'harian') {
        return txDate.toDateString() === now.toDateString();
      }
      if (period === 'mingguan') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return txDate >= sevenDaysAgo && txDate <= now;
      }
      if (period === 'bulanan') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (period === 'tahunan') {
        return txDate.getFullYear() === now.getFullYear();
      }
      if (period === 'custom') {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return txDate >= start && txDate <= end;
      }
      return true;
    });
  }, [transactions, period, customStartDate, customEndDate]);

  // Real KPI calculations from state
  const totalSaldo = wallets.reduce((sum, w) => sum + w.balance, 0);

  const totalPemasukan = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPengeluaran = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
  const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.current_spent, 0);
  const sisaBudget = Math.max(0, totalBudgetLimit - totalBudgetSpent);
  const persentaseSisaBudget = totalBudgetLimit > 0 ? (sisaBudget / totalBudgetLimit) * 100 : 0;

  // 6-month historical cashflow bar chart data
  const monthlyChartData = [
    { month: 'Mei', income: 6500000, expense: 3800000 },
    { month: 'Jun', income: 7000000, expense: 4200000 },
    { month: 'Jul', income: 6800000, expense: 3500000 },
    { month: 'Agu', income: 7500000, expense: 4800000 },
    { month: 'Sep', income: 7200000, expense: 3900000 },
    { month: 'Okt', income: totalPemasukan || 7500000, expense: totalPengeluaran || 2387500 },
  ];

  const maxChartVal = Math.max(
    ...monthlyChartData.map((d) => Math.max(d.income, d.expense)),
    8000000
  );

  // Category breakdown calculations for Pie Chart & List
  const categoryBreakdown = useMemo(() => {
    return categories
      .filter((c) => c.type === 'expense')
      .map((c) => {
        const spent = filteredTransactions
          .filter((t) => t.type === 'expense' && t.category_id === c.id)
          .reduce((sum, t) => sum + t.amount, 0);
        const budget = budgets.find((b) => b.category_id === c.id);
        const limit = budget ? budget.monthly_limit : 0;
        const pctOfTotal = totalPengeluaran > 0 ? (spent / totalPengeluaran) * 100 : 0;
        return {
          ...c,
          spent,
          limit,
          pctOfTotal,
        };
      })
      .filter((c) => c.spent > 0)
      .sort((a, b) => b.spent - a.spent);
  }, [categories, filteredTransactions, budgets, totalPengeluaran]);

  // Daily Spending Trend Line Data for current month (Days 1 to 10)
  const dailySpendingData = useMemo(() => {
    const days = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    return days.map((day) => {
      const dayTransactions = transactions.filter((t) => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.transaction_time);
        return d.getDate() === day && d.getMonth() === 9 && d.getFullYear() === 2026;
      });
      const spent = dayTransactions.reduce((sum, t) => sum + t.amount, 0);
      return { day: `${day} Okt`, spent };
    });
  }, [transactions]);

  const maxDailySpent = Math.max(...dailySpendingData.map((d) => d.spent), 100000);

  // Recent 10 transactions (Part 3: List 10 transaksi terbaru)
  const recentTransactions = transactions.slice(0, 10);

  // Format today's greeting context
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 11
      ? 'Selamat Pagi'
      : currentHour < 15
      ? 'Selamat Siang'
      : currentHour < 19
      ? 'Selamat Sore'
      : 'Selamat Malam';

  // SVG Pie / Donut Chart helper calculations
  const donutRadius = 65;
  const donutCircumference = 2 * Math.PI * donutRadius;
  let accumulatedPercent = 0;

  return (
    <div className="space-y-6">
      {/* 1. ONBOARDING CHECKLIST EMPTY STATE / PROGRESS BAR FOR NEW USERS */}
      {showOnboarding && (
        <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 p-5 rounded-3xl border border-orange-200/80 shadow-sm relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/30 flex-shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5 text-amber-200" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-slate-900">Checklist Onboarding TataDana</h3>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 3 dari 3 Selesai (100%)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Akun Anda telah terintegrasi sempurna dengan Telegram Bot, Multi-Wallet, dan Perencanaan Budget.
                </p>
                {/* 3 Steps Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-800 rounded-xl font-bold shadow-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> 1. Hubungkan Telegram (@TataDanaOfficial_bot)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-800 rounded-xl font-bold shadow-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> 2. Set Wallet Utama (BCA Default)
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-emerald-200 text-emerald-800 rounded-xl font-bold shadow-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> 3. Tetapkan Budget Bulanan
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowOnboarding(false)}
              className="self-start sm:self-center p-1.5 text-slate-400 hover:text-slate-600 hover:bg-orange-100 rounded-xl transition"
              title="Tutup checklist"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. SALUTATION & PERIOD HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {greeting}, {user.full_name.split(' ')[0]} 👋
            </h1>
            <button
              onClick={toggleHideBalance}
              className="text-slate-400 hover:text-orange-600 transition p-1"
              title={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
            >
              {hideBalance ? <EyeOff className="w-4 h-4 text-orange-600" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan keuangan terkonsolidasi &amp; sinkronisasi Telegram Bot (WIB).
          </p>
        </div>

        {/* Period Selector (Part 3: harian, mingguan, bulanan, tahunan, custom range) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-bold overflow-x-auto">
            {(['harian', 'mingguan', 'bulanan', 'tahunan', 'custom'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg capitalize transition whitespace-nowrap ${
                  period === p
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {p === 'custom' ? 'Custom Range' : p}
              </button>
            ))}
          </div>

          <button
            onClick={() => setQuickAddOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-600/20 transition active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Baru</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Selector if period === 'custom' */}
      {period === 'custom' && (
        <div className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center gap-3 text-xs font-bold animate-in fade-in">
          <span className="text-slate-500">Pilih Rentang Tanggal:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-orange-500"
            />
            <span className="text-slate-400">s/d</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-orange-500"
            />
          </div>
          <span className="text-orange-600 font-bold ml-auto text-[11px]">
            {filteredTransactions.length} transaksi dalam rentang ini
          </span>
        </div>
      )}

      {/* 3. 4 FINANCIAL KPI STATS CARDS (Part 3: Saldo Total, Pemasukan Bulan Ini, Pengeluaran Bulan Ini, Budget Tersisa) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Saldo Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-orange-300 transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Saldo Total
            </span>
            <div className="w-9 h-9 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-950 tracking-tight">
              {displayAmount(totalSaldo)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
              ▲ {wallets.length} Dompet Aktif (Tersinkronisasi)
            </span>
          </div>
        </div>

        {/* KPI 2: Pemasukan Bulan Ini */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pemasukan Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-emerald-600 tracking-tight">
              {displayAmount(totalPemasukan)}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
              Gaji rutin &amp; proyek sampingan
            </span>
          </div>
        </div>

        {/* KPI 3: Pengeluaran Bulan Ini */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-rose-300 transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pengeluaran Bulan Ini
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-600 tracking-tight">
              {displayAmount(totalPengeluaran)}
            </h3>
            <span className="text-[11px] text-slate-500 font-medium block mt-1">
              {totalPemasukan > 0
                ? `${((totalPengeluaran / totalPemasukan) * 100).toFixed(1)}% dari total pemasukan`
                : 'Bulan berjalan'}
            </span>
          </div>
        </div>

        {/* KPI 4: Budget Tersisa (Part 3 Requirement) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-blue-300 transition group">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Budget Tersisa
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className={`text-2xl font-black tracking-tight ${sisaBudget > 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {displayAmount(sisaBudget)}
            </h3>
            <span className="text-[11px] text-emerald-600 font-bold block mt-1">
              {persentaseSisaBudget.toFixed(0)}% sisa dari batas {displayAmount(totalBudgetLimit)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. QUICK ACTION SHORTCUTS BAR */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl text-xs font-bold transition whitespace-nowrap"
        >
          <ArrowDownLeft className="w-4 h-4 text-orange-600" />
          <span>+ Catat Pengeluaran</span>
        </button>

        <button
          onClick={() => setQuickAddOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition whitespace-nowrap"
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          <span>+ Catat Pemasukan</span>
        </button>

        <Link
          href="/dashboard/wallets"
          className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition whitespace-nowrap"
        >
          <ArrowLeftRight className="w-4 h-4 text-blue-600" />
          <span>⇄ Transfer Antar Dompet</span>
        </Link>

        <Link
          href="/dashboard/reports"
          className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition whitespace-nowrap"
        >
          <FileText className="w-4 h-4 text-slate-600" />
          <span>Unduh Laporan PDF/Excel</span>
        </Link>

        <Link
          href="/dashboard/tata-ai"
          className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition whitespace-nowrap shadow-sm"
        >
          <Bot className="w-4 h-4 text-amber-200" />
          <span>🤖 Tanya TATA AI BOT</span>
        </Link>

        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-bold transition whitespace-nowrap ml-auto"
        >
          <Send className="w-3.5 h-3.5 text-amber-600" />
          <span>Telegram Bot Pairing</span>
        </Link>
      </div>

      {/* TATA AI BOT SMART INSIGHT BANNER */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-100/60 p-4 sm:p-5 rounded-3xl border border-orange-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-600/30">
            <Bot className="w-5 h-5 text-amber-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-black text-sm text-slate-900 tracking-tight">
                TATA AI BOT — Asisten Keuangan Pribadi
              </span>
              <span className="text-[10px] bg-orange-600 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Live AI
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              Butuh konsultasi keuangan instan atau ingin mencatat pengeluaran semudah kirim pesan chat? Buka percakapan dengan Tata AI untuk menganalisis saldo, sisa budget, dan rekomendasi hematmu.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link
            href="/dashboard/tata-ai"
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 flex items-center gap-2 transition active:scale-95"
          >
            <span>Buka Chat Tata AI</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* 5. CHARTS GRID (Part 3: Bar Chart 6 Bulan, Pie Chart Kategori, Trend Line Harian) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* CHART 1: BAR CHART Pemasukan vs Pengeluaran 6 Bulan Terakhir */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">Arus Kas 6 Bulan Terakhir</h3>
                <p className="text-xs text-slate-400">Pemasukan vs Pengeluaran (IDR)</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-sm"></span> Masuk
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-orange-500 rounded-sm"></span> Keluar
                </span>
              </div>
            </div>

            <div className="h-48 flex items-end justify-between gap-2 pt-4 pb-2 border-b border-slate-100">
              {monthlyChartData.map((bar, idx) => {
                const incHeight = (bar.income / maxChartVal) * 100;
                const expHeight = (bar.expense / maxChartVal) * 100;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full flex items-end justify-center gap-1 h-36 relative">
                      <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-20 shadow-md">
                        +{formatRupiah(bar.income)} | -{formatRupiah(bar.expense)}
                      </div>
                      <div
                        className="w-1/2 bg-emerald-500 group-hover:bg-emerald-600 rounded-t transition-all"
                        style={{ height: `${Math.max(8, incHeight)}%` }}
                      ></div>
                      <div
                        className="w-1/2 bg-orange-500 group-hover:bg-orange-600 rounded-t transition-all"
                        style={{ height: `${Math.max(8, expHeight)}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900 transition">
                      {bar.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Rata-rata: ~Rp 7jt/bln</span>
            <span className="text-emerald-600 font-bold">Surplus Stabil</span>
          </div>
        </div>

        {/* CHART 2: PIE CHART (SVG Donut Chart) Pengeluaran per Kategori (Part 3 Requirement) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-sm text-slate-900">Pie Chart Pengeluaran</h3>
              <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                {categoryBreakdown.length} Kategori
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Distribusi per kategori periode ini</p>

            {/* Pure SVG Donut Chart */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  {/* Background Track Circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r={donutRadius}
                    className="stroke-slate-100"
                    strokeWidth="18"
                    fill="transparent"
                  />
                  {/* Category Arcs */}
                  {categoryBreakdown.map((cat, idx) => {
                    const strokeDasharray = `${(cat.pctOfTotal / 100) * donutCircumference} ${donutCircumference}`;
                    const strokeDashoffset = -((accumulatedPercent / 100) * donutCircumference);
                    accumulatedPercent += cat.pctOfTotal;

                    return (
                      <circle
                        key={cat.id}
                        cx="80"
                        cy="80"
                        r={donutRadius}
                        stroke={cat.color || '#ea580c'}
                        strokeWidth="18"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        fill="transparent"
                        strokeLinecap="round"
                        className="transition-all duration-300 hover:opacity-85"
                      />
                    );
                  })}
                </svg>
                {/* Center text in Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Keluar</span>
                  <span className="text-xs font-black text-slate-900 leading-tight">
                    {displayAmount(totalPengeluaran)}
                  </span>
                </div>
              </div>

              {/* Legend List */}
              <div className="grid grid-cols-2 gap-2 w-full mt-3 text-[11px] max-h-24 overflow-y-auto pr-1">
                {categoryBreakdown.slice(0, 6).map((cat) => (
                  <div key={cat.id} className="flex items-center gap-1.5 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color || '#ea580c' }}
                    ></span>
                    <span className="truncate text-slate-600 font-semibold">{cat.name}</span>
                    <span className="font-extrabold text-slate-900 ml-auto">{cat.pctOfTotal.toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              href="/dashboard/budgets"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
            >
              Atur Batas Budget Kategori →
            </Link>
          </div>
        </div>

        {/* CHART 3: TREND LINE Pengeluaran Harian Bulan Ini (Part 3 Requirement) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-extrabold text-sm text-slate-900">Trend Line Harian</h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Oktober 2026
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">Tren pengeluaran harian bulan ini</p>

            {/* SVG Trend Line Graph */}
            <div className="h-44 w-full relative flex items-center justify-center pt-2">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 300 120">
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ea580c" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#ea580c" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                <line x1="0" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="0" y1="100" x2="300" y2="100" stroke="#f1f5f9" strokeWidth="1" />

                {/* Area under curve */}
                {(() => {
                  const points = dailySpendingData.map((d, i) => {
                    const x = (i / (dailySpendingData.length - 1)) * 290 + 5;
                    const y = 100 - (d.spent / maxDailySpent) * 85;
                    return { x, y, spent: d.spent, day: d.day };
                  });
                  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(' ');
                  const areaPoints = `${points[0].x},100 ${polyPoints} ${points[points.length - 1].x},100`;

                  return (
                    <>
                      <polygon points={areaPoints} fill="url(#trendGradient)" />
                      <polyline
                        points={polyPoints}
                        fill="none"
                        stroke="#ea580c"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {points.map((p, idx) => (
                        <circle
                          key={idx}
                          cx={p.x}
                          cy={p.y}
                          r="3.5"
                          className="fill-white stroke-orange-600 stroke-2 hover:r-5 transition-all cursor-pointer"
                        >
                          <title>{`${p.day}: ${formatRupiah(p.spent)}`}</title>
                        </circle>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Day ticks */}
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2 px-1">
              <span>1 Okt</span>
              <span>3 Okt</span>
              <span>5 Okt</span>
              <span>7 Okt</span>
              <span>10 Okt</span>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Rata-rata/hari: ~Rp 238rb</span>
            <span className="text-orange-600 font-bold">Terkontrol</span>
          </div>
        </div>
      </div>

      {/* 6. LIST 10 TRANSAKSI TERBARU (Part 3 Requirement) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-slate-900">10 Transaksi Terbaru</h3>
              <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-[10px] font-extrabold">
                Real-Time Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sinkronisasi instan Telegram Bot, OCR Struk, dan Web Dashboard
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setQuickAddOpen(true)}
              className="px-3.5 py-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah</span>
            </button>
            <Link
              href="/dashboard/transactions"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <span>Semua Transaksi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-sm text-slate-800">Belum Ada Transaksi Tercatat</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Mulai catat transaksi pertama lewat chat Telegram atau klik tombol Tambah di atas.
            </p>
            <button
              onClick={() => setQuickAddOpen(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20"
            >
              + Catat Transaksi Baru
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Waktu (WIB)</th>
                  <th className="px-6 py-3.5">Deskripsi / Merchant</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5">Dompet</th>
                  <th className="px-6 py-3.5">Sumber Catatan</th>
                  <th className="px-6 py-3.5 text-right">Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {recentTransactions.map((tx) => {
                  const wib = formatTanggalWIB(tx.transaction_time);
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {wib.tanggal} {wib.jam}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{tx.notes}</span>
                          {tx.is_ocr && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                              <Receipt className="w-3 h-3" /> OCR Struk
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-800">
                          <span>{tx.category?.emoji || '📝'}</span>
                          <span>{tx.category?.name || 'Umum'}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-600">
                        👛 {tx.wallet?.name || 'BCA'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[11px] text-slate-500">
                        {tx.source.startsWith('telegram') ? (
                          <span className="inline-flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                            <MessageSquare className="w-3 h-3" /> Telegram Bot
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-lg">
                            Web App
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right font-black text-sm">
                        {tx.type === 'expense' ? (
                          <span className="text-rose-600">- {displayAmount(tx.amount)}</span>
                        ) : tx.type === 'income' ? (
                          <span className="text-emerald-600">+ {displayAmount(tx.amount)}</span>
                        ) : (
                          <span className="text-blue-600">⇄ {displayAmount(tx.amount)}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
