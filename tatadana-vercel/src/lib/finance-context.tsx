'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Wallet, Category, Budget, Transaction, ReceiptItem } from './types';

export interface FinanceContextType {
  user: UserProfile;
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  hideBalance: boolean;
  isImpersonating: boolean;
  impersonatedUser: string | null;
  quickAddOpen: boolean;
  // Actions
  toggleHideBalance: () => void;
  setQuickAddOpen: (open: boolean) => void;
  exitImpersonation: () => void;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Transaction;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  transferFunds: (fromWalletId: string, toWalletId: string, amount: number, fee: number, notes?: string) => boolean;
  setCategoryBudget: (categoryId: string, monthlyLimit: number) => void;
  duplicateBudgetsFromPreviousMonth: () => void;
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => boolean;
  addWallet: (wallet: Omit<Wallet, 'id'>) => Wallet;
  updateWallet: (id: string, wallet: Partial<Wallet>) => void;
  deleteWallet: (id: string) => boolean;
  setDefaultWallet: (id: string) => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

// Initial Seed Data
const defaultUser: UserProfile = {
  id: 'user-01',
  full_name: 'Budi Santoso',
  phone_number: '0812-8899-7766',
  phone_verified: true,
  telegram_id: 19842910,
  telegram_connected: true,
  plan: 'pro',
  default_currency: 'IDR',
  reminder_enabled: true,
  reminder_frequency: 1,
  reminder_time_1: '20:00',
  reminder_time_2: '08:00',
  avatar_url: null,
  email: 'budi@tatadana.id',
  occupation: 'Karyawan Swasta',
  bio: 'Target dana darurat 50 juta dan financial freedom 2028',
  created_at: '2026-09-01T08:00:00+07:00',
};

const defaultWallets: Wallet[] = [
  { id: 'w-1', user_id: 'user-01', name: 'BCA (Default)', type: 'bank', balance: 14820000, is_default: true, color: '#003882', icon: 'bank' },
  { id: 'w-2', user_id: 'user-01', name: 'Bank Mandiri', type: 'bank', balance: 3500000, is_default: false, color: '#003d79', icon: 'bank' },
  { id: 'w-3', user_id: 'user-01', name: 'GoPay', type: 'ewallet', balance: 125000, is_default: false, color: '#00aed6', icon: 'ewallet' },
  { id: 'w-4', user_id: 'user-01', name: 'Dompet Kas Fisik', type: 'cash', balance: 350000, is_default: false, color: '#d97706', icon: 'cash' },
];

const defaultCategories: Category[] = [
  { id: 'c-1', name: 'Makanan & Minuman', emoji: '🍜', color: '#ea580c', type: 'expense', is_default: true },
  { id: 'c-2', name: 'Transportasi', emoji: '🚗', color: '#0284c7', type: 'expense', is_default: true },
  { id: 'c-3', name: 'Hiburan & Santai', emoji: '🎮', color: '#8b5cf6', type: 'expense', is_default: true },
  { id: 'c-4', name: 'Tagihan & Utilitas', emoji: '🏠', color: '#ef4444', type: 'expense', is_default: true },
  { id: 'c-5', name: 'Belanja Harian', emoji: '👕', color: '#ec4899', type: 'expense', is_default: true },
  { id: 'c-6', name: 'Kesehatan & Obat', emoji: '💊', color: '#14b8a6', type: 'expense', is_default: true },
  { id: 'c-7', name: 'Pendidikan & Buku', emoji: '📚', color: '#6366f1', type: 'expense', is_default: true },
  { id: 'c-8', name: 'Gaji & Penghasilan', emoji: '💰', color: '#10b981', type: 'income', is_default: true },
  { id: 'c-9', name: 'Freelance & Bisnis', emoji: '💼', color: '#06b6d4', type: 'income', is_default: true },
  { id: 'c-10', name: 'Bonus & Hadiah', emoji: '🎁', color: '#f59e0b', type: 'income', is_default: true },
  { id: 'c-11', name: 'Investasi & Dividen', emoji: '📈', color: '#84cc16', type: 'income', is_default: true },
];

const defaultBudgets: Budget[] = [
  { id: 'b-1', user_id: 'user-01', category_id: 'c-1', monthly_limit: 2000000, current_spent: 1450000, month: 10, year: 2026, alert_80_sent: false, alert_100_sent: false },
  { id: 'b-2', user_id: 'user-01', category_id: 'c-2', monthly_limit: 1000000, current_spent: 880000, month: 10, year: 2026, alert_80_sent: true, alert_100_sent: false },
  { id: 'b-3', user_id: 'user-01', category_id: 'c-3', monthly_limit: 500000, current_spent: 520000, month: 10, year: 2026, alert_80_sent: true, alert_100_sent: true },
  { id: 'b-4', user_id: 'user-01', category_id: 'c-4', monthly_limit: 800000, current_spent: 350000, month: 10, year: 2026, alert_80_sent: false, alert_100_sent: false },
  { id: 'b-5', user_id: 'user-01', category_id: 'c-5', monthly_limit: 600000, current_spent: 250000, month: 10, year: 2026, alert_80_sent: false, alert_100_sent: false },
  { id: 'b-6', user_id: 'user-01', category_id: 'c-6', monthly_limit: 400000, current_spent: 75000, month: 10, year: 2026, alert_80_sent: false, alert_100_sent: false },
  { id: 'b-7', user_id: 'user-01', category_id: 'c-7', monthly_limit: 500000, current_spent: 0, month: 10, year: 2026, alert_80_sent: false, alert_100_sent: false },
];

const defaultTransactions: Transaction[] = [
  {
    id: 'tx-1',
    user_id: 'user-01',
    wallet_id: 'w-1',
    category_id: 'c-1',
    type: 'expense',
    amount: 30000,
    notes: 'Bakso Malang & Es Teh',
    transaction_time: '2026-10-10T12:20:00+07:00',
    source: 'telegram_text',
  },
  {
    id: 'tx-2',
    user_id: 'user-01',
    wallet_id: 'w-1',
    category_id: 'c-2',
    type: 'expense',
    amount: 65000,
    notes: 'Bensin Pertamax 5L SPBU Sudirman',
    transaction_time: '2026-10-10T09:15:00+07:00',
    source: 'telegram_text',
  },
  {
    id: 'tx-3',
    user_id: 'user-01',
    wallet_id: 'w-3',
    category_id: 'c-5',
    type: 'expense',
    amount: 68500,
    notes: 'Struk Indomaret Point Sudirman',
    transaction_time: '2026-10-09T19:30:00+07:00',
    source: 'telegram_ocr',
    is_ocr: true,
    ocr_items: [
      { name: 'Roti Gandum Sari Roti', price: 21000, qty: 1, category_name: 'Makanan & Minuman', category_emoji: '🍜' },
      { name: 'Ultra Milk Coklat 1L', price: 22500, qty: 1, category_name: 'Makanan & Minuman', category_emoji: '🍜' },
      { name: 'Air Mineral Club 600ml', price: 4000, qty: 1, category_name: 'Makanan & Minuman', category_emoji: '🍜' },
      { name: 'Deterjen Rinso 800g', price: 21000, qty: 1, category_name: 'Belanja Harian', category_emoji: '👕' },
    ],
  },
  {
    id: 'tx-4',
    user_id: 'user-01',
    wallet_id: 'w-1',
    category_id: 'c-9',
    type: 'income',
    amount: 2500000,
    notes: 'Pembayaran DP Web Application Client',
    transaction_time: '2026-10-09T14:00:00+07:00',
    source: 'web',
  },
  {
    id: 'tx-5',
    user_id: 'user-01',
    wallet_id: 'w-1',
    category_id: 'c-4',
    type: 'expense',
    amount: 350000,
    notes: 'Listrik PLN Pascabayar Oktober',
    transaction_time: '2026-10-08T20:10:00+07:00',
    source: 'telegram_text',
  },
  {
    id: 'tx-6',
    user_id: 'user-01',
    wallet_id: 'w-3',
    category_id: 'c-1',
    type: 'expense',
    amount: 44000,
    notes: 'Kopi Susu Senja 2 Cup via Voice Note',
    transaction_time: '2026-10-07T12:45:00+07:00',
    source: 'telegram_voice',
  },
  {
    id: 'tx-7',
    user_id: 'user-01',
    wallet_id: 'w-1',
    category_id: 'c-3',
    type: 'expense',
    amount: 110000,
    notes: 'Tiket Bioskop XXI Cinema Mall',
    transaction_time: '2026-10-06T18:20:00+07:00',
    source: 'telegram_text',
  },
  {
    id: 'tx-8',
    user_id: 'user-01',
    wallet_id: 'w-1',
    category_id: 'c-6',
    type: 'expense',
    amount: 75000,
    notes: 'Beli Vitamin C & Obat Flu Kimia Farma',
    transaction_time: '2026-10-05T10:00:00+07:00',
    source: 'telegram_text',
  },
  {
    id: 'tx-9',
    user_id: 'user-01',
    wallet_id: 'w-1',
    to_wallet_id: 'w-3',
    type: 'transfer',
    amount: 200000,
    notes: 'Top Up GoPay via BCA Mobile',
    transaction_time: '2026-10-04T15:30:00+07:00',
    source: 'web',
  },
  {
    id: 'tx-10',
    user_id: 'user-01',
    wallet_id: 'w-1',
    category_id: 'c-1',
    type: 'expense',
    amount: 120000,
    notes: 'Makan Siang Bareng Tim Kantor',
    transaction_time: '2026-10-02T11:30:00+07:00',
    source: 'web',
  },
  {
    id: 'tx-11',
    user_id: 'user-01',
    wallet_id: 'w-1',
    category_id: 'c-8',
    type: 'income',
    amount: 5000000,
    notes: 'Gaji Pokok Bulanan PT Maju Bersama',
    transaction_time: '2026-10-01T08:00:00+07:00',
    source: 'web',
  },
];

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [wallets, setWallets] = useState<Wallet[]>(defaultWallets);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [budgets, setBudgets] = useState<Budget[]>(defaultBudgets);
  const [transactions, setTransactions] = useState<Transaction[]>(defaultTransactions);
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [quickAddOpen, setQuickAddOpen] = useState<boolean>(false);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);
  const [impersonatedUser, setImpersonatedUser] = useState<string | null>(null);

  // Sync with /api/finance (live localhost sync) and fallback to localStorage
  const fetchLiveFinance = async () => {
    try {
      const res = await fetch('/api/finance', { cache: 'no-store' });
      if (!res.ok) return;
      const json = await res.json();
      if (json.ok && json.data) {
        if (json.data.user) {
          setUser((prev) => ({
            ...json.data.user,
            avatar_url: prev.avatar_url || json.data.user.avatar_url,
            bio: prev.bio || json.data.user.bio,
            occupation: prev.occupation || json.data.user.occupation,
          }));
        }
        if (json.data.wallets) setWallets(json.data.wallets);
        if (json.data.categories) setCategories(json.data.categories);
        if (json.data.budgets) setBudgets(json.data.budgets);
        if (json.data.transactions) setTransactions(json.data.transactions);
      }
    } catch {
      // offline / safe fallback
    }
  };

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const cookies = document.cookie || '';
        const match = cookies.match(/tatadana_impersonate_session=([^;]+)/);
        const search = window.location.search;
        if (match || search.includes('impersonate=')) {
          setIsImpersonating(true);
          setImpersonatedUser('Budi Santoso (USER-01)');
        }

        const savedState = localStorage.getItem('tatadana_finance_state');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          if (parsed.user) setUser(parsed.user);
          if (parsed.wallets) setWallets(parsed.wallets);
          if (parsed.categories) setCategories(parsed.categories);
          if (parsed.budgets) setBudgets(parsed.budgets);
          if (parsed.transactions) setTransactions(parsed.transactions);
          if (typeof parsed.hideBalance === 'boolean') setHideBalance(parsed.hideBalance);
        }
      }
    } catch {
      // safe fallback
    }

    // Initial fetch from live server
    fetchLiveFinance();

    // Auto-poll every 2.5 seconds so Telegram transactions appear immediately
    const interval = setInterval(fetchLiveFinance, 2500);
    return () => clearInterval(interval);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'tatadana_finance_state',
          JSON.stringify({
            user,
            wallets,
            categories,
            budgets,
            transactions,
            hideBalance,
          })
        );
      }
    } catch {
      // safe fallback
    }
  }, [user, wallets, categories, budgets, transactions, hideBalance]);

  const toggleHideBalance = () => setHideBalance((prev) => !prev);

  const exitImpersonation = () => {
    if (typeof window !== 'undefined') {
      document.cookie = 'tatadana_impersonate_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;';
      setIsImpersonating(false);
      setImpersonatedUser(null);
      window.location.href = '/admin';
    }
  };

  const addTransaction = (txData: Omit<Transaction, 'id'>): Transaction => {
    const newId = `tx-${Date.now()}`;
    const newTx: Transaction = {
      ...txData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    // Sync to live server store
    fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txData),
    }).catch((err) => console.warn('[FinanceSync] POST failed:', err));

    // Update Wallets
    setWallets((prev) =>
      prev.map((w) => {
        if (txData.type === 'expense' && w.id === txData.wallet_id) {
          return { ...w, balance: Math.max(0, w.balance - txData.amount) };
        }
        if (txData.type === 'income' && w.id === txData.wallet_id) {
          return { ...w, balance: w.balance + txData.amount };
        }
        if (txData.type === 'transfer') {
          if (w.id === txData.wallet_id) {
            return { ...w, balance: Math.max(0, w.balance - txData.amount) };
          }
          if (w.id === txData.to_wallet_id) {
            return { ...w, balance: w.balance + txData.amount };
          }
        }
        return w;
      })
    );

    // Update Budgets if expense
    if (txData.type === 'expense' && txData.category_id) {
      setBudgets((prev) =>
        prev.map((b) => {
          if (b.category_id === txData.category_id) {
            const nextSpent = b.current_spent + txData.amount;
            return {
              ...b,
              current_spent: nextSpent,
              alert_80_sent: nextSpent >= b.monthly_limit * 0.8,
              alert_100_sent: nextSpent >= b.monthly_limit,
            };
          }
          return b;
        })
      );
    }

    setTransactions((prev) => [newTx, ...prev]);
    return newTx;
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updatedFields } : tx))
    );
  };

  const deleteTransaction = (id: string) => {
    const existing = transactions.find((t) => t.id === id);
    if (!existing) return;

    // Revert wallet balance
    setWallets((prev) =>
      prev.map((w) => {
        if (existing.type === 'expense' && w.id === existing.wallet_id) {
          return { ...w, balance: w.balance + existing.amount };
        }
        if (existing.type === 'income' && w.id === existing.wallet_id) {
          return { ...w, balance: Math.max(0, w.balance - existing.amount) };
        }
        if (existing.type === 'transfer') {
          if (w.id === existing.wallet_id) {
            return { ...w, balance: w.balance + existing.amount };
          }
          if (w.id === existing.to_wallet_id) {
            return { ...w, balance: Math.max(0, w.balance - existing.amount) };
          }
        }
        return w;
      })
    );

    // Revert budget spent
    if (existing.type === 'expense' && existing.category_id) {
      setBudgets((prev) =>
        prev.map((b) => {
          if (b.category_id === existing.category_id) {
            const nextSpent = Math.max(0, b.current_spent - existing.amount);
            return {
              ...b,
              current_spent: nextSpent,
              alert_80_sent: nextSpent >= b.monthly_limit * 0.8,
              alert_100_sent: nextSpent >= b.monthly_limit,
            };
          }
          return b;
        })
      );
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Sync deletion to live server store
    fetch(`/api/finance?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }).catch((err) => console.warn('[FinanceSync] DELETE failed:', err));
  };

  const transferFunds = (
    fromWalletId: string,
    toWalletId: string,
    amount: number,
    fee: number = 0,
    notes: string = 'Transfer Antar Dompet'
  ): boolean => {
    if (fromWalletId === toWalletId || amount <= 0) return false;
    const sourceWallet = wallets.find((w) => w.id === fromWalletId);
    if (!sourceWallet || sourceWallet.balance < amount + fee) return false;

    // Deduct source and credit target
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id === fromWalletId) {
          return { ...w, balance: w.balance - (amount + fee) };
        }
        if (w.id === toWalletId) {
          return { ...w, balance: w.balance + amount };
        }
        return w;
      })
    );

    // Record transfer transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      user_id: user.id,
      wallet_id: fromWalletId,
      to_wallet_id: toWalletId,
      category_id: 'c-2', // general category
      type: 'transfer',
      amount,
      notes: fee > 0 ? `${notes} (Biaya Admin: Rp ${fee.toLocaleString('id-ID')})` : notes,
      transaction_time: new Date().toISOString(),
      source: 'web',
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Sync transfer to live server store
    fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'transfer',
        from_wallet_id: fromWalletId,
        to_wallet_id: toWalletId,
        amount,
        fee,
        notes,
      }),
    }).catch((err) => console.warn('[FinanceSync] Transfer POST failed:', err));

    return true;
  };

  const setCategoryBudget = (categoryId: string, monthlyLimit: number) => {
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.category_id === categoryId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          monthly_limit: monthlyLimit,
          alert_80_sent: next[idx].current_spent >= monthlyLimit * 0.8,
          alert_100_sent: next[idx].current_spent >= monthlyLimit,
        };
        return next;
      } else {
        // Calculate current spent from transactions in category
        const spent = transactions
          .filter((t) => t.type === 'expense' && t.category_id === categoryId)
          .reduce((sum, t) => sum + t.amount, 0);

        return [
          ...prev,
          {
            id: `b-${Date.now()}`,
            user_id: user.id,
            category_id: categoryId,
            monthly_limit: monthlyLimit,
            current_spent: spent,
            month: 10,
            year: 2026,
            alert_80_sent: spent >= monthlyLimit * 0.8,
            alert_100_sent: spent >= monthlyLimit,
          },
        ];
      }
    });

    // Sync budget update to live server store
    fetch('/api/finance', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_id: categoryId,
        monthly_limit: monthlyLimit,
      }),
    }).catch((err) => console.warn('[FinanceSync] Budget PUT failed:', err));
  };

  const duplicateBudgetsFromPreviousMonth = () => {
    // Re-seeds or applies the benchmark monthly limits to the active month
    setBudgets((prev) =>
      prev.map((b) => ({
        ...b,
        month: 10,
        year: 2026,
      }))
    );
  };

  const addWallet = (walletData: Omit<Wallet, 'id'>): Wallet => {
    const newWallet: Wallet = {
      ...walletData,
      id: `w-${Date.now()}`,
    };
    setWallets((prev) => [...prev, newWallet]);
    return newWallet;
  };

  const updateWallet = (id: string, updatedFields: Partial<Wallet>) => {
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updatedFields } : w))
    );
  };

  const deleteWallet = (id: string): boolean => {
    if (wallets.length <= 1) return false;
    setWallets((prev) => prev.filter((w) => w.id !== id));
    return true;
  };

  const setDefaultWallet = (id: string) => {
    setWallets((prev) =>
      prev.map((w) => ({
        ...w,
        is_default: w.id === id,
      }))
    );
  };

  const addCategory = (catData: Omit<Category, 'id'>): Category => {
    const newId = `c-${Date.now()}`;
    const newCat: Category = {
      ...catData,
      id: newId,
    };
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  const updateCategory = (id: string, updatedFields: Partial<Category>) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c))
    );
  };

  const deleteCategory = (id: string): boolean => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    return true;
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...profile }));
  };

  // Populate helper relations on transactions and budgets
  const populatedTransactions = transactions.map((t) => ({
    ...t,
    wallet: wallets.find((w) => w.id === t.wallet_id),
    to_wallet: t.to_wallet_id ? wallets.find((w) => w.id === t.to_wallet_id) : null,
    category: categories.find((c) => c.id === t.category_id),
  }));

  const populatedBudgets = budgets.map((b) => ({
    ...b,
    category: categories.find((c) => c.id === b.category_id),
  }));

  return (
    <FinanceContext.Provider
      value={{
        user,
        wallets,
        categories,
        budgets: populatedBudgets,
        transactions: populatedTransactions,
        hideBalance,
        isImpersonating,
        impersonatedUser,
        quickAddOpen,
        toggleHideBalance,
        setQuickAddOpen,
        exitImpersonation,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        transferFunds,
        setCategoryBudget,
        duplicateBudgetsFromPreviousMonth,
        addCategory,
        updateCategory,
        deleteCategory,
        addWallet,
        updateWallet,
        deleteWallet,
        setDefaultWallet,
        updateUserProfile,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return ctx;
}
