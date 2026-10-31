'use client';

import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  Plus,
  Check,
  Star,
  ArrowLeftRight,
  Trash2,
  Building2,
  Smartphone,
  Banknote,
  TrendingUp,
  X,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useFinance } from '@/lib/finance-context';
import { formatRupiah } from '@/lib/formatters';
import { Wallet } from '@/lib/types';

export default function WalletPage() {
  const {
    wallets,
    addWallet,
    setDefaultWallet,
    deleteWallet,
    transferFunds,
    hideBalance,
  } = useFinance();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Wallet Form State
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState<'bank' | 'ewallet' | 'cash' | 'investment'>('bank');
  const [newWalletBalance, setNewWalletBalance] = useState('');
  const [newWalletColor, setNewWalletColor] = useState('#003882');
  const [newWalletIsDefault, setNewWalletIsDefault] = useState(false);

  // Transfer Form State
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferFee, setTransferFee] = useState('0');
  const [transferNotes, setTransferNotes] = useState('');

  const totalAll = wallets.reduce((sum, w) => sum + w.balance, 0);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleCreateWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWalletName.trim()) {
      showNotification('error', 'Nama dompet tidak boleh kosong');
      return;
    }

    const initialBal = parseFloat(newWalletBalance.replace(/[^0-9]/g, '')) || 0;
    const created = addWallet({
      name: newWalletName.trim(),
      type: newWalletType,
      balance: initialBal,
      is_default: newWalletIsDefault,
      color: newWalletColor,
      icon: newWalletType,
      user_id: 'user-01',
    });

    if (newWalletIsDefault && created.id) {
      setDefaultWallet(created.id);
    }

    setIsAddModalOpen(false);
    setNewWalletName('');
    setNewWalletBalance('');
    setNewWalletType('bank');
    setNewWalletColor('#003882');
    setNewWalletIsDefault(false);
    showNotification('success', `Dompet ${created.name} berhasil ditambahkan!`);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromWalletId === toWalletId) {
      showNotification('error', 'Dompet asal dan tujuan tidak boleh sama');
      return;
    }

    const amt = parseFloat(transferAmount.replace(/[^0-9]/g, '')) || 0;
    const fee = parseFloat(transferFee.replace(/[^0-9]/g, '')) || 0;

    if (amt <= 0) {
      showNotification('error', 'Nominal transfer harus lebih besar dari 0');
      return;
    }

    const source = wallets.find((w) => w.id === fromWalletId);
    if (!source || source.balance < amt + fee) {
      showNotification('error', `Saldo ${source?.name || 'dompet asal'} tidak mencukupi untuk transfer & biaya admin`);
      return;
    }

    const success = transferFunds(fromWalletId, toWalletId, amt, fee, transferNotes.trim() || undefined);
    if (success) {
      setIsTransferModalOpen(false);
      setTransferAmount('');
      setTransferFee('0');
      setTransferNotes('');
      showNotification('success', `Transfer ${formatRupiah(amt)} berhasil dilakukan!`);
    } else {
      showNotification('error', 'Gagal memproses transfer');
    }
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    if (wallet.is_default) {
      showNotification('error', 'Dompet default bot Telegram tidak dapat dihapus. Silakan set dompet lain sebagai default terlebih dahulu.');
      return;
    }

    if (confirm(`Yakin ingin menghapus dompet "${wallet.name}"? Saldo ${formatRupiah(wallet.balance)} akan dihapus.`)) {
      const ok = deleteWallet(wallet.id);
      if (ok) {
        showNotification('success', `Dompet ${wallet.name} berhasil dihapus.`);
      } else {
        showNotification('error', 'Gagal menghapus dompet.');
      }
    }
  };

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <Building2 className="w-5 h-5" />;
      case 'ewallet':
        return <Smartphone className="w-5 h-5" />;
      case 'cash':
        return <Banknote className="w-5 h-5" />;
      case 'investment':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <WalletIcon className="w-5 h-5" />;
    }
  };

  const getWalletTypeLabel = (type: string) => {
    switch (type) {
      case 'bank':
        return 'Rekening Bank';
      case 'ewallet':
        return 'E-Wallet';
      case 'cash':
        return 'Kas Tunai';
      case 'investment':
        return 'Investasi';
      default:
        return 'Dompet';
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Multi-Wallet (Dompet Keuangan)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola saldo terpisah antar rekening bank, dompet digital, kas tunai, dan transfer antar dompet.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition active:scale-95"
          >
            <ArrowLeftRight className="w-4 h-4 text-orange-600" />
            Transfer Antar Dompet
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Tambah Dompet Baru
          </button>
        </div>
      </div>

      {/* NOTIFICATION BANNER */}
      {notification && (
        <div
          className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* TOTAL LIQUID WEALTH BANNER */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Kekayaan Likuid</span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            {hideBalance ? 'Rp ••••••••' : formatRupiah(totalAll)}
          </h2>
          <span className="text-xs text-emerald-400 mt-1 block">
            Tersimpan aman di {wallets.length} dompet aktif dengan enkripsi database
          </span>
        </div>
        <div className="flex flex-col sm:items-end gap-1.5">
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>Default Bot Telegram: <b>{wallets.find((w) => w.is_default)?.name || 'Belum diatur'}</b></span>
          </span>
          <span className="text-[11px] text-slate-400">
            Transaksi Telegram otomatis didebit dari dompet default
          </span>
        </div>
      </div>

      {/* WALLETS GRID */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {wallets.map((w) => (
          <div
            key={w.id}
            className={`p-5 rounded-2xl bg-white border shadow-sm flex flex-col justify-between transition hover:shadow-md ${
              w.is_default ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: w.color || '#ea580c' }}
                  >
                    {getWalletIcon(w.type)}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    {getWalletTypeLabel(w.type)}
                  </span>
                </div>

                {w.is_default ? (
                  <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-current" /> Default Bot
                  </span>
                ) : null}
              </div>

              <h3 className="text-base font-extrabold text-slate-900 mt-2">{w.name}</h3>
              <p className="text-xl font-black text-slate-900 mt-1">
                {hideBalance ? 'Rp ••••••••' : formatRupiah(w.balance)}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              {!w.is_default ? (
                <button
                  onClick={() => {
                    setDefaultWallet(w.id);
                    showNotification('success', `${w.name} kini menjadi dompet default bot Telegram!`);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-orange-600 transition flex items-center gap-1"
                >
                  <Star className="w-3 h-3" />
                  Jadikan Default
                </button>
              ) : (
                <span className="text-xs font-bold text-orange-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Digunakan di Bot
                </span>
              )}

              {!w.is_default && (
                <button
                  onClick={() => handleDeleteWallet(w)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="Hapus Dompet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODAL 1: TAMBAH DOMPET BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <WalletIcon className="w-5 h-5 text-orange-600" />
                <h3 className="font-extrabold text-base text-slate-900">Tambah Dompet Baru</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWallet} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Dompet / Rekening</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BCA Prioritas, Mandiri Livin, GoPay, Kas Fisik"
                  value={newWalletName}
                  onChange={(e) => setNewWalletName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Dompet</label>
                  <select
                    value={newWalletType}
                    onChange={(e) => setNewWalletType(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    <option value="bank">Rekening Bank</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="cash">Kas Tunai</option>
                    <option value="investment">Investasi</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Warna Aksen</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={newWalletColor}
                      onChange={(e) => setNewWalletColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200"
                    />
                    <span className="font-mono text-slate-600 text-[11px]">{newWalletColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Saldo Awal (Rp)</label>
                <input
                  type="text"
                  placeholder="0"
                  value={newWalletBalance}
                  onChange={(e) => setNewWalletBalance(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="setAsDefault"
                  checked={newWalletIsDefault}
                  onChange={(e) => setNewWalletIsDefault(e.target.checked)}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300"
                />
                <label htmlFor="setAsDefault" className="font-semibold text-slate-700 cursor-pointer">
                  Jadikan sebagai dompet default transaksi Telegram
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md shadow-orange-600/20 transition"
                >
                  Simpan Dompet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TRANSFER ANTAR DOMPET */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-orange-600" />
                <h3 className="font-extrabold text-base text-slate-900">Transfer Antar Dompet</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dari Dompet Asal</label>
                  <select
                    value={fromWalletId}
                    onChange={(e) => setFromWalletId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ke Dompet Tujuan</label>
                  <select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nominal Transfer (Rp)</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 500000"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Biaya Admin (Rp)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={transferFee}
                    onChange={(e) => setTransferFee(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan / Keterangan (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Top up GoPay dari BCA, Tarik tunai ATM"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold shadow-md shadow-orange-600/20 transition"
                >
                  Kirim Dana
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
