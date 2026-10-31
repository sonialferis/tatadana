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
  KeyRound,
  ArrowLeft,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Identifier, 2: OTP, 3: New Password, 4: Success
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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

  const handleSendResetCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim()) {
      setErrorMsg(
        resetMethod === 'email'
          ? 'Masukkan alamat email yang terdaftar.'
          : 'Masukkan nomor WhatsApp yang terdaftar.'
      );
      return;
    }

    if (resetMethod === 'email' && !identifier.includes('@')) {
      setErrorMsg('Masukkan alamat email yang valid.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      setCountdown(60);
      setSuccessMsg(
        resetMethod === 'email'
          ? `Kode OTP 6-digit telah dikirimkan ke email ${identifier}.`
          : `Kode OTP 6-digit telah dikirimkan ke WhatsApp ${identifier}.`
      );
    }, 600);
  };

  const handleResendOtp = () => {
    if (countdown > 0) return;
    setErrorMsg('');
    setCountdown(60);
    setSuccessMsg('Kode verifikasi baru telah dikirimkan!');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg('Masukkan 6 digit kode OTP verifikasi.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      setErrorMsg('');
      setSuccessMsg('Verifikasi berhasil! Silakan tentukan kata sandi baru.');
    }, 500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(4);
      setSuccessMsg('Kata sandi berhasil direset! Silakan masuk kembali.');
    }, 700);
  };

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

          <div className="mt-20 max-w-sm">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-orange-100 text-xs font-semibold backdrop-blur-sm mb-4">
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              Pemulihan Akun Aman
            </span>
            <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
              Keuanganmu.<br />Terkontrol.
            </h2>
            <p className="mt-4 text-orange-100 text-sm leading-relaxed">
              Lupa kata sandi? Jangan khawatir. Kami akan mengirimkan kode verifikasi resmi ke email atau WhatsApp Anda untuk memulihkan akun secara aman.
            </p>

            <div className="mt-8 space-y-3 text-xs text-orange-100/90">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Verifikasi Dua Langkah Terenkripsi</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Timer Keamanan 60 Detik Anti-Spam</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                <span>Data Keuangan Tetap Aman dan Terisolasi RLS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-orange-200/90 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-300 flex-shrink-0" />
          <span>Protokol Keamanan Otentikasi Supabase Auth &amp; Enkripsi AES-256</span>
        </div>
      </div>

      {/* KANAN (60%): Recovery Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-orange-600 transition mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kembali ke Halaman Masuk
            </Link>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Pemulihan Kata Sandi
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {step === 1 && 'Pilih metode dan masukkan kontak terdaftar untuk menerima kode verifikasi.'}
              {step === 2 && 'Masukkan 6 digit kode OTP yang telah dikirimkan.'}
              {step === 3 && 'Buat kata sandi baru yang kuat untuk akun Anda.'}
              {step === 4 && 'Kata sandi Anda telah berhasil diperbarui!'}
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="flex items-center gap-2 pb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={`h-1.5 w-full rounded-full transition ${
                    step >= s ? 'bg-orange-600' : 'bg-slate-200'
                  }`}
                ></div>
              </div>
            ))}
          </div>

          {/* Error & Success Notification */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* STEP 1: Select Method & Enter Identifier */}
          {step === 1 && (
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('email');
                    setIdentifier('');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    resetMethod === 'email'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Via Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResetMethod('phone');
                    setIdentifier('');
                    setErrorMsg('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                    resetMethod === 'phone'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Via WhatsApp
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {resetMethod === 'email' ? 'Alamat Email Terdaftar' : 'Nomor WhatsApp Terdaftar'}
                </label>
                <div className="relative">
                  {resetMethod === 'email' ? (
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  ) : (
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  )}
                  <input
                    type={resetMethod === 'email' ? 'email' : 'tel'}
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder={resetMethod === 'email' ? 'contoh@email.com' : '08123456789'}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Mengirim Kode...' : 'Kirim Kode Verifikasi'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: Input OTP with 60s Countdown Timer */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Verifikasi OTP (6 Digit)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm text-center font-mono tracking-widest text-slate-900 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Tidak menerima kode?</span>
                <button
                  type="button"
                  disabled={countdown > 0}
                  onClick={handleResendOtp}
                  className="text-orange-600 hover:text-orange-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {countdown > 0 ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Kirim ulang ({countdown}s)</span>
                    </>
                  ) : (
                    'Kirim Ulang Kode'
                  )}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Memverifikasi...' : 'Verifikasi Kode OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 3: Set New Password */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kata Sandi Baru (Minimal 8 Karakter)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 4: Success Message */}
          {step === 4 && (
            <div className="text-center space-y-4 py-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Kata Sandi Berhasil Diperbarui!</h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                Silakan masuk menggunakan kata sandi baru Anda untuk kembali ke dashboard keuangan.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/auth/login')}
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-2"
                >
                  Masuk Sekarang
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <p className="text-center text-xs text-slate-600 pt-2">
            Ingat kata sandi Anda?{' '}
            <Link href="/auth/login" className="font-bold text-orange-600 hover:text-orange-700">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
