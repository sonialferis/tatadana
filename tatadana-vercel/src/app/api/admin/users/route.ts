import { NextResponse } from 'next/server';
import { getAllUsers, approveCustomer, rejectCustomer } from '@/lib/users-store';
import { logAuditEvent } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = getAllUsers();
    const pendingCount = users.filter((u) => u.status === 'pending').length;
    const approvedCount = users.filter((u) => u.status === 'approved').length;

    return NextResponse.json({
      ok: true,
      users,
      pendingCount,
      approvedCount,
    });
  } catch (error: any) {
    console.error('Error fetching users in /api/admin/users:', error);
    return NextResponse.json(
      { ok: false, error: 'Gagal mengambil data pengguna: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, userId, reason } = body;

    if (!action || !userId) {
      return NextResponse.json(
        { ok: false, error: 'Parameter action dan userId wajib diisi.' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      const res = approveCustomer(userId);
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
      }

      try {
        logAuditEvent({
          action: 'CUSTOMER_APPROVED',
          target_user_id: userId,
          details: {
            info: `Admin menyetujui akun pelanggan ${res.user?.name} (${res.user?.email})`,
          },
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }

      return NextResponse.json({
        ok: true,
        message: `Akun pelanggan ${res.user?.name} berhasil disetujui (Approved). Pelanggan sekarang dapat masuk ke sistem.`,
        user: res.user,
        users: getAllUsers(),
      });
    }

    if (action === 'reject') {
      const res = rejectCustomer(userId, reason);
      if (!res.ok) {
        return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
      }

      try {
        logAuditEvent({
          action: 'CUSTOMER_REJECTED',
          target_user_id: userId,
          details: {
            info: `Admin menolak akun pelanggan ${res.user?.name} (${res.user?.email})`,
            reason,
          },
        });
      } catch (e) {
        console.warn('Failed to log audit event:', e);
      }

      return NextResponse.json({
        ok: true,
        message: `Akun pelanggan ${res.user?.name} telah ditolak.`,
        user: res.user,
        users: getAllUsers(),
      });
    }

    return NextResponse.json({ ok: false, error: 'Aksi tidak dikenal.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/admin/users POST:', error);
    return NextResponse.json(
      { ok: false, error: 'Terjadi kesalahan sistem: ' + error.message },
      { status: 500 }
    );
  }
}
