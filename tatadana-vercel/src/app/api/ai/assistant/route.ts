import { NextResponse } from 'next/server';
import { parseIndonesianCurrency } from '@/lib/formatters';

interface AssistantPayload {
  message: string;
  wallets?: Array<{ id: string; name: string; balance: number; type: string }>;
  budgets?: Array<{ id: string; category_id: string; monthly_limit: number; current_spent: number }>;
  categories?: Array<{ id: string; name: string; emoji: string; type: string }>;
  recentTransactions?: Array<{
    id: string;
    type: 'expense' | 'income' | 'transfer';
    amount: number;
    notes: string;
    category_id: string;
    wallet_id: string;
    transaction_time: string;
  }>;
  userName?: string;
}

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body: AssistantPayload = await req.json();
    const {
      message,
      wallets = [],
      budgets = [],
      categories = [],
      recentTransactions = [],
      userName = 'Sobat TataDana',
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'Pesan tidak boleh kosong.' }, { status: 400 });
    }

    const trimmed = message.trim();
    const lower = trimmed.toLowerCase();

    // 1. CALCULATE LIVE FINANCIAL CONTEXT
    const totalBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
    const totalExpense = recentTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalIncome = recentTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const netCashflow = totalIncome - totalExpense;

    // Overbudget / warning categories
    const criticalBudgets = budgets
      .map((b) => {
        const cat = categories.find((c) => c.id === b.category_id);
        const percent = b.monthly_limit > 0 ? (b.current_spent / b.monthly_limit) * 100 : 0;
        return {
          ...b,
          categoryName: cat?.name || 'Kategori',
          categoryEmoji: cat?.emoji || '🏷️',
          percent: Math.round(percent),
          remaining: b.monthly_limit - b.current_spent,
        };
      })
      .filter((b) => b.percent >= 75)
      .sort((a, b) => b.percent - a.percent);

    // Format Rupiah Helper
    const formatRp = (val: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    // 2. CHECK IF THIS IS A TRANSACTION RECORDING REQUEST
    const isRecordIntent =
      lower.startsWith('catat') ||
      lower.startsWith('beli') ||
      lower.startsWith('bayar') ||
      lower.startsWith('tambah transaksi') ||
      lower.startsWith('masuk') ||
      lower.startsWith('terima') ||
      lower.includes('catat ') ||
      (parseIndonesianCurrency(lower) > 0 &&
        (lower.includes('rb') ||
          lower.includes('ribu') ||
          lower.includes('jt') ||
          lower.includes('juta') ||
          lower.includes('k ') ||
          lower.endsWith('k')));

    if (isRecordIntent) {
      const nominal = parseIndonesianCurrency(lower);
      if (nominal > 0) {
        // Detect Type
        let type: 'expense' | 'income' | 'transfer' = 'expense';
        if (
          lower.includes('gajian') ||
          lower.includes('gaji') ||
          lower.includes('pemasukan') ||
          lower.includes('terima') ||
          lower.includes('dapat uang') ||
          lower.includes('bonus') ||
          lower.includes('freelance') ||
          lower.includes('penjualan')
        ) {
          type = 'income';
        }

        // Detect Category
        let matchedCategory = categories.find((c) => {
          const nameLower = c.name.toLowerCase();
          return (
            (type === 'expense' && c.type === 'expense') ||
            (type === 'income' && c.type === 'income')
          );
        });

        if (lower.includes('makan') || lower.includes('kopi') || lower.includes('nasi') || lower.includes('bakso') || lower.includes('resto') || lower.includes('snack') || lower.includes('cafe')) {
          matchedCategory = categories.find((c) => c.name.toLowerCase().includes('makan')) || matchedCategory;
        } else if (lower.includes('bensin') || lower.includes('gojek') || lower.includes('grab') || lower.includes('ojol') || lower.includes('tol') || lower.includes('parkir') || lower.includes('transport')) {
          matchedCategory = categories.find((c) => c.name.toLowerCase().includes('transport')) || matchedCategory;
        } else if (lower.includes('belanja') || lower.includes('baju') || lower.includes('sepatu') || lower.includes('tokopedia') || lower.includes('shopee') || lower.includes('mart')) {
          matchedCategory = categories.find((c) => c.name.toLowerCase().includes('belanja')) || matchedCategory;
        } else if (lower.includes('listrik') || lower.includes('air') || lower.includes('wifi') || lower.includes('pulsa') || lower.includes('kuota') || lower.includes('tagihan')) {
          matchedCategory = categories.find((c) => c.name.toLowerCase().includes('tagihan')) || matchedCategory;
        } else if (lower.includes('obat') || lower.includes('dokter') || lower.includes('klinik') || lower.includes('sehat') || lower.includes('vitamin')) {
          matchedCategory = categories.find((c) => c.name.toLowerCase().includes('kesehatan')) || matchedCategory;
        } else if (lower.includes('nonton') || lower.includes('game') || lower.includes('steam') || lower.includes('netflix') || lower.includes('hiburan')) {
          matchedCategory = categories.find((c) => c.name.toLowerCase().includes('hiburan')) || matchedCategory;
        } else if (type === 'income') {
          matchedCategory = categories.find((c) => c.name.toLowerCase().includes('gaji') || c.name.toLowerCase().includes('penghasilan')) || categories.find((c) => c.type === 'income');
        }

        // Detect Wallet
        let matchedWallet = wallets.find((w) => w.type === 'bank' || (w as any).is_default) || wallets[0];
        if (lower.includes('bca')) {
          matchedWallet = wallets.find((w) => w.name.toLowerCase().includes('bca')) || matchedWallet;
        } else if (lower.includes('mandiri')) {
          matchedWallet = wallets.find((w) => w.name.toLowerCase().includes('mandiri')) || matchedWallet;
        } else if (lower.includes('gopay')) {
          matchedWallet = wallets.find((w) => w.name.toLowerCase().includes('gopay')) || matchedWallet;
        } else if (lower.includes('ovo')) {
          matchedWallet = wallets.find((w) => w.name.toLowerCase().includes('ovo')) || matchedWallet;
        } else if (lower.includes('cash') || lower.includes('tunai')) {
          matchedWallet = wallets.find((w) => w.name.toLowerCase().includes('kas') || w.name.toLowerCase().includes('cash')) || matchedWallet;
        }

        // Clean Notes
        let cleanNotes = trimmed
          .replace(/^catat(\s+transaksi)?\s*/i, '')
          .replace(/^(beli|bayar|tambah)\s*/i, '')
          .trim();
        if (!cleanNotes) cleanNotes = trimmed;

        return NextResponse.json({
          ok: true,
          isTransaction: true,
          parsedTransaction: {
            type,
            amount: nominal,
            category_id: matchedCategory?.id || 'c-1',
            category_name: matchedCategory?.name || 'Umum',
            category_emoji: matchedCategory?.emoji || '💸',
            wallet_id: matchedWallet?.id || 'w-1',
            wallet_name: matchedWallet?.name || 'Dompet Utama',
            notes: cleanNotes,
          },
          reply: `Siap, ${userName}! 📝 Transaksi langsung saya catat ke dalam pembukuan TataDana:

• **Jenis:** ${type === 'expense' ? '💸 Pengeluaran' : '💰 Pemasukan'}
• **Nominal:** **${formatRp(nominal)}**
• **Kategori:** ${matchedCategory?.emoji || '🏷️'} ${matchedCategory?.name || 'Umum'}
• **Dompet:** 👛 ${matchedWallet?.name || 'Dompet Utama'}
• **Catatan:** ${cleanNotes}

Data ledger keuanganmu langsung terupdate secara real-time! ✨`,
          quickSuggestions: [
            '📊 Analisis Keuangan Saya',
            '🚨 Cek Budget Kritis',
            '💡 Tips Berhemat Bulan Ini',
          ],
        });
      }
    }

    // 3. FINANCIAL ANALYSIS & CONVERSATIONAL ADVISOR INTENTS

    // A. Analisis Keuangan Keseluruhan / Status Cashflow
    if (
      lower.includes('analisis') ||
      lower.includes('kondisi') ||
      lower.includes('keuangan saya') ||
      lower.includes('cashflow') ||
      lower.includes('arus kas') ||
      lower.includes('rekap') ||
      lower.includes('evaluasi')
    ) {
      const savingsRate = totalIncome > 0 ? Math.round((netCashflow / totalIncome) * 100) : 0;
      let score = 70;
      let statusLabel = 'Baik & Terkendali';

      if (netCashflow < 0) {
        score = 48;
        statusLabel = 'Defisit (Perlu Diperbaiki)';
      } else if (savingsRate >= 30) {
        score = 92;
        statusLabel = 'Sangat Sehat (Optimal)';
      } else if (savingsRate >= 15) {
        score = 80;
        statusLabel = 'Sehat & Positif';
      }

      let criticalText = '';
      if (criticalBudgets.length > 0) {
        criticalText = `\n\n⚠️ **Perhatian Budget Kritis:**\n` +
          criticalBudgets.map((b) => `• ${b.categoryEmoji} **${b.categoryName}**: Terpakai **${b.percent}%** (${formatRp(b.current_spent)} dari ${formatRp(b.monthly_limit)})`).join('\n');
      }

      return NextResponse.json({
        ok: true,
        isTransaction: false,
        reply: `Halo **${userName}**! Berikut adalah rangkuman analisis kesehatan finansialmu saat ini:

### 📊 Indeks Kesehatan Finansial: **${score}/100** (*${statusLabel}*)

1. **Total Saldo Seluruh Dompet:** **${formatRp(totalBalance)}**
2. **Pemasukan Tercatat:** **${formatRp(totalIncome)}**
3. **Pengeluaran Tercatat:** **${formatRp(totalExpense)}**
4. **Net Cashflow (Sisa Bersih):** **${formatRp(netCashflow)}** ${netCashflow >= 0 ? '🟢 (Surplus)' : '🔴 (Defisit)'}
5. **Rasio Tabungan (Savings Rate):** **${savingsRate}%** (Target ideal: minimal 20%)${criticalText}

💡 **Saran Aksi dari Tata AI:**
${netCashflow >= 0 ? `• Pertahankan pola pengeluaran ini dan sisihkan minimal **${formatRp(Math.max(netCashflow * 0.5, 500000))}** ke instrumen dana darurat atau tabungan berjangka.` : '• Segera rem pengeluaran non-primer di kategori konsumtif untuk mencegah saldo tergerus.'}
• Pantau terus pencatatan harian lewat bot Telegram atau chat ini agar tidak ada pos pengeluaran yang bocor halus!`,
        quickSuggestions: [
          '🚨 Cek Budget Kritis',
          '💡 Tips Berhemat Bulan Ini',
          '🎯 Alokasi Gaji 50/30/20',
          '📝 Catat makan siang 25rb',
        ],
      });
    }

    // B. Cek Budget & Peringatan Budget Kritis
    if (
      lower.includes('budget') ||
      lower.includes('anggaran') ||
      lower.includes('kritis') ||
      lower.includes('sisa budget') ||
      lower.includes('overbudget')
    ) {
      if (criticalBudgets.length === 0) {
        return NextResponse.json({
          ok: true,
          isTransaction: false,
          reply: `Kabar baik, **${userName}**! 🎉

Semua alokasi budget bulananmu saat ini **masih dalam batas aman (<75%)**. Tidak ada kategori yang berada di zona kritis.

📊 **Saran Tata AI:**
• Terus jaga ritme pengeluaran harianmu sampai akhir bulan.
• Alokasikan sisa kuota budget yang tidak terpakai nanti langsung ke pos tabungan atau investasi.`,
          quickSuggestions: [
            '📊 Analisis Keuangan Saya',
            '💡 Tips Berhemat Bulan Ini',
            '🎯 Alokasi Gaji 50/30/20',
          ],
        });
      }

      const listStr = criticalBudgets
        .map((b) => {
          const badge = b.percent >= 100 ? '🚨 OVERBUDGET' : '⚠️ WASPADA';
          return `• ${b.categoryEmoji} **${b.categoryName}** [${badge}]
   Terpakai: **${b.percent}%** (${formatRp(b.current_spent)} / ${formatRp(b.monthly_limit)})
   ${b.remaining > 0 ? `Sisa kuota: **${formatRp(b.remaining)}**` : `Melampaui kuota: **${formatRp(Math.abs(b.remaining))}**`}`;
        })
        .join('\n\n');

      return NextResponse.json({
        ok: true,
        isTransaction: false,
        reply: `⚠️ **Peringatan Status Budget dari Tata AI untuk ${userName}:**

Terdapat **${criticalBudgets.length} kategori** yang sudah mencapai batas waspada atau melebihi target:

${listStr}

💡 **Rekomendasi Cepat:**
1. Hentikan transaksi non-esensial untuk kategori yang sudah melampaui 100%.
2. Jika sangat mendesak, lakukan revisi alokasi dengan menggeser sisa kuota dari kategori lain yang masih longgar.
3. Gunakan command **/budget** di bot Telegram kamu untuk mengecek status sisa per hari.`,
        quickSuggestions: [
          '💡 Cara Menghemat Pengeluaran Makanan',
          '📊 Cek Total Saldo Dompet',
          '🎯 Alokasi Gaji 50/30/20',
        ],
      });
    }

    // C. Alokasi 50/30/20 Rule
    if (
      lower.includes('50/30/20') ||
      lower.includes('50 30 20') ||
      lower.includes('alokasi') ||
      lower.includes('bagi gaji') ||
      lower.includes('kelola gaji')
    ) {
      const baseIncome = totalIncome > 0 ? totalIncome : 5000000;
      const kebutuhan = baseIncome * 0.5;
      const keinginan = baseIncome * 0.3;
      const tabungan = baseIncome * 0.2;

      return NextResponse.json({
        ok: true,
        isTransaction: false,
        reply: `Halo **${userName}**! Formula **50/30/20** adalah panduan emas manajemen keuangan pribadi yang sangat cocok diterapkan:

Berdasarkan pemasukan bulananmu (${formatRp(baseIncome)}):

1. 🏠 **50% — Kebutuhan Pokok (${formatRp(kebutuhan)}):**
   • Tempat tinggal, listrik, air, internet
   • Bahan makanan & belanja bulanan
   • Transportasi kerja & bensin

2. 🎮 **30% — Keinginan & Gaya Hidup (${formatRp(keinginan)}):**
   • Kuliner / nongkrong bersama teman
   • Langganan hiburan (Netflix, Spotify, game)
   • Hobi dan belanja pakaian

3. 💰 **20% — Tabungan & Investasi (${formatRp(tabungan)}):**
   • Prioritas 1: Bangun Dana Darurat (3–6x pengeluaran)
   • Prioritas 2: Reksadana pasar uang atau emas
   • Prioritas 3: Investasi jangka panjang

*Tips:* Atur transfer otomatis begitu gaji masuk agar bagian 20% tidak sempat terpakai!`,
        quickSuggestions: [
          '📊 Analisis Keuangan Saya',
          '💡 Tips Berhemat Bulan Ini',
          '📝 Catat pemasukan gaji 5jt',
        ],
      });
    }

    // D. Tips Berhemat & Finansial Umum
    if (
      lower.includes('tips') ||
      lower.includes('hemat') ||
      lower.includes('rekomendasi') ||
      lower.includes('saran') ||
      lower.includes('bocorp halus') ||
      lower.includes('tabung')
    ) {
      return NextResponse.json({
        ok: true,
        isTransaction: false,
        reply: `Berikut adalah **5 Strategi Cerdas Berhemat** dari Tata AI untukmu, **${userName}**:

1. ☕ **Waspadai "Latte Factor" (Bocor Halus):**
   Pengeluaran kecil seperti kopi kekinian Rp 25.000/hari atau jajan boba tampak sepele, tapi jika dijumlahkan mencapai **Rp 750.000/bulan**! Batasi jadi 2x seminggu.

2. 🛒 **Gunakan Aturan 48 Jam Sebelum Beli Barang Keinginan:**
   Jika melihat barang diskon di e-commerce, tahan diri selama 48 jam. Jika setelah 2 hari kamu merasa masih sangat butuh, barulah beli. 80% dorongan belanja impulsif hilang setelah 48 jam.

3. 🍱 **Bawa Bekal Makan Siang 3x Seminggu:**
   Bisa menghemat rata-rata Rp 300.000–Rp 500.000 per bulan yang bisa langsung dialihkan ke tabungan.

4. 👛 **Pisahkan Dompet Belanja & Operasional:**
   Manfaatkan fitur **Multi-Wallet** TataDana (misal BCA untuk operasional tetap, GoPay untuk jajan yang dibatasi saldonya).

5. 🤖 **Catat Setiap Transaksi Real-time:**
   Mencatat langsung begitu transaksi terjadi (lewat chat Tata AI ini atau bot Telegram) terbukti meningkatkan kesadaran finansial hingga 40%!`,
        quickSuggestions: [
          '📊 Analisis Keuangan Saya',
          '🚨 Cek Budget Kritis',
          '🎯 Alokasi Gaji 50/30/20',
          '📝 Catat makan siang 20rb',
        ],
      });
    }

    // E. Sapaan & Pertanyaan Umum
    return NextResponse.json({
      ok: true,
      isTransaction: false,
      reply: `Halo **${userName}**! 👋 Saya **TATA AI BOT**, asisten keuangan pribadi cerdasmu di TataDana.

Saya dapat membantumu untuk:
1. 📊 **Menganalisis Cashflow & Kondisi Keuangan** terkini dari semua rekeningmu.
2. 🚨 **Memonitor Budget** dan memberi peringatan saat pengeluaran mendekati batas.
3. 📝 **Mencatat Transaksi Langsung lewat Chat** (contoh: *"Catat makan siang nasi padang 25rb pakai GoPay"*).
4. 💡 **Memberikan Tips & Strategi Finansial** yang disesuaikan dengan data riilmu.

Ada yang bisa saya bantu analisa atau catat hari ini? Silakan ketik pertanyaanmu atau pilih tombol di bawah! 😊`,
      quickSuggestions: [
        '📊 Analisis Keuangan Saya',
        '🚨 Cek Budget Kritis',
        '💡 Tips Berhemat Bulan Ini',
        '🎯 Alokasi Gaji 50/30/20',
        '📝 Catat makan siang 25rb',
      ],
    });
  } catch (error: any) {
    console.error('Error in Tata AI Assistant API:', error);
    return NextResponse.json(
      { ok: false, error: 'Terjadi kesalahan saat memproses permintaan AI: ' + (error?.message || 'Internal error') },
      { status: 500 }
    );
  }
}
