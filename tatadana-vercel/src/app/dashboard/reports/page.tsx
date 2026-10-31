'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Receipt,
  RotateCcw,
  Tag,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useFinance } from '@/lib/finance-context';
import { formatRupiah, formatTanggalWIB } from '@/lib/formatters';
import { downloadPdfFile, downloadExcelFile } from '@/lib/export';
import { Transaction } from '@/lib/types';

interface ExportLogItem {
  id: string;
  filename: string;
  format: 'pdf' | 'xlsx';
  periodLabel: string;
  createdAtWib: string;
  transactionsSnapshot: Transaction[];
  startDate: string;
  endDate: string;
}

export default function ReportsPage() {
  const { user, transactions, wallets, categories, hideBalance } = useFinance();

  const displayAmount = (amt: number) => {
    return hideBalance ? 'Rp ••••••••' : formatRupiah(amt);
  };

  // Period States
  const [periodType, setPeriodType] = useState<'monthly' | 'yearly' | 'custom'>('monthly');
  const [selectedMonth, setSelectedMonth] = useState('10'); // Oktober
  const [selectedYear, setSelectedYear] = useState('2026');
  const [customStartDate, setCustomStartDate] = useState('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState('2026-10-31');

  // Filter & Search States for Report Table
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');

  // Sorting States
  const [sortField, setSortField] = useState<'date' | 'amount' | 'category' | 'wallet'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Expandable OCR Receipt Rows
  const [expandedReceiptTxId, setExpandedReceiptTxId] = useState<string | null>('tx-3');

  // Export State & Notification
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'xlsx' | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Saved Export History (Part 3: Riwayat export tersimpan, bisa didownload ulang)
  const [exportHistory, setExportHistory] = useState<ExportLogItem[]>([
    {
      id: 'exp-1',
      filename: 'TataDana_Laporan_Okt2026.pdf',
      format: 'pdf',
      periodLabel: '1 Okt 2026 - 31 Okt 2026',
      createdAtWib: '10 Okt 2026, 12:45 WIB',
      transactionsSnapshot: transactions,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    },
    {
      id: 'exp-2',
      filename: 'TataDana_Laporan_Okt2026.xlsx',
      format: 'xlsx',
      periodLabel: '1 Okt 2026 - 31 Okt 2026',
      createdAtWib: '10 Okt 2026, 09:30 WIB',
      transactionsSnapshot: transactions,
      startDate: '2026-10-01',
      endDate: '2026-10-31',
    },
  ]);

  // 1. Filter transactions based on report period
  const periodFilteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.transaction_time);
      if (periodType === 'monthly') {
        return d.getMonth() + 1 === parseInt(selectedMonth, 10) && d.getFullYear() === parseInt(selectedYear, 10);
      }
      if (periodType === 'yearly') {
        return d.getFullYear() === parseInt(selectedYear, 10);
      }
      if (periodType === 'custom') {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return d >= start && d <= end;
      }
      return true;
    });
  }, [transactions, periodType, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // 2. Summary Metrics (Part 3: total pemasukan, total pengeluaran, net cashflow, top 5 kategori)
  const totalIncome = periodFilteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalExpense = periodFilteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const netCashflow = totalIncome - totalExpense;

  // Top 5 Expense Categories (Part 3: top 5 kategori pengeluaran)
  const top5ExpenseCategories = useMemo(() => {
    const map = new Map<string, { category: typeof categories[0]; spent: number }>();
    for (const t of periodFilteredTransactions) {
      if (t.type !== 'expense') continue;
      const cat = categories.find((c) => c.id === t.category_id) || {
        id: t.category_id,
        name: 'Lain-lain',
        emoji: '📝',
        color: '#ea580c',
        type: 'expense' as const,
      };
      const existing = map.get(cat.id) || { category: cat, spent: 0 };
      existing.spent += t.amount;
      map.set(cat.id, existing);
    }

    return Array.from(map.values())
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item.category,
        spent: item.spent,
        share: totalExpense > 0 ? (item.spent / totalExpense) * 100 : 0,
      }));
  }, [periodFilteredTransactions, categories, totalExpense]);

  // 3. Filter for Table
  const tableFilteredTransactions = useMemo(() => {
    return periodFilteredTransactions.filter((t) => {
      // Type
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      // Category
      if (selectedCategory !== 'all' && t.category_id !== selectedCategory) return false;
      // Wallet
      if (selectedWallet !== 'all' && t.wallet_id !== selectedWallet && t.to_wallet_id !== selectedWallet) return false;
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNotes = t.notes?.toLowerCase().includes(q);
        const matchCat = t.category?.name?.toLowerCase().includes(q);
        const matchWallet = t.wallet?.name?.toLowerCase().includes(q);
        const matchAmount = String(t.amount).includes(q);
        const matchReceipt = t.ocr_items?.some((item) => item.name.toLowerCase().includes(q));
        if (!matchNotes && !matchCat && !matchWallet && !matchAmount && !matchReceipt) return false;
      }
      return true;
    });
  }, [periodFilteredTransactions, selectedType, selectedCategory, selectedWallet, searchTerm]);

  // 4. Sort for Table
  const sortedTransactions = useMemo(() => {
    const list = [...tableFilteredTransactions];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = new Date(a.transaction_time).getTime() - new Date(b.transaction_time).getTime();
      } else if (sortField === 'amount') {
        cmp = a.amount - b.amount;
      } else if (sortField === 'category') {
        const catA = a.category?.name || '';
        const catB = b.category?.name || '';
        cmp = catA.localeCompare(catB);
      } else if (sortField === 'wallet') {
        const walA = a.wallet?.name || '';
        const walB = b.wallet?.name || '';
        cmp = walA.localeCompare(walB);
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [tableFilteredTransactions, sortField, sortDirection]);

  // 5. Pagination
  const totalPages = Math.ceil(sortedTransactions.length / pageSize) || 1;
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: 'date' | 'amount' | 'category' | 'wallet') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  // Export Period Labels
  const getPeriodLabel = () => {
    if (periodType === 'monthly') {
      const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${monthNames[parseInt(selectedMonth, 10)]} ${selectedYear}`;
    }
    if (periodType === 'yearly') {
      return `Tahun ${selectedYear}`;
    }
    return `${customStartDate} s/d ${customEndDate}`;
  };

  // Direct PDF Export Handler with history logging
  const handleExportPDF = async (customTxs?: Transaction[], customLabel?: string) => {
    setExportingFormat('pdf');
    try {
      const targetTxs = customTxs || sortedTransactions;
      const label = customLabel || getPeriodLabel();
      const filename = `TataDana_Laporan_${label.replace(/\s+/g, '_')}.pdf`;

      downloadPdfFile(
        targetTxs,
        user.full_name,
        periodType === 'custom' ? customStartDate : `01-${selectedMonth}-${selectedYear}`,
        periodType === 'custom' ? customEndDate : `31-${selectedMonth}-${selectedYear}`,
        filename
      );

      // Record in Export History
      const newLog: ExportLogItem = {
        id: `exp-${Date.now()}`,
        filename,
        format: 'pdf',
        periodLabel: label,
        createdAtWib: formatTanggalWIB().fullFormatted.replace('📅 ', ''),
        transactionsSnapshot: targetTxs,
        startDate: periodType === 'custom' ? customStartDate : `01-${selectedMonth}-${selectedYear}`,
        endDate: periodType === 'custom' ? customEndDate : `31-${selectedMonth}-${selectedYear}`,
      };
      setExportHistory((prev) => [newLog, ...prev]);

      setExportNotice('Laporan PDF TataDana berhasil diunduh dan dicatat di riwayat!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      alert(`Gagal membuat PDF: ${err.message}`);
    } finally {
      setExportingFormat(null);
    }
  };

  // Direct Excel Export Handler with history logging
  const handleExportExcel = async (customTxs?: Transaction[], customLabel?: string) => {
    setExportingFormat('xlsx');
    try {
      const targetTxs = customTxs || sortedTransactions;
      const label = customLabel || getPeriodLabel();
      const filename = `TataDana_Laporan_${label.replace(/\s+/g, '_')}.xlsx`;

      downloadExcelFile(
        targetTxs,
        user.full_name,
        periodType === 'custom' ? customStartDate : `01-${selectedMonth}-${selectedYear}`,
        periodType === 'custom' ? customEndDate : `31-${selectedMonth}-${selectedYear}`,
        filename
      );

      // Record in Export History
      const newLog: ExportLogItem = {
        id: `exp-${Date.now()}`,
        filename,
        format: 'xlsx',
        periodLabel: label,
        createdAtWib: formatTanggalWIB().fullFormatted.replace('📅 ', ''),
        transactionsSnapshot: targetTxs,
        startDate: periodType === 'custom' ? customStartDate : `01-${selectedMonth}-${selectedYear}`,
        endDate: periodType === 'custom' ? customEndDate : `31-${selectedMonth}-${selectedYear}`,
      };
      setExportHistory((prev) => [newLog, ...prev]);

      setExportNotice('Laporan Excel (.xlsx) TataDana berhasil diunduh dan dicatat di riwayat!');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      alert(`Gagal membuat Excel: ${err.message}`);
    } finally {
      setExportingFormat(null);
    }
  };

  const handleResetTableFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedWallet('all');
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & EXPORT ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Laporan Keuangan &amp; Audit Mutasi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-extrabold">
              Supabase Native
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Analisis arus kas mendalam, tabel mutasi sortable, top 5 kategori, dan ekspor instan PDF/Excel (WIB).
          </p>
        </div>

        {/* Action Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportPDF()}
            disabled={exportingFormat !== null}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 shadow-sm flex items-center gap-2 transition disabled:opacity-50 active:scale-95"
          >
            <FileText className="w-4 h-4 text-orange-600" />
            <span>{exportingFormat === 'pdf' ? 'Membuat PDF...' : 'Ekspor PDF'}</span>
          </button>

          <button
            onClick={() => handleExportExcel()}
            disabled={exportingFormat !== null}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 flex items-center gap-2 transition disabled:opacity-50 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{exportingFormat === 'xlsx' ? 'Membuat Excel...' : 'Ekspor Excel'}</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {exportNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* 2. REPORT PERIOD SELECTOR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-extrabold text-slate-900">Periode Laporan:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => { setPeriodType('monthly'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodType === 'monthly' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => { setPeriodType('yearly'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodType === 'yearly' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Tahunan
            </button>
            <button
              onClick={() => { setPeriodType('custom'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg transition ${
                periodType === 'custom' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Custom Range
            </button>
          </div>

          {periodType === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => { setSelectedMonth(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
            >
              <option value="1">Januari</option>
              <option value="2">Februari</option>
              <option value="3">Maret</option>
              <option value="4">April</option>
              <option value="5">Mei</option>
              <option value="6">Juni</option>
              <option value="7">Juli</option>
              <option value="8">Agustus</option>
              <option value="9">September</option>
              <option value="10">Oktober</option>
              <option value="11">November</option>
              <option value="12">Desember</option>
            </select>
          )}

          {periodType !== 'custom' && (
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          )}

          {periodType === 'custom' && (
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
              <span className="text-slate-400">s/d</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. RINGKASAN LAPORAN PER PERIODE (Part 3: total pemasukan, total pengeluaran, net cashflow, top 5 kategori) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pemasukan */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider block">Total Pemasukan</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 mt-2 tracking-tight">
            {hideBalance ? 'Rp ••••••••' : formatRupiah(totalIncome)}
          </h3>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Gaji &amp; pendapatan periode ini
          </span>
        </div>

        {/* Total Pengeluaran */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider block">Total Pengeluaran</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-600 mt-2 tracking-tight">
            {hideBalance ? 'Rp ••••••••' : formatRupiah(totalExpense)}
          </h3>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            Belanja, tagihan, dan operasional
          </span>
        </div>

        {/* Net Cashflow (Surplus/Defisit) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider block">Net Cashflow</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <h3 className={`text-2xl font-black mt-2 tracking-tight ${netCashflow >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
            {hideBalance ? 'Rp ••••••••' : formatRupiah(netCashflow)}
          </h3>
          <span className={`text-[11px] font-bold block mt-1 ${netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netCashflow >= 0 ? 'Surplus Keuangan Positif' : 'Defisit Pengeluaran'}
          </span>
        </div>

        {/* Total Mutasi & Rasio Tabungan */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider block">Rasio Tabungan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-600 mt-2 tracking-tight">
            {totalIncome > 0 ? ((netCashflow / totalIncome) * 100).toFixed(1) : 0}%
          </h3>
          <span className="text-[11px] text-slate-500 font-medium block mt-1">
            {periodFilteredTransactions.length} mutasi tercatat
          </span>
        </div>
      </div>

      {/* 4. TOP 5 KATEGORI PENGELUARAN (Part 3 Requirement) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-black">
              5
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Top 5 Kategori Pengeluaran Terbesar</h3>
              <p className="text-xs text-slate-400">Kategori dengan porsi pengeluaran paling dominan di periode {getPeriodLabel()}</p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-500">
            Total Belanja: {hideBalance ? 'Rp ••••••••' : formatRupiah(totalExpense)}
          </span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {top5ExpenseCategories.length === 0 ? (
            <p className="text-xs text-slate-400 col-span-5 text-center py-4">Belum ada pengeluaran pada periode ini</p>
          ) : (
            top5ExpenseCategories.map((cat) => (
              <div
                key={cat.id}
                className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg">{cat.emoji}</span>
                    <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-extrabold flex items-center justify-center">
                      #{cat.rank}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900 truncate">{cat.name}</h4>
                  <p className="text-xs font-black text-rose-600 mt-1">
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(cat.spent)}
                  </p>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>Porsi</span>
                    <span className="font-bold">{cat.share.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cat.share}%`, backgroundColor: cat.color || '#ea580c' }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 5. TABEL TRANSAKSI LENGKAP DENGAN PAGINATION, SORTABLE, SEARCH & FILTER (Part 3 Requirement) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Top Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-slate-900">Tabel Transaksi Lengkap</h3>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-extrabold">
                  {sortedTransactions.length} Hasil
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar mutasi lengkap dengan sortable kolom &amp; rincian struk multi-item yang dapat di-expand
              </p>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedType !== 'all' || selectedCategory !== 'all' || selectedWallet !== 'all') && (
              <button
                onClick={handleResetTableFilters}
                className="self-start sm:self-center px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                placeholder="Cari catatan, merchant, struk..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Filter Jenis */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value as any); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Jenis Transaksi</option>
                <option value="expense">Pengeluaran Saja</option>
                <option value="income">Pemasukan Saja</option>
                <option value="transfer">Transfer Antar Dompet</option>
              </select>
            </div>

            {/* Filter Kategori */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Wallet */}
            <div>
              <select
                value={selectedWallet}
                onChange={(e) => { setSelectedWallet(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    👛 {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                {/* Sortable: Tanggal */}
                <th
                  onClick={() => handleSort('date')}
                  className="px-6 py-3.5 cursor-pointer hover:text-orange-600 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Tanggal (WIB)</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'date' ? 'text-orange-600' : 'text-slate-400'}`} />
                  </div>
                </th>

                {/* Deskripsi & Catatan */}
                <th className="px-6 py-3.5">Catatan / Deskripsi</th>

                {/* Sortable: Kategori */}
                <th
                  onClick={() => handleSort('category')}
                  className="px-6 py-3.5 cursor-pointer hover:text-orange-600 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Kategori</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'category' ? 'text-orange-600' : 'text-slate-400'}`} />
                  </div>
                </th>

                {/* Sortable: Dompet */}
                <th
                  onClick={() => handleSort('wallet')}
                  className="px-6 py-3.5 cursor-pointer hover:text-orange-600 transition select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Dompet</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'wallet' ? 'text-orange-600' : 'text-slate-400'}`} />
                  </div>
                </th>

                {/* Sumber */}
                <th className="px-6 py-3.5">Sumber</th>

                {/* Sortable: Nominal */}
                <th
                  onClick={() => handleSort('amount')}
                  className="px-6 py-3.5 text-right cursor-pointer hover:text-orange-600 transition select-none"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Nominal</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortField === 'amount' ? 'text-orange-600' : 'text-slate-400'}`} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    Tidak ada transaksi yang cocok dengan kriteria filter pada periode ini.
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const wib = formatTanggalWIB(tx.transaction_time);
                  const isExpanded = expandedReceiptTxId === tx.id;
                  const hasReceiptItems = tx.is_ocr && tx.ocr_items && tx.ocr_items.length > 0;

                  return (
                    <React.Fragment key={tx.id}>
                      <tr className={`hover:bg-slate-50/80 transition ${isExpanded ? 'bg-orange-50/30' : ''}`}>
                        {/* Tanggal */}
                        <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {wib.tanggal} {wib.jam}
                        </td>

                        {/* Catatan / Merchant with Expand Toggle */}
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span>{tx.notes || '-'}</span>
                              {tx.is_ocr && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md font-extrabold flex items-center gap-1">
                                  <Receipt className="w-3 h-3" /> Struk Multi-Item
                                </span>
                              )}
                            </div>

                            {/* Expandable toggle for receipt with items (Part 3 Requirement) */}
                            {hasReceiptItems && (
                              <button
                                type="button"
                                onClick={() => setExpandedReceiptTxId(isExpanded ? null : tx.id)}
                                className="text-[11px] font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 w-fit mt-0.5"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                    <span>Tutup Rincian Struk ({tx.ocr_items?.length} item)</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                    <span>Lihat Rincian Struk ({tx.ocr_items?.length} item) ↓</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-800">
                            <span>{tx.category?.emoji || '📝'}</span>
                            <span>{tx.category?.name || 'Umum'}</span>
                          </span>
                        </td>

                        {/* Dompet */}
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-600">
                          👛 {tx.wallet?.name || 'BCA'}
                        </td>

                        {/* Sumber */}
                        <td className="px-6 py-4 whitespace-nowrap text-[11px] text-slate-500">
                          {tx.source.startsWith('telegram') ? (
                            <span className="inline-flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                              Telegram
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-lg">
                              Web App
                            </span>
                          )}
                        </td>

                        {/* Nominal */}
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

                      {/* EXPANDABLE ROW: Itemized breakdown from receipt photo (Part 3 Requirement) */}
                      {isExpanded && hasReceiptItems && (
                        <tr className="bg-orange-50/50">
                          <td colSpan={6} className="px-8 py-3.5">
                            <div className="bg-white rounded-2xl border border-orange-200/80 p-4 shadow-xs space-y-2">
                              <div className="flex items-center justify-between text-xs font-extrabold text-orange-950 border-b border-slate-100 pb-2">
                                <span className="flex items-center gap-1.5">
                                  <Receipt className="w-4 h-4 text-orange-600" />
                                  <span>Rincian Item Struk Belanjaan (Total 1 Transaksi di Database)</span>
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                  {tx.ocr_items?.length} item terdeteksi via AI Vision
                                </span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                                    <tr>
                                      <th className="py-1.5 text-left">Nama Barang / Item</th>
                                      <th className="py-1.5 text-left">Kategori Item</th>
                                      <th className="py-1.5 text-center">Qty</th>
                                      <th className="py-1.5 text-right">Harga Satuan</th>
                                      <th className="py-1.5 text-right">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {tx.ocr_items?.map((item, i) => (
                                      <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="py-2 font-bold text-slate-900">{item.name}</td>
                                        <td className="py-2 text-slate-600">
                                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                                            <span>{item.category_emoji || '🛍️'}</span>
                                            <span>{item.category_name || 'Belanja'}</span>
                                          </span>
                                        </td>
                                        <td className="py-2 text-center font-mono">{item.qty || 1}</td>
                                        <td className="py-2 text-right font-mono text-slate-500">
                                          {formatRupiah(item.price)}
                                        </td>
                                        <td className="py-2 text-right font-bold text-slate-900 font-mono">
                                          {formatRupiah(item.price * (item.qty || 1))}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Baris per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>
              Menampilkan {sortedTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
              {Math.min(currentPage * pageSize, sortedTransactions.length)} dari {sortedTransactions.length} mutasi
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                onClick={() => setCurrentPage(pg)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                  currentPage === pg
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pg}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition"
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 6. RIWAYAT EXPORT TERSIMPAN (Part 3: bisa didownload ulang tanpa generate ulang) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Riwayat Unduhan Laporan Resmi</h3>
            <p className="text-xs text-slate-400">Berkas yang pernah dibuat tersimpan untuk audit finansial &amp; unduh ulang</p>
          </div>
          <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-xl">
            {exportHistory.length} Berkas Tersimpan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Nama Berkas</th>
                <th className="px-6 py-3.5">Format</th>
                <th className="px-6 py-3.5">Periode Laporan</th>
                <th className="px-6 py-3.5">Tanggal Dibuat (WIB)</th>
                <th className="px-6 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {exportHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                    {item.format === 'pdf' ? (
                      <FileText className="w-4 h-4 text-rose-500 flex-shrink-0" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    )}
                    <span>{item.filename}</span>
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                        item.format === 'pdf'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {item.format.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 font-medium">{item.periodLabel}</td>
                  <td className="px-6 py-3.5 font-mono text-[11px] text-slate-500">{item.createdAtWib}</td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => {
                        if (item.format === 'pdf') {
                          handleExportPDF(item.transactionsSnapshot, item.periodLabel);
                        } else {
                          handleExportExcel(item.transactionsSnapshot, item.periodLabel);
                        }
                      }}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
                    >
                      Unduh Lagi ↓
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
