'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Mic,
  MicOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  TrendingUp,
  Wallet as WalletIcon,
  PieChart,
  ArrowRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import { useFinance } from '@/lib/finance-context';
import { formatRupiah, formatTanggalWIB } from '@/lib/formatters';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isTransaction?: boolean;
  transactionData?: {
    type: 'expense' | 'income' | 'transfer';
    amount: number;
    category_name: string;
    category_emoji: string;
    wallet_name: string;
    notes: string;
  };
}

interface TataAiChatProps {
  embedded?: boolean; // True when inside floating widget, false when on dedicated page
  onClose?: () => void;
}

export default function TataAiChat({ embedded = false, onClose }: TataAiChatProps) {
  const { user, wallets, categories, budgets, transactions, addTransaction } = useFinance();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: `Halo **${user.full_name || 'Sobat TataDana'}**! 👋 Saya **TATA AI BOT**, asisten keuangan pribadi cerdasmu.

Saya siap membantumu:
• 📊 **Menganalisis kondisi keuangan & cashflow** rekeningmu secara real-time.
• 🚨 **Mengecek batas budget** kategori yang sudah kritis atau melebihi target.
• 📝 **Mencatat transaksi langsung via chat** (misal: *"beli kopi 25rb pakai GoPay"*).
• 💡 **Memberikan rekomendasi hemat** berdasarkan kebiasaan transaksimu.

Silakan tanyakan apa saja atau pilih opsi cepat di bawah ya! 😊`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    '📊 Analisis Keuangan Saya',
    '🚨 Cek Budget Kritis',
    '💡 Tips Berhemat Bulan Ini',
    '🎯 Alokasi Gaji 50/30/20',
    '📝 Catat makan siang 25rb pakai BCA',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          wallets,
          budgets,
          categories,
          recentTransactions: transactions.slice(0, 30),
          userName: user.full_name || 'Sobat TataDana',
        }),
      });

      const data = await res.json();

      if (data.ok) {
        // If this is a transaction, record it in the ledger!
        if (data.isTransaction && data.parsedTransaction) {
          const pt = data.parsedTransaction;
          try {
            addTransaction({
              user_id: user.id || 'user-01',
              wallet_id: pt.wallet_id || wallets[0]?.id || 'w-1',
              to_wallet_id: null,
              category_id: pt.category_id || categories[0]?.id || 'c-1',
              type: pt.type,
              amount: pt.amount,
              notes: pt.notes || 'Catatan via Tata AI Bot',
              transaction_time: new Date().toISOString(),
              source: 'web',
            });
          } catch (err) {
            console.warn('Could not auto-insert transaction to local state:', err);
          }
        }

        const botReply: ChatMessage = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: data.reply || 'Maaf, saya tidak memahami pesan tersebut. Coba tanyakan lagi.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          isTransaction: data.isTransaction,
          transactionData: data.parsedTransaction
            ? {
                type: data.parsedTransaction.type,
                amount: data.parsedTransaction.amount,
                category_name: data.parsedTransaction.category_name,
                category_emoji: data.parsedTransaction.category_emoji,
                wallet_name: data.parsedTransaction.wallet_name,
                notes: data.parsedTransaction.notes,
              }
            : undefined,
        };

        setMessages((prev) => [...prev, botReply]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            sender: 'bot',
            text: `⚠️ Maaf, terjadi kendala teknis: ${data.error || 'Gagal memproses pesan.'}`,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: `⚠️ Terjadi kesalahan jaringan. Pastikan koneksi internet stabil.`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceSimulate = () => {
    if (isRecording) return;
    setIsRecording(true);

    const voiceSamples = [
      'beli bakso malang komplit 25rb pakai GoPay',
      'beli bensin pertamax 50rb',
      'gajian bulanan 6.500.000 masuk ke BCA',
      'bayar servis motor 135rb dari Mandiri',
    ];
    const picked = voiceSamples[Math.floor(Math.random() * voiceSamples.length)];

    setTimeout(() => {
      setIsRecording(false);
      setInput(`Catat ${picked}`);
    }, 1200);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    if (confirm('Bersihkan riwayat percakapan Tata AI?')) {
      setMessages([
        {
          id: 'msg-welcome-reset',
          sender: 'bot',
          text: `Percakapan telah direset. Ada hal keuangan yang ingin kamu tanyakan atau catat sekarang, **${user.full_name}**?`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  // Helper to render simple Markdown formatting
  const renderFormattedText = (rawText: string) => {
    const formatted = rawText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gim, '<h4 class="text-sm font-extrabold text-slate-900 mt-2 mb-1">$1</h4>')
      .replace(/\n/g, '<br/>');

    return <div dangerouslySetInnerHTML={{ __html: formatted }} className="text-xs leading-relaxed space-y-1" />;
  };

  return (
    <div
      className={`flex flex-col bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden ${
        embedded ? 'h-[540px]' : 'h-[calc(100vh-140px)] min-h-[580px]'
      }`}
    >
      {/* 1. CHAT HEADER */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white shadow-inner">
            <Bot className="w-5 h-5 text-amber-200 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white tracking-tight">TATA AI BOT</h3>
              <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-sm">
                Asisten Keuangan
              </span>
            </div>
            <p className="text-[11px] text-orange-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
              <span>Online • Terhubung ke Ledger Keuangan</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetChat}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
            title="Reset Percakapan"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {embedded && onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
              title="Tutup Chat"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 2. MESSAGES CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/60">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 sm:gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs shadow-sm ${
                  isUser
                    ? 'bg-slate-800 text-white font-bold'
                    : 'bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-extrabold'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[78%] group relative`}>
                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs shadow-sm ${
                    isUser
                      ? 'bg-orange-600 text-white rounded-tr-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  ) : (
                    <div>{renderFormattedText(msg.text)}</div>
                  )}

                  {/* Transaction Confirmation Card */}
                  {msg.isTransaction && msg.transactionData && (
                    <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-slate-800 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          ✓ Transaksi Tersimpan
                        </span>
                        <span className="text-[10px] text-emerald-800 font-bold">
                          {formatRupiah(msg.transactionData.amount)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 pt-1 border-t border-emerald-200/60">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Kategori</span>
                          <span className="font-bold text-slate-800">
                            {msg.transactionData.category_emoji} {msg.transactionData.category_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block">Dompet</span>
                          <span className="font-bold text-slate-800">👛 {msg.transactionData.wallet_name}</span>
                        </div>
                      </div>
                      <div className="pt-1">
                        <Link
                          href="/dashboard/transactions"
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 transition"
                        >
                          <span>Buka Riwayat Transaksi</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* Timestamp & Copy */}
                  <div
                    className={`flex items-center justify-between gap-3 mt-1.5 text-[10px] ${
                      isUser ? 'text-orange-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      className="opacity-0 group-hover:opacity-100 transition hover:text-slate-700"
                      title="Salin Pesan"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Bubble */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-orange-500 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium ml-1">Tata AI sedang menganalisa data...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. QUICK PROMPT PILLS */}
      <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-orange-500" />
          Pilihan:
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            disabled={loading}
            className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-600 text-[11px] font-bold rounded-xl whitespace-nowrap transition border border-slate-200 hover:border-orange-200 active:scale-95"
          >
            {p}
          </button>
        ))}
      </div>

      {/* 4. CHAT INPUT SECTION */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <button
          type="button"
          onClick={handleVoiceSimulate}
          disabled={loading || isRecording}
          className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
            isRecording
              ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
              : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
          }`}
          title="Input Suara / VN (Simulasi)"
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isRecording ? '🎙️ Merekam suara...' : 'Tanya keuangan atau ketik "catat bakso 25rb"...'}
          disabled={loading || isRecording}
          className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 focus:border-orange-500 rounded-xl text-xs text-slate-900 focus:outline-none transition"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-orange-600/30 transition flex items-center justify-center active:scale-95"
          title="Kirim Pesan"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
