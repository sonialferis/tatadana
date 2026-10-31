import { NextResponse } from 'next/server';
import { registerCustomer } from '@/lib/users-store';
import { logAuditEvent } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, password, plan } = body;

    if (!name || !email) {
      return NextResponse.json(
        { ok: false, error: 'Nama dan email wajib diisi.' },
        { status: 400 }
      );
    }

    const regResult = registerCustomer({
      name,
      email,
      phone,
      password,
      plan: plan || 'starter',
    });

    if (!regResult.ok) {
      return NextResponse.json(
        { ok: false, error: regResult.error },
        { status: 400 }
      );
    }

    // Catat log audit pendaftaran pelanggan baru yang membutuhkan persetujuan
    try {
      logAuditEvent({
        action: 'CUSTOMER_REGISTRATION_PENDING',
        target_user_id: regResult.user?.id,
        details: {
          info: `Pelanggan baru ${name} (${email}) mendaftar dan menunggu persetujuan admin`,
          phone,
          plan: plan || 'starter',
        },
      });
    } catch (e) {
      console.warn('Failed to log audit event:', e);
    }

    return NextResponse.json({
      ok: true,
      status: 'pending',
      message:
        'Pendaftaran berhasil! Akun Anda saat ini berstatus MENUNGGU PERSETUJUAN (Approval) dari Administrator Soni Alferis.',
      user: regResult.user,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/register:', error);
    return NextResponse.json(
      { ok: false, error: 'Terjadi kesalahan sistem: ' + (error?.message || 'Unknown') },
      { status: 500 }
    );
  }
}
