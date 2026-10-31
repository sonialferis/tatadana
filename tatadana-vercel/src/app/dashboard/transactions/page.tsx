'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Receipt,
  MessageSquare,
  Calendar,
  Wallet,
  ArrowUpDown,
  CheckCircle2,
  X,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  TrendingUp,
  TrendingDown,
  ListFilter,
  Clock,
  Sparkles,
  Layers,
  Tag,
  CalendarDays,
} from 'lucide-react';
import { useFinance } from '@/lib/finance-context';
import { formatRupiah, formatTanggalWIB } from '@/lib/formatters';
import { Transaction, Category, Wallet as WalletType } from '@/lib/types';
import { downloadExcelFile } from '@/lib/export';

// Indonesian Month & Day Constants
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAY_NAMES_FULL = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const DAY_NAMES_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

// Helper to format date key into YYYY-MM-DD in WIB
function getWIBDateKey(dateInput?: string | Date | null): string {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  let year = '', month = '', day = '';
  for (const p of parts) {
    if (p.type === 'year') year = p.value;
    if (p.type === 'month') month = p.value;
    if (p.type === 'day') day = p.value;
  }
  return `${year}-${month}-${day}`;
}

// Compact nominal formatter for calendar day badges
function formatCompactRupiah(amount: number): string {
  if (!amount || amount === 0) return '0';
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}jt`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}rb`;
  }
  return String(amount);
}

// Helper to add or subtract days from YYYY-MM-DD
function addDaysToDateKey(dateKey: string, days: number): string {
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3) return dateKey;
  const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  d.setDate(d.getDate() + days);
  return getWIBDateKey(d);
}

// Full Indonesian date formatter (e.g. "Sabtu, 10 Oktober 2026")
function formatIndonesianDateFull(dateKey: string): string {
  if (!dateKey) return '';
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3) return dateKey;
  const [y, m, d] = parts;
  const dateObj = new Date(y, m - 1, d, 12, 0, 0);
  const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const hari = hariList[dateObj.getDay()];
  return `${hari}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

// Medium Indonesian date formatter (e.g. "10 Okt 2026")
function formatIndonesianDateMedium(dateKey: string): string {
  if (!dateKey) return '';
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3) return dateKey;
  const [y, m, d] = parts;
  return `${d} ${MONTH_NAMES[m - 1].slice(0, 3)} ${y}`;
}

// Get 7 days of the week containing dateKey (Monday = 0, Sunday = 6)
function getWeekInfo(dateKey: string) {
  const parts = dateKey.split('-').map(Number);
  if (parts.length !== 3) {
    return { mondayKey: dateKey, sundayKey: dateKey, days: [] };
  }
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  const day = dateObj.getDay(); // 0 is Sunday, 1 is Monday ...
  const diffToMonday = (day + 6) % 7; // Monday -> 0, Sunday -> 6
  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() - diffToMonday);

  const days: Array<{
    dateKey: string;
    dayNum: number;
    dayName: string;
    dayShort: string;
  }> = [];

  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const key = getWIBDateKey(cur);
    days.push({
      dateKey: key,
      dayNum: cur.getDate(),
      dayName: DAY_NAMES_FULL[i],
      dayShort: DAY_NAMES_SHORT[i],
    });
  }

  return {
    mondayKey: days[0].dateKey,
    sundayKey: days[6].dateKey,
    days,
  };
}

export default function TransactionsPage() {
  const {
    wallets,
    categories,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    hideBalance,
    user,
  } = useFinance();

  // View Mode: 'table' or 'calendar'
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  // Filter States (Table View)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [filterExactDate, setFilterExactDate] = useState<string>('');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Expanded OCR Rows
  const [expandedTxId, setExpandedTxId] = useState<string | null>('tx-3');

  // Bulk Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Form Fields State for Add/Edit
  const [modalTab, setModalTab] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [modalAmount, setModalAmount] = useState('');
  const [modalCategoryId, setModalCategoryId] = useState('c-1');
  const [modalWalletId, setModalWalletId] = useState('w-1');
  const [modalToWalletId, setModalToWalletId] = useState('w-2');
  const [modalNotes, setModalNotes] = useState('');
  const [modalDate, setModalDate] = useState('');

  // Calendar States
  const todayKey = useMemo(() => getWIBDateKey(new Date()), []);
  const [calendarPeriod, setCalendarPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('monthly');
  const [calendarWalletFilter, setCalendarWalletFilter] = useState<string>('all');

  // Daily View States
  const [dailySelectedDate, setDailySelectedDate] = useState<string>('2026-10-10');

  // Weekly View States
  const [weeklyAnchorDate, setWeeklyAnchorDate] = useState<string>('2026-10-10');
  const [weeklySelectedDay, setWeeklySelectedDay] = useState<string>('2026-10-10');

  // Monthly View States
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(9); // 0-indexed: 9 = Oktober
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2026-10-10');

  // Custom Range View States
  const [customStartDate, setCustomStartDate] = useState<string>('2026-10-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-10-31');

  // Filtered transactions for Calendar based on calendarWalletFilter
  const calendarTransactions = useMemo(() => {
    if (calendarWalletFilter === 'all') return transactions;
    return transactions.filter(
      (t) => t.wallet_id === calendarWalletFilter || t.to_wallet_id === calendarWalletFilter
    );
  }, [transactions, calendarWalletFilter]);

  // Selected Wallet Info for badge/chip
  const selectedCalendarWallet = useMemo(() => {
    if (calendarWalletFilter === 'all') return null;
    return wallets.find((w) => w.id === calendarWalletFilter) || null;
  }, [wallets, calendarWalletFilter]);

  // Map calendar transactions by YYYY-MM-DD date key (WIB)
  const transactionsByDate = useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    for (const t of calendarTransactions) {
      const key = getWIBDateKey(t.transaction_time);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    }
    return map;
  }, [calendarTransactions]);

  // --- DAILY VIEW CALCULATIONS ---
  const dailyTransactions = useMemo(() => {
    return transactionsByDate[dailySelectedDate] || [];
  }, [dailySelectedDate, transactionsByDate]);

  const dailyStats = useMemo(() => {
    const inc = dailyTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const exp = dailyTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return {
      income: inc,
      expense: exp,
      net: inc - exp,
      count: dailyTransactions.length,
    };
  }, [dailyTransactions]);

  const handlePrevDay = () => setDailySelectedDate((d) => addDaysToDateKey(d, -1));
  const handleNextDay = () => setDailySelectedDate((d) => addDaysToDateKey(d, 1));
  const handleGoToTodayDaily = () => setDailySelectedDate(todayKey);

  // --- WEEKLY VIEW CALCULATIONS ---
  const currentWeekInfo = useMemo(() => {
    return getWeekInfo(weeklyAnchorDate);
  }, [weeklyAnchorDate]);

  const weeklyBreakdown = useMemo(() => {
    let weekIncome = 0;
    let weekExpense = 0;
    let weekTxCount = 0;
    let peakDayKey = '';
    let peakDayExpense = 0;

    const daysData = currentWeekInfo.days.map((d) => {
      const dayTxs = transactionsByDate[d.dateKey] || [];
      const dayInc = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const dayExp = dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      weekIncome += dayInc;
      weekExpense += dayExp;
      weekTxCount += dayTxs.length;

      if (dayExp > peakDayExpense) {
        peakDayExpense = dayExp;
        peakDayKey = d.dateKey;
      }

      return {
        ...d,
        income: dayInc,
        expense: dayExp,
        count: dayTxs.length,
        transactions: dayTxs,
      };
    });

    return {
      days: daysData,
      totalIncome: weekIncome,
      totalExpense: weekExpense,
      net: weekIncome - weekExpense,
      totalCount: weekTxCount,
      peakDayKey,
      peakDayExpense,
    };
  }, [currentWeekInfo, transactionsByDate]);

  const weeklySelectedDayTransactions = useMemo(() => {
    return transactionsByDate[weeklySelectedDay] || [];
  }, [weeklySelectedDay, transactionsByDate]);

  const weeklySelectedDaySummary = useMemo(() => {
    const inc = weeklySelectedDayTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const exp = weeklySelectedDayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return {
      income: inc,
      expense: exp,
      net: inc - exp,
      count: weeklySelectedDayTransactions.length,
    };
  }, [weeklySelectedDayTransactions]);

  const handlePrevWeek = () => {
    setWeeklyAnchorDate((d) => addDaysToDateKey(d, -7));
    setWeeklySelectedDay((d) => addDaysToDateKey(d, -7));
  };
  const handleNextWeek = () => {
    setWeeklyAnchorDate((d) => addDaysToDateKey(d, 7));
    setWeeklySelectedDay((d) => addDaysToDateKey(d, 7));
  };
  const handleGoToCurrentWeek = () => {
    setWeeklyAnchorDate(todayKey);
    setWeeklySelectedDay(todayKey);
  };

  // --- MONTHLY VIEW CALCULATIONS ---
  const calendarMonthlyStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    let count = 0;
    const dailyExpenses: Record<string, number> = {};

    for (const t of calendarTransactions) {
      const dateKey = getWIBDateKey(t.transaction_time);
      if (!dateKey) continue;
      const [yStr, mStr] = dateKey.split('-');
      if (Number(yStr) === calendarYear && Number(mStr) === calendarMonth + 1) {
        count++;
        if (t.type === 'income') {
          income += t.amount;
        } else if (t.type === 'expense') {
          expense += t.amount;
          dailyExpenses[dateKey] = (dailyExpenses[dateKey] || 0) + t.amount;
        }
      }
    }

    let peakDate = '';
    let peakExpense = 0;
    for (const [dKey, total] of Object.entries(dailyExpenses)) {
      if (total > peakExpense) {
        peakExpense = total;
        peakDate = dKey;
      }
    }

    return {
      income,
      expense,
      net: income - expense,
      count,
      peakDate,
      peakExpense,
    };
  }, [calendarTransactions, calendarYear, calendarMonth]);

  // Calendar Grid Calculation
  const calendarGrid = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const startPadding = (firstDay + 6) % 7; // Monday = 0, Sunday = 6

    const daysInCurrMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();

    const cells: Array<{
      dayNumber: number;
      dateKey: string;
      isCurrentMonth: boolean;
      income: number;
      expense: number;
      count: number;
      categories: Category[];
      transactions: Transaction[];
    }> = [];

    // 1. Previous month padding
    for (let i = startPadding - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const prevM = calendarMonth === 0 ? 11 : calendarMonth - 1;
      const prevY = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
      const mStr = String(prevM + 1).padStart(2, '0');
      const dStr = String(dayNum).padStart(2, '0');
      const dateKey = `${prevY}-${mStr}-${dStr}`;
      const dayTxs = transactionsByDate[dateKey] || [];
      const inc = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const catList = Array.from(new Set(dayTxs.map((t) => t.category).filter(Boolean))) as Category[];

      cells.push({
        dayNumber: dayNum,
        dateKey,
        isCurrentMonth: false,
        income: inc,
        expense: exp,
        count: dayTxs.length,
        categories: catList,
        transactions: dayTxs,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= daysInCurrMonth; d++) {
      const mStr = String(calendarMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateKey = `${calendarYear}-${mStr}-${dStr}`;
      const dayTxs = transactionsByDate[dateKey] || [];
      const inc = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const catList = Array.from(new Set(dayTxs.map((t) => t.category).filter(Boolean))) as Category[];

      cells.push({
        dayNumber: d,
        dateKey,
        isCurrentMonth: true,
        income: inc,
        expense: exp,
        count: dayTxs.length,
        categories: catList,
        transactions: dayTxs,
      });
    }

    // 3. Next month padding
    const remainder = cells.length % 7;
    if (remainder > 0) {
      const needed = 7 - remainder;
      for (let d = 1; d <= needed; d++) {
        const nextM = calendarMonth === 11 ? 0 : calendarMonth + 1;
        const nextY = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
        const mStr = String(nextM + 1).padStart(2, '0');
        const dStr = String(d).padStart(2, '0');
        const dateKey = `${nextY}-${mStr}-${dStr}`;
        const dayTxs = transactionsByDate[dateKey] || [];
        const inc = dayTxs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const exp = dayTxs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
        const catList = Array.from(new Set(dayTxs.map((t) => t.category).filter(Boolean))) as Category[];

        cells.push({
          dayNumber: d,
          dateKey,
          isCurrentMonth: false,
          income: inc,
          expense: exp,
          count: dayTxs.length,
          categories: catList,
          transactions: dayTxs,
        });
      }
    }

    return cells;
  }, [calendarYear, calendarMonth, transactionsByDate]);

  // Selected Date Transactions & Summary
  const selectedDayTransactions = useMemo(() => {
    if (!selectedCalendarDate) return [];
    return transactionsByDate[selectedCalendarDate] || [];
  }, [selectedCalendarDate, transactionsByDate]);

  const selectedDaySummary = useMemo(() => {
    const inc = selectedDayTransactions
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const exp = selectedDayTransactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return {
      income: inc,
      expense: exp,
      net: inc - exp,
      count: selectedDayTransactions.length,
    };
  }, [selectedDayTransactions]);

  const selectedDateFormatted = useMemo(() => {
    return formatIndonesianDateFull(selectedCalendarDate);
  }, [selectedCalendarDate]);

  // Calendar Month Navigators
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((y) => y - 1);
    } else {
      setCalendarMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((y) => y + 1);
    } else {
      setCalendarMonth((m) => m + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    const key = getWIBDateKey(today);
    const [y, m] = key.split('-').map(Number);
    setCalendarYear(y);
    setCalendarMonth(m - 1);
    setSelectedCalendarDate(key);
  };

  // --- CUSTOM RANGE VIEW CALCULATIONS ---
  const customRangeData = useMemo(() => {
    const start = customStartDate || '1970-01-01';
    const end = customEndDate || '2099-12-31';

    let totalInc = 0;
    let totalExp = 0;
    let txCount = 0;
    const dateMap: Record<string, Transaction[]> = {};

    for (const t of calendarTransactions) {
      const key = getWIBDateKey(t.transaction_time);
      if (!key) continue;
      if (key >= start && key <= end) {
        txCount++;
        if (t.type === 'income') totalInc += t.amount;
        if (t.type === 'expense') totalExp += t.amount;
        if (!dateMap[key]) dateMap[key] = [];
        dateMap[key].push(t);
      }
    }

    const sortedDates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a));
    const groups = sortedDates.map((dateKey) => {
      const txs = dateMap[dateKey];
      const inc = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      return {
        dateKey,
        transactions: txs,
        income: inc,
        expense: exp,
        net: inc - exp,
        count: txs.length,
      };
    });

    const d1 = new Date(start).getTime();
    const d2 = new Date(end).getTime();
    const daysDiff = Math.max(1, Math.round(Math.abs(d2 - d1) / (24 * 60 * 60 * 1000)) + 1);
    const avgDailyExpense = Math.round(totalExp / daysDiff);

    return {
      groups,
      totalIncome: totalInc,
      totalExpense: totalExp,
      net: totalInc - totalExp,
      totalCount: txCount,
      daysDiff,
      avgDailyExpense,
    };
  }, [calendarTransactions, customStartDate, customEndDate]);

  // Quick Preset Handlers for Custom Range
  const handleSetCustomPreset = (preset: 'this_month' | 'last_month' | '7days' | '30days' | 'this_year') => {
    const now = new Date();
    if (preset === 'this_month') {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(y, now.getMonth() + 1, 0).getDate();
      setCustomStartDate(`${y}-${m}-01`);
      setCustomEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === 'last_month') {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const lastDay = new Date(y, prevDate.getMonth() + 1, 0).getDate();
      setCustomStartDate(`${y}-${m}-01`);
      setCustomEndDate(`${y}-${m}-${String(lastDay).padStart(2, '0')}`);
    } else if (preset === '7days') {
      setCustomEndDate(todayKey);
      setCustomStartDate(addDaysToDateKey(todayKey, -6));
    } else if (preset === '30days') {
      setCustomEndDate(todayKey);
      setCustomStartDate(addDaysToDateKey(todayKey, -29));
    } else if (preset === 'this_year') {
      const y = now.getFullYear();
      setCustomStartDate(`${y}-01-01`);
      setCustomEndDate(`${y}-12-31`);
    }
  };

  // Filter Logic for Table View
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Exact Date Filter
      if (filterExactDate) {
        const txDateKey = getWIBDateKey(t.transaction_time);
        if (txDateKey !== filterExactDate) return false;
      }
      // Type
      if (selectedType !== 'all' && t.type !== selectedType) return false;
      // Category
      if (selectedCategory !== 'all' && t.category_id !== selectedCategory) return false;
      // Wallet
      if (selectedWallet !== 'all' && t.wallet_id !== selectedWallet && t.to_wallet_id !== selectedWallet) return false;
      // Source
      if (selectedSource !== 'all') {
        if (selectedSource === 'telegram' && !t.source.startsWith('telegram')) return false;
        if (selectedSource === 'ocr' && !t.is_ocr) return false;
        if (selectedSource === 'web' && t.source !== 'web') return false;
      }
      // Date Range
      if (selectedDateRange !== 'all') {
        const txDate = new Date(t.transaction_time);
        const now = new Date();
        if (selectedDateRange === 'today') {
          if (txDate.toDateString() !== now.toDateString()) return false;
        } else if (selectedDateRange === '7days') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (txDate < sevenDaysAgo) return false;
        } else if (selectedDateRange === 'this_month') {
          if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) return false;
        }
      }
      // Search text
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchNotes = t.notes?.toLowerCase().includes(q);
        const matchCat = t.category?.name?.toLowerCase().includes(q);
        const matchWallet = t.wallet?.name?.toLowerCase().includes(q);
        const matchAmount = String(t.amount).includes(q);
        if (!matchNotes && !matchCat && !matchWallet && !matchAmount) return false;
      }
      return true;
    });
  }, [transactions, selectedType, selectedCategory, selectedWallet, selectedSource, selectedDateRange, filterExactDate, searchTerm]);

  // Summaries of filtered
  const totalFilteredIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);

  const totalFilteredExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);

  const netFilteredCashflow = totalFilteredIncome - totalFilteredExpense;

  // Pagination Slicing
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedCategory('all');
    setSelectedWallet('all');
    setSelectedSource('all');
    setSelectedDateRange('all');
    setFilterExactDate('');
    setCurrentPage(1);
  };

  // Open Edit Modal
  const openEditModal = (t: Transaction) => {
    setEditingTx(t);
    setModalTab(t.type);
    setModalAmount(String(t.amount));
    setModalCategoryId(t.category_id || categories[0]?.id || 'c-1');
    setModalWalletId(t.wallet_id);
    setModalToWalletId(t.to_wallet_id || wallets[1]?.id || 'w-2');
    setModalNotes(t.notes || '');
    if (t.transaction_time) {
      const d = new Date(t.transaction_time);
      if (!isNaN(d.getTime())) {
        const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        setModalDate(localIso);
      } else {
        setModalDate('');
      }
    } else {
      setModalDate('');
    }
  };

  // Open Add Modal
  const openAddModal = (presetDateKey?: string) => {
    setEditingTx(null);
    setModalAmount('');
    setModalNotes('');
    setModalCategoryId(categories[0]?.id || 'c-1');
    setModalWalletId(wallets[0]?.id || 'w-1');
    setModalToWalletId(wallets[1]?.id || 'w-2');
    setModalTab('expense');

    const targetDateKey = presetDateKey || selectedCalendarDate || todayKey;
    setModalDate(`${targetDateKey}T12:00`);
    setIsAddModalOpen(true);
  };

  // Handle Save (Add or Edit)
  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(modalAmount.replace(/\D/g, ''), 10);
    if (!cleanAmount || cleanAmount <= 0) return;

    const txTime = modalDate ? new Date(modalDate).toISOString() : new Date().toISOString();

    if (editingTx) {
      updateTransaction(editingTx.id, {
        type: modalTab,
        amount: cleanAmount,
        category_id: modalCategoryId,
        wallet_id: modalWalletId,
        to_wallet_id: modalTab === 'transfer' ? modalToWalletId : null,
        notes: modalNotes.trim(),
        transaction_time: txTime,
      });
      setEditingTx(null);
    } else {
      addTransaction({
        user_id: user.id,
        wallet_id: modalWalletId,
        to_wallet_id: modalTab === 'transfer' ? modalToWalletId : null,
        category_id: modalCategoryId,
        type: modalTab,
        amount: cleanAmount,
        notes: modalNotes.trim() || 'Transaksi Baru',
        transaction_time: txTime,
        source: 'web',
      });
      setIsAddModalOpen(false);
    }

    setModalAmount('');
    setModalNotes('');
  };

  // Bulk Actions
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedTransactions.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`Hapus ${selectedIds.length} transaksi terpilih secara permanen?`)) {
      selectedIds.forEach((id) => deleteTransaction(id));
      setSelectedIds([]);
    }
  };

  const handleBulkExport = () => {
    const selectedTxs = transactions.filter((t) => selectedIds.includes(t.id));
    downloadExcelFile(
      selectedTxs.length ? selectedTxs : filteredTransactions,
      user.full_name,
      '2026-10-01',
      '2026-10-31',
      'TataDana_Transaksi_Terpilih.xlsx'
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Manajemen Transaksi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar mutasi, kalender keuangan harian, audit struk OCR &amp; aksi massal (WIB).
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle (Tabel vs Kalender) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('calendar')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
          </div>

          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange-600/20 flex items-center gap-2 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. CALENDAR VIEW MODE */}
      {/* ============================================================== */}
      {viewMode === 'calendar' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Top Sub-Bar: Period Switcher & Wallet/Account Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Period Switcher (Harian, Mingguan, Bulanan, Kustom) */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl overflow-x-auto">
              <button
                type="button"
                onClick={() => setCalendarPeriod('daily')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  calendarPeriod === 'daily'
                    ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Harian</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarPeriod('weekly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  calendarPeriod === 'weekly'
                    ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Mingguan</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarPeriod('monthly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  calendarPeriod === 'monthly'
                    ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Bulanan</span>
              </button>

              <button
                type="button"
                onClick={() => setCalendarPeriod('custom')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  calendarPeriod === 'custom'
                    ? 'bg-white text-orange-600 shadow-sm border border-slate-200/60'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Kustom Rentang</span>
              </button>
            </div>

            {/* Wallet / Account Filter Selector */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 flex-1 sm:flex-initial">
                <Wallet className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <span className="text-xs font-bold text-slate-500 hidden sm:inline">Dompet/Rekening:</span>
                <select
                  value={calendarWalletFilter}
                  onChange={(e) => setCalendarWalletFilter(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-slate-800 focus:outline-none cursor-pointer pr-2 max-w-[200px] sm:max-w-[260px] truncate"
                >
                  <option value="all">Semua Dompet / Rekening</option>
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.icon || '👛'} {w.name} ({w.type === 'bank' ? 'Bank' : w.type === 'ewallet' ? 'E-Wallet' : 'Tunai'}) • {formatRupiah(w.balance)}
                    </option>
                  ))}
                </select>
              </div>

              {calendarWalletFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setCalendarWalletFilter('all')}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Reset Filter Dompet"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Active Wallet Filter Info Banner (when specific wallet is active) */}
          {selectedCalendarWallet && (
            <div className="flex items-center justify-between gap-3 p-3.5 bg-orange-50/80 border border-orange-200 rounded-2xl text-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm"
                  style={{
                    backgroundColor: `${selectedCalendarWallet.color || '#ea580c'}20`,
                    color: selectedCalendarWallet.color || '#ea580c',
                  }}
                >
                  {selectedCalendarWallet.icon || '👛'}
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 block">
                    Menampilkan data transaksi untuk: {selectedCalendarWallet.name}
                  </span>
                  <span className="text-[11px] text-slate-600">
                    Tipe: <b className="capitalize">{selectedCalendarWallet.type}</b> • Saldo Saat Ini:{' '}
                    <b className="text-orange-700">
                      {hideBalance ? 'Rp ••••••••' : formatRupiah(selectedCalendarWallet.balance)}
                    </b>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCalendarWalletFilter('all')}
                className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl font-bold text-[11px] transition shadow-sm active:scale-95"
              >
                Lihat Semua Dompet
              </button>
            </div>
          )}

          {/* ========================================================== */}
          {/* A. VIEW HARIAN (DAILY VIEW) */}
          {/* ========================================================== */}
          {calendarPeriod === 'daily' && (
            <div className="space-y-6">
              {/* Daily KPI Summary Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Pemasukan Hari Ini
                  </span>
                  <p className="text-xl font-black text-emerald-700 mt-1">
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(dailyStats.income)}
                  </p>
                </div>

                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    Pengeluaran Hari Ini
                  </span>
                  <p className="text-xl font-black text-rose-600 mt-1">
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(dailyStats.expense)}
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Arus Kas Bersih
                  </span>
                  <p
                    className={`text-xl font-black mt-1 ${
                      dailyStats.net >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(dailyStats.net)}
                  </p>
                </div>

                <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">
                    Total Mutasi
                  </span>
                  <p className="text-xl font-black text-orange-950 mt-1">
                    {dailyStats.count} <span className="text-xs font-bold text-orange-700">Transaksi</span>
                  </p>
                </div>
              </div>

              {/* Daily Navigator & Transactions List */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-600">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900">
                        {formatIndonesianDateFull(dailySelectedDate)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Navigasi mutasi harian dan kelola pencatatan keuangan per tanggal.
                      </p>
                    </div>
                  </div>

                  {/* Daily Nav Controls */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={handleGoToTodayDaily}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition"
                    >
                      Hari Ini
                    </button>

                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={handlePrevDay}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                        title="Hari Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextDay}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                        title="Hari Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    <input
                      type="date"
                      value={dailySelectedDate}
                      onChange={(e) => e.target.value && setDailySelectedDate(e.target.value)}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500 cursor-pointer"
                    />

                    <button
                      type="button"
                      onClick={() => openAddModal(dailySelectedDate)}
                      className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Catat di Hari Ini</span>
                    </button>
                  </div>
                </div>

                {/* Daily Transaction Cards */}
                {dailyTransactions.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                    <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">
                        Tidak ada transaksi pada tanggal ini
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Belum ada mutasi tercatat pada tanggal {formatIndonesianDateFull(dailySelectedDate)}.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAddModal(dailySelectedDate)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 inline-flex items-center gap-2 transition active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Catat Transaksi Sekarang</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                      <span>Daftar Transaksi ({dailyTransactions.length} item)</span>
                      <span>Waktu Indonesia Barat (WIB)</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {dailyTransactions.map((t) => (
                        <div
                          key={t.id}
                          className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start justify-between gap-3 hover:border-orange-300 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
                              style={{
                                backgroundColor: `${t.category?.color || '#ea580c'}15`,
                                color: t.category?.color || '#ea580c',
                              }}
                            >
                              {t.category?.emoji || '💼'}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900">
                                  {t.notes}
                                </span>
                                {t.is_ocr && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
                                    Struk OCR
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span>{t.category?.name || 'Kategori'}</span>
                                <span>•</span>
                                <span>👛 {t.wallet?.name || 'Dompet'}</span>
                                <span>•</span>
                                <span>{t.transaction_time?.slice(11, 16)} WIB</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right space-y-1 flex-shrink-0">
                            <div
                              className={`font-black text-sm ${
                                t.type === 'expense'
                                  ? 'text-rose-600'
                                  : t.type === 'income'
                                  ? 'text-emerald-600'
                                  : 'text-blue-600'
                              }`}
                            >
                              {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : '⇄'}{' '}
                              {hideBalance ? 'Rp ••••••••' : formatRupiah(t.amount)}
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(t)}
                                className="p-1 text-slate-400 hover:text-orange-600 transition"
                                title="Ubah Transaksi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingTxId(t.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* B. VIEW MINGGUAN (WEEKLY VIEW) */}
          {/* ========================================================== */}
          {calendarPeriod === 'weekly' && (
            <div className="space-y-6">
              {/* Weekly KPI Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Pemasukan Minggu Ini
                  </span>
                  <p className="text-xl font-black text-emerald-700 mt-1">
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(weeklyBreakdown.totalIncome)}
                  </p>
                </div>

                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    Pengeluaran Minggu Ini
                  </span>
                  <p className="text-xl font-black text-rose-600 mt-1">
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(weeklyBreakdown.totalExpense)}
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Arus Kas Bersih
                  </span>
                  <p
                    className={`text-xl font-black mt-1 ${
                      weeklyBreakdown.net >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(weeklyBreakdown.net)}
                  </p>
                </div>

                <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">
                    Hari Terboros
                  </span>
                  <p className="text-sm font-extrabold text-orange-950 mt-1 truncate">
                    {weeklyBreakdown.peakDayKey ? (
                      <>
                        {formatIndonesianDateMedium(weeklyBreakdown.peakDayKey)}
                        <span className="text-xs font-bold text-rose-600 ml-1.5">
                          ({formatRupiah(weeklyBreakdown.peakDayExpense)})
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Belum ada pengeluaran</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Weekly Header & 7-Day Card Grid */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-600">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900">
                        {formatIndonesianDateMedium(currentWeekInfo.mondayKey)} – {formatIndonesianDateMedium(currentWeekInfo.sundayKey)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Pilih hari untuk melihat mutasi dan proporsi pengeluaran selama satu minggu.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={handleGoToCurrentWeek}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition"
                    >
                      Minggu Ini
                    </button>

                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={handlePrevWeek}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                        title="Minggu Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextWeek}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                        title="Minggu Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 7-Day Interactive Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {weeklyBreakdown.days.map((day) => {
                    const isSelected = day.dateKey === weeklySelectedDay;
                    const isToday = day.dateKey === todayKey;
                    const expPercent =
                      weeklyBreakdown.totalExpense > 0
                        ? Math.min(100, Math.round((day.expense / weeklyBreakdown.totalExpense) * 100))
                        : 0;

                    return (
                      <div
                        key={day.dateKey}
                        onClick={() => setWeeklySelectedDay(day.dateKey)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between text-left select-none relative group ${
                          isSelected
                            ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-50/40 shadow-sm'
                            : isToday
                            ? 'border-orange-400 bg-orange-50/15 hover:border-orange-500'
                            : 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">
                              {day.dayShort}
                            </span>
                            {isToday && (
                              <span className="text-[9px] bg-orange-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                                Hari Ini
                              </span>
                            )}
                          </div>

                          <div className="text-base font-black text-slate-900 mb-2">
                            {day.dayNum}{' '}
                            <span className="text-xs font-bold text-slate-400">
                              {MONTH_NAMES[Number(day.dateKey.split('-')[1]) - 1].slice(0, 3)}
                            </span>
                          </div>

                          <div className="space-y-1 mb-2">
                            {day.income > 0 && (
                              <div className="text-[10px] font-black text-emerald-700 bg-emerald-50/90 border border-emerald-200/60 px-1.5 py-0.5 rounded truncate">
                                +Rp {formatCompactRupiah(day.income)}
                              </div>
                            )}
                            {day.expense > 0 && (
                              <div className="text-[10px] font-black text-rose-700 bg-rose-50/90 border border-rose-200/60 px-1.5 py-0.5 rounded truncate">
                                -Rp {formatCompactRupiah(day.expense)}
                              </div>
                            )}
                            {day.income === 0 && day.expense === 0 && (
                              <div className="text-[10px] font-bold text-slate-400 py-0.5">
                                Belum ada mutasi
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Weekly proportion bar */}
                        <div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-orange-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${expPercent}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold mt-1">
                            <span>{day.count} tx</span>
                            <span>{expPercent}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Day Drawer in Weekly View */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                        <h4 className="font-extrabold text-sm text-slate-900">
                          Rincian Mutasi: {formatIndonesianDateFull(weeklySelectedDay)}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="text-emerald-700 font-bold">
                          Masuk: +{hideBalance ? 'Rp ••••••••' : formatRupiah(weeklySelectedDaySummary.income)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-600 font-bold">
                          Keluar: -{hideBalance ? 'Rp ••••••••' : formatRupiah(weeklySelectedDaySummary.expense)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-bold">
                          Net:{' '}
                          <b className={weeklySelectedDaySummary.net >= 0 ? 'text-slate-900' : 'text-rose-600'}>
                            {hideBalance ? 'Rp ••••••••' : formatRupiah(weeklySelectedDaySummary.net)}
                          </b>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterExactDate(weeklySelectedDay);
                          setViewMode('table');
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                      >
                        <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                        <span>Filter di Tabel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openAddModal(weeklySelectedDay)}
                        className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Catat di Hari Ini</span>
                      </button>
                    </div>
                  </div>

                  {weeklySelectedDayTransactions.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                      <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-extrabold text-slate-700">
                        Tidak ada transaksi pada tanggal ini
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Klik tombol Tambah Transaksi untuk mencatat pengeluaran atau pemasukan baru.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {weeklySelectedDayTransactions.map((t) => (
                        <div
                          key={t.id}
                          className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start justify-between gap-3 hover:border-orange-300 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
                              style={{
                                backgroundColor: `${t.category?.color || '#ea580c'}15`,
                                color: t.category?.color || '#ea580c',
                              }}
                            >
                              {t.category?.emoji || '💼'}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900">
                                  {t.notes}
                                </span>
                                {t.is_ocr && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
                                    Struk OCR
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span>{t.category?.name || 'Kategori'}</span>
                                <span>•</span>
                                <span>👛 {t.wallet?.name || 'Dompet'}</span>
                                <span>•</span>
                                <span>{t.transaction_time?.slice(11, 16)} WIB</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right space-y-1">
                            <div
                              className={`font-black text-sm ${
                                t.type === 'expense'
                                  ? 'text-rose-600'
                                  : t.type === 'income'
                                  ? 'text-emerald-600'
                                  : 'text-blue-600'
                              }`}
                            >
                              {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : '⇄'}{' '}
                              {hideBalance ? 'Rp ••••••••' : formatRupiah(t.amount)}
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(t)}
                                className="p-1 text-slate-400 hover:text-orange-600 transition"
                                title="Ubah Transaksi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingTxId(t.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* C. VIEW BULANAN (MONTHLY GRID VIEW) */}
          {/* ========================================================== */}
          {calendarPeriod === 'monthly' && (
            <div className="space-y-6">
              {/* Monthly Financial Stats Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Pemasukan ({MONTH_NAMES[calendarMonth]} {calendarYear})
                  </span>
                  <p className="text-xl font-black text-emerald-700 mt-1">
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(calendarMonthlyStats.income)}
                  </p>
                </div>

                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    Pengeluaran ({MONTH_NAMES[calendarMonth]} {calendarYear})
                  </span>
                  <p className="text-xl font-black text-rose-600 mt-1">
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(calendarMonthlyStats.expense)}
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Arus Kas Bersih
                  </span>
                  <p
                    className={`text-xl font-black mt-1 ${
                      calendarMonthlyStats.net >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(calendarMonthlyStats.net)}
                  </p>
                </div>

                <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">
                    Hari Terboros
                  </span>
                  <p className="text-base font-extrabold text-orange-950 mt-1 truncate">
                    {calendarMonthlyStats.peakDate ? (
                      <>
                        {calendarMonthlyStats.peakDate.slice(8, 10)} {MONTH_NAMES[calendarMonth].slice(0, 3)}
                        <span className="text-xs font-bold text-rose-600 ml-1.5">
                          ({formatRupiah(calendarMonthlyStats.peakExpense)})
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">Belum ada pengeluaran</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Calendar Card & Grid */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-6">
                {/* Calendar Controls & Navigation Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-600">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                        <span>{MONTH_NAMES[calendarMonth]}</span>
                        <span className="text-orange-600">{calendarYear}</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Klik pada tanggal untuk melihat rincian mutasi hari tersebut.
                      </p>
                    </div>
                  </div>

                  {/* Month Switcher Controls */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                      type="button"
                      onClick={handleGoToToday}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold rounded-xl transition"
                    >
                      Hari Ini
                    </button>

                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl p-0.5">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                        title="Bulan Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition"
                        title="Bulan Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Month Dropdown */}
                    <select
                      value={calendarMonth}
                      onChange={(e) => setCalendarMonth(Number(e.target.value))}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                    >
                      {MONTH_NAMES.map((mName, idx) => (
                        <option key={idx} value={idx}>
                          {mName}
                        </option>
                      ))}
                    </select>

                    {/* Quick Year Dropdown */}
                    <select
                      value={calendarYear}
                      onChange={(e) => setCalendarYear(Number(e.target.value))}
                      className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                      <option value={2027}>2027</option>
                    </select>
                  </div>
                </div>

                {/* 7-DAY HEADERS */}
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
                  {DAY_NAMES_FULL.map((dName, idx) => (
                    <div
                      key={idx}
                      className={`py-2 text-[11px] font-extrabold uppercase tracking-wider rounded-xl ${
                        idx >= 5 ? 'text-rose-500 bg-rose-50/40' : 'text-slate-500 bg-slate-50/70'
                      }`}
                    >
                      <span className="hidden sm:inline">{dName}</span>
                      <span className="sm:hidden">{DAY_NAMES_SHORT[idx]}</span>
                    </div>
                  ))}
                </div>

                {/* 7-COLUMN CALENDAR GRID */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                  {calendarGrid.map((cell, idx) => {
                    const isSelected = cell.dateKey === selectedCalendarDate;
                    const isToday = cell.dateKey === todayKey;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedCalendarDate(cell.dateKey)}
                        className={`min-h-[80px] sm:min-h-[105px] p-2 sm:p-2.5 rounded-2xl border transition-all duration-150 cursor-pointer flex flex-col justify-between text-left select-none relative group ${
                          isSelected
                            ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-50/40 shadow-md'
                            : isToday
                            ? 'border-orange-400 bg-orange-50/15 hover:border-orange-500'
                            : cell.isCurrentMonth
                            ? 'bg-white border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70 hover:shadow-sm'
                            : 'bg-slate-50/40 border-slate-100 text-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {/* Top Row: Date Number & Badges */}
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-black inline-flex items-center justify-center ${
                              isToday
                                ? 'w-6 h-6 rounded-full bg-orange-600 text-white shadow-sm'
                                : isSelected
                                ? 'text-orange-600 font-black'
                                : cell.isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-400 opacity-60'
                            }`}
                          >
                            {cell.dayNumber}
                          </span>

                          {/* Transaction Count indicator */}
                          {cell.count > 0 && (
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ${
                                isSelected
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                              }`}
                            >
                              {cell.count}
                            </span>
                          )}
                        </div>

                        {/* Middle: Financial Amount Badges */}
                        <div className="space-y-1 my-1">
                          {cell.income > 0 && (
                            <div className="text-[10px] font-black text-emerald-700 bg-emerald-50/90 border border-emerald-200/60 px-1.5 py-0.5 rounded-md truncate">
                              +Rp {formatCompactRupiah(cell.income)}
                            </div>
                          )}
                          {cell.expense > 0 && (
                            <div className="text-[10px] font-black text-rose-700 bg-rose-50/90 border border-rose-200/60 px-1.5 py-0.5 rounded-md truncate">
                              -Rp {formatCompactRupiah(cell.expense)}
                            </div>
                          )}
                        </div>

                        {/* Bottom: Emojis snippet */}
                        <div className="flex items-center gap-0.5 h-4 overflow-hidden">
                          {cell.categories.slice(0, 3).map((c, cIdx) => (
                            <span key={cIdx} className="text-[11px] leading-none" title={c.name}>
                              {c.emoji}
                            </span>
                          ))}
                          {cell.categories.length > 3 && (
                            <span className="text-[9px] text-slate-400 font-bold">
                              +{cell.categories.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SELECTED DAY TRANSACTION DETAIL DRAWER */}
                <div className="border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                        <h4 className="font-extrabold text-sm text-slate-900">
                          Rincian Mutasi: {selectedDateFormatted}
                        </h4>
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="text-emerald-700 font-bold">
                          Masuk: +{hideBalance ? 'Rp ••••••••' : formatRupiah(selectedDaySummary.income)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-600 font-bold">
                          Keluar: -{hideBalance ? 'Rp ••••••••' : formatRupiah(selectedDaySummary.expense)}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600 font-bold">
                          Net:{' '}
                          <b className={selectedDaySummary.net >= 0 ? 'text-slate-900' : 'text-rose-600'}>
                            {hideBalance ? 'Rp ••••••••' : formatRupiah(selectedDaySummary.net)}
                          </b>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFilterExactDate(selectedCalendarDate);
                          setViewMode('table');
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                      >
                        <ListFilter className="w-3.5 h-3.5 text-slate-500" />
                        <span>Filter di Tabel</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => openAddModal(selectedCalendarDate)}
                        className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Catat di Tanggal Ini</span>
                      </button>
                    </div>
                  </div>

                  {/* Transactions List on Selected Date */}
                  {selectedDayTransactions.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl space-y-2">
                      <CalendarDays className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-extrabold text-slate-700">
                        Tidak ada transaksi pada tanggal ini
                      </p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Kirim chat ke bot Telegram <b>@ituson_bot</b> atau klik tombol Tambah Transaksi untuk mencatat pengeluaran/pemasukan baru.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedDayTransactions.map((t) => (
                        <div
                          key={t.id}
                          className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start justify-between gap-3 hover:border-orange-300 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
                              style={{
                                backgroundColor: `${t.category?.color || '#ea580c'}15`,
                                color: t.category?.color || '#ea580c',
                              }}
                            >
                              {t.category?.emoji || '💼'}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900">
                                  {t.notes}
                                </span>
                                {t.is_ocr && (
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
                                    Struk OCR
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span>{t.category?.name || 'Kategori'}</span>
                                <span>•</span>
                                <span>👛 {t.wallet?.name || 'Dompet'}</span>
                                <span>•</span>
                                <span>{t.transaction_time?.slice(11, 16)} WIB</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right space-y-1">
                            <div
                              className={`font-black text-sm ${
                                t.type === 'expense'
                                  ? 'text-rose-600'
                                  : t.type === 'income'
                                  ? 'text-emerald-600'
                                  : 'text-blue-600'
                              }`}
                            >
                              {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : '⇄'}{' '}
                              {hideBalance ? 'Rp ••••••••' : formatRupiah(t.amount)}
                            </div>
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditModal(t)}
                                className="p-1 text-slate-400 hover:text-orange-600 transition"
                                title="Ubah Transaksi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingTxId(t.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================== */}
          {/* D. VIEW KUSTOM RENTANG (CUSTOM DATE RANGE VIEW) */}
          {/* ========================================================== */}
          {calendarPeriod === 'custom' && (
            <div className="space-y-6">
              {/* Custom Range KPI Banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Pemasukan Periode
                  </span>
                  <p className="text-xl font-black text-emerald-700 mt-1">
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(customRangeData.totalIncome)}
                  </p>
                </div>

                <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                    Pengeluaran Periode
                  </span>
                  <p className="text-xl font-black text-rose-600 mt-1">
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(customRangeData.totalExpense)}
                  </p>
                </div>

                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Arus Kas Bersih
                  </span>
                  <p
                    className={`text-xl font-black mt-1 ${
                      customRangeData.net >= 0 ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(customRangeData.net)}
                  </p>
                </div>

                <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl shadow-sm">
                  <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wider block">
                    Rata-rata Pengeluaran / Hari
                  </span>
                  <p className="text-base font-extrabold text-orange-950 mt-1">
                    {hideBalance ? 'Rp ••••••••' : formatRupiah(customRangeData.avgDailyExpense)}
                    <span className="text-xs font-bold text-slate-400 ml-1">/ hari</span>
                  </p>
                </div>
              </div>

              {/* Range Filters & Grouped Transactions */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-xl text-orange-600">
                      <Filter className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-900">
                        Rentang: {formatIndonesianDateMedium(customStartDate)} – {formatIndonesianDateMedium(customEndDate)}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Total {customRangeData.totalCount} transaksi dalam rentang {customRangeData.daysDiff} hari.
                      </p>
                    </div>
                  </div>

                  {/* Range Inputs & Presets */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                      <span className="text-slate-400">Dari:</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold">
                      <span className="text-slate-400">Sampai:</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="bg-transparent text-slate-800 focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Presets Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-slate-400 whitespace-nowrap">Pilihan Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleSetCustomPreset('this_month')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg whitespace-nowrap transition"
                  >
                    Bulan Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetCustomPreset('7days')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg whitespace-nowrap transition"
                  >
                    7 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetCustomPreset('30days')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg whitespace-nowrap transition"
                  >
                    30 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetCustomPreset('last_month')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg whitespace-nowrap transition"
                  >
                    Bulan Lalu
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetCustomPreset('this_year')}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg whitespace-nowrap transition"
                  >
                    Tahun 2026
                  </button>
                </div>

                {/* Grouped Date Results */}
                {customRangeData.groups.length === 0 ? (
                  <div className="p-12 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                    <Filter className="w-10 h-10 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">
                        Tidak ada transaksi dalam rentang tanggal ini
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Coba sesuaikan tanggal awal dan akhir atau klik pilihan cepat di atas.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSetCustomPreset('this_month')}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 inline-flex items-center gap-2 transition active:scale-95"
                    >
                      <span>Kembalikan ke Bulan Ini</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {customRangeData.groups.map((group) => (
                      <div key={group.dateKey} className="space-y-3">
                        {/* Group Date Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold">
                          <div className="flex items-center gap-2 text-slate-900">
                            <CalendarDays className="w-4 h-4 text-orange-600" />
                            <span className="font-extrabold">{formatIndonesianDateFull(group.dateKey)}</span>
                            <span className="text-slate-400 font-normal">({group.count} transaksi)</span>
                          </div>

                          <div className="flex items-center gap-3">
                            {group.income > 0 && (
                              <span className="text-emerald-700 font-bold">
                                +{hideBalance ? 'Rp ••••••••' : formatRupiah(group.income)}
                              </span>
                            )}
                            {group.expense > 0 && (
                              <span className="text-rose-600 font-bold">
                                -{hideBalance ? 'Rp ••••••••' : formatRupiah(group.expense)}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => openAddModal(group.dateKey)}
                              className="p-1 text-orange-600 hover:bg-orange-100/60 rounded-md transition"
                              title="Tambah Transaksi pada Tanggal Ini"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Transactions in Date Group */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-2 sm:pl-3">
                          {group.transactions.map((t) => (
                            <div
                              key={t.id}
                              className="p-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-start justify-between gap-3 hover:border-orange-300 transition"
                            >
                              <div className="flex items-start gap-2.5">
                                <div
                                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 shadow-sm"
                                  style={{
                                    backgroundColor: `${t.category?.color || '#ea580c'}15`,
                                    color: t.category?.color || '#ea580c',
                                  }}
                                >
                                  {t.category?.emoji || '💼'}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-xs text-slate-900">
                                      {t.notes}
                                    </span>
                                    {t.is_ocr && (
                                      <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full font-bold">
                                        Struk OCR
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                    <span>{t.category?.name || 'Kategori'}</span>
                                    <span>•</span>
                                    <span>👛 {t.wallet?.name || 'Dompet'}</span>
                                    <span>•</span>
                                    <span>{t.transaction_time?.slice(11, 16)} WIB</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right space-y-1 flex-shrink-0">
                                <div
                                  className={`font-black text-xs ${
                                    t.type === 'expense'
                                      ? 'text-rose-600'
                                      : t.type === 'income'
                                      ? 'text-emerald-600'
                                      : 'text-blue-600'
                                  }`}
                                >
                                  {t.type === 'expense' ? '-' : t.type === 'income' ? '+' : '⇄'}{' '}
                                  {hideBalance ? 'Rp ••••••••' : formatRupiah(t.amount)}
                                </div>
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => openEditModal(t)}
                                    className="p-1 text-slate-400 hover:text-orange-600 transition"
                                    title="Ubah Transaksi"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeletingTxId(t.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 transition"
                                    title="Hapus Transaksi"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TABLE VIEW MODE */}
      {/* ============================================================== */}
      {viewMode === 'table' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Summary Totals Banner (Filtered) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Transaksi Terfilter
              </span>
              <p className="text-xl font-black text-slate-900 mt-1">
                {filteredTransactions.length} <span className="text-xs font-normal text-slate-500">item</span>
              </p>
            </div>

            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Total Pemasukan
              </span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {hideBalance ? 'Rp ••••••••' : formatRupiah(totalFilteredIncome)}
              </p>
            </div>

            <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                Total Pengeluaran
              </span>
              <p className="text-xl font-black text-rose-600 mt-1">
                {hideBalance ? 'Rp ••••••••' : formatRupiah(totalFilteredExpense)}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl shadow-sm">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                Net Kas Terfilter
              </span>
              <p className={`text-xl font-black mt-1 ${netFilteredCashflow >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {hideBalance ? 'Rp ••••••••' : formatRupiah(netFilteredCashflow)}
              </p>
            </div>
          </div>

          {/* Multi-Filter & Search Toolbar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari transaksi berdasarkan catatan, merchant, kategori, nominal..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 transition"
              />
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {/* Filter Type */}
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Tipe</option>
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
                <option value="transfer">Transfer</option>
              </select>

              {/* Filter Category */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.emoji} {c.name}
                  </option>
                ))}
              </select>

              {/* Filter Wallet */}
              <select
                value={selectedWallet}
                onChange={(e) => {
                  setSelectedWallet(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    👛 {w.name}
                  </option>
                ))}
              </select>

              {/* Filter Date Range Preset */}
              <select
                value={selectedDateRange}
                onChange={(e) => {
                  setSelectedDateRange(e.target.value);
                  setFilterExactDate('');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Rentang</option>
                <option value="today">Hari Ini</option>
                <option value="7days">7 Hari Terakhir</option>
                <option value="this_month">Bulan Ini (Oktober)</option>
              </select>

              {/* Filter Source */}
              <select
                value={selectedSource}
                onChange={(e) => {
                  setSelectedSource(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
              >
                <option value="all">Semua Sumber</option>
                <option value="telegram">Telegram Bot</option>
                <option value="ocr">Scan Struk (OCR)</option>
                <option value="web">Web App</option>
              </select>

              {/* Filter Exact Date from Calendar */}
              <input
                type="date"
                value={filterExactDate}
                onChange={(e) => {
                  setFilterExactDate(e.target.value);
                  setSelectedDateRange('all');
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-orange-500"
                title="Pilih tanggal spesifik dari kalender"
              />
            </div>

            {/* Active Filter Chips & Reset */}
            {(searchTerm ||
              selectedType !== 'all' ||
              selectedCategory !== 'all' ||
              selectedWallet !== 'all' ||
              selectedSource !== 'all' ||
              selectedDateRange !== 'all' ||
              filterExactDate) && (
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Filter aktif:</span>
                  {filterExactDate && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-lg text-[10px] font-bold">
                      📅 Tanggal: {filterExactDate}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 transition"
                >
                  Reset Semua Filter ✕
                </button>
              </div>
            )}
          </div>

          {/* Bulk Actions Floating Bar */}
          {selectedIds.length > 0 && (
            <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2 pl-2">
                <span className="text-xs font-bold">{selectedIds.length} Transaksi Terpilih</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkExport}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Ekspor Terpilih</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Terpilih</span>
                </button>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase tracking-wider text-[10px] border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3.5 w-10 text-center">
                      <input
                        type="checkbox"
                        onChange={handleSelectAll}
                        checked={
                          paginatedTransactions.length > 0 &&
                          paginatedTransactions.every((t) => selectedIds.includes(t.id))
                        }
                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                      />
                    </th>
                    <th className="px-4 py-3.5 w-8"></th>
                    <th className="px-5 py-3.5">Tanggal (WIB)</th>
                    <th className="px-5 py-3.5">Kategori</th>
                    <th className="px-5 py-3.5">Catatan / Keterangan</th>
                    <th className="px-5 py-3.5">Dompet</th>
                    <th className="px-5 py-3.5">Sumber</th>
                    <th className="px-5 py-3.5 text-right">Nominal</th>
                    <th className="px-5 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginatedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-extrabold text-sm text-slate-600">
                          Tidak ada transaksi yang cocok dengan filter
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Coba atur ulang kata kunci pencarian atau reset filter tanggal.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedTransactions.map((t) => {
                      const isExpanded = expandedTxId === t.id;
                      const dateObj = formatTanggalWIB(t.transaction_time);

                      return (
                        <React.Fragment key={t.id}>
                          <tr className="hover:bg-slate-50/80 transition">
                            <td className="px-4 py-3.5 text-center">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(t.id)}
                                onChange={() => handleToggleSelect(t.id)}
                                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                              />
                            </td>

                            {/* OCR Accordion Trigger Button */}
                            <td className="px-4 py-3.5 text-center">
                              {t.is_ocr ? (
                                <button
                                  onClick={() => setExpandedTxId(isExpanded ? null : t.id)}
                                  className="p-1 rounded-md text-orange-600 hover:bg-orange-50 transition"
                                  title="Lihat Rincian Item Struk"
                                >
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4" />
                                  )}
                                </button>
                              ) : (
                                <span className="w-4 h-4 block" />
                              )}
                            </td>

                            {/* Date */}
                            <td className="px-5 py-3.5 whitespace-nowrap">
                              <span className="font-bold text-slate-900 block">{dateObj.tanggal}</span>
                              <span className="text-[10px] text-slate-400">
                                {dateObj.hari}, {dateObj.jam}
                              </span>
                            </td>

                            {/* Category */}
                            <td className="px-5 py-3.5 whitespace-nowrap font-bold">
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs"
                                style={{
                                  backgroundColor: `${t.category?.color || '#ea580c'}15`,
                                  color: t.category?.color || '#ea580c',
                                }}
                              >
                                <span>{t.category?.emoji || '🏷️'}</span>
                                <span>{t.category?.name || 'Lainnya'}</span>
                              </span>
                            </td>

                            {/* Description / Notes */}
                            <td className="px-5 py-3.5 font-bold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span>{t.notes}</span>
                                {t.is_ocr && (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                    <Receipt className="w-3 h-3" /> Struk ({t.ocr_items?.length} item)
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Wallet */}
                            <td className="px-5 py-3.5 whitespace-nowrap font-bold text-slate-600">
                              👛 {t.wallet?.name || 'Default'}
                              {t.type === 'transfer' && t.to_wallet && (
                                <span className="text-blue-600 block text-[10px]">
                                  ➔ {t.to_wallet.name}
                                </span>
                              )}
                            </td>

                            {/* Source */}
                            <td className="px-5 py-3.5 whitespace-nowrap text-[11px] text-slate-500">
                              {t.source.startsWith('telegram') ? (
                                <span className="inline-flex items-center gap-1 text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                  <MessageSquare className="w-3 h-3" /> Telegram
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded-lg">
                                  Web App
                                </span>
                              )}
                            </td>

                            {/* Amount */}
                            <td className="px-5 py-3.5 whitespace-nowrap text-right font-black text-sm">
                              {t.type === 'expense' ? (
                                <span className="text-rose-600">- {hideBalance ? 'Rp ••••••••' : formatRupiah(t.amount)}</span>
                              ) : t.type === 'income' ? (
                                <span className="text-emerald-600">+ {hideBalance ? 'Rp ••••••••' : formatRupiah(t.amount)}</span>
                              ) : (
                                <span className="text-blue-600">⇄ {hideBalance ? 'Rp ••••••••' : formatRupiah(t.amount)}</span>
                              )}
                            </td>

                            {/* Action buttons */}
                            <td className="px-5 py-3.5 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => openEditModal(t)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition"
                                  title="Ubah Transaksi"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingTxId(t.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                  title="Hapus Transaksi"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expandable row: Itemized OCR details */}
                          {isExpanded && t.is_ocr && t.ocr_items && (
                            <tr className="bg-amber-50/50 border-y border-amber-100">
                              <td colSpan={9} className="px-8 py-4">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-xs font-bold text-amber-950 border-b border-amber-200 pb-2">
                                    <span className="flex items-center gap-1.5">
                                      <Receipt className="w-4 h-4 text-orange-600" />
                                      <span>Rincian Item Struk Pembelanjaan (Gemini 1.5 Flash Vision OCR)</span>
                                    </span>
                                    <span>Total: {formatRupiah(t.amount)}</span>
                                  </div>
                                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    {t.ocr_items.map((item, idx) => (
                                      <div
                                        key={idx}
                                        className="bg-white p-2.5 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between"
                                      >
                                        <div>
                                          <span className="font-bold text-slate-900 block truncate max-w-[140px]">
                                            {item.name}
                                          </span>
                                          <span className="text-[10px] text-slate-500">
                                            {item.category_emoji} {item.category_name}
                                          </span>
                                        </div>
                                        <span className="font-extrabold text-slate-900">
                                          {formatRupiah(item.price)}
                                        </span>
                                      </div>
                                    ))}
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

            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Baris per halaman:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>
                  Menampilkan {filteredTransactions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} -{' '}
                  {Math.min(currentPage * pageSize, filteredTransactions.length)} dari {filteredTransactions.length}
                </span>
              </div>

              <div className="flex items-center gap-1.5 self-center">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 disabled:opacity-40 transition"
                >
                  Sebelumnya
                </button>
                <span className="px-2 font-bold text-slate-800">
                  Hal {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 disabled:opacity-40 transition"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. ADD / EDIT TRANSACTION MODAL WITH DATE PICKER */}
      {/* ============================================================== */}
      {(isAddModalOpen || editingTx) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-600" />
                <span>{editingTx ? 'Ubah Data Transaksi' : 'Tambah Transaksi Manual'}</span>
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingTx(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 space-y-4 overflow-y-auto">
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setModalTab('expense')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    modalTab === 'expense' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('income')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    modalTab === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab('transfer')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    modalTab === 'transfer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                  }`}
                >
                  Transfer
                </button>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (IDR)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={modalAmount}
                  onChange={(e) => setModalAmount(e.target.value)}
                  placeholder="50000"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                />
                {modalAmount && !isNaN(Number(modalAmount)) && (
                  <span className="text-[11px] text-orange-600 font-bold mt-1 block">
                    {formatRupiah(Number(modalAmount))}
                  </span>
                )}
              </div>

              {/* Date & Time Input (WIB) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-orange-600" />
                    Tanggal &amp; Waktu Transaksi
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">WIB (Asia/Jakarta)</span>
                </label>
                <input
                  type="datetime-local"
                  required
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Category */}
              {modalTab !== 'transfer' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={modalCategoryId}
                    onChange={(e) => setModalCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    {categories
                      .filter((c) => (modalTab === 'expense' ? c.type === 'expense' : c.type === 'income'))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Wallets */}
              {modalTab !== 'transfer' ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Dompet / Rekening</label>
                  <select
                    value={modalWalletId}
                    onChange={(e) => setModalWalletId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        👛 {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dompet Asal</label>
                    <select
                      value={modalWalletId}
                      onChange={(e) => setModalWalletId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dompet Tujuan</label>
                    <select
                      value={modalToWalletId}
                      onChange={(e) => setModalToWalletId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    >
                      {wallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Keterangan transaksi"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingTx(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-600/20 transition active:scale-95"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. CONFIRM DELETE MODAL */}
      {/* ============================================================== */}
      {deletingTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Hapus Transaksi?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tindakan ini akan mengembalikan saldo dompet dan memotong budget spending terkait secara permanen.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingTxId(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  deleteTransaction(deletingTxId);
                  setDeletingTxId(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20 transition active:scale-95"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
