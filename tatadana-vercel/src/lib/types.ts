export type PlanType = 'starter' | 'pro';

export interface UserProfile {
  id: string;
  full_name: string;
  phone_number: string | null;
  phone_verified: boolean;
  telegram_id: number | null;
  telegram_username?: string | null;
  telegram_bot_token_encrypted?: string | null;
  telegram_connected: boolean;
  plan: PlanType;
  default_currency: string;
  reminder_enabled: boolean;
  reminder_frequency: number;
  reminder_time_1: string;
  reminder_time_2: string;
  avatar_url?: string | null;
  email?: string | null;
  occupation?: string | null;
  bio?: string | null;
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: 'cash' | 'bank' | 'ewallet' | 'other';
  balance: number;
  is_default: boolean;
  color: string;
  icon: string;
  created_at?: string;
}

export interface Category {
  id: string;
  user_id?: string | null;
  name: string;
  emoji: string;
  color: string;
  type: 'expense' | 'income';
  is_default?: boolean;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  category?: Category;
  monthly_limit: number;
  current_spent: number;
  month: number;
  year: number;
  alert_80_sent: boolean;
  alert_100_sent: boolean;
}

export interface ReceiptItem {
  name: string;
  price: number;
  qty?: number;
  category_name?: string;
  category_emoji?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  wallet?: Wallet;
  category_id: string;
  category?: Category;
  to_wallet_id?: string | null;
  to_wallet?: Wallet | null;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  notes?: string | null;
  transaction_time: string; // WIB ISO string
  source: 'web' | 'telegram_text' | 'telegram_ocr' | 'telegram_voice' | 'api';
  telegram_update_id?: number | null;
  is_ocr?: boolean;
  ocr_items?: ReceiptItem[];
  created_at?: string;
}

export interface AiLog {
  id: string;
  user_id?: string | null;
  provider: 'gemini' | 'openai' | 'deepseek';
  model: string;
  operation_type: 'text_parse' | 'receipt_ocr' | 'voice_transcribe' | 'advisor';
  prompt_tokens: number;
  completion_tokens: number;
  cost_estimate_idr: number;
  latency_ms: number;
  status: 'success' | 'failed' | 'fallback';
  error_message?: string | null;
  created_at: string;
}

export interface SubscriptionOrder {
  id: string;
  user_id: string;
  order_id: string;
  plan: PlanType;
  amount: number;
  payment_type: 'midtrans' | 'manual_transfer';
  payment_status: 'pending' | 'settlement' | 'rejected' | 'expire';
  proof_image_url?: string | null;
  admin_notes?: string | null;
  created_at: string;
}

export interface ParsedTransaction {
  jenis: 'pengeluaran' | 'pemasukan' | 'transfer';
  nominal: number;
  kategori: string;
  catatan: string;
  tujuan_wallet?: string;
  confidence: number;
  raw_transcript?: string;
  items?: ReceiptItem[];
}

export interface AuditLog {
  id: string;
  admin_id: string;
  target_user_id?: string | null;
  action: string;
  details: Record<string, any>;
  ip_address?: string | null;
  created_at: string;
}

export interface AiProviderConfig {
  id: string;
  name: string;
  provider: 'gemini' | 'groq' | 'openai' | 'deepseek' | 'heuristic';
  model: string;
  tier: number;
  priority: number;
  is_active: boolean;
  timeout_ms: number;
  latency_ms: number;
  error_rate: number;
  total_calls: number;
  error_count: number;
  api_key_masked?: string;
}

export interface ImpersonationSession {
  user_id: string;
  targetUserId: string;
  admin_id: string;
  adminId: string;
  targetUserName?: string;
  targetUserPhone?: string;
  reason?: string;
  startedAt: string;
  expiresAt: string;
  signature?: string;
}

export interface BroadcastRecord {
  id: string;
  title: string;
  message: string;
  targetPlan: 'all' | 'starter' | 'pro';
  totalSent: number;
  totalFailed: number;
  sentAt: string;
  recipients?: Array<{
    chatId: number | string;
    userName?: string;
    plan?: string;
    success: boolean;
  }>;
}
