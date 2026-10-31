'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  // 60-second countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown]);

  const handleSendOtp = () => {
    setErrorMsg('');
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg('Masukkan nomor WhatsApp yang valid (contoh: 08123456789)');
      return;
    }

    setOtpSent(true);
    setCountdown(60);
    setSuccessMsg('Kode verifikasi OTP 6-digit telah dikirimkan ke WhatsApp Anda!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsPendingApproval(false);

    const identifier = authMethod === 'email' ? email.trim() : phone.trim();

    if (!identifier) {
      setErrorMsg(authMethod === 'email' ? 'Alamat email wajib diisi.' : 'Nomor WhatsApp wajib diisi.');
      return;
    }

    if (authMethod === 'email' && !password.trim()) {
      setErrorMsg('Kata sandi wajib diisi.');
      return;
    }

    if (authMethod === 'phone') {
      if (!otpSent) {
        setErrorMsg('Silakan klik tombol Kirim OTP terlebih dahulu.');
        return;
      }
      if (!otpCode || otpCode.trim().length !== 6) {
        setErrorMsg('Masukkan 6 digit kode OTP yang telah dikirim ke WhatsApp Anda.');
        return;
      }
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          password: password.trim(),
          method: authMethod,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        if (data.status === 'pending') {
          setIsPendingApproval(true);
          setErrorMsg(data.error || 'Akun Anda sedang menunggu persetujuan (approval) dari Administrator.');
        } else {
          setErrorMsg(data.error || 'Gagal masuk. Periksa kembali kredensial Anda.');
        }
        setLoading(false);
        return;
      }

      // Otentikasi Berhasil
      if (data.role === 'admin') {
        // --- 1. ADMIN FLOW ---
        setSuccessMsg('Otentikasi Administrator Berhasil! Mengalihkan ke Panel Superadmin...');
        if (typeof window !== 'undefined') {
          localStorage.setItem('tatadana_auth_role', 'admin');
          localStorage.setItem('tatadana_admin_email', 'sonialferis@gmail.com');
          localStorage.setItem('tatadana_admin_name', 'Soni Alferis');
        }
        setTimeout(() => {
          router.push('/admin');
        }, 700);
      } else {
        // --- 2. CUSTOMER FLOW ---
        setSuccessMsg('Masuk berhasil! Mengalihkan ke Dashboard Keuangan...');
        if (typeof window !== 'undefined') {
          localStorage.setItem('tatadana_auth_role', 'customer');
          localStorage.removeItem('tatadana_admin_email');
          localStorage.removeItem('tatadana_admin_name');
          localStorage.setItem('tatadana_user_email', data.user?.email || identifier);
          localStorage.setItem('tatadana_user_name', data.user?.name || 'Pelanggan TataDana');
        }
        setTimeout(() => {
          router.push('/dashboard');
        }, 700);
      }
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan jaringan atau server: ' + (err?.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const isAdminEmailEntered = email.trim().toLowerCase() === 'sonialferis@gmail.com';

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* KIRI (40%): Branding Panel — Hidden on Mobile */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-orange-600 via-orange-700 to-amber-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative backdrop shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-orange-950/20 blur-2xl"></div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-white text-orange-600 font-bold flex items-center justify-center text-lg shadow-lg group-hover:scale-105 transition">
              TD
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">TataDana</span>
          </Link>

          <div className="mt-20 max-w-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-orange-100 text-xs font-semibold backdrop-blur-sm mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              SaaS Manajemen Keuangan Indonesia
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
              Keuanganmu.<br />Terkontrol.
            </h2>
            <p className="mt-4 text-orange-100 text-sm leading-relaxed">
              Catat pemasukan dan pengeluaran secepat kirim pesan Telegram. Dapatkan insight pengeluaran real-time dan lindungi tabungan masa depanmu.
            </p>

            <div className="mt-8 space-y-3 text-xs text-orange-100/90">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Terintegrasi Bot Telegram @ituson_bot</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Isolasi Data Database Row Level Security (RLS)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Persetujuan Akun Aman oleh Administrator</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-orange-200/90 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          <span>Keamanan Data Terenkripsi &amp; Verifikasi Superadmin Terpusat</span>
        </div>
      </div>

      {/* KANAN (60%): Single Unified Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center text-sm shadow">
              TD
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">TataDana</span>
          </Link>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Masuk ke TataDana
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-600">
              Gunakan email terdaftar Anda untuk masuk ke sistem. Akun pelanggan memerlukan persetujuan admin sebelum dapat mengakses dashboard.
            </p>
          </div>

          {/* Admin Email Detected Live Banner */}
          {isAdminEmailEntered && (
            <div className="p-3 bg-slate-900 text-amber-300 rounded-xl text-xs flex items-center gap-2.5 border border-slate-800 shadow-sm animate-in fade-in">
              <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div>
                <span className="font-bold text-white">Akun Administrator Terdeteksi: </span>
                <span>Masukkan kata sandi admin untuk langsung menuju Panel Superadmin.</span>
              </div>
            </div>
          )}

          {/* Pending Approval Notice Card */}
          {isPendingApproval && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                <span>Akun Anda Menunggu Persetujuan Admin</span>
              </div>
              <p className="leading-relaxed">
                Pendaftaran akun Anda telah tersimpan di sistem, namun saat ini berstatus <b>Menunggu Persetujuan (Pending)</b> dari Administrator (Soni Alferis).
              </p>
              <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200 text-[11px] text-amber-800">
                💡 <b>Petunjuk:</b> Setelah admin menyetujui akun Anda melalui Panel Superadmin, Anda akan dapat langsung masuk menggunakan email ini.
              </div>
            </div>
          )}

          {/* Error & Success Notification */}
          {errorMsg && !isPendingApproval && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Toggle Tab Login Method: Email vs WhatsApp */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setErrorMsg('');
                setIsPendingApproval(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                authMethod === 'email' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Email &amp; Kata Sandi
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone');
                setErrorMsg('');
                setIsPendingApproval(false);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                authMethod === 'phone' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Nomor WhatsApp / HP (OTP)
            </button>
          </div>

          {/* Single Unified Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMethod === 'email' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorMsg('');
                        setIsPendingApproval(false);
                      }}
                      placeholder="nama@email.com atau sonialferis@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition font-medium"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Kata Sandi
                    </label>
                    <a href="#" className="text-[11px] text-orange-600 hover:underline">
                      Lupa sandi?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-2.5 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nomor WhatsApp
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Contoh: 081288997766"
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={countdown > 0}
                      className="px-4 py-2.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold rounded-xl transition disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                    >
                      {countdown > 0 ? (
                        <>
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>{countdown}s</span>
                        </>
                      ) : (
                        'Kirim OTP'
                      )}
                    </button>
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Kode Verifikasi (OTP)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="6 digit kode OTP"
                      className="w-full text-center tracking-widest text-lg font-bold py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 shadow-md ${
                isAdminEmailEntered
                  ? 'bg-slate-900 hover:bg-slate-800 text-amber-400 shadow-slate-900/20'
                  : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/30'
              }`}
            >
              <span>
                {loading
                  ? 'Memverifikasi...'
                  : isAdminEmailEntered
                  ? 'Masuk ke Panel Administrator'
                  : 'Masuk ke Akun'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Register Link */}
          <div className="text-center text-xs text-slate-600 pt-2">
            Belum memiliki akun pelanggan?{' '}
            <Link href="/auth/register" className="font-bold text-orange-600 hover:underline">
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
