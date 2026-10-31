'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ArrowLeftRight,
  BarChart3,
  Target,
  Wallet as WalletIcon,
  Settings,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Bell,
  Sparkles,
  ChevronRight,
  Plus,
  Eye,
  EyeOff,
  Radio,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Bot,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { FinanceProvider, useFinance } from '@/lib/finance-context';
import { formatRupiah } from '@/lib/formatters';
import TataAiFloatingWidget from '@/components/tata-ai-floating-widget';

function QuickAddModal() {
  const { quickAddOpen, setQuickAddOpen, wallets, categories, addTransaction } = useFinance();
  const [activeTab, setActiveTab] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 'c-1');
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || 'w-1');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || 'w-2');
  const [notes, setNotes] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!quickAddOpen) return null;

  const handleQuickDenom = (extra: number) => {
    const current = parseInt(amount.replace(/\D/g, ''), 10) || 0;
    setAmount(String(current + extra));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = parseInt(amount.replace(/\D/g, ''), 10);
    if (!cleanAmount || cleanAmount <= 0) return;

    addTransaction({
      user_id: 'user-01',
      wallet_id: fromWalletId,
      to_wallet_id: activeTab === 'transfer' ? toWalletId : null,
      category_id: selectedCategory,
      type: activeTab,
      amount: cleanAmount,
      notes: notes.trim() || (activeTab === 'transfer' ? 'Transfer Antar Dompet' : 'Pencatatan Cepat'),
      transaction_time: new Date().toISOString(),
      source: 'web',
    });

    setSuccessToast(`Transaksi ${formatRupiah(cleanAmount)} berhasil dicatat!`);
    setAmount('');
    setNotes('');

    setTimeout(() => {
      setSuccessToast(null);
      setQuickAddOpen(false);
    }, 1200);
  };

  const filteredCategories = categories.filter((c) =>
    activeTab === 'expense' ? c.type === 'expense' : c.type === 'income'
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/30">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Catat Transaksi Cepat</h3>
              <p className="text-[11px] text-slate-500">Input transaksi langsung ke ledger TataDana</p>
            </div>
          </div>
          <button
            onClick={() => setQuickAddOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {successToast && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('expense')}
              className={`py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'expense' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('income')}
              className={`py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transfer')}
              className={`py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'transfer' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Nominal Input with Rp Prefix */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (IDR)</label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-slate-400 font-extrabold text-sm">Rp</span>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-lg font-extrabold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>
            {amount && !isNaN(Number(amount)) && (
              <span className="text-[11px] text-orange-600 font-bold mt-1 block">
                Terbaca: {formatRupiah(Number(amount))}
              </span>
            )}
            {/* Quick Denomination Chips */}
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-1">
              {[10000, 20000, 50000, 100000, 500000].map((denom) => (
                <button
                  type="button"
                  key={denom}
                  onClick={() => handleQuickDenom(denom)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 rounded-lg text-[10px] font-bold transition whitespace-nowrap"
                >
                  +{denom >= 1000 ? `${denom / 1000}rb` : denom}
                </button>
              ))}
            </div>
          </div>

          {/* Category Picker (for expense/income) */}
          {activeTab !== 'transfer' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1 border border-slate-200 rounded-2xl bg-slate-50/50">
                {filteredCategories.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setSelectedCategory(c.id)}
                    className={`p-2 rounded-xl text-left text-xs font-bold flex items-center gap-2 border transition ${
                      selectedCategory === c.id
                        ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-base">{c.emoji}</span>
                    <span className="truncate text-[11px]">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wallet Pickers */}
          {activeTab !== 'transfer' ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dompet / Rekening</label>
              <select
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    👛 {w.name} (Saldo: {formatRupiah(w.balance)})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dari Dompet Asal</label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ke Dompet Tujuan</label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                >
                  {wallets
                    .filter((w) => w.id !== fromWalletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.balance)})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Catatan Transaksi</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Makan siang nasi padang"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-2xl text-xs shadow-lg shadow-orange-600/30 transition active:scale-[0.98]"
            >
              Simpan Transaksi Sekarang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    user,
    hideBalance,
    toggleHideBalance,
    setQuickAddOpen,
    isImpersonating,
    impersonatedUser,
    exitImpersonation,
  } = useFinance();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('tatadana_auth_role');
      const adminEmail = localStorage.getItem('tatadana_admin_email');
      const userEmail = localStorage.getItem('tatadana_user_email');
      // Verifikasi hak akses admin: email HARUS sonialferis@gmail.com dan role admin
      const isSoniAdmin =
        (role === 'admin' || userEmail === 'sonialferis@gmail.com' || adminEmail === 'sonialferis@gmail.com') &&
        (adminEmail === 'sonialferis@gmail.com' || userEmail === 'sonialferis@gmail.com');
      setIsAdmin(Boolean(isSoniAdmin));
    }
  }, []);

  const navItems = [
    { label: 'Beranda', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Tata AI Bot', href: '/dashboard/tata-ai', icon: Bot, isAi: true },
    { label: 'Transaksi', href: '/dashboard/transactions', icon: ArrowLeftRight },
    { label: 'Laporan', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Budget', href: '/dashboard/budgets', icon: Target },
    { label: 'Wallet', href: '/dashboard/wallets', icon: WalletIcon },
    { label: 'Landing Page', href: '/dashboard/landing', icon: Globe },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tatadana_auth_role');
      localStorage.removeItem('tatadana_admin_email');
      localStorage.removeItem('tatadana_admin_name');
      localStorage.removeItem('tatadana_user_email');
      localStorage.removeItem('tatadana_user_name');
    }
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* 1. STICKY IMPERSONATION ALERT BANNER */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 px-4 py-2.5 text-xs font-bold shadow-lg flex items-center justify-between border-b border-amber-600">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-950 flex-shrink-0 animate-bounce" />
            <span>
              <b>MODE IMPERSONASI AKTIF:</b> Anda sedang mengakses dashboard sebagai{' '}
              <u>{impersonatedUser || 'Budi Santoso'}</u>. Seluruh tindakan dicatat di audit logs.
            </span>
          </div>
          <button
            onClick={exitImpersonation}
            className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition shadow-sm ml-2 flex-shrink-0"
          >
            Keluar dari Impersonasi →
          </button>
        </div>
      )}

      {/* 2. MOBILE TOPBAR (< 768px) */}
      <div
        className={`md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky z-40 ${
          isImpersonating ? 'top-10' : 'top-0'
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-extrabold text-sm shadow">
            TD
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            Tata<span className="text-orange-600">Dana</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link
              href="/admin"
              className="p-1.5 bg-slate-900 text-orange-400 hover:text-white rounded-xl shadow-sm border border-slate-700 flex items-center justify-center transition"
              title="Panel Admin (Superadmin)"
            >
              <ShieldAlert className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => setQuickAddOpen(true)}
            className="p-1.5 bg-orange-600 text-white rounded-xl shadow-sm text-xs font-bold flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={toggleHideBalance}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            title="Sembunyikan / Tampilkan Saldo"
          >
            {hideBalance ? <EyeOff className="w-4 h-4 text-orange-600" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 3. DESKTOP SIDEBAR */}
      <aside
        className={`fixed md:sticky top-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col justify-between p-4 z-40 transition-transform md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isImpersonating ? 'pt-14' : 'pt-4'}`}
      >
        <div className="space-y-5">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-2 pt-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white font-black shadow-md shadow-orange-500/20">
                TD
              </div>
              <div>
                <span className="font-black text-lg text-slate-900 block leading-none tracking-tight">
                  Tata<span className="text-orange-600">Dana</span>
                </span>
                <span className="text-[10px] text-slate-400 font-semibold tracking-wide">
                  Fintech Indonesia
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Plan Badge & Avatar (Part 9: badge plan user + avatar + logout) */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center text-lg shadow-sm flex-shrink-0 overflow-hidden border border-orange-300">
                {user.avatar_url && (user.avatar_url.startsWith('data:image') || user.avatar_url.startsWith('http')) ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.avatar_url || '👨‍💼'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-700 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-orange-600" />
                    {user.plan.toUpperCase()}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Akun Aktif"></span>
                </div>
                <p className="text-xs font-bold text-slate-900 truncate">{user.full_name}</p>
                <p className="text-[10px] text-slate-500 font-mono truncate">{user.phone_number}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href === '/dashboard/transactions' && pathname === '/dashboard/transaksi') ||
                (item.href === '/dashboard/reports' && pathname === '/dashboard/laporan') ||
                (item.href === '/dashboard/budgets' && pathname === '/dashboard/budget') ||
                (item.href === '/dashboard/wallets' && pathname === '/dashboard/wallet') ||
                (item.href === '/dashboard/tata-ai' && pathname === '/dashboard/tata-ai') ||
                (item.href === '/dashboard/landing' && pathname === '/dashboard/landing');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'text-slate-600 hover:bg-orange-50/70 hover:text-orange-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {(item as any).isAi && (
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                        isActive
                          ? 'bg-white text-orange-600 shadow-sm'
                          : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                      }`}
                    >
                      AI
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Panel Admin Khusus Administrator (sonialferis@gmail.com) */}
            {isAdmin && (
              <div className="pt-2">
                <div className="px-3 pb-1.5 flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  <span>Akses Superadmin</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Admin Aktif"></span>
                </div>
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-md shadow-slate-900/10 border border-slate-700 group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-orange-600/30 text-orange-400 flex items-center justify-center group-hover:scale-110 transition">
                      <ShieldAlert className="w-3.5 h-3.5" />
                    </div>
                    <span>Panel Admin</span>
                  </div>
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded font-mono font-bold">
                    Superadmin
                  </span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          {isAdmin && (
            <Link
              href="/admin"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-slate-900 text-orange-400 hover:bg-slate-800 border border-slate-700 transition shadow-sm"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
              <span>Buka Panel Admin</span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* 4. MAIN CONTENT AREA WITH TOPBAR */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Topbar Header */}
        <header
          className={`hidden md:flex bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-3.5 items-center justify-between sticky z-30 ${
            isImpersonating ? 'top-10' : 'top-0'
          }`}
        >
          {/* Page Context & Timezone */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-slate-800">
              TataDana Web Dashboard
            </span>
            <span className="text-[11px] text-slate-400 font-medium">|</span>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>WIB (UTC+7) Sync</span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Privacy Hide/Show Balance Toggle */}
            <button
              onClick={toggleHideBalance}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                hideBalance
                  ? 'bg-orange-50 border-orange-200 text-orange-700'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
              title={hideBalance ? 'Tampilkan Angka Saldo' : 'Sembunyikan Saldo (Mode Privasi)'}
            >
              {hideBalance ? <EyeOff className="w-3.5 h-3.5 text-orange-600" /> : <Eye className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{hideBalance ? 'Saldo Tersembunyi' : 'Mode Privasi'}</span>
            </button>

            {/* Quick Add Button */}
            <button
              onClick={() => setQuickAddOpen(true)}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tambah Transaksi</span>
            </button>

            {/* Landing Page Shortcut */}
            <Link
              href="/dashboard/landing"
              className="px-3 py-2 bg-slate-50 hover:bg-orange-50 hover:text-orange-600 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition shadow-2xs hover:border-orange-300"
              title="Lihat & Kelola Fitur Landing Page"
            >
              <Globe className="w-3.5 h-3.5 text-orange-600" />
              <span>Landing Page</span>
            </Link>

            {/* Panel Admin Shortcut (Hanya untuk sonialferis@gmail.com) */}
            {isAdmin && (
              <Link
                href="/admin"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 transition shadow-sm hover:border-orange-500/50"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                <span>Panel Admin</span>
                <span className="text-[9px] bg-orange-500/30 text-orange-300 px-1.5 py-0.5 rounded font-mono">
                  Superadmin
                </span>
              </Link>
            )}

            {/* Notification Bell with Popover */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 relative transition"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5 ring-2 ring-white"></span>
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-4 z-50 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="font-extrabold text-slate-900">Pemberitahuan Sistem</span>
                    <span className="text-[10px] text-orange-600 font-bold">2 Baru</span>
                  </div>
                  <div className="divide-y divide-slate-100 mt-2 space-y-2">
                    <div className="pt-2">
                      <p className="font-bold text-rose-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Over Budget: Hiburan & Santai
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pengeluaran kategori ini telah mencapai 104% (Rp 520.000 / Rp 500.000).
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="font-bold text-amber-600 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Waspada 80%: Transportasi
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Pengeluaran kategori transportasi telah menyentuh 88% batas bulanan.
                      </p>
                    </div>
                    <div className="pt-2">
                      <p className="font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Telegram Bot Terhubung
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Webhook aktif menerima chat, foto struk, dan rekaman suara.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 pl-2 border-l border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                BS
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* 5. MOBILE BOTTOM NAVIGATION BAR (< 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 z-40 flex items-center justify-around shadow-lg">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname === '/dashboard' ? 'text-orange-600' : 'text-slate-500'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span>Beranda</span>
        </Link>

        <Link
          href="/dashboard/transactions"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname.includes('transaction') || pathname.includes('transaksi') ? 'text-orange-600' : 'text-slate-500'
          }`}
        >
          <ArrowLeftRight className="w-5 h-5" />
          <span>Transaksi</span>
        </Link>

        {/* Center Floating (+) Quick Add Button */}
        <button
          onClick={() => setQuickAddOpen(true)}
          className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-600/40 active:scale-90 transition"
          title="Tambah Transaksi Cepat"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        <Link
          href="/dashboard/budgets"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname.includes('budget') ? 'text-orange-600' : 'text-slate-500'
          }`}
        >
          <Target className="w-5 h-5" />
          <span>Budget</span>
        </Link>

        <Link
          href="/dashboard/wallets"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold ${
            pathname.includes('wallet') ? 'text-orange-600' : 'text-slate-500'
          }`}
        >
          <WalletIcon className="w-5 h-5" />
          <span>Dompet</span>
        </Link>
      </nav>

      {/* Global Quick Add Modal */}
      <QuickAddModal />

      {/* Global TATA AI BOT Floating Widget */}
      <TataAiFloatingWidget />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FinanceProvider>
      <DashboardShell>{children}</DashboardShell>
    </FinanceProvider>
  );
}
