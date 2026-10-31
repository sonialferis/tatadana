import { NextRequest, NextResponse } from 'next/server';
import {
  getBroadcastRecipients,
  getBroadcastHistory,
  saveBroadcastRecord,
  logAuditEvent,
} from '@/lib/admin-store';
import { formatBroadcastMessage, sendTelegramMessage } from '@/lib/telegram';
import { BroadcastRecord } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const broadcasts = getBroadcastHistory();
    return NextResponse.json({
      ok: true,
      broadcasts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Gagal memuat histori broadcast' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const title = (body.title || '').trim();
    const message = (body.message || '').trim();
    const normalizedPlan = (body.targetPlan || '').toLowerCase().trim();
    const targetPlan: 'all' | 'starter' | 'pro' = ['starter', 'pro'].includes(normalizedPlan)
      ? (normalizedPlan as 'starter' | 'pro')
      : 'all';

    if (!title || !message) {
      return NextResponse.json(
        { ok: false, error: 'Judul dan isi pesan broadcast wajib diisi' },
        { status: 400 }
      );
    }

    // 1. Gather all registered recipients based on targetPlan
    const recipients = getBroadcastRecipients(targetPlan);

    // 2. Format broadcast message for Telegram HTML mode
    const formattedText = formatBroadcastMessage({
      title,
      message,
      targetPlan,
    });

    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8992878861:AAHCKkqhwMg0mT7Luvgdk17ovBaWTUEMVgY';

    // 3. Dispatch to all recipients concurrently to prevent request timeouts
    const recipientResults = await Promise.all(
      recipients.map(async (recipient) => {
        try {
          const ok = await sendTelegramMessage(botToken, recipient.telegram_id, formattedText);
          return {
            chatId: recipient.telegram_id,
            userName: recipient.full_name,
            plan: recipient.plan,
            success: ok,
          };
        } catch {
          return {
            chatId: recipient.telegram_id,
            userName: recipient.full_name,
            plan: recipient.plan,
            success: false,
          };
        }
      })
    );

    const totalSent = recipientResults.filter((r) => r.success).length;
    const totalFailed = recipientResults.filter((r) => !r.success).length;

    const broadcastId = `bc-${Date.now()}`;
    const sentAt = new Date().toISOString();

    // 4. Save broadcast history record
    const record: BroadcastRecord = {
      id: broadcastId,
      title,
      message,
      targetPlan,
      totalSent,
      totalFailed,
      sentAt,
      recipients: recipientResults,
    };
    saveBroadcastRecord(record);

    // 5. Record Audit Log entry
    logAuditEvent({
      admin_id: body.adminId || 'admin-super-01',
      action: 'TELEGRAM_BROADCAST_SENT',
      details: {
        broadcastId,
        title,
        targetPlan,
        totalSent,
        totalFailed,
        totalRecipients: recipients.length,
      },
    });

    return NextResponse.json({
      ok: true,
      totalSent,
      totalFailed,
      broadcastId,
      message: `Broadcast selesai dikirim: ${totalSent} terkirim, ${totalFailed} gagal.`,
      record,
    });
  } catch (err: any) {
    console.error('[API /api/admin/broadcast error]:', err);
    return NextResponse.json(
      { ok: false, error: err?.message || 'Gagal mengirim broadcast Telegram' },
      { status: 500 }
    );
  }
}
