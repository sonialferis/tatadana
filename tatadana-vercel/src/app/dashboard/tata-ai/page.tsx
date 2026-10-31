'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  TrendingUp,
  Target,
  Wallet as WalletIcon,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import TataAiChat from '@/components/tata-ai-chat';
import { useFinance } from '@/lib/finance-context';
import { formatRupiah } from '@/lib/formatters';

export default function TataAiPage() {
  const { user, wallets, categories, budgets, transactions } = useFinance();

  // Financial calculations
  const totalBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netCashflow = totalIncome - totalExpense;

  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netCashflow / totalIncome) * 100)) : 0;

  // Financial health score
  let healthScore = 75;
  let healthBadge = 'Sehat & Positif';
  let healthColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';

  if (netCashflow < 0) {
    healthScore = 50;
    healthBadge = 'Defisit (Waspada)';
    healthColor = 'text-rose-600 bg-rose-50 border-rose-200';
  } else if (savingsRate >= 30) {
    healthScore = 94;
    healthBadge = 'Sangat Sehat (Optimal)';
    healthColor = 'text-emerald-700 bg-emerald-100 border-emerald-300';
  } else if (savingsRate >= 15) {
    healthScore = 82;
    healthBadge = 'Kondisi Baik';
    healthColor = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  // Critical budgets
  const criticalBudgets = budgets
    .map((b) => {
      const cat = categories.find((c) => c.id === b.category_id);
      const percent = b.monthly_limit > 0 ? (b.current_spent / b.monthly_limit) * 100 : 0;
      return {
        ...b,
        catName: cat?.name || 'Kategori',
        catEmoji: cat?.emoji || '🏷️',
        percent: Math.round(percent),
      };
    })
    .filter((b) => b.percent >= 70)
    .sort((a, b) => b.percent - a.percent);

  return (
    <div className="space-y-6">
      {/* 1. PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              TATA AI BOT
            </h1>
            <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-600" />
              Asisten Keuangan
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Konsultasi finansial interaktif, analisis arus kas real-time, dan pencatatan transaksi langsung via chat.
          </p>
        </div>

        {/* Live sync status pill */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sinkronisasi Otomatis</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Chat Assistant Canvas (7 or 8 cols) */}
        <div className="lg:col-span-8">
          <TataAiChat embedded={false} />
        </div>

        {/* Right Column: Live Context & Financial Health Insights (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          {/* A. Skor Kesehatan Finansial */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-orange-600" />
                Skor Finansial Pribadi
              </span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${healthColor}`}>
                {healthBadge}
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex flex-col items-center justify-center shadow-lg shadow-orange-600/20">
                <span className="text-2xl font-black leading-none">{healthScore}</span>
                <span className="text-[9px] font-bold text-orange-100 uppercase tracking-wider">/ 100</span>
              </div>
              <div className="flex-1 text-xs space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Rasio Tabungan:</span>
                  <span className="font-bold text-slate-900">{savingsRate}%</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Cashflow Bersih:</span>
                  <span className={`font-bold ${netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatRupiah(netCashflow)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
              💡 <b>Catatan Tata AI:</b> {netCashflow >= 0
                ? 'Arus kasmu surplus bulan ini. Alokasikan kelebihan saldo untuk pos tabungan darurat.'
                : 'Pengeluaran melebihi pemasukan bulan ini. Konsultasikan cara memangkas anggaran dengan bot.'}
            </p>
          </div>

          {/* B. Status Saldo Dompet */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <WalletIcon className="w-4 h-4 text-orange-600" />
                Saldo Rekening & Dompet
              </span>
              <Link href="/dashboard/wallets" className="text-[11px] font-bold text-orange-600 hover:underline">
                Kelola →
              </Link>
            </div>

            <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Total Likuiditas</span>
              <span className="text-xl font-black text-amber-400">{formatRupiah(totalBalance)}</span>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {wallets.slice(0, 4).map((w) => (
                <div key={w.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color || '#ea580c' }}></span>
                    <span className="font-bold text-slate-700">{w.name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900">{formatRupiah(w.balance)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* C. Kategori Budget Waspada */}
          {criticalBudgets.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-3xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-amber-800 text-xs font-extrabold">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Peringatan Budget ({criticalBudgets.length} Pos)</span>
              </div>

              <div className="space-y-2.5">
                {criticalBudgets.slice(0, 3).map((b) => (
                  <div key={b.id} className="text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{b.catEmoji} {b.catName}</span>
                      <span className={b.percent >= 100 ? 'text-rose-600' : 'text-amber-700'}>{b.percent}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          b.percent >= 100 ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.min(b.percent, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* D. Panduan Perintah Cepat */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-orange-600" />
              Contoh Pertanyaan ke Tata AI
            </span>
            <div className="space-y-2 text-[11px] text-slate-600">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-mono">
                "Catat beli bakso 25rb pakai GoPay"
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-mono">
                "Bagaimana kondisi keuangan saya bulan ini?"
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-mono">
                "Apakah budget makanan saya masih aman?"
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 font-mono">
                "Beri tips cara berhemat untuk gaji 5 juta"
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
