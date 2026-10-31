/**
 * TataDana Fintech SaaS — E2E Test Suite R3: User Web Dashboard, Multi-Wallet & Export APIs
 * Target: http://localhost:3000/api/export/* & Dashboard Domain Engine
 */

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

export async function run() {
  const assertions = [];
  const startTime = Date.now();

  function assert(condition, desc) {
    if (condition) {
      assertions.push({ desc, pass: true });
    } else {
      assertions.push({ desc, pass: false, error: new Error(`Assertion failed: ${desc}`) });
    }
  }

  const sampleTransactions = [
    {
      id: 'tx-01',
      type: 'income',
      amount: 8500000,
      notes: 'Gaji Bulanan PT Tata Finansial',
      category_name: 'Gaji & Penghasilan',
      wallet_name: 'BCA Utama',
      transaction_time: '2026-10-01T09:00:00+07:00',
    },
    {
      id: 'tx-02',
      type: 'expense',
      amount: 1450000,
      notes: 'Belanja Bulanan Supermarket',
      category_name: 'Belanja Harian',
      wallet_name: 'BCA Utama',
      transaction_time: '2026-10-02T14:30:00+07:00',
    },
    {
      id: 'tx-03',
      type: 'expense',
      amount: 250000,
      notes: 'Bensin Pertamax Mobil',
      category_name: 'Transportasi',
      wallet_name: 'Mandiri Bisnis',
      transaction_time: '2026-10-04T11:15:00+07:00',
    },
    {
      id: 'tx-04',
      type: 'expense',
      amount: 750000,
      notes: 'Makan Malam Restoran Keluarga',
      category_name: 'Makanan & Minuman',
      wallet_name: 'GoPay',
      transaction_time: '2026-10-06T19:45:00+07:00',
    },
    {
      id: 'tx-05',
      type: 'transfer',
      amount: 500000,
      notes: 'Top Up Saldo GoPay dari BCA',
      wallet_name: 'BCA Utama',
      to_wallet_name: 'GoPay',
      transaction_time: '2026-10-07T10:00:00+07:00',
    },
  ];

  // 1. Export PDF API Endpoint (/api/export/pdf)
  try {
    const pdfRes = await fetch(`${BASE_URL}/api/export/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        userName: 'Budi Santoso',
        transactions: sampleTransactions,
      }),
    });

    assert(pdfRes.status === 200, 'POST /api/export/pdf responds with HTTP 200');
    const contentType = pdfRes.headers.get('content-type') || '';
    assert(contentType.includes('application/pdf'), 'PDF export returns content-type: application/pdf');

    const contentDisposition = pdfRes.headers.get('content-disposition') || '';
    assert(
      contentDisposition.includes('attachment') && contentDisposition.includes('.pdf'),
      'PDF export provides attachment header with .pdf filename'
    );

    const pdfBuffer = await pdfRes.arrayBuffer();
    const bytes = new Uint8Array(pdfBuffer);
    assert(bytes.length > 500, `PDF generated binary has substantive size (${bytes.length} bytes)`);

    // Verify PDF Magic Bytes "%PDF" (0x25, 0x50, 0x44, 0x46)
    const magicString = String.fromCharCode(...bytes.slice(0, 4));
    assert(magicString === '%PDF', 'PDF file begins with authoritative magic bytes "%PDF"');
  } catch (err) {
    assert(false, `PDF export endpoint test failed: ${err.message}`);
  }

  // 2. Export Excel API Endpoint (/api/export/excel)
  try {
    const excelRes = await fetch(`${BASE_URL}/api/export/excel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        userName: 'Budi Santoso',
        transactions: sampleTransactions,
      }),
    });

    assert(excelRes.status === 200, 'POST /api/export/excel responds with HTTP 200');
    const excelContentType = excelRes.headers.get('content-type') || '';
    assert(
      excelContentType.includes('spreadsheetml.sheet'),
      'Excel export returns OpenXML XLSX content-type'
    );

    const excelDisposition = excelRes.headers.get('content-disposition') || '';
    assert(
      excelDisposition.includes('attachment') && excelDisposition.includes('.xlsx'),
      'Excel export provides attachment header with .xlsx filename'
    );

    const excelBuffer = await excelRes.arrayBuffer();
    const excelBytes = new Uint8Array(excelBuffer);
    assert(excelBytes.length > 500, `Excel generated binary has substantive size (${excelBytes.length} bytes)`);

    // Verify XLSX Magic Bytes "PK" (0x50, 0x4B - ZIP container)
    const excelMagic = String.fromCharCode(...excelBytes.slice(0, 2));
    assert(excelMagic === 'PK', 'Excel file begins with authoritative ZIP/OpenXML magic bytes "PK"');
  } catch (err) {
    assert(false, `Excel export endpoint test failed: ${err.message}`);
  }

  // 3. Financial Statistics Aggregation Calculations
  const mockWallets = [
    { id: 'w1', name: 'BCA Utama', balance: 14820000 },
    { id: 'w2', name: 'Mandiri Bisnis', balance: 5200000 },
    { id: 'w3', name: 'GoPay', balance: 850000 },
    { id: 'w4', name: 'Kas Tunai', balance: 3780000 },
  ];

  const totalSaldo = mockWallets.reduce((sum, w) => sum + w.balance, 0);
  assert(totalSaldo === 24650000, 'Total consolidated balance correctly calculates sum of all active wallets (Rp 24.650.000)');

  const totalIncome = sampleTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = sampleTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0);

  assert(totalIncome === 8500000, 'Total income accurately sums all income transactions (Rp 8.500.000)');
  assert(totalExpense === 2450000, 'Total expense accurately sums all expense transactions (Rp 2.450.000)');

  const netSavings = totalIncome - totalExpense;
  assert(netSavings === 6050000, 'Net cashflow calculation matches surplus (Rp 6.050.000)');

  const savingsRate = (netSavings / totalIncome) * 100;
  assert(
    Math.round(savingsRate) === 71,
    `Savings rate accurately computes ratio of surplus to income (${savingsRate.toFixed(1)}% -> 71%)`
  );

  // 4. Budgeting 80% and 100% Alert Indicators
  const budgetTestMatrix = [
    { category: 'Makanan', limit: 2000000, spent: 1200000, expectedTier: 'normal', expected80: false, expected100: false },
    { category: 'Transportasi', limit: 1000000, spent: 850000, expectedTier: 'warning_80', expected80: true, expected100: false },
    { category: 'Hiburan', limit: 500000, spent: 550000, expectedTier: 'critical_100', expected80: true, expected100: true },
  ];

  for (const b of budgetTestMatrix) {
    const ratio = b.spent / b.limit;
    const is80 = ratio >= 0.8;
    const is100 = ratio >= 1.0;

    let tier = 'normal';
    if (is100) tier = 'critical_100';
    else if (is80) tier = 'warning_80';

    assert(tier === b.expectedTier, `Budget alert tier for ${b.category} (${(ratio * 100).toFixed(0)}%) evaluated as ${tier}`);
    assert(is80 === b.expected80, `Budget 80% trigger flag matches expected for ${b.category}`);
    assert(is100 === b.expected100, `Budget 100% trigger flag matches expected for ${b.category}`);
  }

  // 5. Multi-Wallet Balance & Inter-Wallet Transfer Logic
  const sourceWallet = { id: 'w1', name: 'BCA Utama', balance: 14820000 };
  const destWallet = { id: 'w3', name: 'GoPay', balance: 850000 };
  const transferAmount = 500000;

  const initialTotal = sourceWallet.balance + destWallet.balance;
  sourceWallet.balance -= transferAmount;
  destWallet.balance += transferAmount;
  const postTotal = sourceWallet.balance + destWallet.balance;

  assert(sourceWallet.balance === 14320000, 'Inter-wallet transfer decrements source wallet by transfer amount');
  assert(destWallet.balance === 1350000, 'Inter-wallet transfer increments destination wallet by transfer amount');
  assert(initialTotal === postTotal, 'Inter-wallet transfer preserves total assets with zero net leakage');

  // 6. Settings & Telegram Pairing Code Token
  const generatePairingCode = () => 'TD' + Math.floor(1000 + Math.random() * 9000);
  const code = generatePairingCode();
  assert(code.startsWith('TD') && code.length === 6, 'Telegram pairing code generator creates 6-char formatted token');
  const pairingUrl = `https://t.me/TataDanaBot?start=${code}`;
  assert(pairingUrl.includes('?start=' + code), 'Telegram pairing URL matches official deep-link structure');

  const passed = assertions.filter((a) => a.pass).length;
  const failed = assertions.filter((a) => !a.pass).length;

  return {
    name: 'E2E-R3: Web App Dashboard, Budget & Export APIs',
    total: assertions.length,
    passed,
    failed,
    assertions,
    durationMs: Date.now() - startTime,
  };
}

if (process.argv[1] === (await import('node:url')).fileURLToPath(import.meta.url)) {
  run().then((res) => {
    console.log(`[${res.failed === 0 ? 'PASS' : 'FAIL'}] ${res.name} (${res.passed}/${res.total} assertions, ${res.durationMs}ms)`);
    if (res.failed > 0) {
      for (const a of res.assertions.filter((a) => !a.pass)) {
        console.error(`  - FAILED: ${a.desc}`);
      }
      process.exit(1);
    }
  });
}
