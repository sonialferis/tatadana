import { NextRequest, NextResponse } from 'next/server';
import {
  addManualTransaction,
  deleteServerTransaction,
  transferServerFunds,
  updateCategoryBudget,
  getFinanceState,
} from '@/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = getFinanceState();
    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal mengambil data keuangan' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if this is a transfer request
    if (body.action === 'transfer' || (body.type === 'transfer' && body.from_wallet_id && body.to_wallet_id)) {
      const res = transferServerFunds({
        fromWalletId: body.from_wallet_id || body.wallet_id,
        toWalletId: body.to_wallet_id,
        amount: Number(body.amount),
        fee: Number(body.fee || 0),
        notes: body.notes || 'Transfer Antar Dompet',
      });
      if (!res.success) {
        return NextResponse.json({ ok: false, error: res.error || 'Transfer gagal' }, { status: 400 });
      }
      return NextResponse.json({ ok: true, transaction: res.transaction, data: getFinanceState() });
    }

    // Check if this is a budget update request
    if (body.action === 'update_budget' && body.category_id && body.monthly_limit !== undefined) {
      const budget = updateCategoryBudget(body.category_id, Number(body.monthly_limit));
      return NextResponse.json({ ok: true, budget, data: getFinanceState() });
    }

    if (!body || !body.type || !body.amount) {
      return NextResponse.json(
        { ok: false, error: 'Data transaksi tidak lengkap' },
        { status: 400 }
      );
    }

    const newTx = addManualTransaction({
      user_id: body.user_id || 'user-01',
      wallet_id: body.wallet_id || 'w-1',
      category_id: body.category_id || 'c-1',
      to_wallet_id: body.to_wallet_id || null,
      type: body.type,
      amount: Number(body.amount),
      notes: body.notes || '',
      transaction_time: body.transaction_time || new Date().toISOString(),
      source: body.source || 'web',
    });

    const updatedState = getFinanceState();

    return NextResponse.json({
      ok: true,
      transaction: newTx,
      data: updatedState,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal menyimpan transaksi' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await req.json();
        id = body.id;
      } catch {
        // query param fallback
      }
    }

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID transaksi wajib disertakan' },
        { status: 400 }
      );
    }

    const result = deleteServerTransaction(id);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      deletedTx: result.deletedTx,
      data: getFinanceState(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal menghapus transaksi' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.category_id && body.monthly_limit !== undefined) {
      const budget = updateCategoryBudget(body.category_id, Number(body.monthly_limit));
      return NextResponse.json({ ok: true, budget, data: getFinanceState() });
    }
    return NextResponse.json({ ok: false, error: 'Permintaan tidak valid' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || 'Gagal memperbarui budget' },
      { status: 500 }
    );
  }
}
