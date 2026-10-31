import { NextRequest, NextResponse } from 'next/server';
import { formatReminderReply, sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const botToken = process.env.TELEGRAM_BOT_TOKEN || 'mock_telegram_bot_token';
    const targetChatId = body.chatId || 123456789;

    const reminderText = formatReminderReply();
    const sent = await sendTelegramMessage(botToken, targetChatId, reminderText);

    return NextResponse.json({
      ok: true,
      status: 'reminder_dispatched',
      chatId: targetChatId,
      sent,
      message: 'Reminder harian Telegram berhasil dikirim',
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal mengirim reminder' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const reminderText = formatReminderReply();
  return NextResponse.json({
    ok: true,
    preview: reminderText,
    policy: 'Maksimal 2x sehari (WIB)',
  });
}
