import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  getOrderById,
  updateSubscriptionOrder,
  logAuditEvent,
} from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const orderId = body.order_id || body.orderId;
    const statusCode = body.status_code || body.statusCode || '200';
    const grossAmount = body.gross_amount || body.grossAmount || '99000.00';
    const signatureKey = body.signature_key || body.signatureKey;
    const transactionStatus = body.transaction_status || body.transactionStatus || 'settlement';
    const fraudStatus = body.fraud_status || body.fraudStatus;

    if (!orderId) {
      return NextResponse.json(
        { ok: false, error: 'order_id wajib disertakan dalam payload Midtrans' },
        { status: 400 }
      );
    }

    // 1. Signature Verification using SHA-512
    const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-mock123';

    const isValidSignature = verifyMidtransSignature(
      String(orderId),
      String(statusCode),
      String(grossAmount),
      String(signatureKey || ''),
      serverKey
    );

    if (!isValidSignature) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Verifikasi Midtrans SHA-512 gagal. Signature key tidak valid.',
        },
        { status: 403 }
      );
    }

    // 2. Idempotency Check: if order is already settled
    const existingOrder = getOrderById(String(orderId));
    if (existingOrder && existingOrder.payment_status === 'settlement') {
      return NextResponse.json({
        ok: true,
        status: 'already_settled',
        message: 'Order telah diselesaikan sebelumnya (idempotent).',
        orderId,
      });
    }

    // 3. Process Transaction Status
    if (
      transactionStatus === 'settlement' ||
      (transactionStatus === 'capture' && fraudStatus === 'accept')
    ) {
      // Auto upgrade user to Pro plan
      const updatedOrder = updateSubscriptionOrder(String(orderId), {
        payment_status: 'settlement',
        amount: Number(grossAmount) || 99000,
        payment_type: 'midtrans',
        admin_notes: `Midtrans Webhook: Verified SHA-512 (${body.payment_type || 'qris'})`,
      });

      const targetUserId = updatedOrder?.user_id || 'usr-1';
      updateUserPlan(targetUserId, 'pro');

      // Audit Trail Logging
      logAuditEvent({
        admin_id: 'SYSTEM_MIDTRANS',
        target_user_id: targetUserId,
        action: 'MIDTRANS_SETTLEMENT',
        details: {
          orderId,
          grossAmount,
          transactionStatus,
          paymentType: body.payment_type || 'midtrans',
          upgradedPlan: 'pro',
        },
      });

      return NextResponse.json({
        ok: true,
        status: 'settlement',
        orderId,
        userPlan: 'pro',
        message: 'Pembayaran sukses diverifikasi. Akun pengguna di-upgrade ke Paket Pro.',
      });
    } else if (transactionStatus === 'pending') {
      updateSubscriptionOrder(String(orderId), {
        payment_status: 'pending',
        amount: Number(grossAmount) || 99000,
        payment_type: 'midtrans',
      });

      return NextResponse.json({
        ok: true,
        status: 'pending',
        orderId,
      });
    } else if (
      transactionStatus === 'deny' ||
      transactionStatus === 'cancel' ||
      transactionStatus === 'expire'
    ) {
      updateSubscriptionOrder(String(orderId), {
        payment_status: transactionStatus === 'expire' ? 'expire' : 'rejected',
        payment_type: 'midtrans',
      });

      return NextResponse.json({
        ok: true,
        status: transactionStatus,
        orderId,
      });
    }

    return NextResponse.json({
      ok: true,
      status: transactionStatus,
      orderId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Gagal memproses notifikasi Midtrans' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'TataDana Midtrans Webhook Receiver',
    algorithm: 'SHA-512',
    status: 'active',
  });
}

function verifyMidtransSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  receivedSignature: string,
  serverKey: string
): boolean {
  if (!receivedSignature) return false;

  const targetSig = receivedSignature.trim().toLowerCase();

  // Test 1: exact payload
  const payload1 = `${orderId}${statusCode}${grossAmount}${serverKey}`;
  const hash1 = crypto.createHash('sha512').update(payload1).digest('hex');
  if (hash1 === targetSig) return true;

  // Test 2: grossAmount normalized with .00
  if (!grossAmount.includes('.')) {
    const payload2 = `${orderId}${statusCode}${grossAmount}.00${serverKey}`;
    const hash2 = crypto.createHash('sha512').update(payload2).digest('hex');
    if (hash2 === targetSig) return true;
  }

  // Test 3: grossAmount stripped of trailing .00
  if (grossAmount.endsWith('.00')) {
    const stripped = grossAmount.slice(0, -3);
    const payload3 = `${orderId}${statusCode}${stripped}${serverKey}`;
    const hash3 = crypto.createHash('sha512').update(payload3).digest('hex');
    if (hash3 === targetSig) return true;
  }

  return false;
}
