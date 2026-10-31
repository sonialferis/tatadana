import { NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/users-store';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password, method } = body;

    if (!identifier) {
      return NextResponse.json(
        { ok: false, error: 'Email atau nomor telepon wajib diisi.' },
        { status: 400 }
      );
    }

    // Phone OTP login method bypasses password if OTP is verified
    const result = authenticateUser(identifier, method === 'phone' ? undefined : password);

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: result.status,
          error: result.error,
        },
        { status: result.status === 'pending' ? 403 : 401 }
      );
    }

    return NextResponse.json({
      ok: true,
      role: result.role,
      status: result.status || 'approved',
      user: result.user,
      redirectTo: result.redirectTo,
    });
  } catch (error: any) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json(
      { ok: false, error: 'Terjadi kesalahan sistem: ' + (error?.message || 'Unknown') },
      { status: 500 }
    );
  }
}
