import { NextRequest, NextResponse } from 'next/server';
import { generatePdfReport } from '@/lib/export';
import { Transaction } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const transactions: Transaction[] = body.transactions || [];
    const userName = body.userName || 'Pengguna TataDana';
    const startDate = body.startDate || '2026-10-01';
    const endDate = body.endDate || '2026-10-31';

    const pdfBuffer = generatePdfReport(transactions, userName, startDate, endDate);

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="TataDana_Laporan_${startDate}_${endDate}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
