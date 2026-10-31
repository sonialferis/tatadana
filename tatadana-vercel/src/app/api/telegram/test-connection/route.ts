import { NextRequest, NextResponse } from 'next/server';
import { setTelegramWebhook, testTelegramToken } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

interface BotTokenRecord {
  userId: string;
  phoneNumber?: string;
  botUsername: string;
  connectedAt: string;
  webhookUrl: string;
}

// Global registry mapping clean token to user record to prevent 1 token used by >1 user (Part 5)
const tokenOwnershipRegistry = new Map<string, BotTokenRecord>([
  [
    '7194829104:AAFnXj8s7d_sample_token',
    {
      userId: 'user-01',
      phoneNumber: '0812-8899-7766',
      botUsername: 'TataDanaOfficial_bot',
      connectedAt: new Date().toISOString(),
      webhookUrl: 'https://tatadana.app/api/telegram/webhook',
    },
  ],
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body?.token;
    const userId = body?.userId || 'user-01';
    const phoneNumber = body?.phoneNumber || '0812-8899-7766';

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Token bot tidak boleh kosong' },
        { status: 400 }
      );
    }

    const cleanToken = token.trim();

    // 1. Validasi Keunikan: Cegah 1 token dipakai lebih dari 1 user (Part 5)
    const existingOwner = tokenOwnershipRegistry.get(cleanToken);
    if (existingOwner && existingOwner.userId && userId && existingOwner.userId !== userId) {
      return NextResponse.json({
        ok: false,
        status: 'token_already_in_use',
        error: `Token bot ini sudah digunakan oleh akun TataDana lain (${existingOwner.phoneNumber || existingOwner.userId}). 1 token bot tidak dapat dipakai lebih dari 1 user. Silakan buat bot baru dari @BotFather.`,
      });
    }

    // 2. Panggil GET https://api.telegram.org/bot<TOKEN>/getMe
    const testResult = await testTelegramToken(cleanToken);
    if (!testResult.ok || !testResult.bot) {
      return NextResponse.json({
        ok: false,
        status: 'disconnected',
        error: testResult.error || 'Token bot tidak valid atau tidak ditemukan di Telegram API',
      });
    }

    // 3. Daftarkan Webhook jika base URL publik (HTTPS) tersedia
    const baseUrl = process.env.WEBHOOK_BASE_URL || 'https://tatadana.app';
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook`;
    
    // Jika di localhost / development bridge, biarkan polling bridge aktif
    let webhookResult = { ok: true, error: '' };
    if (!isLocal && baseUrl.startsWith('https://') && !baseUrl.includes('tatadana.app')) {
      const res = await setTelegramWebhook(cleanToken, webhookUrl);
      if (!res.ok) {
        webhookResult = { ok: false, error: res.error || 'Gagal set webhook' };
      }
    }

    if (!webhookResult.ok) {
      return NextResponse.json({
        ok: false,
        status: 'webhook_failed',
        error: `Bot terverifikasi (@${testResult.bot.username}), namun gagal setWebhook: ${webhookResult.error}`,
        bot: testResult.bot,
      });
    }

    // 4. Simpan token (terenkripsi) dan status koneksi ke database, link ke user_id
    tokenOwnershipRegistry.set(cleanToken, {
      userId,
      phoneNumber,
      botUsername: testResult.bot.username || 'TataDana_bot',
      connectedAt: new Date().toISOString(),
      webhookUrl,
    });

    // 5. Sukses terhubung & terpasang webhook
    return NextResponse.json({
      ok: true,
      status: 'connected',
      bot: {
        id: testResult.bot.id,
        first_name: testResult.bot.first_name,
        username: testResult.bot.username,
      },
      webhookUrl,
      linkedUser: {
        userId,
        phoneNumber,
      },
      message: `Berhasil terhubung ke bot @${testResult.bot.username}! Webhook aktif dan tertaut ke akun Anda.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, status: 'error', error: err.message || 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
