'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Phone,
  User,
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

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isRegisteredSuccess, setIsRegisteredSuccess] = useState(false);

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

  // Password strength evaluation
  const getPasswordStrength = () => {
    if (!password) return { score: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { score: 1, label: 'Lemah', color: 'bg-rose-500 text-rose-600' };
    if (score <= 3) return { score: 2, label: 'Cukup', color: 'bg-amber-500 text-amber-600' };
    return { score: 3, label: 'Kuat', color: 'bg-emerald-500 text-emerald-600' };
  };

  const handleSendOtp = () => {
    setErrorMsg('');
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setErrorMsg('Masukkan nomor WhatsApp yang valid (contoh: 08123456789)');
      return;
    }

    setOtpSent(true);
    setCountdown(60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Alamat email valid wajib diisi.');
      return;
    }

    // Guard: sonialferis@gmail.com is reserved
    if (email.trim().toLowerCase() === 'sonialferis@gmail.com') {
      setErrorMsg('Email sonialferis@gmail.com adalah akun Administrator resmi TataDana. Akun sudah aktif dan tidak perlu didaftarkan. Silakan langsung masuk di halaman Login.');
      return;
    }

    if (!phone.trim()) {
      setErrorMsg('Nomor WhatsApp wajib diisi.');
      return;
    }
    if (!otpSent) {
      setErrorMsg('Silakan klik tombol Kirim OTP terlebih dahulu.');
      return;
    }
    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg('Masukkan 6 digit kode OTP yang diterima di WhatsApp.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('Anda harus menyetujui Syarat & Ketentuan serta Kebijakan Privasi.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || 'Gagal mendaftar. Silakan coba kembali.');
        setLoading(false);
        return;
      }

      setIsRegisteredSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan jaringan atau server: ' + (err?.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans">
      {/* KIRI (40%): Branding Panel — Hidden on Mobile */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-orange-600 via-orange-700 to-amber-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-orange-950/20 blur-2xl"></div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-white text-orange-600 font-bold flex items-center justify-center text-lg shadow-lg group-hover:scale-105 transition">
              TD
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-white">TataDana</span>
          </Link>

          <div className="mt-16 max-w-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-orange-100 text-xs font-semibold backdrop-blur-sm mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              SaaS Manajemen Keuangan Indonesia
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
              Mulai Kendalikan<br />Uangmu Hari Ini.
            </h2>
            <p className="mt-4 text-orange-100 text-sm leading-relaxed">
              Bergabung dengan ribuan pengguna yang mengontrol finansial harian semudah chatting di Telegram.
            </p>

            <div className="mt-8 space-y-3 text-xs text-orange-100/90">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Pencatatan Natural Language AI Bot Telegram</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Verifikasi Akun Pelanggan Aman &amp; Terlindungi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Monitoring Budget &amp; Ekspor Laporan Otomatis</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-orange-200/90 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          <span>Keamanan Data Terenkripsi &amp; Otorisasi Admin Terpusat</span>
        </div>
      </div>

      {/* KANAN (60%): Register Form / Success State */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <Link href="/" className="lg:hidden inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white font-bold flex items-center justify-center text-sm shadow">
              TD
            </div>
            <span className="font-extrabold text-xl tracking-tight text-slate-900">TataDana</span>
          </Link>

          {isRegisteredSuccess ? (
            /* SUCCESS STATE: WAITING FOR ADMIN APPROVAL */
            <div className="p-6 bg-white rounded-3xl border border-amber-300 shadow-xl space-y-5 text-center animate-in zoom-in-95">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  Menunggu Persetujuan Admin
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  Pendaftaran Berhasil!
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                  Akun Anda atas nama <b>{fullName}</b> (<span className="text-orange-600 font-mono">{email}</span>) telah berhasil kami catat di sistem TataDana.
                </p>
              </div>

              <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-left text-xs text-amber-950 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Proses Verifikasi Keamanan:</span>
                </div>
                <p className="text-[11px] leading-relaxed text-amber-900/90">
                  Sesuai kebijakan keamanan, setiap pendaftaran pelanggan baru harus disetujui (<b>Approved</b>) oleh Administrator (<b>Soni Alferis</b>) sebelum dapat mengakses dashboard.
                </p>
                <div className="text-[11px] font-semibold text-amber-800">
                  Setelah admin menyetujui akun Anda di Panel Admin, Anda dapat langsung masuk dengan email dan kata sandi Anda.
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Ke Halaman Masuk (Login)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* REGISTER FORM */
            <>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Daftar Akun TataDana
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-600">
                  Lengkapi data berikut untuk membuat akun pelanggan baru. Akun akan ditinjau oleh Administrator sebelum aktif.
                </p>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                    />
                  </div>
                </div>

                {/* Email */}
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
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition font-medium"
                    />
                  </div>
                </div>

                {/* Nomor WhatsApp & Tombol Kirim OTP */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nomor WhatsApp (Aktif)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        required
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

                {/* Input OTP jika sudah dikirim */}
                {otpSent && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-900">Masukkan 6 Digit OTP WhatsApp</span>
                      <span className="text-[11px] text-amber-700">Kode simulasi: 123456</span>
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      placeholder="123456"
                      className="w-full text-center tracking-widest text-lg font-bold py-1.5 bg-white border border-amber-300 rounded-xl focus:outline-none focus:border-orange-500"
                    />
                  </div>
                )}

                {/* Kata Sandi */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Kata Sandi
                    </label>
                    {password && (
                      <span className={`text-[10px] font-bold ${strength.color}`}>
                        Kekuatan: {strength.label}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
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

                {/* Checkbox Syarat & Ketentuan */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <label htmlFor="terms" className="text-[11px] text-slate-600 leading-snug">
                    Saya menyetujui{' '}
                    <a href="/terms" className="text-orange-600 hover:underline">
                      Syarat &amp; Ketentuan
                    </a>{' '}
                    dan{' '}
                    <a href="/privacy" className="text-orange-600 hover:underline">
                      Kebijakan Privasi
                    </a>{' '}
                    TataDana.
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-orange-600/30 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                  <span>{loading ? 'Mendaftarkan Akun...' : 'Daftar Sekarang'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Login Link */}
              <div className="text-center text-xs text-slate-600 pt-2">
                Sudah memiliki akun?{' '}
                <Link href="/auth/login" className="font-bold text-orange-600 hover:underline">
                  Masuk di sini
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
