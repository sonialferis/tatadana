import assert from 'node:assert';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3005';

// Date math helpers matching src/app/dashboard/transactions/page.tsx
const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const DAY_NAMES_FULL = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const DAY_NAMES_SHORT = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function getWIBDateKey(dateInput) {
  if (!dateInput) return '';
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '';
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  let year = '', month = '', day = '';
  for (const p of parts) {
    if (p.type === 'year') year = p.value;
    if (p.type === 'month') month = p.value;
    if (p.type === 'day') day = p.value;
  }
  return `${year}-${month}-${day}`;
}

function addDaysToDateKey(dateKey, days) {
  const parts = dateKey.split('-').map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  d.setDate(d.getDate() + days);
  return getWIBDateKey(d);
}

function getWeekInfo(dateKey) {
  const parts = dateKey.split('-').map(Number);
  const dateObj = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
  const day = dateObj.getDay();
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(dateObj);
  monday.setDate(dateObj.getDate() - diffToMonday);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday);
    cur.setDate(monday.getDate() + i);
    const key = getWIBDateKey(cur);
    days.push({
      dateKey: key,
      dayNum: cur.getDate(),
      dayName: DAY_NAMES_FULL[i],
      dayShort: DAY_NAMES_SHORT[i],
    });
  }

  return {
    mondayKey: days[0].dateKey,
    sundayKey: days[6].dateKey,
    days,
  };
}

async function runCalendarTests() {
  console.log('--- Testing Calendar Periods & Wallet Filter ---');

  // 1. Fetch live transactions & wallets
  const res = await fetch(`${BASE_URL}/api/finance`);
  assert.strictEqual(res.status, 200, 'API /api/finance should return 200');
  const json = await res.json();
  const { transactions, wallets } = json.data;

  console.log(`Loaded ${transactions.length} transactions and ${wallets.length} wallets.`);
  assert(transactions.length > 0, 'Should have transactions');
  assert(wallets.length >= 2, 'Should have at least 2 wallets');

  // 2. Test Wallet Filtering
  const bcaWallet = wallets.find(w => w.name.includes('BCA')) || wallets[0];
  console.log(`Selected wallet for filter: ${bcaWallet.name} (${bcaWallet.id})`);

  const filteredByBca = transactions.filter(
    t => t.wallet_id === bcaWallet.id || t.to_wallet_id === bcaWallet.id
  );
  console.log(`Transactions in ${bcaWallet.name}: ${filteredByBca.length}/${transactions.length}`);
  assert(filteredByBca.length > 0, 'BCA wallet should have transactions');
  assert(filteredByBca.length <= transactions.length, 'Filtered count must be <= total');

  // 3. Test Harian (Daily View)
  const targetDate = '2026-10-10';
  const dailyTxs = transactions.filter(t => getWIBDateKey(t.transaction_time) === targetDate);
  const dailyIncome = dailyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const dailyExpense = dailyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const dailyNet = dailyIncome - dailyExpense;

  console.log(`[Harian ${targetDate}] Mutasi: ${dailyTxs.length}, Masuk: Rp ${dailyIncome}, Keluar: Rp ${dailyExpense}, Net: Rp ${dailyNet}`);
  assert(dailyTxs.length >= 1, 'Should have transactions on 2026-10-10');

  // 4. Test Mingguan (Weekly View)
  const weekInfo = getWeekInfo('2026-10-10');
  assert.strictEqual(weekInfo.mondayKey, '2026-10-05', 'Monday should be 2026-10-05');
  assert.strictEqual(weekInfo.sundayKey, '2026-10-11', 'Sunday should be 2026-10-11');
  assert.strictEqual(weekInfo.days.length, 7, 'Week should have 7 days');

  const weeklyTxs = transactions.filter(t => {
    const k = getWIBDateKey(t.transaction_time);
    return k >= weekInfo.mondayKey && k <= weekInfo.sundayKey;
  });
  const weeklyIncome = weeklyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const weeklyExpense = weeklyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  console.log(`[Mingguan 05-11 Okt] Mutasi: ${weeklyTxs.length}, Masuk: Rp ${weeklyIncome}, Keluar: Rp ${weeklyExpense}`);
  assert(weeklyTxs.length >= dailyTxs.length, 'Weekly txs should be >= daily txs');

  // 5. Test Bulanan (Monthly View)
  const monthlyTxs = transactions.filter(t => {
    const k = getWIBDateKey(t.transaction_time);
    return k.startsWith('2026-10');
  });
  const monthlyIncome = monthlyTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthlyExpense = monthlyTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  console.log(`[Bulanan Okt 2026] Mutasi: ${monthlyTxs.length}, Masuk: Rp ${monthlyIncome}, Keluar: Rp ${monthlyExpense}`);
  assert(monthlyTxs.length >= weeklyTxs.length, 'Monthly txs should be >= weekly txs');

  // 6. Test Kustom Rentang (Custom Range View)
  const customStart = '2026-10-01';
  const customEnd = '2026-10-15';
  const customTxs = transactions.filter(t => {
    const k = getWIBDateKey(t.transaction_time);
    return k >= customStart && k <= customEnd;
  });
  const customIncome = customTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const customExpense = customTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const daysDiff = 15;
  const avgDailyExp = Math.round(customExpense / daysDiff);

  console.log(`[Kustom ${customStart} s/d ${customEnd}] Mutasi: ${customTxs.length}, Masuk: Rp ${customIncome}, Keluar: Rp ${customExpense}, Rata-rata/hari: Rp ${avgDailyExp}`);
  assert(customTxs.length > 0, 'Custom range should have transactions');

  // 7. Verify page route renders without error
  const pageRes = await fetch(`${BASE_URL}/dashboard/transactions`);
  assert.strictEqual(pageRes.status, 200, 'Page /dashboard/transactions should return HTTP 200');

  console.log('✅ ALL CALENDAR PERIOD & WALLET FILTER TESTS PASSED SUCCESSFULLY!');
}

runCalendarTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
