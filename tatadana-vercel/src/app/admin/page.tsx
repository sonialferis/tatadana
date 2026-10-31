'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Users,
  Cpu,
  CreditCard,
  History,
  FileDown,
  Key,
  CheckCircle2,
  XCircle,
  Eye,
  ArrowLeft,
  Lock,
  Sparkles,
  Plus,
  Trash2,
  Receipt,
  X,
  AlertCircle,
  Clock,
  Activity,
  Megaphone,
  Send,
  Loader2,
  Globe,
  Crown,
  Info,
  Check,
  Radio,
  ExternalLink,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { formatRupiah, formatTanggalWIB } from '@/lib/formatters';
import { BroadcastRecord } from '@/lib/types';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'ai' | 'payments' | 'ai_logs' | 'audit' | 'broadcast'>('users');
  const [aiMode, setAiMode] = useState<'single' | 'parallel'>('parallel');

  // AI Providers configuration state
  const [providers, setProviders] = useState([
    { id: 'p-1', name: 'Google Gemini', model: 'gemini-1.5-flash', active: true, priority: 1, key: 'AIzaSyD***masked' },
    { id: 'p-2', name: 'OpenAI GPT', model: 'gpt-4o-mini', active: true, priority: 2, key: 'sk-proj-***masked' },
    { id: 'p-3', name: 'DeepSeek', model: 'deepseek-chat', active: false, priority: 3, key: 'sk-ds-***masked' },
  ]);

  // Dynamic users list & approval state
  const [users, setUsers] = useState<any[]>([
    { id: 'usr-1', name: 'Budi Santoso', email: 'budi@tatadana.id', phone: '081288997766', plan: 'pro', status: 'approved', telegram: 'Connected (ID: 8831965887)', txCount: 43 },
    { id: 'usr-2', name: 'Siti Rahma', email: 'siti@gmail.com', phone: '081399881122', plan: 'starter', status: 'approved', telegram: 'Connected (ID: 987654321)', txCount: 28 },
    { id: 'usr-3', name: 'Andi Wijaya', email: 'andi@gmail.com', phone: '085712345678', plan: 'starter', status: 'pending', telegram: 'Not Connected', txCount: 4 },
    { id: 'usr-4', name: 'Dewi Lestari', email: 'dewi@gmail.com', phone: '081922334455', plan: 'starter', status: 'approved', telegram: 'Connected (ID: 556677889)', txCount: 12 },
    { id: 'usr-5', name: 'Dimas Aditya', email: 'dimas@gmail.com', phone: '081299001122', plan: 'pro', status: 'approved', telegram: 'Connected (ID: 123456789)', txCount: 15 },
  ]);
  const [userFilter, setUserFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);

  // Telegram Broadcast states
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastRecord[]>([
    {
      id: 'bc-sample-01',
      title: 'Selamat Datang di TataDana Bot v1.0',
      message: 'Halo Sobat TataDana! 🎉\n\nKini Anda dapat mencatat pengeluaran & pemasukan harian langsung via Telegram dengan AI pintar kami.',
      targetPlan: 'all',
      totalSent: 3,
      totalFailed: 0,
      sentAt: '2026-10-12T10:00:00+07:00',
    },
  ]);
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [targetPlan, setTargetPlan] = useState<'all' | 'starter' | 'pro'>('all');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<{
    type: 'success' | 'error';
    text: string;
    details?: string;
  } | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [viewingBroadcastDetail, setViewingBroadcastDetail] = useState<BroadcastRecord | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch broadcasts on mount and parse tab query parameter with strict admin auth guard
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('tatadana_auth_role');
      const email = localStorage.getItem('tatadana_admin_email');
      // Proteksi: Panel admin HANYA untuk Administrator (sonialferis@gmail.com)
      if (role !== 'admin' || email !== 'sonialferis@gmail.com') {
        setIsAuthorized(false);
        window.location.href = '/auth/login';
        return;
      }
      setIsAuthorized(true);

      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['users', 'ai', 'payments', 'ai_logs', 'audit', 'broadcast'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }

    async function loadBroadcasts() {
      try {
        const res = await fetch('/api/admin/broadcast');
        const data = await res.json();
        if (data.ok && Array.isArray(data.broadcasts)) {
          setBroadcastHistory(data.broadcasts);
        }
      } catch (err) {
        console.warn('Failed to load broadcasts from API:', err);
      }
    }

    async function loadUsers() {
      try {
        const res = await fetch('/api/admin/users');
        const data = await res.json();
        if (data.ok && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      } catch (err) {
        console.warn('Failed to load users from API:', err);
      }
    }

    loadBroadcasts();
    loadUsers();
  }, []);


  // Manual payment orders pending approval
  const [payments, setPayments] = useState([
    { id: 'ORD-1092', user: 'Dimas Aditya', plan: 'pro', amount: 99000, method: 'Transfer BCA Manual', proof: 'bukti_transfer_dimas.jpg', status: 'pending' },
    { id: 'ORD-1093', user: 'Rina Marlina', plan: 'starter', amount: 49000, method: 'Midtrans QRIS', proof: 'Auto Settlement', status: 'settlement' },
  ]);

  // AI Invocation Logs (Part 10: Log AI untuk monitoring biaya & failover)
  const [aiLogs, setAiLogs] = useState([
    { id: 'log-1', timestamp: '2026-10-10 12:35:10 WIB', provider: 'Gemini 1.5 Flash', type: 'OCR Struk Belanja', latency: 342, tokens: 418, cost: 24, status: 'success', excerpt: 'Indomaret Point: 4 item, total Rp 68.500' },
    { id: 'log-2', timestamp: '2026-10-10 12:30:22 WIB', provider: 'Gemini 1.5 Flash', type: 'Text Natural Parser', latency: 185, tokens: 120, cost: 8, status: 'success', excerpt: 'beli bakso 15rb -> Pengeluaran Rp 15.000' },
    { id: 'log-3', timestamp: '2026-10-10 11:15:04 WIB', provider: 'Groq Llama-3.1', type: 'Failover Trigger', latency: 120, tokens: 95, cost: 0, status: 'failover', excerpt: 'Failover cascade aktivasi sukses' },
    { id: 'log-4', timestamp: '2026-10-10 09:40:12 WIB', provider: 'Gemini Multimodal Audio', type: 'Voice Note STT', latency: 512, tokens: 280, cost: 16, status: 'success', excerpt: 'Transkrip: bayar servis motor 135rb' },
  ]);

  // Audit Logs (Part 10: Audit log setiap akses data pengguna)
  const [auditLogs, setAuditLogs] = useState<string[]>([
    '[2026-10-10 12:20:15 WIB] ADMIN-01 viewed transactions of USER-01 (Budi Santoso) - Reason: Support sync debugging.',
    '[2026-10-10 10:45:00 WIB] SYSTEM auto-verified Midtrans settlement ORD-1093.',
    '[2026-10-10 09:12:30 WIB] ADMIN-01 updated Gemini API Token with encrypted key.',
  ]);

  // User Transactions Inspection Modal State
  const [inspectingUser, setInspectingUser] = useState<typeof users[0] | null>(null);

  // New Provider Modal State
  const [isAddProviderOpen, setIsAddProviderOpen] = useState(false);
  const [newProvName, setNewProvName] = useState('');
  const [newProvModel, setNewProvModel] = useState('');
  const [newProvKey, setNewProvKey] = useState('');

  const handleApprove = (id: string) => {
    setPayments(payments.map(p => p.id === id ? { ...p, status: 'settlement' } : p));
    setAuditLogs(prev => [
      `[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB] ADMIN-01 manual approved payment ${id}.`,
      ...prev,
    ]);
  };

  const handleReject = (id: string) => {
    setPayments(payments.map(p => p.id === id ? { ...p, status: 'rejected' } : p));
    setAuditLogs(prev => [
      `[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB] ADMIN-01 manual rejected payment ${id}.`,
      ...prev,
    ]);
  };

  // Impersonation state & handler (Part 10)
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  const handleImpersonate = async (targetUser: typeof users[0]) => {
    setImpersonatingId(targetUser.id);
    const reason = `Superadmin inspection for support troubleshooting of ${targetUser.name}`;
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: targetUser.id,
          targetUserName: targetUser.name,
          reason,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setAuditLogs((prev) => [
          `[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB] ADMIN-01 started impersonation of ${targetUser.name} (${targetUser.id}).`,
          ...prev,
        ]);
        window.location.href = `/dashboard?impersonate=${targetUser.id}`;
      } else {
        alert(`Gagal memulai impersonasi: ${data.error || 'Unknown error'}`);
        setImpersonatingId(null);
      }
    } catch (err: any) {
      alert(`Gagal memulai impersonasi: ${err.message}`);
      setImpersonatingId(null);
    }
  };

  const handleInspectUserTransactions = (user: typeof users[0]) => {
    setInspectingUser(user);
    // Record audit log entry per Part 10 requirement
    const logEntry = `[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB] ADMIN-01 viewed transactions of ${user.name} (${user.id}) - Reason: Support & Troubleshooting.`;
    setAuditLogs(prev => [logEntry, ...prev]);
  };

  const handleApproveUser = async (user: any) => {
    setIsApprovingId(user.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', userId: user.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users);
        const logEntry = `[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB] ADMIN-01 menyetujui akun pelanggan ${user.name} (${user.email || user.id}).`;
        setAuditLogs(prev => [logEntry, ...prev]);
      } else {
        alert(data.error || 'Gagal menyetujui pengguna.');
      }
    } catch (err: any) {
      alert('Gagal menyetujui pengguna: ' + err.message);
    } finally {
      setIsApprovingId(null);
    }
  };

  const handleRejectUser = async (user: any) => {
    const reason = prompt(`Masukkan alasan penolakan untuk pendaftaran ${user.name}:`, 'Data verifikasi tidak sesuai');
    if (reason === null) return;

    setIsApprovingId(user.id);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', userId: user.id, reason }),
      });
      const data = await res.json();
      if (data.ok) {
        setUsers(data.users);
        const logEntry = `[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB] ADMIN-01 menolak akun pelanggan ${user.name} (${user.email || user.id}) - Alasan: ${reason}.`;
        setAuditLogs(prev => [logEntry, ...prev]);
      } else {
        alert(data.error || 'Gagal menolak pengguna.');
      }
    } catch (err: any) {
      alert('Gagal menolak pengguna: ' + err.message);
    } finally {
      setIsApprovingId(null);
    }
  };

  const handleExportAllUsers = () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      superadmin: 'ADMIN-01',
      total_users: users.length,
      users,
      payments,
      ai_mode: aiMode,
      providers: providers.map(p => ({ name: p.name, model: p.model, active: p.active })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TataDana_Database_Dump_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAddProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProvName.trim() || !newProvKey.trim()) return;

    const newP = {
      id: `p-${Date.now()}`,
      name: newProvName.trim(),
      model: newProvModel.trim() || 'default-chat',
      active: true,
      priority: providers.length + 1,
      key: `${newProvKey.slice(0, 7)}***masked`,
    };

    setProviders([...providers, newP]);
    setAuditLogs(prev => [
      `[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB] ADMIN-01 added new AI Provider: ${newP.name} (${newP.model}).`,
      ...prev,
    ]);

    setIsAddProviderOpen(false);
    setNewProvName('');
    setNewProvModel('');
    setNewProvKey('');
  };

  const handleDeleteProvider = (id: string) => {
    const p = providers.find(x => x.id === id);
    if (!p) return;
    if (confirm(`Hapus provider ${p.name}?`)) {
      setProviders(providers.filter(x => x.id !== id));
      setAuditLogs(prev => [
        `[${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB] ADMIN-01 removed AI Provider: ${p.name}.`,
        ...prev,
      ]);
    }
  };

  const insertTag = (openTag: string, closeTag: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);
    const replacement = `${openTag}${selected || 'teks'}${closeTag}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setBroadcastMessage(newText);
    setTimeout(() => {
      el.focus();
      const cursorTarget = start + openTag.length + (selected ? selected.length : 4);
      el.setSelectionRange(cursorTarget, cursorTarget);
    }, 40);
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const newText = text.substring(0, start) + emoji + text.substring(end);
    setBroadcastMessage(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 40);
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) {
      setBroadcastStatus({
        type: 'error',
        text: 'Judul pengumuman dan isi pesan broadcast wajib diisi.',
      });
      return;
    }

    setIsSendingBroadcast(true);
    setBroadcastStatus(null);
    setIsConfirmDialogOpen(false);

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          targetPlan,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setBroadcastStatus({
          type: 'success',
          text: `Broadcast berhasil dikirim! ${data.totalSent} pesan terkirim (${data.totalFailed} gagal).`,
          details: `Broadcast ID: ${data.broadcastId}`,
        });

        if (data.record) {
          setBroadcastHistory((prev) => [data.record, ...prev]);
        }

        const nowStr = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
        setAuditLogs((prev) => [
          `[${nowStr} WIB] ADMIN-01 sent Telegram broadcast: "${broadcastTitle}" to target [${targetPlan.toUpperCase()}] (${data.totalSent} sent, ${data.totalFailed} failed).`,
          ...prev,
        ]);

        setBroadcastTitle('');
        setBroadcastMessage('');
      } else {
        setBroadcastStatus({
          type: 'error',
          text: data.error || 'Gagal mengirim broadcast Telegram.',
        });
      }
    } catch (err: any) {
      setBroadcastStatus({
        type: 'error',
        text: err?.message || 'Terjadi kesalahan saat menghubungi API broadcast.',
      });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const renderTelegramHtml = (text: string) => {
    if (!text) {
      return (
        <span className="italic text-slate-500">
          Tuliskan isi pengumuman pada textarea di sebelah kiri untuk melihat pratinjau pesan langsung di sini...
        </span>
      );
    }
    const sanitized = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, '<strong class="font-bold text-white">$1</strong>')
      .replace(/&lt;strong&gt;([\s\S]*?)&lt;\/strong&gt;/gi, '<strong class="font-bold text-white">$1</strong>')
      .replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/gi, '<em class="italic text-slate-300">$1</em>')
      .replace(/&lt;em&gt;([\s\S]*?)&lt;\/em&gt;/gi, '<em class="italic text-slate-300">$1</em>')
      .replace(/&lt;code&gt;([\s\S]*?)&lt;\/code&gt;/gi, '<code class="bg-black/40 text-amber-300 px-1 py-0.5 rounded font-mono text-[11px]">$1</code>')
      .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi, '<span class="underline underline-offset-2">$1</span>')
      .replace(/&lt;s&gt;([\s\S]*?)&lt;\/s&gt;/gi, '<span class="line-through text-slate-400">$1</span>')
      .replace(/&lt;a\s+href=[&quot;'](.*?)[\&quot;']&gt;([\s\S]*?)&lt;\/a&gt;/gi, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-orange-400 underline underline-offset-2 hover:text-orange-300">$2</a>')
      .replace(/\n/g, '<br/>');

    return <div dangerouslySetInnerHTML={{ __html: sanitized }} className="leading-relaxed break-words" />;
  };

  // Block customer access: Render 403 Forbidden view if unauthorized
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center font-sans">
        <div className="max-w-md w-full bg-slate-800 border border-rose-500/30 p-8 rounded-3xl shadow-2xl space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">Akses Ditolak (403 Forbidden)</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Panel Admin dilindungi secara ketat dan hanya dapat diakses oleh Administrator resmi dengan email <b>sonialferis@gmail.com</b>. Akun pelanggan tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <div className="pt-2">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition shadow-md"
            >
              <span>Kembali ke Halaman Masuk</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans p-6 sm:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
              title="Kembali ke Dashboard User"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-orange-500" />
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  Superadmin Panel
                </h1>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                  Superadmin Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Kelola API multi-provider, impersonation pengguna, approval Midtrans, log AI &amp; audit log.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Admin Profile Pill */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 font-black text-xs shadow-sm">
                SA
              </div>
              <div className="text-left leading-tight">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>Soni Alferis</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                    Superadmin Terverifikasi
                  </span>
                </div>
                <div className="text-[10px] text-amber-400 font-mono">sonialferis@gmail.com</div>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ke Dashboard TataDana</span>
            </Link>

            <button
              onClick={handleExportAllUsers}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition active:scale-95"
            >
              <FileDown className="w-4 h-4 text-orange-500" />
              Export Data (JSON)
            </button>

            {/* Logout Admin Button */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('tatadana_auth_role');
                  localStorage.removeItem('tatadana_admin_email');
                  localStorage.removeItem('tatadana_admin_name');
                }
                window.location.href = '/auth/login';
              }}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95"
              title="Keluar dari Panel Admin"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar Admin</span>
            </button>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700 w-fit overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Kelola Pengguna</span>
            {users.filter((u) => u.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black animate-pulse">
                {users.filter((u) => u.status === 'pending').length} Menunggu
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ai' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Engine Multi-AI
          </button>
          <button
            onClick={() => setActiveTab('ai_logs')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ai_logs' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            Log AI ({aiLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'payments' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Pembayaran &amp; Midtrans
          </button>
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'broadcast' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            📢 Broadcast Telegram
            {broadcastHistory.length > 0 && (
              <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full font-mono">
                {broadcastHistory.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'audit' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            Audit Log Privasi ({auditLogs.length})
          </button>
        </div>

        {/* TAB 1: USERS & APPROVAL MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* High Priority Banner if Pending Users Exist */}
            {users.filter((u) => u.status === 'pending').length > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                    <Clock className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>Persetujuan Pelanggan Diperlukan</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                        {users.filter((u) => u.status === 'pending').length} Akun Baru
                      </span>
                    </h4>
                    <p className="text-xs text-amber-200/80 mt-0.5">
                      Pelanggan baru tidak dapat masuk atau mengakses dashboard sebelum disetujui oleh Anda.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setUserFilter('pending')}
                  className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm"
                >
                  <span>Tampilkan Hanya Pending</span>
                </button>
              </div>
            )}

            <div className="bg-slate-800/60 rounded-3xl border border-slate-700 overflow-hidden shadow-xl">
              <div className="p-6 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-base text-white">Daftar Pengguna &amp; Persetujuan Akun</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Kelola otorisasi akun pelanggan, status persetujuan, dan impersonasi pengguna.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      userFilter === 'all' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua ({users.length})
                  </button>
                  <button
                    onClick={() => setUserFilter('pending')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      userFilter === 'pending'
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-amber-400 hover:text-white'
                    }`}
                  >
                    <span>Pending</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 font-mono">
                      {users.filter((u) => u.status === 'pending').length}
                    </span>
                  </button>
                  <button
                    onClick={() => setUserFilter('approved')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      userFilter === 'approved' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Disetujui ({users.filter((u) => u.status === 'approved').length})
                  </button>
                  <button
                    onClick={() => setUserFilter('rejected')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      userFilter === 'rejected' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Ditolak ({users.filter((u) => u.status === 'rejected').length})
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700">
                    <tr>
                      <th className="px-6 py-4">Nama &amp; Email Pengguna</th>
                      <th className="px-6 py-4">Nomor HP (WhatsApp)</th>
                      <th className="px-6 py-4">Paket Plan</th>
                      <th className="px-6 py-4">Status Akun</th>
                      <th className="px-6 py-4">Bot Telegram</th>
                      <th className="px-6 py-4 text-right">Aksi Superadmin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {users
                      .filter((u) => {
                        if (userFilter === 'all') return true;
                        return u.status === userFilter;
                      })
                      .map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800 transition">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {u.role === 'admin' && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {u.email || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-300">{u.phone}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              u.plan === 'pro'
                                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                                : 'bg-slate-700 text-slate-300'
                            }`}>
                              {u.plan}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.status === 'pending' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Menunggu Persetujuan</span>
                              </span>
                            )}
                            {u.status === 'approved' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Disetujui (Aktif)</span>
                              </span>
                            )}
                            {u.status === 'rejected' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                <XCircle className="w-3 h-3 text-rose-400" />
                                <span>Ditolak</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-300">{u.telegram || 'Not Connected'}</td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {/* IF PENDING: Show Approve & Reject buttons */}
                            {u.status === 'pending' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveUser(u)}
                                  disabled={isApprovingId === u.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50"
                                  title="Setujui pendaftaran pelanggan ini agar dapat masuk"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isApprovingId === u.id ? 'Memproses...' : 'Setujui (Approve)'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectUser(u)}
                                  disabled={isApprovingId === u.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition disabled:opacity-50"
                                  title="Tolak pendaftaran pelanggan ini"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>Tolak</span>
                                </button>
                              </>
                            )}

                            {/* IF APPROVED: Show Transactions, Impersonate, and Reject option */}
                            {u.status === 'approved' && u.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleInspectUserTransactions(u)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition"
                                  title="Lihat isi transaksi pengguna (tercatat di audit log)"
                                >
                                  <Receipt className="w-3.5 h-3.5 text-orange-400" />
                                  <span>Transaksi</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleImpersonate(u)}
                                  disabled={impersonatingId === u.id}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                                  title="Masuk sebagai user ini tanpa re-login"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>{impersonatingId === u.id ? 'Memproses...' : 'Impersonasi'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectUser(u)}
                                  className="inline-flex items-center px-2 py-1.5 text-slate-400 hover:text-rose-400 text-xs transition"
                                  title="Nonaktifkan / Cabut persetujuan akun"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {/* IF REJECTED: Show Re-approve button */}
                            {u.status === 'rejected' && (
                              <button
                                type="button"
                                onClick={() => handleApproveUser(u)}
                                disabled={isApprovingId === u.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-emerald-600 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition"
                                title="Beri persetujuan ulang akun ini"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Setujui Ulang</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MULTI-AI ENGINE & FAILOVER */}
        {activeTab === 'ai' && (
          <div className="bg-slate-800/60 rounded-3xl border border-slate-700 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-white">Konfigurasi Multi-AI Provider Terenkripsi</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Admin dapat menambah/menghapus provider (Gemini, GPT, DeepSeek) &amp; memilih mode failover otomatis.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Failover Mode Switcher */}
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-700 text-xs">
                  <button
                    onClick={() => setAiMode('single')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${aiMode === 'single' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}
                  >
                    Single Provider
                  </button>
                  <button
                    onClick={() => setAiMode('parallel')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${aiMode === 'parallel' ? 'bg-orange-600 text-white' : 'text-slate-400'}`}
                  >
                    Paralel (Failover)
                  </button>
                </div>

                <button
                  onClick={() => setIsAddProviderOpen(true)}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Provider
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {providers.map((p) => (
                <div key={p.id} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">{p.name}</h4>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-mono">
                        Model: {p.model}
                      </span>
                      {p.active && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          Prioritas #{p.priority}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-orange-400" />
                      <span>API Key: {p.key}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert(`Pengaturan token untuk ${p.name} tersimpan terenkripsi di database.`)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition"
                    >
                      Ubah Token
                    </button>
                    {providers.length > 1 && (
                      <button
                        onClick={() => handleDeleteProvider(p.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
                        title="Hapus Provider"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: AI INVOCATION LOGS (PART 10) */}
        {activeTab === 'ai_logs' && (
          <div className="bg-slate-800/60 rounded-3xl border border-slate-700 overflow-hidden shadow-xl space-y-4 p-6">
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <div>
                <h3 className="font-extrabold text-base text-white">Log Panggilan AI &amp; Monitoring Biaya</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audit latensi, model aktif, konsumsi token, dan estimasi biaya per inferensi.
                </p>
              </div>
              <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded-xl font-mono text-emerald-400">
                Mode: {aiMode === 'parallel' ? 'Failover Cascading' : 'Single Engine'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Waktu (WIB)</th>
                    <th className="px-4 py-3">Provider &amp; Tipe</th>
                    <th className="px-4 py-3">Latensi</th>
                    <th className="px-4 py-3">Token</th>
                    <th className="px-4 py-3">Estimasi Biaya</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Cuplikan Prompt / Output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono">
                  {aiLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/80 transition">
                      <td className="px-4 py-3 text-[11px] text-slate-400">{log.timestamp}</td>
                      <td className="px-4 py-3 font-sans">
                        <span className="font-bold text-white block">{log.provider}</span>
                        <span className="text-[10px] text-slate-400">{log.type}</span>
                      </td>
                      <td className="px-4 py-3 text-amber-400 font-bold">{log.latency} ms</td>
                      <td className="px-4 py-3">{log.tokens} tok</td>
                      <td className="px-4 py-3 text-emerald-400">{formatRupiah(log.cost)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.status === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-sans text-xs text-slate-300 max-w-xs truncate">
                        {log.excerpt}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MIDTRANS & MANUAL PAYMENTS */}
        {activeTab === 'payments' && (
          <div className="bg-slate-800/60 rounded-3xl border border-slate-700 p-6 sm:p-8 space-y-6 shadow-xl">
            <div>
              <h3 className="font-extrabold text-base text-white">Approval Pembayaran Berlangganan</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Konfirmasi transaksi transfer manual atau pantau webhook otomatis Midtrans.
              </p>
            </div>

            <div className="space-y-3">
              {payments.map((ord) => (
                <div key={ord.id} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-orange-400 font-bold">{ord.id}</span>
                      <span className="font-bold text-white text-sm">{ord.user}</span>
                      <span className="text-[10px] uppercase font-bold bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                        {ord.plan}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {ord.method} — {formatRupiah(ord.amount)} | Bukti: <span className="underline cursor-pointer text-slate-300">{ord.proof}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {ord.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApprove(ord.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(ord.id)}
                          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        ord.status === 'settlement' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {ord.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: BROADCAST TELEGRAM */}
        {activeTab === 'broadcast' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* BROADCAST HEADER BANNER */}
            <div className="bg-gradient-to-r from-orange-950/40 via-slate-800/80 to-slate-900/80 border border-orange-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-xl">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <h3 className="font-extrabold text-lg text-white">Broadcast Pesan Massal Telegram</h3>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Bot Aktif: @ituson_bot
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Kirim pengumuman massal, pembaruan fitur, edukasi finansial, atau promo upgrade Pro ke seluruh pengguna bot Telegram langsung dari dashboard admin.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-300 font-mono flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-orange-400" />
                  Total Riwayat: <b className="text-white">{broadcastHistory.length}</b>
                </span>
              </div>
            </div>

            {/* STATUS ALERT BANNER */}
            {broadcastStatus && (
              <div
                className={`p-4 rounded-2xl border flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${
                  broadcastStatus.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {broadcastStatus.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold">{broadcastStatus.text}</p>
                    {broadcastStatus.details && (
                      <p className="font-mono text-[11px] opacity-80">{broadcastStatus.details}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setBroadcastStatus(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* COMPOSE SECTION & LIVE PREVIEW (2-COLUMN GRID) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* LEFT COLUMN: COMPOSE SECTION */}
              <div className="lg:col-span-7 bg-slate-800/60 rounded-3xl border border-slate-700 p-6 sm:p-7 space-y-6 shadow-xl">
                <div className="border-b border-slate-700/80 pb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-orange-500" />
                      Tulis Pengumuman Baru
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pesan akan dikirim menggunakan format resmi HTML Telegram dengan branding TataDana.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBroadcastTitle('');
                      setBroadcastMessage('');
                      setTargetPlan('all');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 transition underline underline-offset-2"
                  >
                    Reset Form
                  </button>
                </div>

                <div className="space-y-5 text-xs">
                  {/* 1. INPUT JUDUL */}
                  <div>
                    <label className="block font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                      <span>Judul Pengumuman</span>
                      <span className="text-[10px] text-slate-400 font-mono">Wajib diisi</span>
                    </label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      placeholder="Contoh: 🚀 Fitur Baru: AI Voice Note Scanner Telah Rilis!"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-white placeholder-slate-500 font-medium focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition"
                    />
                  </div>

                  {/* 2. FILTER TARGET PENERIMA */}
                  <div>
                    <label className="block font-bold text-slate-200 mb-2 flex items-center justify-between">
                      <span>Target Pengguna</span>
                      <span className="text-[10px] text-orange-400 font-bold">
                        {targetPlan === 'all'
                          ? 'Seluruh User Aktif (~4 akun)'
                          : targetPlan === 'pro'
                          ? 'Pengguna Paket Pro (~2 akun)'
                          : 'Pengguna Paket Starter (~2 akun)'}
                      </span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setTargetPlan('all')}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                          targetPlan === 'all'
                            ? 'bg-orange-600/20 border-orange-500 text-white shadow-lg shadow-orange-600/10'
                            : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <Globe className={`w-4 h-4 ${targetPlan === 'all' ? 'text-orange-400' : 'text-slate-500'}`} />
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            targetPlan === 'all' ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            SEMUA
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">Semua User</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Starter &amp; Pro aktif</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetPlan('pro')}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                          targetPlan === 'pro'
                            ? 'bg-amber-600/20 border-amber-500 text-white shadow-lg shadow-amber-600/10'
                            : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <Crown className={`w-4 h-4 ${targetPlan === 'pro' ? 'text-amber-400' : 'text-slate-500'}`} />
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            targetPlan === 'pro' ? 'bg-amber-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-400'
                          }`}>
                            PRO
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">Paket Pro Saja</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Pelanggan premium</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTargetPlan('starter')}
                        className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                          targetPlan === 'starter'
                            ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg shadow-emerald-600/10'
                            : 'bg-slate-900/60 border-slate-700/80 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <ShieldAlert className={`w-4 h-4 ${targetPlan === 'starter' ? 'text-emerald-400' : 'text-slate-500'}`} />
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            targetPlan === 'starter' ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'
                          }`}>
                            STARTER
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-xs text-white">Paket Starter</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Promo upgrade Pro</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* 3. QUICK FORMATTING TOOLBAR */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-slate-200">
                        Isi Pesan Broadcast (Format HTML Telegram)
                      </label>
                      <span className="text-[10px] text-slate-400">Klik tombol cepat di bawah</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-900/90 border border-slate-700 rounded-t-2xl">
                      <button
                        type="button"
                        onClick={() => insertTag('<b>', '</b>')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold font-mono transition"
                        title="Tebal (Bold)"
                      >
                        &lt;b&gt;B&lt;/b&gt;
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<i>', '</i>')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs italic font-serif transition"
                        title="Miring (Italic)"
                      >
                        &lt;i&gt;I&lt;/i&gt;
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<code>', '</code>')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition"
                        title="Kode (Monospace)"
                      >
                        &lt;code&gt;
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<u>', '</u>')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono underline transition"
                        title="Garis Bawah (Underline)"
                      >
                        &lt;u&gt;U&lt;/u&gt;
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<s>', '</s>')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono line-through transition"
                        title="Coret (Strikethrough)"
                      >
                        &lt;s&gt;S&lt;/s&gt;
                      </button>
                      <button
                        type="button"
                        onClick={() => insertTag('<a href="https://">', '</a>')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono transition"
                        title="Link Web (Anchor)"
                      >
                        &lt;a&gt;
                      </button>
                      <div className="h-4 w-px bg-slate-700 mx-1" />
                      <button
                        type="button"
                        onClick={() => insertEmoji('🚀 ')}
                        className="p-1 hover:bg-slate-800 rounded-lg transition text-sm"
                        title="Emoji Rocket"
                      >
                        🚀
                      </button>
                      <button
                        type="button"
                        onClick={() => insertEmoji('🎉 ')}
                        className="p-1 hover:bg-slate-800 rounded-lg transition text-sm"
                        title="Emoji Party"
                      >
                        🎉
                      </button>
                      <button
                        type="button"
                        onClick={() => insertEmoji('💡 ')}
                        className="p-1 hover:bg-slate-800 rounded-lg transition text-sm"
                        title="Emoji Lampu"
                      >
                        💡
                      </button>
                      <button
                        type="button"
                        onClick={() => insertEmoji('⚠️ ')}
                        className="p-1 hover:bg-slate-800 rounded-lg transition text-sm"
                        title="Emoji Peringatan"
                      >
                        ⚠️
                      </button>
                      <button
                        type="button"
                        onClick={() => insertEmoji('💰 ')}
                        className="p-1 hover:bg-slate-800 rounded-lg transition text-sm"
                        title="Emoji Uang"
                      >
                        💰
                      </button>
                      <button
                        type="button"
                        onClick={() => insertEmoji('📊 ')}
                        className="p-1 hover:bg-slate-800 rounded-lg transition text-sm"
                        title="Emoji Grafik"
                      >
                        📊
                      </button>
                    </div>

                    <textarea
                      ref={textareaRef}
                      rows={6}
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      placeholder="Halo Sobat TataDana! 🎉&#10;&#10;Kami baru saja memperbarui bot dengan fitur pencatatan pintar terbaru.&#10;&#10;Gunakan tag <b>tebal</b>, <i>miring</i>, atau <code>kode</code> untuk mempercantik pengumuman."
                      className="w-full px-4 py-3 bg-slate-900 border-x border-b border-slate-700 rounded-b-2xl text-white placeholder-slate-500 font-mono text-xs focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition leading-relaxed resize-y"
                    />
                  </div>

                  {/* 4. TOMBOL AKSI KIRIM DENGAN DIALOG KONFIRMASI */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-700/80">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-orange-400" />
                      Konfirmasi dialog aktif sebelum pengiriman massal
                    </span>

                    <button
                      type="button"
                      disabled={isSendingBroadcast || !broadcastTitle.trim() || !broadcastMessage.trim()}
                      onClick={() => setIsConfirmDialogOpen(true)}
                      className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                    >
                      {isSendingBroadcast ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sedang Mengirim...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Kirim Broadcast</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: LIVE PREVIEW BOX (ORANGE-WHITE PREMIUM FINTECH STYLING) */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                    <h4 className="font-extrabold text-sm text-white">Live Preview Telegram</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700 font-mono">
                    Telegram App Styling
                  </span>
                </div>

                {/* TELEGRAM MOCK FRAME */}
                <div className="bg-slate-950 rounded-3xl border border-slate-700/90 overflow-hidden shadow-2xl flex flex-col">
                  {/* APP TOP BAR */}
                  <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-extrabold shadow-md border border-orange-400/40">
                        TD
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-xs text-white leading-none">TataDana Official</h5>
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 fill-blue-400/20" />
                        </div>
                        <p className="text-[10px] text-orange-400 font-mono mt-0.5">@ituson_bot • bot</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                        Online
                      </span>
                    </div>
                  </div>

                  {/* CHAT AREA WITH PREVIEW BUBBLE */}
                  <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-900/60 via-slate-950 to-slate-950 min-h-[380px] flex flex-col justify-start">
                    {/* DATE PILL */}
                    <div className="self-center mb-4">
                      <span className="text-[10px] bg-slate-800/80 text-slate-300 px-3 py-1 rounded-full font-mono border border-slate-700/50">
                        Hari Ini
                      </span>
                    </div>

                    {/* TELEGRAM MESSAGE BUBBLE */}
                    <div className="max-w-md w-full bg-gradient-to-b from-slate-800/95 to-slate-900/95 border border-orange-500/30 rounded-2xl rounded-tl-sm p-4 text-xs shadow-xl space-y-3 relative group">
                      {/* SENDER INFO */}
                      <div className="flex items-center justify-between border-b border-slate-700/50 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-orange-400 text-xs tracking-wide">TataDana Bot</span>
                          <span className="text-[9px] bg-orange-600/30 text-orange-300 border border-orange-500/40 px-1.5 py-0.2 rounded font-bold uppercase">
                            BOT
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">Resmi</span>
                      </div>

                      {/* BROADCAST HEADER */}
                      <div className="space-y-1">
                        <p className="font-extrabold text-orange-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <span>📢</span> PENGUMUMAN RESMI TATADANA
                        </p>
                        <p className="text-slate-600 font-mono text-[10px] select-none">
                          ━━━━━━━━━━━━━━━━━━━━━
                        </p>
                      </div>

                      {/* TITLE */}
                      <div className="text-white font-extrabold text-sm leading-snug flex items-start gap-1.5">
                        <span className="text-orange-400 mt-0.5">📌</span>
                        <span>{broadcastTitle || 'Judul Pengumuman Disini'}</span>
                      </div>

                      {/* MESSAGE CONTENT */}
                      <div className="text-slate-200 text-xs leading-relaxed py-1">
                        {renderTelegramHtml(broadcastMessage)}
                      </div>

                      {/* FOOTER DIVIDER & BRANDING */}
                      <div className="pt-2 border-t border-slate-700/60 space-y-1">
                        <p className="text-slate-600 font-mono text-[10px] select-none">
                          ━━━━━━━━━━━━━━━━━━━━━
                        </p>
                        <p className="text-[10px] italic text-slate-400 flex items-center gap-1">
                          <span>💡</span>
                          <span>
                            Pesan broadcast resmi Admin TataDana (
                            <b className="text-orange-400 not-italic">
                              {targetPlan === 'pro'
                                ? '⭐ Khusus Member Pro'
                                : targetPlan === 'starter'
                                ? '🌱 Pengguna Paket Starter'
                                : '🌐 Seluruh Pengguna'}
                            </b>
                            )
                          </span>
                        </p>
                      </div>

                      {/* TIMESTAMP & DOUBLE CHECKS */}
                      <div className="flex justify-end items-center gap-1 text-[10px] text-slate-400 pt-1 font-mono">
                        <span>
                          {new Date().toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Asia/Jakarta',
                          })}{' '}
                          WIB
                        </span>
                        <span className="text-orange-400 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM TELEGRAM INFO NOTE */}
                  <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-2.5 text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-orange-400" />
                      Visual preview persis dengan tampilan di Telegram mobile &amp; desktop.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* BROADCAST HISTORY SECTION */}
            <div className="bg-slate-800/60 rounded-3xl border border-slate-700 overflow-hidden shadow-xl space-y-4 p-6 sm:p-7">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/80 pb-4">
                <div>
                  <h4 className="font-extrabold text-base text-white flex items-center gap-2">
                    <History className="w-4 h-4 text-orange-500" />
                    Riwayat Broadcast Terkirim
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Histori seluruh pengumuman massal yang telah didistribusikan ke pengguna bot Telegram.
                  </p>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                  Total Tercatat: <b className="text-white">{broadcastHistory.length}</b> pesan
                </div>
              </div>

              {broadcastHistory.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-slate-300">Belum Ada Riwayat Broadcast</p>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Kirim pesan broadcast pertama Anda menggunakan formulir di atas untuk menyapa pengguna TataDana.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-700">
                      <tr>
                        <th className="px-5 py-3.5">Waktu Kirim (WIB)</th>
                        <th className="px-5 py-3.5">Judul Pengumuman</th>
                        <th className="px-5 py-3.5">Target</th>
                        <th className="px-5 py-3.5">Status Pengiriman</th>
                        <th className="px-5 py-3.5">Cuplikan Isi Pesan</th>
                        <th className="px-5 py-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/60 font-mono text-[11px]">
                      {broadcastHistory.map((bc) => {
                        const dateFormatted = formatTanggalWIB(bc.sentAt);
                        return (
                          <tr key={bc.id} className="hover:bg-slate-800/80 transition">
                            <td className="px-5 py-4 text-slate-300 font-sans whitespace-nowrap">
                              <span className="font-bold block text-white">{dateFormatted.jam}</span>
                              <span className="text-[10px] text-slate-400">{dateFormatted.tanggal}</span>
                            </td>
                            <td className="px-5 py-4 font-sans font-bold text-white max-w-xs">
                              {bc.title}
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  bc.targetPlan === 'pro'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                    : bc.targetPlan === 'starter'
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {bc.targetPlan}
                              </span>
                            </td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold text-[10px]">
                                  ✓ {bc.totalSent} sukses
                                </span>
                                {bc.totalFailed > 0 && (
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-[10px]">
                                    ✗ {bc.totalFailed} gagal
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 font-sans text-xs text-slate-400 max-w-sm truncate">
                              {(bc.message || '').replace(/<[^>]*>?/gm, '')}
                            </td>
                            <td className="px-5 py-4 text-right whitespace-nowrap font-sans">
                              <button
                                type="button"
                                onClick={() => setViewingBroadcastDetail(bc)}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ml-auto"
                              >
                                <Eye className="w-3.5 h-3.5 text-orange-400" />
                                Rincian
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="bg-slate-800/60 rounded-3xl border border-slate-700 p-6 sm:p-8 space-y-4 shadow-xl text-xs">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base text-white">Audit Log Akses Data Transaksi</h3>
                <p className="text-slate-400 mt-0.5">
                  Setiap kali admin melihat rincian transaksi pengguna demi troubleshooting, sistem mencatat log permanen untuk menjaga privasi UU PDP.
                </p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-xl font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Immutable Audit Trail
              </span>
            </div>
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-700 font-mono space-y-2 text-slate-300 text-[11px] max-h-96 overflow-y-auto">
              {auditLogs.map((entry, idx) => (
                <div key={idx} className="border-b border-slate-800/80 pb-1.5 last:border-0 last:pb-0">
                  {entry}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL: INSPECT USER TRANSACTIONS (PART 10) */}
        {inspectingUser && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 text-slate-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-orange-500" />
                  <div>
                    <h3 className="font-extrabold text-base text-white">
                      Rincian Transaksi: {inspectingUser.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {inspectingUser.id} • {inspectingUser.phone}</span>
                  </div>
                </div>
                <button
                  onClick={() => setInspectingUser(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* PRIVACY WARNING BANNER */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  Sesi inspeksi ini telah dicatat di <b>Audit Log Privasi</b> demi kepatuhan UU PDP &amp; integritas data nasabah.
                </span>
              </div>

              {/* TRANSACTIONS TABLE */}
              <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-2xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] sticky top-0">
                    <tr>
                      <th className="px-4 py-2.5">Tanggal</th>
                      <th className="px-4 py-2.5">Jenis</th>
                      <th className="px-4 py-2.5">Nominal</th>
                      <th className="px-4 py-2.5">Kategori</th>
                      <th className="px-4 py-2.5">Catatan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                    <tr className="hover:bg-slate-800/50">
                      <td className="px-4 py-2.5">10 Okt 2026 12:20</td>
                      <td className="px-4 py-2.5 text-rose-400 font-bold font-sans">Pengeluaran</td>
                      <td className="px-4 py-2.5 font-bold text-white">Rp 30.000</td>
                      <td className="px-4 py-2.5 font-sans">🍜 Makanan</td>
                      <td className="px-4 py-2.5 font-sans text-slate-400">Bakso Malang &amp; Es Teh</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="px-4 py-2.5">09 Okt 2026 18:45</td>
                      <td className="px-4 py-2.5 text-rose-400 font-bold font-sans">Pengeluaran</td>
                      <td className="px-4 py-2.5 font-bold text-white">Rp 45.000</td>
                      <td className="px-4 py-2.5 font-sans">🚗 Transportasi</td>
                      <td className="px-4 py-2.5 font-sans text-slate-400">Bensin Pertamax</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="px-4 py-2.5">08 Okt 2026 14:10</td>
                      <td className="px-4 py-2.5 text-rose-400 font-bold font-sans">Pengeluaran</td>
                      <td className="px-4 py-2.5 font-bold text-white">Rp 68.500</td>
                      <td className="px-4 py-2.5 font-sans">🧾 OCR Struk</td>
                      <td className="px-4 py-2.5 font-sans text-slate-400">Indomaret Point (4 item)</td>
                    </tr>
                    <tr className="hover:bg-slate-800/50">
                      <td className="px-4 py-2.5">01 Okt 2026 08:00</td>
                      <td className="px-4 py-2.5 text-emerald-400 font-bold font-sans">Pemasukan</td>
                      <td className="px-4 py-2.5 font-bold text-emerald-400">Rp 5.000.000</td>
                      <td className="px-4 py-2.5 font-sans">💰 Gaji</td>
                      <td className="px-4 py-2.5 font-sans text-slate-400">Gaji Pokok Bulanan</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setInspectingUser(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Tutup Tinjauan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: TAMBAH PROVIDER AI */}
        {isAddProviderOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-slate-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-orange-500" />
                  <h3 className="font-extrabold text-base text-white">Tambah Provider AI</h3>
                </div>
                <button
                  onClick={() => setIsAddProviderOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddProvider} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nama Provider</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Mistral AI, Anthropic Claude, Perplexity"
                    value={newProvName}
                    onChange={(e) => setNewProvName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-medium text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Nama Model</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: mistral-large-latest, claude-3-5-sonnet"
                    value={newProvModel}
                    onChange={(e) => setNewProvModel(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">API Key (Tersimpan Terenkripsi)</label>
                  <input
                    type="password"
                    required
                    placeholder="Paste API Key provider di sini"
                    value={newProvKey}
                    onChange={(e) => setNewProvKey(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl font-mono text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProviderOpen(false)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition"
                  >
                    Simpan Provider
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: DIALOG KONFIRMASI KIRIM BROADCAST */}
        {isConfirmDialogOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 text-slate-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-600/20 text-orange-400 rounded-xl border border-orange-500/30">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-white">
                      Konfirmasi Pengiriman Broadcast
                    </h3>
                    <p className="text-[11px] text-slate-400">Pastikan rincian pengumuman sudah sesuai sebelum dikirimkan.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsConfirmDialogOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* WARNING BOX */}
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Pesan broadcast ini akan dikirimkan secara massal ke akun Telegram pengguna terdaftar via bot <b>@ituson_bot</b>. Pesan yang telah terkirim tidak dapat dibatalkan.
                </span>
              </div>

              {/* SUMMARY DETAILS */}
              <div className="bg-slate-950/70 rounded-2xl border border-slate-800 p-4 space-y-2.5 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Target Penerima:</span>
                  <span className="font-bold text-orange-400 uppercase">
                    {targetPlan === 'all'
                      ? 'Semua Pengguna'
                      : targetPlan === 'pro'
                      ? 'Paket Pro Saja'
                      : 'Paket Starter Saja'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Judul:</span>
                  <span className="font-bold text-white max-w-[240px] truncate">{broadcastTitle}</span>
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-sans block mb-1">Cuplikan Pesan:</span>
                  <p className="text-[11px] text-slate-300 font-sans italic line-clamp-3 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    &quot;{broadcastMessage}&quot;
                  </p>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsConfirmDialogOpen(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSendBroadcast}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-orange-600/20 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Ya, Kirim Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: RINCIAN HISTORI BROADCAST */}
        {viewingBroadcastDetail && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 text-slate-200">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-orange-500" />
                  <div>
                    <h3 className="font-extrabold text-base text-white">
                      Rincian Broadcast: {viewingBroadcastDetail.id}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatTanggalWIB(viewingBroadcastDetail.sentAt).fullFormatted}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setViewingBroadcastDetail(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block mb-1">Judul Pengumuman:</span>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-bold text-white text-sm">
                    {viewingBroadcastDetail.title}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Target Penerima:</span>
                    <span className="font-bold text-orange-400 uppercase text-xs">
                      {viewingBroadcastDetail.targetPlan}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[10px] block font-sans">Hasil Distribusi:</span>
                    <span className="font-bold text-emerald-400 text-xs">
                      {viewingBroadcastDetail.totalSent} Sukses{' '}
                      {viewingBroadcastDetail.totalFailed > 0 && (
                        <span className="text-rose-400">({viewingBroadcastDetail.totalFailed} Gagal)</span>
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 font-bold block mb-1">Isi Pesan Lengkap:</span>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-200 max-h-48 overflow-y-auto">
                    {viewingBroadcastDetail.message}
                  </div>
                </div>

                {viewingBroadcastDetail.recipients && viewingBroadcastDetail.recipients.length > 0 && (
                  <div>
                    <span className="text-slate-400 font-bold block mb-1">Rincian Penerima:</span>
                    <div className="max-h-36 overflow-y-auto border border-slate-800 rounded-xl divide-y divide-slate-800 font-mono text-[11px]">
                      {viewingBroadcastDetail.recipients.map((r, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between bg-slate-950/40">
                          <div>
                            <span className="text-white font-sans font-bold">{r.userName || 'Pengguna'}</span>{' '}
                            <span className="text-slate-500 font-mono text-[10px]">(Chat ID: {r.chatId})</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {r.success ? 'Terkirim' : 'Gagal'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewingBroadcastDetail(null)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

