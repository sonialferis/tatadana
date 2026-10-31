import fs from 'fs';
import os from 'os';
import path from 'path';
import { UserProfile, Wallet, Category, Budget, Transaction, ReceiptItem } from './types';

export interface FinanceStoreData {
  user: UserProfile;
  wallets: Wallet[];
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
}

// On Vercel serverless functions, process.cwd() is read-only (/var/task). Use os.tmpdir() for runtime store.
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'tatadana-data')
  : path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'tatadana-store.json');

// Initial Default Data
const defaultUser: UserProfile = {
  id: 'user-01',
  full_name: 'Budi Santoso',
  phone_number: '0812-8899-7766',
  phone_verified: true,
  telegram_id: 8831965887,
  telegram_connected: true,
  plan: 'pro',
  default_currency: 'IDR',
  reminder_enabled: true,
  reminder_frequency: 1,
  reminder_time_1: '20:00',
  reminder_time_2: '08:00',
  avatar_url: null,
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

let inMemoryStore: FinanceStoreData | null = null;

function loadStore(): FinanceStoreData {
  if (inMemoryStore) {
    return inMemoryStore;
  }

  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data && data.wallets && data.transactions) {
        inMemoryStore = data;
        return inMemoryStore!;
      }
    }
  } catch (err) {
    console.warn('[ServerStore] Gagal membaca data file, fallback ke default:', err);
  }

  // Initialize with default data
  inMemoryStore = {
    user: { ...defaultUser },
    wallets: [...defaultWallets],
    categories: [...defaultCategories],
    budgets: [...defaultBudgets],
    transactions: [...defaultTransactions],
  };

  saveStore(inMemoryStore);
  return inMemoryStore;
}

function saveStore(data: FinanceStoreData): void {
  inMemoryStore = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ServerStore] Gagal menyimpan store ke file:', err);
  }
}

/**
 * Get the full synced finance state
 */
export function getFinanceState(): FinanceStoreData {
  return loadStore();
}

/**
 * Find the best matching category for a text/keyword
 */
export function matchCategory(inputCat: string, isIncome: boolean = false): Category {
  const store = loadStore();
  const lower = (inputCat || '').toLowerCase().trim();

  // Try exact or partial match in existing categories
  const matched = store.categories.find((c) => {
    if (isIncome && c.type !== 'income') return false;
    if (!isIncome && c.type !== 'expense') return false;
    const cName = c.name.toLowerCase();
    return cName.includes(lower) || lower.includes(cName);
  });

  if (matched) return matched;

  // Keyword rules for common Indonesian terms
  if (!isIncome) {
    if (lower.includes('makan') || lower.includes('bakso') || lower.includes('nasi') || lower.includes('kopi') || lower.includes('minum') || lower.includes('resto') || lower.includes('snack') || lower.includes('mie') || lower.includes('ayam')) {
      return store.categories.find(c => c.id === 'c-1') || store.categories[0];
    }
    if (lower.includes('bensin') || lower.includes('pertamax') || lower.includes('pertalite') || lower.includes('ojol') || lower.includes('grab') || lower.includes('gojek') || lower.includes('parkir') || lower.includes('tol') || lower.includes('transport')) {
      return store.categories.find(c => c.id === 'c-2') || store.categories[0];
    }
    if (lower.includes('nonton') || lower.includes('bioskop') || lower.includes('game') || lower.includes('steam') || lower.includes('spotify') || lower.includes('netflix') || lower.includes('liburan') || lower.includes('hiburan')) {
      return store.categories.find(c => c.id === 'c-3') || store.categories[0];
    }
    if (lower.includes('listrik') || lower.includes('pln') || lower.includes('air') || lower.includes('pdam') || lower.includes('wifi') || lower.includes('indihome') || lower.includes('pulsa') || lower.includes('kuota') || lower.includes('tagihan')) {
      return store.categories.find(c => c.id === 'c-4') || store.categories[0];
    }
    if (lower.includes('belanja') || lower.includes('indomaret') || lower.includes('alfamart') || lower.includes('baju') || lower.includes('sabun') || lower.includes('shopee') || lower.includes('tokopedia')) {
      return store.categories.find(c => c.id === 'c-5') || store.categories[0];
    }
    if (lower.includes('obat') || lower.includes('dokter') || lower.includes('klinik') || lower.includes('apotek') || lower.includes('vitamin') || lower.includes('sehat')) {
      return store.categories.find(c => c.id === 'c-6') || store.categories[0];
    }
    // Default fallback expense category
    return store.categories.find(c => c.id === 'c-1') || store.categories[0];
  } else {
    if (lower.includes('gaji') || lower.includes('salary') || lower.includes('upah')) {
      return store.categories.find(c => c.id === 'c-8') || store.categories.find(c => c.type === 'income') || store.categories[0];
    }
    if (lower.includes('freelance') || lower.includes('proyek') || lower.includes('bisnis') || lower.includes('jual')) {
      return store.categories.find(c => c.id === 'c-9') || store.categories.find(c => c.type === 'income') || store.categories[0];
    }
    return store.categories.find(c => c.id === 'c-8') || store.categories.find(c => c.type === 'income') || store.categories[0];
  }
}

/**
 * Record an expense from Telegram bot into the shared server store
 */
export function recordExpenseFromTelegram(params: {
  chatId: number | string;
  amount: number;
  categoryName: string;
  notes?: string;
  source?: 'telegram_text' | 'telegram_ocr' | 'telegram_voice';
  ocr_items?: ReceiptItem[];
  telegram_update_id?: number;
}): {
  transaction: Transaction;
  wallet: Wallet;
  category: Category;
  budget: Budget | undefined;
  newBalance: number;
  budgetPercent: number;
  budgetRemaining: number;
} {
  const store = loadStore();
  const category = matchCategory(params.categoryName, false);

  // Find default wallet or fallback to first wallet
  let wallet = store.wallets.find(w => w.is_default) || store.wallets[0];
  wallet.balance -= params.amount;

  // Update budget
  let budget = store.budgets.find(b => b.category_id === category.id);
  if (!budget) {
    budget = {
      id: `b-${Date.now()}`,
      user_id: store.user.id,
      category_id: category.id,
      monthly_limit: 1500000,
      current_spent: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      alert_80_sent: false,
      alert_100_sent: false,
    };
    store.budgets.push(budget);
  }
  budget.current_spent += params.amount;

  const budgetPercent = (budget.current_spent / budget.monthly_limit) * 100;
  const budgetRemaining = Math.max(0, budget.monthly_limit - budget.current_spent);

  // Create transaction
  const newTx: Transaction = {
    id: `tx-tg-${Date.now()}`,
    user_id: store.user.id,
    wallet_id: wallet.id,
    category_id: category.id,
    type: 'expense',
    amount: params.amount,
    notes: params.notes || `Pengeluaran via Telegram: ${category.name}`,
    transaction_time: new Date().toISOString(),
    source: params.source || 'telegram_text',
    telegram_update_id: params.telegram_update_id,
    is_ocr: params.source === 'telegram_ocr',
    ocr_items: params.ocr_items,
    created_at: new Date().toISOString(),
  };

  store.transactions.unshift(newTx);
  saveStore(store);

  return {
    transaction: newTx,
    wallet,
    category,
    budget,
    newBalance: wallet.balance,
    budgetPercent,
    budgetRemaining,
  };
}

/**
 * Record income from Telegram bot into shared server store
 */
export function recordIncomeFromTelegram(params: {
  chatId: number | string;
  amount: number;
  notes?: string;
  source?: 'telegram_text' | 'telegram_voice';
  telegram_update_id?: number;
}): {
  transaction: Transaction;
  wallet: Wallet;
  category: Category;
  newBalance: number;
} {
  const store = loadStore();
  const category = matchCategory('Gaji & Penghasilan', true);

  let wallet = store.wallets.find(w => w.is_default) || store.wallets[0];
  wallet.balance += params.amount;

  const newTx: Transaction = {
    id: `tx-tg-${Date.now()}`,
    user_id: store.user.id,
    wallet_id: wallet.id,
    category_id: category.id,
    type: 'income',
    amount: params.amount,
    notes: params.notes || 'Pemasukan via Telegram',
    transaction_time: new Date().toISOString(),
    source: params.source || 'telegram_text',
    telegram_update_id: params.telegram_update_id,
    created_at: new Date().toISOString(),
  };

  store.transactions.unshift(newTx);
  saveStore(store);

  return {
    transaction: newTx,
    wallet,
    category,
    newBalance: wallet.balance,
  };
}

/**
 * Add a manual transaction from the web dashboard
 */
export function addManualTransaction(txData: Omit<Transaction, 'id'>): Transaction {
  const store = loadStore();
  const newTx: Transaction = {
    ...txData,
    id: `tx-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  // Adjust Wallet Balance
  if (txData.type === 'expense') {
    const w = store.wallets.find(w => w.id === txData.wallet_id);
    if (w) w.balance -= txData.amount;

    const b = store.budgets.find(b => b.category_id === txData.category_id);
    if (b) b.current_spent += txData.amount;
  } else if (txData.type === 'income') {
    const w = store.wallets.find(w => w.id === txData.wallet_id);
    if (w) w.balance += txData.amount;
  } else if (txData.type === 'transfer' && txData.to_wallet_id) {
    const fromW = store.wallets.find(w => w.id === txData.wallet_id);
    const toW = store.wallets.find(w => w.id === txData.to_wallet_id);
    if (fromW) fromW.balance -= txData.amount;
    if (toW) toW.balance += txData.amount;
  }

  store.transactions.unshift(newTx);
  saveStore(store);
  return newTx;
}

/**
 * Delete a transaction and accurately revert wallet balances and budget spending
 */
export function deleteServerTransaction(id: string): { success: boolean; deletedTx?: Transaction } {
  const store = loadStore();
  const txIndex = store.transactions.findIndex(t => t.id === id);
  if (txIndex === -1) return { success: false };

  const [tx] = store.transactions.splice(txIndex, 1);

  // Revert Wallet & Budget
  if (tx.type === 'expense') {
    const w = store.wallets.find(w => w.id === tx.wallet_id);
    if (w) w.balance += tx.amount;

    const b = store.budgets.find(b => b.category_id === tx.category_id);
    if (b) b.current_spent = Math.max(0, b.current_spent - tx.amount);
  } else if (tx.type === 'income') {
    const w = store.wallets.find(w => w.id === tx.wallet_id);
    if (w) w.balance = Math.max(0, w.balance - tx.amount);
  } else if (tx.type === 'transfer' && tx.to_wallet_id) {
    const fromW = store.wallets.find(w => w.id === tx.wallet_id);
    const toW = store.wallets.find(w => w.id === tx.to_wallet_id);
    if (fromW) fromW.balance += tx.amount;
    if (toW) toW.balance = Math.max(0, toW.balance - tx.amount);
  }

  saveStore(store);
  return { success: true, deletedTx: tx };
}

/**
 * Perform wallet transfer on the server store
 */
export function transferServerFunds(params: {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  fee?: number;
  notes?: string;
}): { success: boolean; transaction?: Transaction; error?: string } {
  const store = loadStore();
  const fee = params.fee || 0;
  const fromW = store.wallets.find(w => w.id === params.fromWalletId);
  const toW = store.wallets.find(w => w.id === params.toWalletId);

  if (!fromW || !toW) return { success: false, error: 'Dompet tidak ditemukan' };
  if (fromW.balance < params.amount + fee) return { success: false, error: 'Saldo dompet asal tidak mencukupi' };

  fromW.balance -= (params.amount + fee);
  toW.balance += params.amount;

  const newTx: Transaction = {
    id: `tx-${Date.now()}`,
    user_id: store.user.id,
    wallet_id: params.fromWalletId,
    to_wallet_id: params.toWalletId,
    category_id: null,
    type: 'transfer',
    amount: params.amount,
    notes: params.notes || 'Transfer Antar Dompet',
    transaction_time: new Date().toISOString(),
    source: 'web',
    created_at: new Date().toISOString(),
  };

  store.transactions.unshift(newTx);
  saveStore(store);
  return { success: true, transaction: newTx };
}

/**
 * Update category monthly budget in the server store
 */
export function updateCategoryBudget(categoryId: string, monthlyLimit: number): Budget {
  const store = loadStore();
  let b = store.budgets.find(b => b.category_id === categoryId);
  if (b) {
    b.monthly_limit = monthlyLimit;
  } else {
    b = {
      id: `b-${Date.now()}`,
      user_id: store.user.id,
      category_id: categoryId,
      monthly_limit: monthlyLimit,
      current_spent: 0,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      alert_80_sent: false,
      alert_100_sent: false,
    };
    store.budgets.push(b);
  }
  saveStore(store);
  return b;
}

/**
 * Get accurate balances of all wallets (for Telegram /saldo)
 */
export function getWalletsSummary(): {
  wallets: Wallet[];
  totalBalance: number;
  defaultWallet: Wallet;
} {
  const store = loadStore();
  const totalBalance = store.wallets.reduce((sum, w) => sum + w.balance, 0);
  const defaultWallet = store.wallets.find(w => w.is_default) || store.wallets[0];
  return {
    wallets: store.wallets,
    totalBalance,
    defaultWallet,
  };
}

/**
 * Get period summary of transactions (for Telegram /hari ini, /minggu ini, /bulan ini)
 */
export function getPeriodSummary(period: 'hari ini' | 'minggu ini' | 'bulan ini'): {
  totalPemasukan: number;
  totalPengeluaran: number;
  count: number;
  categoryBreakdown: { [categoryName: string]: number };
} {
  const store = loadStore();
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let totalPemasukan = 0;
  let totalPengeluaran = 0;
  let count = 0;
  const categoryBreakdown: { [categoryName: string]: number } = {};

  for (const tx of store.transactions) {
    const txTime = new Date(tx.transaction_time);

    let inRange = false;
    if (period === 'hari ini') {
      inRange = txTime >= startOfDay;
    } else if (period === 'minggu ini') {
      inRange = txTime >= sevenDaysAgo;
    } else if (period === 'bulan ini') {
      inRange = txTime >= startOfMonth;
    }

    if (inRange) {
      count++;
      if (tx.type === 'income') {
        totalPemasukan += tx.amount;
      } else if (tx.type === 'expense') {
        totalPengeluaran += tx.amount;
        const cat = store.categories.find(c => c.id === tx.category_id);
        const catName = cat ? cat.name : 'Lainnya';
        categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + tx.amount;
      }
    }
  }

  return {
    totalPemasukan,
    totalPengeluaran,
    count,
    categoryBreakdown,
  };
}
