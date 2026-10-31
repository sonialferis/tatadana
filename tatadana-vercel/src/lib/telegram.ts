import { formatRupiah, formatTanggalWIB, generateProgressBar } from './formatters';

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
  first_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  caption?: string;
  photo?: Array<{ file_id: string; file_unique_id: string; width: number; height: number; file_size?: number }>;
  voice?: { file_id: string; duration: number; mime_type?: string; file_size?: number };
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

/**
 * Verify Telegram Bot Token by calling getMe API
 */
export async function testTelegramToken(token: string): Promise<{ ok: boolean; bot?: TelegramUser; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`, {
      method: 'GET',
    });
    const data = await res.json();
    if (data.ok) {
      return { ok: true, bot: data.result };
    }
    return { ok: false, error: data.description || 'Token bot tidak valid' };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Gagal menghubungi Telegram API' };
  }
}

/**
 * Register Webhook URL to Telegram
 */
export async function setTelegramWebhook(token: string, webhookUrl: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ['message'],
        drop_pending_updates: false,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      return { ok: true };
    }
    return { ok: false, error: data.description || 'Gagal mendaftarkan webhook' };
  } catch (err: any) {
    return { ok: false, error: err.message || 'Gagal menghubungi Telegram API' };
  }
}

/**
 * Send Text Message to Telegram Chat
 */
export async function sendTelegramMessage(token: string, chatId: number | string, text: string): Promise<boolean> {
  const activeToken = token && token !== 'mock_telegram_bot_token' 
    ? token 
    : (process.env.TELEGRAM_BOT_TOKEN || '8992878861:AAHCKkqhwMg0mT7Luvgdk17ovBaWTUEMVgY');

  try {
    const res = await fetch(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error('[sendTelegramMessage FAIL]:', data);
      // Fallback: if failure was due to entity parsing in HTML mode, retry sending as plain text
      if (typeof data.description === 'string' && data.description.toLowerCase().includes("can't parse entities")) {
        const plainText = text.replace(/<[^>]*>?/gm, '');
        const retryRes = await fetch(`https://api.telegram.org/bot${activeToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: plainText,
          }),
          signal: AbortSignal.timeout(8000),
        });
        const retryData = await retryRes.json();
        return !!retryData.ok;
      }
    } else {
      console.log('[sendTelegramMessage SUCCESS] message sent to chat:', chatId);
    }
    return !!data.ok;
  } catch (err: any) {
    console.error('[sendTelegramMessage ERROR]:', err.message);
    return false;
  }
}

/**
 * Format Reply Pengeluaran persis sesuai PART 4.4
 */
export function formatExpenseReply(params: {
  nominal: number;
  kategoriEmoji: string;
  kategoriNama: string;
  walletName: string;
  catatan: string;
  saldoSetelah: number;
  budgetKategoriNama: string;
  persentaseBudget: number;
  sisaBudget: number;
  motivasi?: string;
  transcriptVoice?: string;
}): string {
  const { fullFormatted } = formatTanggalWIB();
  const progressBar = generateProgressBar(params.persentaseBudget, 16);
  
  let transcriptLine = '';
  if (params.transcriptVoice) {
    transcriptLine = `🎙️ Transkrip: "<i>${params.transcriptVoice}</i>"\n\n`;
  }

  let motivationLine = '';
  if (params.persentaseBudget >= 100) {
    motivationLine = '\n⚠️ <b>Perhatian:</b> Budget kategori ini sudah habis! Rem pengeluaranmu ya.';
  } else if (params.persentaseBudget >= 80) {
    motivationLine = '\n⚠️ <b>Peringatan:</b> Budget kategori ini sudah mencapai 80%. Berhematlah!';
  } else if (params.motivasi) {
    motivationLine = `\n<i>${params.motivasi}</i>`;
  }

  return (
    `${transcriptLine}` +
    `${fullFormatted}\n` +
    `💸 <b>Pengeluaran tercatat!</b>\n` +
    `├ Nominal : <b>${formatRupiah(params.nominal)}</b>\n` +
    `├ Kategori : ${params.kategoriEmoji} ${params.kategoriNama}\n` +
    `├ Dompet : 👛 ${params.walletName}\n` +
    `├ Catatan : ${params.catatan}\n` +
    `└ Saldo : <b>${formatRupiah(params.saldoSetelah)}</b>\n\n` +
    `📊 <b>Budget ${params.budgetKategoriNama} bulan ini:</b>\n` +
    `[${progressBar}] ${params.persentaseBudget.toFixed(1)}% — sisa ${formatRupiah(params.sisaBudget)}` +
    `${motivationLine}`
  );
}

/**
 * Format Reply Pemasukan persis sesuai PART 4.5
 */
export function formatIncomeReply(params: {
  nominal: number;
  walletName: string;
  saldoBaru: number;
  transcriptVoice?: string;
}): string {
  const { fullFormatted } = formatTanggalWIB();
  
  let transcriptLine = '';
  if (params.transcriptVoice) {
    transcriptLine = `🎙️ Transkrip: "<i>${params.transcriptVoice}</i>"\n\n`;
  }

  return (
    `${transcriptLine}` +
    `${fullFormatted}\n` +
    `💰 <b>Pemasukan tercatat!</b>\n` +
    `├ Nominal : <b>${formatRupiah(params.nominal)}</b>\n` +
    `├ Kategori : 💼 Pemasukan\n` +
    `├ Dompet : 👛 ${params.walletName}\n` +
    `└ Saldo baru : <b>${formatRupiah(params.saldoBaru)}</b>\n\n` +
    `💪 <i>Semangat terus! Jangan lupa sisihkan untuk tabungan ya.</i>`
  );
}

/**
 * Format Reply untuk Limit Transaksi Starter Tercapai (Part 4.9)
 */
export function formatLimitExceededReply(): string {
  return (
    `⚠️ <b>Batas Transaksi Bulanan Tercapai</b>\n\n` +
    `Kamu sudah mencapai batas maksimal <b>50 transaksi/bulan</b> pada paket <b>Starter</b>.\n\n` +
    `✨ <b>Upgrade ke Pro</b> untuk menikmati:\n` +
    `• Transaksi unlimited\n` +
    `• Input via foto struk (OCR AI)\n` +
    `• AI Financial Advisor aktif\n` +
    `• Ekspor laporan PDF & Excel unlimited\n\n` +
    `👉 Kunjungi dashboard TataDana untuk upgrade: https://tatadana.app/pricing`
  );
}

/**
 * Format Reply Bantuan (/bantuan)
 */
export function formatHelpReply(): string {
  return (
    `🤖 <b>Panduan Penggunaan TataDana Bot</b>\n\n` +
    `Ketik langsung transaksimu dalam bahasa natural:\n` +
    `• <i>"beli bakso 15rb"</i> (Pengeluaran)\n` +
    `• <i>"gajian freelance 5jt"</i> (Pemasukan)\n` +
    `• <i>"kopi susu 25k via gopay"</i>\n` +
    `• Kirim <b>Foto Struk</b> (khusus paket Pro)\n` +
    `• Kirim <b>Voice Note</b> (maks. 60 detik)\n\n` +
    `<b>Daftar Perintah:</b>\n` +
    `• /saldo — Cek saldo semua dompet\n` +
    `• /hari ini — Rekap transaksi hari ini\n` +
    `• /minggu ini — Rekap transaksi 7 hari terakhir\n` +
    `• /bulan ini — Rekap bulan berjalan & kategori\n` +
    `• /budget — Status semua budget bulanan\n` +
    `• /sheet — Link spreadsheet laporan kamu\n` +
    `• /bantuan — Tampilkan pesan ini`
  );
}

/**
 * Format Reply Google Sheet pribadi (/sheet) - Part 4.6
 */
export function formatGoogleSheetReply(sheetUrl: string): string {
  return (
    `📊 <b>Link Google Sheet Laporan Pribadi</b>\n\n` +
    `Semua mutasi transaksi dan rincian struk belanja tersinkronisasi otomatis ke spreadsheet pribadi kamu:\n\n` +
    `🔗 <a href="${sheetUrl}">${sheetUrl}</a>\n\n` +
    `<i>Data diperbarui real-time setiap kali kamu mencatat transaksi baru.</i>`
  );
}

/**
 * Format Reply AI Financial Advisor (Part 4.7)
 */
export function formatFinancialAdvisorReply(params: {
  nama: string;
  analisa: string;
  saran: string;
}): string {
  return (
    `🤖 <b>Financial Advisor</b>\n` +
    `Hei ${params.nama}! ${params.analisa}\n` +
    `💡 Saran: ${params.saran}`
  );
}

/**
 * Format Reply Reminder Harian (Part 4.8)
 */
export function formatReminderReply(): string {
  return (
    `⏰ <b>Reminder Keuangan!</b>\n` +
    `Jangan lupa catat pengeluaran hari ini ya 📝\n` +
    `Pencatatan rutin = keuangan lebih terkontrol 💪\n` +
    `Ketik transaksimu sekarang!`
  );
}

/**
 * Format Reply Pesan Broadcast Telegram Admin
 */
export function formatBroadcastMessage(params: {
  title: string;
  message: string;
  targetPlan?: 'all' | 'starter' | 'pro' | string;
}): string {
  const targetLabel = params.targetPlan === 'pro'
    ? '⭐ Khusus Member Pro'
    : params.targetPlan === 'starter'
    ? '🌱 Pengguna Paket Starter'
    : '🌐 Seluruh Pengguna';

  // Safely escape reserved HTML characters in title so Telegram API doesn't fail entity parsing
  const safeTitle = (params.title || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Sanitize bare & in message that are not valid entities
  const safeMessage = (params.message || '')
    .replace(/&(?!amp;|lt;|gt;|quot;|#\d+;)/g, '&amp;');

  return (
    `📢 <b>PENGUMUMAN RESMI TATADANA</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📌 <b>${safeTitle}</b>\n\n` +
    `${safeMessage}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `<i>💡 Pesan broadcast resmi Admin TataDana (${targetLabel})</i>`
  );
}

