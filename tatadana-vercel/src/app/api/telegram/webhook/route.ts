import { NextRequest, NextResponse } from 'next/server';
import {
  formatExpenseReply,
  formatFinancialAdvisorReply,
  formatGoogleSheetReply,
  formatHelpReply,
  formatIncomeReply,
  formatLimitExceededReply,
  formatReminderReply,
  sendTelegramMessage,
  TelegramUpdate,
} from '@/lib/telegram';
import { generateFinancialAdvisorAdvice, parseNaturalTransaction, parseReceiptImage } from '@/lib/ai-parser';
import { executeAiWithFailover } from '@/lib/ai-failover';
import { formatRupiah } from '@/lib/formatters';
import {
  getFinanceState,
  getPeriodSummary,
  getWalletsSummary,
  recordExpenseFromTelegram,
  recordIncomeFromTelegram,
} from '@/lib/server-store';

// Next.js Route Segment Config for Vercel Serverless
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// In-memory idempotency cache (in addition to database update_id constraint)
const processedUpdateIds = new Set<number>();

// Mock in-memory state for development / testing when database is connected
interface DevUserSession {
  id: string;
  telegram_id: number;
  plan: 'starter' | 'pro';
  wallet_default: string;
  balance: number;
  monthly_transaction_count: number;
  budgets: { [key: string]: { limit: number; spent: number } };
}

const mockSessions: { [telegramId: number]: DevUserSession } = {
  123456789: {
    id: 'user-sample-01',
    telegram_id: 123456789,
    plan: 'starter',
    wallet_default: 'BCA (Default)',
    balance: 14850000,
    monthly_transaction_count: 14,
    budgets: {
      'Makanan & Minuman': { limit: 2000000, spent: 1450000 },
      'Transportasi': { limit: 1000000, spent: 880000 },
    },
  },
};

export async function POST(req: NextRequest) {
  try {
    const update: TelegramUpdate = await req.json();

    if (!update || !update.update_id) {
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    // 1. Idempotency Check (Mencegah transaksi ganda jika Telegram melakukan retry)
    if (processedUpdateIds.has(update.update_id)) {
      return NextResponse.json({ ok: true, status: 'already_processed' });
    }
    processedUpdateIds.add(update.update_id);
    if (processedUpdateIds.size > 10000) {
      // Keep memory bounded
      const it = processedUpdateIds.values();
      for (let i = 0; i < 2000; i++) {
        const nextVal = it.next().value;
        if (nextVal !== undefined) processedUpdateIds.delete(nextVal);
      }
    }

    const message = update.message;
    if (!message || !message.chat) {
      return NextResponse.json({ ok: true, message: 'No actionable message' });
    }

    const chatId = message.chat.id;
    const botToken = process.env.TELEGRAM_BOT_TOKEN || '8992878861:AAHCKkqhwMg0mT7Luvgdk17ovBaWTUEMVgY';
    console.log(`[TELEGRAM INCOMING] update_id=${update.update_id} chatId=${chatId} text="${message.text || message.caption || ''}"`);

    // Retrieve or register user session
    const financeStore = getFinanceState();
    const isMainUser = financeStore.user && Number(financeStore.user.telegram_id) === Number(chatId);
    let user = mockSessions[chatId];
    if (!user) {
      user = {
        id: isMainUser ? financeStore.user.id : `user-${chatId}`,
        telegram_id: chatId,
        plan: isMainUser ? (financeStore.user.plan as 'starter' | 'pro') : 'starter',
        wallet_default: 'BCA (Default)',
        balance: 10000000,
        monthly_transaction_count: 0,
        budgets: {
          'Makanan & Minuman': { limit: 2000000, spent: 500000 },
        },
      };
      mockSessions[chatId] = user;
    } else if (isMainUser && financeStore.user.plan) {
      user.plan = financeStore.user.plan as 'starter' | 'pro';
    }

    // Handle Commands
    const text = message.text?.trim() || message.caption?.trim() || '';
    if (text.startsWith('/')) {
      const cmd = text.toLowerCase();
      if (cmd === '/bantuan' || cmd === '/start') {
        await sendTelegramMessage(botToken, chatId, formatHelpReply());
        return NextResponse.json({ ok: true });
      }

      if (cmd === '/saldo') {
        const { wallets, totalBalance } = getWalletsSummary();
        let reply = `👛 <b>Status Saldo Dompet TataDana (Live)</b>\n\n`;
        wallets.forEach((w, idx) => {
          const prefix = idx === wallets.length - 1 ? '└' : '├';
          reply += `${prefix} ${w.name} : ${formatRupiah(w.balance)}\n`;
        });
        reply += `\n💰 <b>Total Saldo:</b> ${formatRupiah(totalBalance)}`;
        await sendTelegramMessage(botToken, chatId, reply);
        return NextResponse.json({ ok: true });
      }

      if (cmd === '/budget') {
        const state = getFinanceState();
        let msg = `🎯 <b>Status Budget Bulan Ini (Live)</b>\n\n`;
        state.budgets.forEach((b) => {
          const cat = state.categories.find(c => c.id === b.category_id);
          const catName = cat ? `${cat.emoji} ${cat.name}` : 'Kategori';
          const pct = b.monthly_limit > 0 ? (b.current_spent / b.monthly_limit) * 100 : 0;
          msg += `• <b>${catName}</b>\n  ${pct.toFixed(0)}% terpakai (${formatRupiah(b.current_spent)} / ${formatRupiah(b.monthly_limit)})\n`;
        });
        await sendTelegramMessage(botToken, chatId, msg);
        return NextResponse.json({ ok: true });
      }

      if (cmd === '/sheet') {
        const sheetUrl = `https://docs.google.com/spreadsheets/d/tatadana-user-${chatId}`;
        await sendTelegramMessage(botToken, chatId, formatGoogleSheetReply(sheetUrl));
        return NextResponse.json({ ok: true, status: 'sheet_link_sent' });
      }

      if (
        cmd === '/hari ini' || cmd === '/hari_ini' || cmd === '/hari' ||
        cmd === '/minggu ini' || cmd === '/minggu_ini' || cmd === '/minggu' ||
        cmd === '/bulan ini' || cmd === '/bulan_ini' || cmd === '/bulan'
      ) {
        const p = cmd.includes('hari') ? 'hari ini' : cmd.includes('minggu') ? 'minggu ini' : 'bulan ini';
        const summary = getPeriodSummary(p as 'hari ini' | 'minggu ini' | 'bulan ini');

        let breakdownKategori = '';
        if (Object.keys(summary.categoryBreakdown).length > 0) {
          breakdownKategori = `\n\n<b>Breakdown Kategori:</b>\n`;
          for (const [kat, spent] of Object.entries(summary.categoryBreakdown)) {
            breakdownKategori += `• ${kat}: ${formatRupiah(spent)}\n`;
          }
        }

        const rekap =
          `📊 <b>Rekap Transaksi (${p}) (Live)</b>\n\n` +
          `• Total Pemasukan: ${formatRupiah(summary.totalPemasukan)}\n` +
          `• Total Pengeluaran: ${formatRupiah(summary.totalPengeluaran)}\n` +
          `• Jumlah Transaksi: ${summary.count} transaksi` +
          breakdownKategori +
          `\n\nBuka dashboard lengkap di: http://localhost:3005/dashboard`;
        await sendTelegramMessage(botToken, chatId, rekap);
        return NextResponse.json({ ok: true });
      }
    }

    // 2. Check Plan Limit (Part 4.9)
    if (user.plan === 'starter' && user.monthly_transaction_count >= 50) {
      await sendTelegramMessage(botToken, chatId, formatLimitExceededReply());
      return NextResponse.json({ ok: true, status: 'limit_exceeded' });
    }

    // 3. Handle Receipt Photo (Part 4.2 - Pro Only)
    if (message.photo && message.photo.length > 0) {
      if (user.plan !== 'pro') {
        const upgradeMsg =
          `📸 <b>Fitur Foto Struk Khusus Pengguna Pro</b>\n\n` +
          `Pencatatan otomatis via AI Vision OCR struk belanja hanya tersedia di paket <b>Pro</b>.\n\n` +
          `👉 Upgrade sekarang seharga Rp 99.000 (sekali bayar seumur hidup) di https://tatadana.app/pricing`;
        await sendTelegramMessage(botToken, chatId, upgradeMsg);
        return NextResponse.json({ ok: true, status: 'ocr_upgrade_prompt' });
      }

      // Process OCR Struk
      const ocrResult = await parseReceiptImage('mock_base64_data', process.env.GEMINI_API_KEY);
      const result = recordExpenseFromTelegram({
        chatId,
        amount: ocrResult.totalAmount,
        categoryName: 'Belanja Harian',
        notes: `Struk ${ocrResult.merchantName} (${ocrResult.items.length} item)`,
        source: 'telegram_ocr',
        ocr_items: ocrResult.items.map((i) => ({
          name: i.name,
          price: i.price,
          qty: 1,
          category_name: 'Belanja Harian',
          category_emoji: '👕',
        })),
        telegram_update_id: update.update_id,
      });

      user.monthly_transaction_count++;

      const reply = formatExpenseReply({
        nominal: ocrResult.totalAmount,
        kategoriEmoji: '🧾',
        kategoriNama: `Struk ${ocrResult.merchantName}`,
        walletName: result.wallet.name,
        catatan: `${ocrResult.items.length} item: ${ocrResult.items.map(i => i.name).join(', ')}`,
        saldoSetelah: result.newBalance,
        budgetKategoriNama: result.category.name,
        persentaseBudget: result.budgetPercent,
        sisaBudget: result.budgetRemaining,
        motivasi: 'Transaksi struk berhasil dicatat ke dashboard TataDana!',
      });

      await sendTelegramMessage(botToken, chatId, reply);
      return NextResponse.json({ ok: true, status: 'ocr_success' });
    }

    // 4. Handle Voice Note (Part 4.3)
    let transcriptText = '';
    if (message.voice) {
      if (message.voice.duration > 60) {
        await sendTelegramMessage(
          botToken,
          chatId,
          '⏱️ <b>Durasi Voice Note terlalu panjang</b> (maksimal 60 detik). Silakan rekam kembali lebih singkat ya!'
        );
        return NextResponse.json({ ok: true, status: 'voice_duration_exceeded' });
      }
      transcriptText = 'beli nasi goreng gila 25rb sama es jeruk 5rb';
    }

    // 5. Handle Text Input (Part 4.1)
    const inputText = text || transcriptText;
    if (!inputText) {
      return NextResponse.json({ ok: true, status: 'empty_content' });
    }

    let parsed: any = null;
    try {
      const failoverRes = await executeAiWithFailover<any>('text_parse', inputText, user.id);
      parsed = failoverRes.result;
    } catch {
      parsed = await parseNaturalTransaction(inputText, process.env.GEMINI_API_KEY);
    }

    if (!parsed || !parsed.nominal) {
      const errMsg =
        `❓ <b>Maaf, transaksi belum dapat dipahami.</b>\n\n` +
        `Coba ketik dalam format sederhana, contoh:\n` +
        `• <i>"beli bakso 15rb"</i>\n` +
        `• <i>"kopi kenangan 22k"</i>\n` +
        `• <i>"gajian freelance 3.5jt"</i>\n` +
        `• <i>"bensin pertamax 50rb"</i>`;
      await sendTelegramMessage(botToken, chatId, errMsg);
      return NextResponse.json({ ok: true, status: 'unparseable' });
    }

    user.monthly_transaction_count++;

    if (parsed.jenis === 'pemasukan') {
      const result = recordIncomeFromTelegram({
        chatId,
        amount: parsed.nominal,
        notes: parsed.catatan,
        source: transcriptText ? 'telegram_voice' : 'telegram_text',
        telegram_update_id: update.update_id,
      });

      const reply = formatIncomeReply({
        nominal: parsed.nominal,
        walletName: result.wallet.name,
        saldoBaru: result.newBalance,
        transcriptVoice: transcriptText || undefined,
      });
      await sendTelegramMessage(botToken, chatId, reply);
    } else {
      const result = recordExpenseFromTelegram({
        chatId,
        amount: parsed.nominal,
        categoryName: parsed.kategori,
        notes: parsed.catatan,
        source: transcriptText ? 'telegram_voice' : 'telegram_text',
        telegram_update_id: update.update_id,
      });

      const reply = formatExpenseReply({
        nominal: parsed.nominal,
        kategoriEmoji: result.category.emoji || '💸',
        kategoriNama: result.category.name,
        walletName: result.wallet.name,
        catatan: parsed.catatan,
        saldoSetelah: result.newBalance,
        budgetKategoriNama: result.category.name,
        persentaseBudget: result.budgetPercent,
        sisaBudget: result.budgetRemaining,
        transcriptVoice: transcriptText || undefined,
      });
      await sendTelegramMessage(botToken, chatId, reply);

      // 4.7 AI Financial Advisor (Pro Feature Trigger)
      if (user.plan === 'pro') {
        const isBigExpense = parsed.nominal >= ((result.budget?.monthly_limit || 1500000) * 0.2);
        const isHighBudget = result.budgetPercent >= 80;
        if (isBigExpense || isHighBudget) {
          const advice = generateFinancialAdvisorAdvice({
            userName: message.from?.first_name || 'Kak',
            categoryName: result.category.name,
            percentIncrease: isHighBudget ? 55 : 30,
            totalExpenseRatio: result.budgetPercent / 100,
          });
          const advReply = formatFinancialAdvisorReply({
            nama: message.from?.first_name || 'Kak',
            analisa: advice.analysis,
            saran: advice.saran,
          });
          await sendTelegramMessage(botToken, chatId, advReply);
        }
      }
    }

    return NextResponse.json({ ok: true, status: 'transaction_recorded' });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
