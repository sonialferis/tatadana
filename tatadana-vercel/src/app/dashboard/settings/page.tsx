'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  MessageSquare,
  Bell,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Plus,
  Trash2,
  Tag,
  X,
  Camera,
  Check,
  Upload,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  BadgeCheck,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { useFinance } from '@/lib/finance-context';

export default function SettingsPage() {
  const { user, updateUserProfile, categories, addCategory, deleteCategory } = useFinance();
  const [activeTab, setActiveTab] = useState<'profile' | 'telegram' | 'reminder' | 'categories'>('profile');

  // Profile Form State (nama, email, foto, profesi, bio, mata uang default)
  const [profileName, setProfileName] = useState(user.full_name || 'Budi Santoso');
  const [profileEmail, setProfileEmail] = useState(user.email || 'budi@tatadana.id');
  const [profilePhone, setProfilePhone] = useState(user.phone_number || '0812-8899-7766');
  const [profileOccupation, setProfileOccupation] = useState(user.occupation || 'Karyawan Swasta');
  const [profileBio, setProfileBio] = useState(user.bio || 'Target dana darurat 50 juta dan financial freedom 2028');
  const [profileCurrency, setProfileCurrency] = useState(user.default_currency || 'IDR');
  const [selectedAvatarEmoji, setSelectedAvatarEmoji] = useState(
    user.avatar_url && !user.avatar_url.startsWith('data:image') && !user.avatar_url.startsWith('http')
      ? user.avatar_url
      : '👨‍💼'
  );
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(
    user.avatar_url && (user.avatar_url.startsWith('data:image') || user.avatar_url.startsWith('http'))
      ? user.avatar_url
      : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [profileNotice, setProfileNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with user data
  useEffect(() => {
    if (user) {
      if (user.full_name) setProfileName(user.full_name);
      if (user.email) setProfileEmail(user.email);
      if (user.phone_number) setProfilePhone(user.phone_number);
      if (user.occupation) setProfileOccupation(user.occupation);
      if (user.bio) setProfileBio(user.bio);
      if (user.default_currency) setProfileCurrency(user.default_currency);
      if (user.avatar_url) {
        if (user.avatar_url.startsWith('data:image') || user.avatar_url.startsWith('http')) {
          setUploadedPhotoUrl(user.avatar_url);
        } else {
          setSelectedAvatarEmoji(user.avatar_url);
          setUploadedPhotoUrl(null);
        }
      }
    }
  }, [user]);

  // Photo Upload Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Ukuran foto terlalu besar. Maksimal 5 MB.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (JPG, PNG, atau WebP).');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPhotoUrl(reader.result as string);
      setIsUploading(false);
    };
    reader.onerror = () => {
      alert('Gagal membaca gambar.');
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setUploadedPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectEmojiAvatar = (emoji: string) => {
    setSelectedAvatarEmoji(emoji);
    setUploadedPhotoUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Profile Save Handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert('Nama lengkap tidak boleh kosong');
      return;
    }

    const finalAvatar = uploadedPhotoUrl || selectedAvatarEmoji;

    updateUserProfile({
      full_name: profileName.trim(),
      email: profileEmail.trim(),
      phone_number: profilePhone.trim(),
      occupation: profileOccupation.trim(),
      bio: profileBio.trim(),
      default_currency: profileCurrency,
      avatar_url: finalAvatar,
    });

    setProfileNotice('Foto profil dan data akun Anda berhasil diperbarui!');
    setTimeout(() => setProfileNotice(null), 3500);
  };

  // Telegram Bot Token State (Part 5)
  const [botToken, setBotToken] = useState('8992878861:AAHCKkqhwMg0mT7Luvgdk17ovBaWTUEMVgY');
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'testing'>('connected');
  const [botUsername, setBotUsername] = useState('ituson_bot');
  const [statusMessage, setStatusMessage] = useState('🟢 Terhubung ke bot @ituson_bot (SoAi)! Siap menerima pesan transaksi.');

  // Category Management State
  const [isAddCatOpen, setIsAddCatOpen] = useState(false);
  const [catFilter, setCatFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍜');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newCatColor, setNewCatColor] = useState('#ea580c');
  const [catNotice, setCatNotice] = useState<string | null>(null);

  // Reminder State (Part 3: toggle ON/OFF, frekuensi 1x/2x sehari, jam, preview)
  const [reminderEnabled, setReminderEnabled] = useState(user.reminder_enabled ?? true);
  const [reminderFrequency, setReminderFrequency] = useState<1 | 2>((user.reminder_frequency as 1 | 2) || 1);
  const [reminderTime1, setReminderTime1] = useState(user.reminder_time_1 || '08:00');
  const [reminderTime2, setReminderTime2] = useState(user.reminder_time_2 || '20:00');
  const [reminderNotice, setReminderNotice] = useState<string | null>(null);


  // Reminder Save Handler
  const handleSaveReminder = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      reminder_enabled: reminderEnabled,
      reminder_frequency: reminderFrequency,
      reminder_time_1: reminderTime1,
      reminder_time_2: reminderTime2,
    });
    setReminderNotice('Jadwal pengingat harian Telegram berhasil diperbarui!');
    setTimeout(() => setReminderNotice(null), 3500);
  };

  // Test Connection Handler (Calling real /api/telegram/test-connection - Part 5)
  const handleTestConnection = async () => {
    if (!botToken.trim()) {
      alert('Masukkan token bot terlebih dahulu');
      return;
    }

    setConnectionStatus('testing');
    setStatusMessage('Memeriksa token ke Telegram API (getMe) dan mendaftarkan webhook...');

    try {
      const res = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: botToken,
          userId: user.id,
          phoneNumber: user.phone_number,
        }),
      });

      const data = await res.json();
      if (data.ok && data.status === 'connected') {
        setConnectionStatus('connected');
        setBotUsername(data.bot?.username || 'TataDana_bot');
        setStatusMessage(`🟢 Terhubung dengan sukses ke @${data.bot?.username}! Webhook aktif dan tertaut ke akun Anda.`);
        updateUserProfile({
          telegram_connected: true,
          telegram_username: data.bot?.username,
        });
      } else {
        setConnectionStatus('disconnected');
        setStatusMessage(`🔴 Tidak terhubung: ${data.error || 'Token tidak valid'}`);
      }
    } catch (err: any) {
      setConnectionStatus('disconnected');
      setStatusMessage(`🔴 Gagal terhubung: ${err.message}`);
    }
  };

  // Category Add Handler
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      emoji: newCatEmoji.trim() || '📁',
      type: newCatType,
      color: newCatColor,
      is_default: false,
    });

    setCatNotice(`Kategori "${newCatName.trim()}" berhasil ditambahkan!`);
    setIsAddCatOpen(false);
    setNewCatName('');
    setTimeout(() => setCatNotice(null), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pengaturan Sistem</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Konfigurasi profil, integrasi bot Telegram, pengingat harian, dan kategori keuangan (WIB).
        </p>
      </div>

      {/* TABS HEADER */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        {[
          { id: 'profile', label: 'Profil Saya', icon: User },
          { id: 'telegram', label: 'Telegram Bot (Wajib)', icon: MessageSquare },
          { id: 'reminder', label: 'Pengingat (Reminder)', icon: Bell },
          { id: 'categories', label: 'Kategori Custom', icon: FolderPlus },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition whitespace-nowrap ${
                isActive
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PROFILE & FOTO (nama, foto/avatar upload, email, nomor WA, profesi, bio, mata uang default) */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-7 animate-in fade-in">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-lg text-slate-900">Informasi &amp; Foto Profil</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Atur foto profil kustom, avatar karakter, identitas diri, dan preferensi akun TataDana Anda.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-[11px] font-extrabold bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full uppercase shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Paket {user.plan.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Success Notification Alert */}
          {profileNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{profileNotice}</span>
            </div>
          )}

          {/* SECTION 1: FOTO PROFIL & AVATAR SELECTION */}
          <div className="p-5 sm:p-6 bg-gradient-to-br from-slate-50 to-orange-50/40 rounded-3xl border border-slate-200/90 space-y-5">
            <div>
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-orange-600" />
                <span>Foto Profil &amp; Avatar</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Unggah foto diri asli atau pilih avatar karakter yang akan tampil pada dashboard dan laporan.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Preview Avatar Box (96x96px) */}
              <div className="relative group flex-shrink-0">
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-orange-500 via-orange-600 to-amber-500 text-white shadow-xl shadow-orange-600/25 flex items-center justify-center overflow-hidden border-2 border-white ring-4 ring-orange-100">
                  {uploadedPhotoUrl ? (
                    <img
                      src={uploadedPhotoUrl}
                      alt="Foto Profil"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl select-none">{selectedAvatarEmoji}</span>
                  )}
                </div>

                {/* Upload Trigger Badge */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg border-2 border-white transition transform hover:scale-110 active:scale-95"
                  title="Ganti Foto Profil"
                >
                  <Camera className="w-3.5 h-3.5 text-orange-400" />
                </button>
              </div>

              {/* Upload Controls & Actions */}
              <div className="flex-1 space-y-3 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoUpload}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Memproses...' : 'Unggah Foto Baru'}</span>
                  </button>

                  {uploadedPhotoUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  Format gambar yang didukung: <b>JPG, PNG, WebP</b> (Ukuran maksimal 5MB).
                </p>

                {/* Avatar Alternative Selector */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-700 block mb-2">
                    Atau gunakan Avatar Karakter:
                  </span>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {[
                      { emoji: '👨‍💼', label: 'Eksekutif Pria' },
                      { emoji: '👩‍💼', label: 'Eksekutif Wanita' },
                      { emoji: '🧑‍💻', label: 'Developer Pria' },
                      { emoji: '👩‍💻', label: 'Developer Wanita' },
                      { emoji: '👨‍🎓', label: 'Pelajar / Mahasiswa' },
                      { emoji: '🧕', label: 'Hijaber' },
                      { emoji: '🧔', label: 'Kreator' },
                      { emoji: '🧑‍🎨', label: 'Desainer' },
                      { emoji: '💼', label: 'Pebisnis' },
                      { emoji: '🚀', label: 'Startup' },
                      { emoji: '💎', label: 'Investor' },
                      { emoji: '🐱', label: 'Maskot Kucing' },
                    ].map((item) => {
                      const isSelected = !uploadedPhotoUrl && selectedAvatarEmoji === item.emoji;
                      return (
                        <button
                          type="button"
                          key={item.emoji}
                          onClick={() => handleSelectEmojiAvatar(item.emoji)}
                          title={item.label}
                          className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition transform hover:scale-110 active:scale-95 ${
                            isSelected
                              ? 'border-orange-600 bg-orange-100/70 ring-2 ring-orange-500/30 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-100'
                          }`}
                        >
                          {item.emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: USER PROFILE DATA FIELDS */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-orange-600" />
              <span>Data Identitas &amp; Preferensi Akun</span>
            </h4>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    placeholder="Nama lengkap Anda"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Email Akun */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email Akun
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    placeholder="email@tatadana.id"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Nomor WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">Nomor WhatsApp</label>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Terverifikasi OTP
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Profesi / Pekerjaan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Profesi / Pekerjaan
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={profileOccupation}
                    onChange={(e) => setProfileOccupation(e.target.value)}
                    placeholder="Contoh: Karyawan Swasta, Freelancer"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition"
                  />
                  <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              {/* Mata Uang Default */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Uang Default</label>
                <select
                  value={profileCurrency}
                  onChange={(e) => setProfileCurrency(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-bold"
                >
                  <option value="IDR">IDR — Rupiah Indonesia (Rp)</option>
                  <option value="USD">USD — US Dollar ($)</option>
                </select>
              </div>

              {/* Zona Waktu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Zona Waktu Sistem</label>
                <input
                  type="text"
                  disabled
                  defaultValue="WIB (Asia/Jakarta, UTC+7)"
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* Bio / Target Finansial */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bio &amp; Catatan Target Finansial
              </label>
              <textarea
                value={profileBio}
                onChange={(e) => setProfileBio(e.target.value)}
                rows={2}
                placeholder="Tuliskan target atau motivasi keuangan Anda (contoh: Target tabungan 50 juta dan financial freedom 2028)"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-orange-500 focus:bg-white transition resize-none"
              />
            </div>
          </div>

          {/* SECTION 3: ACCOUNT STATUS CARD */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Status Keanggotaan: <b className="text-slate-900">Aktif &amp; Terverifikasi</b></span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Terdaftar Sejak: <b className="text-slate-900">Oktober 2026</b></span>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-orange-600/25 transition active:scale-95 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan Profil</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: TELEGRAM BOT INTEGRATION (PART 5) */}
      {activeTab === 'telegram' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Konfigurasi Bot Telegram</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Hubungkan bot Telegram kamu agar bisa mencatat transaksi langsung dari chat (WIB).
              </p>
            </div>

            {/* Status Badge (Part 5: 🟢 Terhubung / 🔴 Tidak terhubung / ⏳ Testing...) */}
            <div>
              {connectionStatus === 'connected' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  🟢 Terhubung (@{botUsername})
                </span>
              )}
              {connectionStatus === 'disconnected' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-bold">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  🔴 Tidak terhubung
                </span>
              )}
              {connectionStatus === 'testing' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ⏳ Testing...
                </span>
              )}
            </div>
          </div>

          {/* Inline Step-by-Step Guide from @BotFather (Part 5 Requirement) */}
          <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl space-y-2 text-xs">
            <h4 className="font-bold text-orange-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-600" />
              Panduan Menghubungkan Bot dari @BotFather
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed">
              <li>Buka aplikasi Telegram dan cari <b>@BotFather</b>.</li>
              <li>Kirim perintah <code>/newbot</code> dan ikuti instruksi untuk memberi nama bot kamu.</li>
              <li>Salin token HTTP API yang diberikan (contoh: <code>7194829104:AAFnXj8s7d...</code>).</li>
              <li>Paste token tersebut pada kolom di bawah ini, lalu klik tombol <b>Test Koneksi</b>.</li>
              <li>Sistem akan memverifikasi getMe dan otomatis mendaftarkan webhook idempotent.</li>
            </ol>
          </div>

          {/* Token Input Field & Test Connection */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Bot Token dari @BotFather (Terenkripsi di Database)
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Paste token bot Telegram di sini"
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-orange-500"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing'}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {connectionStatus === 'testing' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>⏳ Testing...</span>
                  </>
                ) : (
                  <span>Test Koneksi</span>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">{statusMessage}</p>
          </div>
        </div>
      )}

      {/* TAB 3: REMINDER (PART 3 & PART 4.8) */}
      {activeTab === 'reminder' && (
        <form onSubmit={handleSaveReminder} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Pengingat Harian (Telegram Reminder)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kirimkan pengingat rutin agar kamu tidak lupa mencatat transaksi harian (maksimal 2x/hari sesuai kebijakan produk).
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {reminderNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{reminderNotice}</span>
            </div>
          )}

          {reminderEnabled && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Frekuensi Pengingat (Maksimal 2x/Hari)</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="freq"
                      checked={reminderFrequency === 1}
                      onChange={() => setReminderFrequency(1)}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span>1x Sehari</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="freq"
                      checked={reminderFrequency === 2}
                      onChange={() => setReminderFrequency(2)}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span>2x Sehari (Pagi &amp; Malam)</span>
                  </label>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Reminder 1 (WIB)</label>
                  <input
                    type="time"
                    value={reminderTime1}
                    onChange={(e) => setReminderTime1(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                  />
                </div>
                {reminderFrequency === 2 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Jam Reminder 2 (WIB)</label>
                    <input
                      type="time"
                      value={reminderTime2}
                      onChange={(e) => setReminderTime2(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900"
                    />
                  </div>
                )}
              </div>

              {/* Preview Pesan Reminder (Part 4.8 Format Wajib) */}
              <div className="p-4 bg-slate-900 text-amber-200 rounded-2xl font-mono text-[11px] space-y-1 shadow">
                <span className="text-slate-400 block mb-1 font-sans font-bold">// Preview Pesan Reminder Bot Sesuai Part 4.8:</span>
                ⏰ <b>Reminder Keuangan!</b><br />
                Jangan lupa catat pengeluaran hari ini ya 📝<br />
                Pencatatan rutin = keuangan lebih terkontrol 💪<br />
                Ketik transaksimu sekarang!
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 transition active:scale-95"
                >
                  Simpan Jadwal Reminder
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* TAB 4: CATEGORIES (PART 3) */}
      {activeTab === 'categories' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Kelola Kategori Keuangan</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar kategori transaksi bawaan rekomendasi AI &amp; kategori kustom yang Anda buat.
              </p>
            </div>
            <button
              onClick={() => setIsAddCatOpen(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 flex items-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Tambah Kategori Baru
            </button>
          </div>

          {/* AI Onboarding Banner */}
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-start gap-3 text-xs">
            <Sparkles className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-orange-950">Rekomendasi Cerdas AI Onboarding</span>
              <p className="text-orange-900/80 leading-relaxed">
                Kategori awal direkomendasikan otomatis oleh AI saat registrasi berdasarkan pola pengeluaran Anda. Anda bebas menambah emoji custom dan warna spesifik untuk memudahkan pengelompokan bot.
              </p>
            </div>
          </div>

          {/* Notification */}
          {catNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{catNotice}</span>
            </div>
          )}

          {/* Type Filter */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold w-fit">
            <button
              onClick={() => setCatFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition ${
                catFilter === 'all' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Semua ({categories.length})
            </button>
            <button
              onClick={() => setCatFilter('expense')}
              className={`px-3 py-1.5 rounded-lg transition ${
                catFilter === 'expense' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Pengeluaran ({categories.filter((c) => c.type === 'expense').length})
            </button>
            <button
              onClick={() => setCatFilter('income')}
              className={`px-3 py-1.5 rounded-lg transition ${
                catFilter === 'income' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              Pemasukan ({categories.filter((c) => c.type === 'income').length})
            </button>
          </div>

          {/* Category Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories
              .filter((c) => catFilter === 'all' || c.type === catFilter)
              .map((cat) => (
                <div
                  key={cat.id}
                  className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between transition hover:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm"
                      style={{ backgroundColor: `${cat.color || '#ea580c'}15`, color: cat.color || '#ea580c' }}
                    >
                      {cat.emoji}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{cat.name}</h4>
                      <span className="text-[10px] text-slate-400 capitalize">{cat.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</span>
                    </div>
                  </div>

                  {!cat.is_default && (
                    <button
                      onClick={() => {
                        if (confirm(`Hapus kategori "${cat.name}"?`)) {
                          deleteCategory(cat.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Hapus Kategori"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>

          {/* Add Category Modal */}
          {isAddCatOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-extrabold text-sm text-slate-900">Tambah Kategori Baru</h3>
                  <button onClick={() => setIsAddCatOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAddCategorySubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Kategori</label>
                    <input
                      type="text"
                      required
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="Contoh: Belanja Online, Donasi..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Pilih Emoji</label>
                      <input
                        type="text"
                        value={newCatEmoji}
                        onChange={(e) => setNewCatEmoji(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Warna Label</label>
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={(e) => setNewCatColor(e.target.value)}
                        className="w-full h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jenis Kategori</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewCatType('expense')}
                        className={`py-2 rounded-xl font-bold border transition ${
                          newCatType === 'expense'
                            ? 'bg-orange-50 border-orange-500 text-orange-700'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Pengeluaran
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCatType('income')}
                        className={`py-2 rounded-xl font-bold border transition ${
                          newCatType === 'income'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                            : 'border-slate-200 text-slate-600'
                        }`}
                      >
                        Pemasukan
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-xl shadow-md shadow-orange-600/20"
                    >
                      Simpan Kategori Baru
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
