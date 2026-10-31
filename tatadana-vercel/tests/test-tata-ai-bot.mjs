import assert from 'node:assert';

console.log('🚀 Running TATA AI BOT Verification Test Suite...\n');

const BASE_URL = 'http://127.0.0.1:3005';

async function runTests() {
  // Test 1: Check Page Route HTTP 200
  console.log('👉 [Test 1] Testing /dashboard/tata-ai route...');
  const pageRes = await fetch(`${BASE_URL}/dashboard/tata-ai`);
  assert.strictEqual(pageRes.status, 200, 'Page /dashboard/tata-ai must return HTTP 200');
  console.log('   ✅ /dashboard/tata-ai is live and compiled with HTTP 200!\n');

  // Test 2: Test Financial Overview Analysis
  console.log('👉 [Test 2] Testing TATA AI Financial Analysis intent...');
  const payloadAnalysis = {
    message: 'Bagaimana kondisi keuangan dan cashflow saya bulan ini?',
    wallets: [
      { id: 'w-1', name: 'BCA (Default)', balance: 14820000, type: 'bank' },
      { id: 'w-2', name: 'GoPay', balance: 125000, type: 'ewallet' },
    ],
    budgets: [
      { id: 'b-1', category_id: 'c-1', monthly_limit: 2000000, current_spent: 1450000 },
      { id: 'b-2', category_id: 'c-2', monthly_limit: 1000000, current_spent: 880000 },
    ],
    categories: [
      { id: 'c-1', name: 'Makanan & Minuman', emoji: '🍜', type: 'expense' },
      { id: 'c-2', name: 'Transportasi', emoji: '🚗', type: 'expense' },
    ],
    recentTransactions: [
      { id: 't-1', type: 'income', amount: 8000000, notes: 'Gaji Pokok', category_id: 'c-8', wallet_id: 'w-1', transaction_time: '2026-10-01' },
      { id: 't-2', type: 'expense', amount: 2330000, notes: 'Pengeluaran', category_id: 'c-1', wallet_id: 'w-1', transaction_time: '2026-10-05' },
    ],
    userName: 'Soni Alferis',
  };

  const analysisRes = await fetch(`${BASE_URL}/api/ai/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadAnalysis),
  });
  const analysisData = await analysisRes.json();
  assert.strictEqual(analysisData.ok, true);
  assert.strictEqual(analysisData.isTransaction, false);
  assert.ok(analysisData.reply.includes('Kesehatan Finansial'));
  console.log('   ✅ TATA AI returned structured financial analysis!');
  console.log('   Excerpt:', analysisData.reply.slice(0, 150) + '...\n');

  // Test 3: Test Transaction Recording via Chat
  console.log('👉 [Test 3] Testing Transaction Recording via Chat: "catat beli kopi kenangan 28rb pakai GoPay"...');
  const payloadTx = {
    message: 'catat beli kopi kenangan 28rb pakai GoPay',
    wallets: [
      { id: 'w-1', name: 'BCA (Default)', balance: 14820000, type: 'bank' },
      { id: 'w-3', name: 'GoPay', balance: 125000, type: 'ewallet' },
    ],
    categories: [
      { id: 'c-1', name: 'Makanan & Minuman', emoji: '🍜', type: 'expense' },
      { id: 'c-2', name: 'Transportasi', emoji: '🚗', type: 'expense' },
    ],
    userName: 'Budi Santoso',
  };

  const txRes = await fetch(`${BASE_URL}/api/ai/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadTx),
  });
  const txData = await txRes.json();
  assert.strictEqual(txData.ok, true);
  assert.strictEqual(txData.isTransaction, true);
  assert.strictEqual(txData.parsedTransaction.amount, 28000);
  assert.strictEqual(txData.parsedTransaction.type, 'expense');
  assert.strictEqual(txData.parsedTransaction.wallet_name, 'GoPay');
  assert.ok(txData.reply.includes('28.000'));
  console.log('   ✅ Successfully parsed transaction from chat text!');
  console.log('   Parsed Tx:', txData.parsedTransaction);
  console.log('   Reply:\n', txData.reply, '\n');

  // Test 4: Test Critical Budget Check
  console.log('👉 [Test 4] Testing Critical Budget intent...');
  const payloadBudget = {
    message: 'Cek sisa budget yang kritis',
    budgets: [
      { id: 'b-1', category_id: 'c-1', monthly_limit: 2000000, current_spent: 1800000 },
      { id: 'b-2', category_id: 'c-2', monthly_limit: 500000, current_spent: 550000 },
    ],
    categories: [
      { id: 'c-1', name: 'Makanan & Minuman', emoji: '🍜', type: 'expense' },
      { id: 'c-2', name: 'Hiburan', emoji: '🎮', type: 'expense' },
    ],
    userName: 'Budi',
  };

  const budgetRes = await fetch(`${BASE_URL}/api/ai/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadBudget),
  });
  const budgetData = await budgetRes.json();
  assert.strictEqual(budgetData.ok, true);
  assert.ok(budgetData.reply.includes('Peringatan Status Budget'));
  console.log('   ✅ TATA AI accurately identified critical and overbudget categories!\n');

  // Test 5: Test 50/30/20 Rule Advice
  console.log('👉 [Test 5] Testing 50/30/20 Allocation Advice...');
  const payloadRule = {
    message: 'Bagaimana simulasi alokasi 50/30/20 untuk gaji saya?',
    userName: 'Budi',
  };

  const ruleRes = await fetch(`${BASE_URL}/api/ai/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadRule),
  });
  const ruleData = await ruleRes.json();
  assert.strictEqual(ruleData.ok, true);
  assert.ok(ruleData.reply.includes('50%'));
  assert.ok(ruleData.reply.includes('30%'));
  assert.ok(ruleData.reply.includes('20%'));
  console.log('   ✅ TATA AI produced structured 50/30/20 budgeting advice!\n');

  console.log('🎉 ALL 5 TATA AI BOT TESTS PASSED 100%!');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
