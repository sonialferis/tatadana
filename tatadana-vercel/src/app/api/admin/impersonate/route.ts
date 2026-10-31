import { NextRequest, NextResponse } from 'next/server';
import {
  createImpersonationSession,
  endImpersonationSession,
  getActiveImpersonationSession,
} from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const action = (body.action || '').toUpperCase();
    const targetUserId = body.targetUserId || body.user_id;

    // Check if this is a STOP or EXIT action
    if (action === 'STOP' || action === 'EXIT' || (!targetUserId && body.action)) {
      endImpersonationSession(body.adminId || body.admin_id);

      const response = NextResponse.json({
        ok: true,
        action: 'STOP',
        message: 'Mode impersonasi telah dinonaktifkan.',
        redirectUrl: '/admin',
      });

      // Clear the cookie
      response.cookies.set({
        name: 'tatadana_impersonate_session',
        value: '',
        path: '/',
        maxAge: 0,
        httpOnly: false, // Accessible to client-side scripts & tests
        sameSite: 'lax',
      });

      return response;
    }

    // Default or Explicit START action
    if (!targetUserId) {
      return NextResponse.json(
        { ok: false, error: 'targetUserId atau user_id wajib disertakan untuk impersonasi' },
        { status: 400 }
      );
    }

    const { session, cookieValue } = createImpersonationSession({
      targetUserId,
      adminId: body.adminId || body.admin_id || 'admin-super-01',
      targetUserName: body.targetUserName,
      targetUserPhone: body.targetUserPhone,
      reason: body.reason || 'Troubleshooting & Support',
    });

    const response = NextResponse.json({
      ok: true,
      action: 'START',
      message: `Berhasil memulai mode impersonasi untuk pengguna ${session.targetUserName || session.targetUserId}.`,
      session,
      redirectUrl: '/dashboard',
    });

    // Set signed cookie tatadana_impersonate_session with 1 hour expiration
    response.cookies.set({
      name: 'tatadana_impersonate_session',
      value: cookieValue,
      path: '/',
      maxAge: 3600, // 1 hour
      httpOnly: false, // Allows both server and browser to inspect impersonation context
      sameSite: 'lax',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || 'Gagal memproses sesi impersonasi' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const cookieHeader = req.cookies.get('tatadana_impersonate_session')?.value;
  const session = parseImpersonationCookie(cookieHeader) || getActiveImpersonationSession();

  if (session && session.user_id) {
    return NextResponse.json({
      ok: true,
      isImpersonating: true,
      session,
    });
  }

  return NextResponse.json({
    ok: true,
    isImpersonating: false,
    session: null,
  });
}

export async function DELETE(req: NextRequest) {
  endImpersonationSession();

  const response = NextResponse.json({
    ok: true,
    action: 'STOP',
    message: 'Sesi impersonasi dihapus.',
    redirectUrl: '/admin',
  });

  response.cookies.set({
    name: 'tatadana_impersonate_session',
    value: '',
    path: '/',
    maxAge: 0,
    httpOnly: false,
    sameSite: 'lax',
  });

  return response;
}
