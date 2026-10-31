import { NextRequest, NextResponse } from 'next/server';
import { rejectManualPaymentOrder } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const orderId = body.orderId || body.order_id;
    const adminId = body.adminId || body.admin_id || 'admin-super-01';
    const reason = body.reason || 'Bukti transfer tidak valid atau nominal tidak sesuai';

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: 'orderId wajib disertakan' },
        { status: 400 }
      );
    }

    const updated = rejectManualPaymentOrder(orderId, adminId, reason);
    if (!updated) {
      return NextResponse.json(
        { ok: false, error: `Order ${orderId} tidak ditemukan` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      orderId,
      status: 'rejected',
      message: `Order ${orderId} telah ditolak dengan alasan: ${reason}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Gagal memproses penolakan pembayaran' },
      { status: 500 }
    );
  }
}
