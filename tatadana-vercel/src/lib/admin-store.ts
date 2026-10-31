import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { AiLog, AuditLog, AiProviderConfig, ImpersonationSession, SubscriptionOrder, UserProfile, BroadcastRecord } from './types';

// Secret key for HMAC signing
const SIGNING_SECRET = process.env.DATA_ENCRYPTION_KEY || 'tatadana-fintech-secret-key-32-chars!';

// On Vercel serverless functions, process.cwd() is read-only (/var/task). Use os.tmpdir() for runtime store.
const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'tatadana-data')
  : path.join(process.cwd(), 'data');
const BROADCAST_FILE = path.join(DATA_DIR, 'broadcast-history.json');

function loadBroadcastHistoryFromFile(): BroadcastRecord[] {
  try {
    if (fs.existsSync(BROADCAST_FILE)) {
      const raw = fs.readFileSync(BROADCAST_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) return data;
    }
  } catch (err) {
    console.warn('[AdminStore] Gagal membaca broadcast-history.json:', err);
  }
  return [
    {
      id: 'bc-sample-01',
      title: 'Selamat Datang di TataDana Bot v1.0',
      message: 'Halo Sobat TataDana! 🎉\n\nKini Anda dapat mencatat pengeluaran & pemasukan harian langsung via Telegram dengan AI pintar kami.',
      targetPlan: 'all',
      totalSent: 3,
      totalFailed: 0,
      sentAt: '2026-10-12T10:00:00+07:00',
    },
  ];
}

function saveBroadcastHistoryToFile(list: BroadcastRecord[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(BROADCAST_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[AdminStore] Gagal menyimpan broadcast-history.json:', err);
  }
}

// In-Memory Global State (persists across API invocations in runtime)
const globalState: {
  users: Array<UserProfile & { txCount?: number; totalBalance?: number }>;
  impersonationSession: ImpersonationSession | null;
  auditLogs: AuditLog[];
  aiLogs: AiLog[];
  orders: SubscriptionOrder[];
  providers: AiProviderConfig[];
  broadcasts: BroadcastRecord[];
} = {
  users: [
    {
      id: 'usr-1',
      full_name: 'Budi Santoso',
      phone_number: '081288997766',
      phone_verified: true,
      telegram_id: 8831965887,
      telegram_connected: true,
      plan: 'pro',
      default_currency: 'IDR',
      reminder_enabled: true,
      reminder_frequency: 1,
      reminder_time_1: '08:00:00',
      reminder_time_2: '20:00:00',
      created_at: '2026-10-01T08:00:00+07:00',
      txCount: 43,
      totalBalance: 14850000,
    },
    {
      id: 'usr-2',
      full_name: 'Siti Rahma',
      phone_number: '081399881122',
      phone_verified: true,
      telegram_id: 987654321,
      telegram_connected: true,
      plan: 'starter',
      default_currency: 'IDR',
      reminder_enabled: true,
      reminder_frequency: 2,
      reminder_time_1: '07:30:00',
      reminder_time_2: '21:00:00',
      created_at: '2026-10-03T10:15:00+07:00',
      txCount: 28,
      totalBalance: 3200000,
    },
    {
      id: 'usr-3',
      full_name: 'Andi Wijaya',
      phone_number: '085712345678',
      phone_verified: true,
      telegram_id: null,
      telegram_connected: false,
      plan: 'starter',
      default_currency: 'IDR',
      reminder_enabled: false,
      reminder_frequency: 1,
      reminder_time_1: '09:00:00',
      reminder_time_2: '19:00:00',
      created_at: '2026-10-08T14:20:00+07:00',
      txCount: 4,
      totalBalance: 850000,
    },
    {
      id: 'usr-4',
      full_name: 'Dewi Lestari',
      phone_number: '081922334455',
      phone_verified: true,
      telegram_id: 556677889,
      telegram_connected: true,
      plan: 'starter',
      default_currency: 'IDR',
      reminder_enabled: true,
      reminder_frequency: 1,
      reminder_time_1: '08:00:00',
      reminder_time_2: '20:00:00',
      created_at: '2026-10-09T09:30:00+07:00',
      txCount: 12,
      totalBalance: 5400000,
    },
    {
      id: 'usr-5',
      full_name: 'Dimas Aditya',
      phone_number: '081299001122',
      phone_verified: true,
      telegram_id: 123456789,
      telegram_connected: true,
      plan: 'pro',
      default_currency: 'IDR',
      reminder_enabled: true,
      reminder_frequency: 1,
      reminder_time_1: '08:00:00',
      reminder_time_2: '20:00:00',
      created_at: '2026-10-10T11:00:00+07:00',
      txCount: 15,
      totalBalance: 9500000,
    },
  ],
  impersonationSession: null,
  auditLogs: [
    {
      id: 'aud-1',
      admin_id: 'admin-super-01',
      target_user_id: 'usr-1',
      action: 'SYSTEM_INIT',
      details: { info: 'Audit log subsystem initialized' },
      ip_address: '127.0.0.1',
      created_at: '2026-10-10T08:00:00+07:00',
    },
  ],
  aiLogs: [
    {
      id: 'ailog-01',
      user_id: 'usr-1',
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      operation_type: 'text_parse',
      prompt_tokens: 38,
      completion_tokens: 22,
      cost_estimate_idr: 12.5,
      latency_ms: 285,
      status: 'success',
      error_message: null,
      created_at: '2026-10-10T09:15:20+07:00',
    },
    {
      id: 'ailog-02',
      user_id: 'usr-2',
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      operation_type: 'receipt_ocr',
      prompt_tokens: 145,
      completion_tokens: 65,
      cost_estimate_idr: 45.0,
      latency_ms: 620,
      status: 'success',
      error_message: null,
      created_at: '2026-10-10T10:02:11+07:00',
    },
  ],
  orders: [
    {
      id: 'ORD-1092',
      order_id: 'ORD-1092',
      user_id: 'usr-2',
      plan: 'pro',
      amount: 99000,
      payment_type: 'manual_transfer',
      payment_status: 'pending',
      proof_image_url: 'https://tatadana.id/uploads/slips/bukti_transfer_dimas.jpg',
      admin_notes: 'Transfer manual BCA a.n Siti Rahma',
      created_at: '2026-10-10T08:30:00+07:00',
    },
    {
      id: 'ORD-1093',
      order_id: 'ORD-1093',
      user_id: 'usr-1',
      plan: 'pro',
      amount: 49000,
      payment_type: 'midtrans',
      payment_status: 'settlement',
      proof_image_url: null,
      admin_notes: 'Midtrans QRIS Auto Settlement',
      created_at: '2026-10-10T09:00:00+07:00',
    },
    {
      id: 'ORD-MANUAL-01',
      order_id: 'ORD-MANUAL-01',
      user_id: 'usr-3',
      plan: 'pro',
      amount: 99000,
      payment_type: 'manual_transfer',
      payment_status: 'pending',
      proof_image_url: 'https://tatadana.id/uploads/slips/slip_bca_andi.jpg',
      admin_notes: 'Transfer ke Rek Mandiri TataDana',
      created_at: '2026-10-10T11:00:00+07:00',
    },
  ],
  providers: [
    {
      id: 'gemini-flash',
      name: 'Google Gemini 1.5 Flash',
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      tier: 1,
      priority: 1,
      is_active: true,
      timeout_ms: 4000,
      latency_ms: 285,
      error_rate: 0.2,
      total_calls: 1420,
      error_count: 3,
      api_key_masked: 'AIzaSyD***masked',
    },
    {
      id: 'gemini-pro',
      name: 'Google Gemini 1.5 Pro',
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      tier: 2,
      priority: 2,
      is_active: true,
      timeout_ms: 6000,
      latency_ms: 540,
      error_rate: 0.5,
      total_calls: 310,
      error_count: 2,
      api_key_masked: 'AIzaSyP***masked',
    },
    {
      id: 'groq',
      name: 'Groq Llama 3.1 70B',
      provider: 'groq',
      model: 'llama-3.1-70b-versatile',
      tier: 3,
      priority: 3,
      is_active: true,
      timeout_ms: 3000,
      latency_ms: 180,
      error_rate: 1.1,
      total_calls: 890,
      error_count: 10,
      api_key_masked: 'gsk_***masked',
    },
    {
      id: 'openai',
      name: 'OpenAI GPT-4o-mini',
      provider: 'openai',
      model: 'gpt-4o-mini',
      tier: 4,
      priority: 4,
      is_active: true,
      timeout_ms: 5000,
      latency_ms: 410,
      error_rate: 0.4,
      total_calls: 460,
      error_count: 2,
      api_key_masked: 'sk-proj-***masked',
    },
    {
      id: 'heuristic',
      name: 'Indonesian Heuristic Regex Fallback',
      provider: 'heuristic',
      model: 'regex-heuristic-v1',
      tier: 5,
      priority: 5,
      is_active: true,
      timeout_ms: 100,
      latency_ms: 4,
      error_rate: 0.0,
      total_calls: 154,
      error_count: 0,
      api_key_masked: 'Offline (No API Key Required)',
    },
  ],
  broadcasts: loadBroadcastHistoryFromFile(),
};

// -------------------------------------------------------------
// USER MANAGEMENT
// -------------------------------------------------------------
export function getUsers() {
  return [...globalState.users];
}

export function getUserById(userId: string) {
  return globalState.users.find((u) => u.id === userId) || null;
}

export function updateUserPlan(userId: string, plan: 'starter' | 'pro') {
  const user = globalState.users.find((u) => u.id === userId);
  if (user) {
    user.plan = plan;
  }
  return user;
}

// -------------------------------------------------------------
// USER IMPERSONATION SESSION & SIGNING
// -------------------------------------------------------------
export function signSessionPayload(payload: Record<string, any>): string {
  const dataToSign = `${payload.user_id}:${payload.admin_id}:${payload.startedAt}`;
  return crypto.createHmac('sha256', SIGNING_SECRET).update(dataToSign).digest('hex');
}

export function verifySessionSignature(session: ImpersonationSession): boolean {
  if (!session || !session.signature) return false;
  const expected = signSessionPayload({
    user_id: session.user_id || session.targetUserId,
    admin_id: session.admin_id || session.adminId,
    startedAt: session.startedAt,
  });
  return expected === session.signature;
}

export function createImpersonationSession(params: {
  targetUserId: string;
  adminId?: string;
  targetUserName?: string;
  targetUserPhone?: string;
  reason?: string;
}): { session: ImpersonationSession; cookieValue: string } {
  const targetUser = getUserById(params.targetUserId);
  const now = new Date();
  const expires = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour expiry

  const sessionData = {
    user_id: params.targetUserId,
    targetUserId: params.targetUserId,
    admin_id: params.adminId || 'admin-super-01',
    adminId: params.adminId || 'admin-super-01',
    targetUserName: params.targetUserName || targetUser?.full_name || 'Budi Santoso',
    targetUserPhone: params.targetUserPhone || targetUser?.phone_number || '081288997766',
    reason: params.reason || 'Customer Support Troubleshooting',
    startedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  const signature = signSessionPayload(sessionData);
  const fullSession: ImpersonationSession = {
    ...sessionData,
    signature,
  };

  globalState.impersonationSession = fullSession;

  // JSON serialized cookie string with encoded payload
  const cookieValue = encodeURIComponent(JSON.stringify(fullSession));

  // Log in Audit Trail
  logAuditEvent({
    admin_id: fullSession.admin_id,
    target_user_id: fullSession.user_id,
    action: 'IMPERSONATE_START',
    details: {
      reason: fullSession.reason,
      targetUserName: fullSession.targetUserName,
      startedAt: fullSession.startedAt,
      expiresAt: fullSession.expiresAt,
    },
  });

  return { session: fullSession, cookieValue };
}

export function parseImpersonationCookie(cookieHeader?: string | null): ImpersonationSession | null {
  if (!cookieHeader) return globalState.impersonationSession;

  try {
    let raw = cookieHeader;
    if (cookieHeader.includes('tatadana_impersonate_session=')) {
      const match = cookieHeader.match(/tatadana_impersonate_session=([^;]+)/);
      if (match) raw = match[1];
    }

    let parsed: any = null;
    try {
      parsed = JSON.parse(decodeURIComponent(raw));
    } catch {
      parsed = JSON.parse(raw);
    }

    if (parsed && (parsed.user_id || parsed.targetUserId)) {
      // Check expiration
      if (parsed.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
        return null;
      }
      return {
        user_id: parsed.user_id || parsed.targetUserId,
        targetUserId: parsed.targetUserId || parsed.user_id,
        admin_id: parsed.admin_id || parsed.adminId || 'admin-super-01',
        adminId: parsed.adminId || parsed.admin_id || 'admin-super-01',
        targetUserName: parsed.targetUserName || 'Pengguna',
        targetUserPhone: parsed.targetUserPhone,
        reason: parsed.reason,
        startedAt: parsed.startedAt || new Date().toISOString(),
        expiresAt: parsed.expiresAt || new Date(Date.now() + 3600000).toISOString(),
        signature: parsed.signature,
      };
    }
  } catch {
    // Return in-memory fallback if cookie parsing encounters invalid encoding
  }

  return globalState.impersonationSession;
}

export function endImpersonationSession(adminId?: string): { success: boolean } {
  const current = globalState.impersonationSession;
  if (current) {
    logAuditEvent({
      admin_id: adminId || current.admin_id,
      target_user_id: current.user_id,
      action: 'IMPERSONATE_STOP',
      details: {
        endedAt: new Date().toISOString(),
        durationMinutes: Math.round(
          (Date.now() - new Date(current.startedAt).getTime()) / 60000
        ),
      },
    });
    // Also record IMPERSONATE_END synonym for full spec compliance
    logAuditEvent({
      admin_id: adminId || current.admin_id,
      target_user_id: current.user_id,
      action: 'IMPERSONATE_END',
      details: { endedAt: new Date().toISOString() },
    });
  }

  globalState.impersonationSession = null;
  return { success: true };
}

export function getActiveImpersonationSession(): ImpersonationSession | null {
  return globalState.impersonationSession;
}

// -------------------------------------------------------------
// AUDIT LOG MANAGEMENT
// -------------------------------------------------------------
export function logAuditEvent(params: {
  admin_id: string;
  target_user_id?: string | null;
  action: string;
  details?: Record<string, any>;
  ip_address?: string | null;
}): AuditLog {
  const entry: AuditLog = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    admin_id: params.admin_id,
    target_user_id: params.target_user_id || null,
    action: params.action,
    details: params.details || {},
    ip_address: params.ip_address || '127.0.0.1',
    created_at: new Date().toISOString(),
  };

  globalState.auditLogs.unshift(entry);
  if (globalState.auditLogs.length > 500) {
    globalState.auditLogs.pop();
  }

  return entry;
}

export function getAuditLogs(limit = 100): AuditLog[] {
  return globalState.auditLogs.slice(0, limit);
}

// -------------------------------------------------------------
// AI LOG MANAGEMENT
// -------------------------------------------------------------
export function logAiRecord(entry: Omit<AiLog, 'id' | 'created_at'>): AiLog {
  const fullLog: AiLog = {
    ...entry,
    id: `ailog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    created_at: new Date().toISOString(),
  };

  globalState.aiLogs.unshift(fullLog);
  if (globalState.aiLogs.length > 500) {
    globalState.aiLogs.pop();
  }

  return fullLog;
}

export function getAiLogsList(limit = 100): AiLog[] {
  return globalState.aiLogs.slice(0, limit);
}

export function clearAiLogsList() {
  globalState.aiLogs = [];
}

// -------------------------------------------------------------
// SUBSCRIPTIONS & ORDERS
// -------------------------------------------------------------
export function getSubscriptionOrdersList(): SubscriptionOrder[] {
  return [...globalState.orders];
}

export function getOrderById(orderId: string): SubscriptionOrder | null {
  return (
    globalState.orders.find((o) => o.order_id === orderId || o.id === orderId) ||
    null
  );
}

export function updateSubscriptionOrder(
  orderId: string,
  updates: Partial<SubscriptionOrder>
): SubscriptionOrder | null {
  let order = globalState.orders.find((o) => o.order_id === orderId || o.id === orderId);
  if (!order) {
    // If order was created on the fly (e.g. from test ORD-TEST-01)
    const newOrder: SubscriptionOrder = {
      id: orderId,
      order_id: orderId,
      user_id: updates.user_id || 'usr-1',
      plan: updates.plan || 'pro',
      amount: updates.amount || 99000,
      payment_type: updates.payment_type || 'midtrans',
      payment_status: updates.payment_status || 'pending',
      created_at: new Date().toISOString(),
    };
    globalState.orders.unshift(newOrder);
    order = newOrder;
  }

  Object.assign(order, updates);

  // If status transitions to settlement, auto upgrade user to Pro
  if (updates.payment_status === 'settlement' && order.user_id) {
    updateUserPlan(order.user_id, 'pro');
  }

  return order;
}

export function approveManualPaymentOrder(orderId: string, adminId = 'admin-super-01') {
  const existing = globalState.orders.find((o) => o.id === orderId || o.order_id === orderId);
  if (!existing) {
    return null;
  }

  const order = updateSubscriptionOrder(orderId, {
    payment_status: 'settlement',
    admin_notes: `Disetujui oleh Superadmin (${adminId})`,
  });

  if (order) {
    // Upgrade plan
    updateUserPlan(order.user_id, 'pro');

    // Audit logs (both PAYMENT_APPROVE and PAYMENT_APPROVE_MANUAL)
    logAuditEvent({
      admin_id: adminId,
      target_user_id: order.user_id,
      action: 'PAYMENT_APPROVE_MANUAL',
      details: {
        orderId: order.order_id,
        amount: order.amount,
        plan: order.plan,
        method: order.payment_type,
      },
    });
    logAuditEvent({
      admin_id: adminId,
      target_user_id: order.user_id,
      action: 'PAYMENT_APPROVE',
      details: { orderId: order.order_id },
    });
  }

  return order;
}

export function rejectManualPaymentOrder(orderId: string, adminId = 'admin-super-01', reason = 'Bukti pembayaran tidak valid') {
  const existing = globalState.orders.find((o) => o.id === orderId || o.order_id === orderId);
  if (!existing) {
    return null;
  }

  const order = updateSubscriptionOrder(orderId, {
    payment_status: 'rejected',
    admin_notes: `Ditolak oleh Superadmin (${adminId}): ${reason}`,
  });

  if (order) {
    logAuditEvent({
      admin_id: adminId,
      target_user_id: order.user_id,
      action: 'PAYMENT_REJECT_MANUAL',
      details: { orderId: order.order_id, reason },
    });
    logAuditEvent({
      admin_id: adminId,
      target_user_id: order.user_id,
      action: 'PAYMENT_REJECT',
      details: { orderId: order.order_id, reason },
    });
  }

  return order;
}

// -------------------------------------------------------------
// MULTI-AI PROVIDER CONFIG & TELEMETRY
// -------------------------------------------------------------
export function getAiProvidersList(): AiProviderConfig[] {
  return [...globalState.providers].sort((a, b) => a.priority - b.priority);
}

export function updateAiProviderConfig(id: string, updates: Partial<AiProviderConfig>) {
  const provider = globalState.providers.find((p) => p.id === id);
  if (provider) {
    Object.assign(provider, updates);
    logAuditEvent({
      admin_id: 'admin-super-01',
      action: 'AI_CONFIG_CHANGE',
      details: { providerId: id, updates },
    });
  }
  return provider;
}

export function recordProviderTelemetry(id: string, latencyMs: number, success: boolean) {
  const provider = globalState.providers.find((p) => p.id === id);
  if (provider) {
    provider.total_calls += 1;
    if (!success) {
      provider.error_count += 1;
    }
    // Exponential moving average for latency
    provider.latency_ms = Math.round(provider.latency_ms * 0.8 + latencyMs * 0.2);
    provider.error_rate = Number(
      ((provider.error_count / provider.total_calls) * 100).toFixed(2)
    );
  }
}

// -------------------------------------------------------------
// TELEGRAM BROADCAST MANAGEMENT
// -------------------------------------------------------------
export function getBroadcastHistory(): BroadcastRecord[] {
  try {
    if (fs.existsSync(BROADCAST_FILE)) {
      const raw = fs.readFileSync(BROADCAST_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        globalState.broadcasts = data;
        return [...globalState.broadcasts];
      }
    }
  } catch (err) {
    console.warn('[AdminStore] Gagal membaca file histori broadcast:', err);
  }

  if (!globalState.broadcasts || globalState.broadcasts.length === 0) {
    globalState.broadcasts = loadBroadcastHistoryFromFile();
  }
  return [...globalState.broadcasts];
}

export function saveBroadcastRecord(record: BroadcastRecord): BroadcastRecord {
  if (!globalState.broadcasts) {
    globalState.broadcasts = [];
  }
  globalState.broadcasts.unshift(record);
  if (globalState.broadcasts.length > 200) {
    globalState.broadcasts.pop();
  }
  saveBroadcastHistoryToFile(globalState.broadcasts);
  return record;
}

export function getBroadcastRecipients(targetPlan: 'all' | 'starter' | 'pro' = 'all') {
  const users = getUsers();
  // Ensure active user 8831965887 is explicitly included in recipient pool if not already in users
  const hasActiveUser = users.some((u) => Number(u.telegram_id) === 8831965887);
  if (!hasActiveUser) {
    users.unshift({
      id: 'usr-active-01',
      full_name: 'Budi Santoso (Active)',
      phone_number: '0812-8899-7766',
      phone_verified: true,
      telegram_id: 8831965887,
      telegram_connected: true,
      plan: 'pro',
      default_currency: 'IDR',
      reminder_enabled: true,
      reminder_frequency: 1,
      reminder_time_1: '08:00:00',
      reminder_time_2: '20:00:00',
      created_at: '2026-09-01T08:00:00+07:00',
    });
  }

  const normalizedTarget = (targetPlan || 'all').toLowerCase().trim();
  const seen = new Set<number>();
  const recipients: Array<{ id: string; full_name: string; telegram_id: number; plan: 'starter' | 'pro' }> = [];

  for (const u of users) {
    if (!u.telegram_id) continue;
    const tid = Number(u.telegram_id);
    if (!tid || seen.has(tid)) continue;

    const userPlan = ((u.plan || 'starter').toLowerCase().trim() as 'starter' | 'pro');
    if (normalizedTarget === 'all' || userPlan === normalizedTarget) {
      seen.add(tid);
      recipients.push({
        id: u.id,
        full_name: u.full_name,
        telegram_id: tid,
        plan: userPlan,
      });
    }
  }

  return recipients;
}
