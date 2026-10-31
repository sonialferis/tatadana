'use client';

import React, { useState } from 'react';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Bell,
  Copy,
  Edit2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Sparkles,
  X,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { useFinance } from '@/lib/finance-context';
import { formatRupiah } from '@/lib/formatters';

export default function BudgetsPage() {
  const {
    budgets,
    categories,
    setCategoryBudget,
    duplicateBudgetsFromPreviousMonth,
    hideBalance,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [limitInput, setLimitInput] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Overall Budget Calculations
  const totalLimit = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.current_spent, 0);
  const totalRemaining = Math.max(0, totalLimit - totalSpent);
  const overallPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

  // Days left in current month (October has 31 days)
  const today = new Date();
  const daysInMonth = 31;
  const currentDay = today.getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);
  const safeDailyBudget = totalRemaining / daysRemaining;

  // Open Edit/Create Budget Modal
  const openBudgetModal = (categoryId?: string, currentLimit?: number) => {
    const expenseCategories = categories.filter((c) => c.type === 'expense');
    setSelectedCategoryId(categoryId || expenseCategories[0]?.id || 'c-1');
    setLimitInput(currentLimit ? String(currentLimit) : '');
    setModalOpen(true);
  };

  // Submit Budget Update
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLimit = parseInt(limitInput.replace(/\D/g, ''), 10);
    if (!cleanLimit || cleanLimit <= 0) return;

    setCategoryBudget(selectedCategoryId, cleanLimit);
    setFeedbackNotice('Batas anggaran kategori berhasil diperbarui!');
    setModalOpen(false);

    setTimeout(() => setFeedbackNotice(null), 3000);
  };

  // Duplicate Budget from Previous Month
  const handleDuplicateMonth = () => {
    duplicateBudgetsFromPreviousMonth();
    setFeedbackNotice('Semua batas anggaran berhasil disalin dari bulan lalu!');
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  // Count tiers
  const dangerCount = budgets.filter((b) => b.monthly_limit > 0 && (b.current_spent / b.monthly_limit) >= 1).length;
  const warningCount = budgets.filter((b) => b.monthly_limit > 0 && (b.current_spent / b.monthly_limit) >= 0.8 && (b.current_spent / b.monthly_limit) < 1).length;
  const safeCount = budgets.filter((b) => b.monthly_limit > 0 && (b.current_spent / b.monthly_limit) < 0.8).length;

  return (
    <div className="space-y-6">
      {/* 1. HEADER & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Perencanaan Anggaran (Budgeting)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kendali pengeluaran per kategori dengan sistem peringatan visual cerdas 3-tahap (WIB).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Duplicate Month Button */}
          <button
            onClick={handleDuplicateMonth}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm flex items-center gap-2 transition active:scale-95"
            title="Salin seluruh kuota budget dari bulan sebelumnya"
          >
            <Copy className="w-4 h-4 text-slate-500" />
            <span>Salin dari Bulan Lalu</span>
          </button>

          {/* Add/Edit Budget Button */}
          <button
            onClick={() => openBudgetModal()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Atur Limit Kategori</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      {/* 2. OVERALL BUDGET HEALTH BANNER */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              Ringkasan Anggaran Bulan Ini (Oktober 2026)
            </span>
            <div className="flex items-baseline gap-3 mt-1">
              <h2 className="text-3xl font-black text-white tracking-tight">
                {hideBalance ? 'Rp ••••••••' : formatRupiah(totalSpent)}
              </h2>
              <span className="text-xs text-slate-400">
                dari batas {hideBalance ? 'Rp ••••••••' : formatRupiah(totalLimit)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-700">
            <Calendar className="w-4 h-4 text-amber-400" />
            <div className="text-right sm:text-left">
              <span className="text-[10px] text-slate-400 block font-bold">Hari Tersisa</span>
              <span className="text-xs font-black text-white">{daysRemaining} Hari</span>
            </div>
          </div>
        </div>

        {/* Master Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                overallPercentage >= 100
                  ? 'bg-rose-500'
                  : overallPercentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            ></div>
          </div>

          <div className="flex justify-between items-center text-xs font-bold text-slate-300 pt-1">
            <span>{overallPercentage.toFixed(1)}% Anggaran Terpakai</span>
            <span>
              Sisa Kuota: <b className="text-emerald-400">{hideBalance ? 'Rp ••' : formatRupiah(totalRemaining)}</b>
            </span>
          </div>
        </div>

        {/* Safe Daily Spending Rate */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <span className="text-slate-400">
            Batas Pengeluaran Aman Harian: <b className="text-amber-300 font-extrabold">{hideBalance ? 'Rp ••' : `${formatRupiah(Math.round(safeDailyBudget))} / hari`}</b>
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              🟢 {safeCount} Aman
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🟡 {warningCount} Waspada
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              🔴 {dangerCount} Over
            </span>
          </div>
        </div>
      </div>

      {/* 3. TELEGRAM BOT AUTOMATION BANNER */}
      <div className="p-4 bg-orange-50 border border-orange-200 rounded-3xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-extrabold text-slate-900">
              Sistem Peringatan Otomatis Telegram Terintegrasi
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              Bot Telegram akan otomatis mengirim pesan darurat saat kategori mencapai <b>80% (Waspada)</b> dan <b>100% (Over Budget)</b>.
            </p>
          </div>
        </div>
        <span className="text-[11px] bg-emerald-100 text-emerald-800 font-extrabold px-3 py-1 rounded-full border border-emerald-200 flex-shrink-0">
          Aktif 24/7
        </span>
      </div>

      {/* 4. BUDGET CARDS (3-TIER VISUALS) */}
      <div className="grid md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          const pct = b.monthly_limit > 0 ? (b.current_spent / b.monthly_limit) * 100 : 0;
          const remaining = b.monthly_limit - b.current_spent;
          const isDanger = pct >= 100;
          const isWarning = pct >= 80 && pct < 100;
          const isSafe = pct < 80;

          return (
            <div
              key={b.id}
              className={`p-6 rounded-3xl bg-white border transition-all shadow-sm flex flex-col justify-between ${
                isDanger
                  ? 'border-rose-300 ring-2 ring-rose-300/40'
                  : isWarning
                  ? 'border-amber-300 ring-2 ring-amber-300/40'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header: Category & Tier Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                      {b.category?.emoji || '🎯'}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">{b.category?.name}</h3>
                      <span className="text-[10px] text-slate-400 font-medium">Bulan Oktober 2026</span>
                    </div>
                  </div>

                  {/* 3-Tier Badges */}
                  <div>
                    {isDanger && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 flex items-center gap-1 animate-pulse">
                        <AlertTriangle className="w-3 h-3" /> Over Budget ({pct.toFixed(0)}%)
                      </span>
                    )}
                    {isWarning && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Bell className="w-3 h-3" /> Waspada 80% ({pct.toFixed(0)}%)
                      </span>
                    )}
                    {isSafe && (
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Aman ({pct.toFixed(0)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Spent & Limit Info */}
                <div className="space-y-1.5 mt-4">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-500">
                      Terpakai: <b className="text-slate-900">{hideBalance ? 'Rp ••' : formatRupiah(b.current_spent)}</b>
                    </span>
                    <span className="text-slate-700">
                      Batas: {hideBalance ? 'Rp ••' : formatRupiah(b.monthly_limit)}
                    </span>
                  </div>

                  {/* Visual 3-Tier Color Bar */}
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Overspent or Remaining info */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className={`font-bold ${isDanger ? 'text-rose-600' : 'text-slate-600'}`}>
                    {isDanger
                      ? `Melebihi budget ${formatRupiah(Math.abs(remaining))}`
                      : `Sisa kuota: ${formatRupiah(remaining)}`}
                  </span>

                  <button
                    onClick={() => openBudgetModal(b.category_id, b.monthly_limit)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 font-bold transition flex items-center gap-1 text-[11px]"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Ubah Limit</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. ADD / EDIT BUDGET MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-sm text-slate-900">Atur Batas Anggaran Kategori</h3>
              <button onClick={() => setModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pilih Kategori</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                >
                  {categories
                    .filter((c) => c.type === 'expense')
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.emoji} {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Batas Bulanan (IDR)
                </label>
                <input
                  type="number"
                  required
                  min="10000"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  placeholder="Contoh: 1500000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                />
                {limitInput && !isNaN(Number(limitInput)) && (
                  <span className="text-[11px] text-orange-600 font-bold mt-1 block">
                    {formatRupiah(Number(limitInput))}
                  </span>
                )}
              </div>

              {/* Notification reminder toggle */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 block">Notifikasi Telegram 80% &amp; 100%</span>
                  <span className="text-[10px] text-slate-400">Kirim peringatan otomatis ke chat</span>
                </div>
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-600/20 transition"
                >
                  Simpan Batas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
