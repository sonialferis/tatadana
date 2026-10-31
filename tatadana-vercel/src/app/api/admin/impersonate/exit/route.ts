import { NextRequest, NextResponse } from 'next/server';
import { endImpersonationSession } from '@/lib/admin-store';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  endImpersonationSession();

  const response = NextResponse.json({
    ok: true,
    action: 'STOP',
    message: 'Keluar dari mode impersonasi.',
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

export async function GET(req: NextRequest) {
  endImpersonationSession();

  const response = NextResponse.redirect(new URL('/admin', req.url));
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
