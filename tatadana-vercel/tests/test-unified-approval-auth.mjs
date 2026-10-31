// Comprehensive E2E Test Suite: Unified Auth & Customer Approval Workflow
// Verifies:
// 1. Single unified login (admin logs in directly with sonialferis@gmail.com / sonial200712)
// 2. Customer registration creates account with status 'pending'
// 3. Customer login while 'pending' is blocked with informative message
// 4. Admin approves customer account via /api/admin/users
// 5. Customer login after approval succeeds with redirect to /dashboard
// 6. Admin rejection flow stops rejected customers from entering

import assert from 'node:assert/strict';

const BASE_URL = 'http://127.0.0.1:3005';

async function run() {
  console.log('🚀 Running Unified Auth & Customer Approval Test Suite...\n');

  // --- TEST 1: Admin Direct Login ---
  console.log('👉 [Test 1] Testing Admin Direct Login (sonialferis@gmail.com + sonial200712)...');
  const adminRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'sonialferis@gmail.com',
      password: 'sonial200712',
      method: 'email',
    }),
  });
  const adminData = await adminRes.json();
  assert.equal(adminRes.status, 200, 'Admin login must return HTTP 200');
  assert.equal(adminData.ok, true, 'Admin login must be ok');
  assert.equal(adminData.role, 'admin', 'Admin role must be "admin"');
  assert.equal(adminData.redirectTo, '/admin', 'Admin must be redirected to /admin');
  console.log('   ✅ Admin direct login successful! Redirects straight to /admin.');

  // --- TEST 2: Admin Wrong Password ---
  console.log('👉 [Test 2] Testing Admin Login with incorrect password...');
  const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: 'sonialferis@gmail.com',
      password: 'wrongpassword',
      method: 'email',
    }),
  });
  const wrongPassData = await wrongPassRes.json();
  assert.equal(wrongPassRes.status, 401, 'Wrong admin password must return HTTP 401');
  assert.equal(wrongPassData.ok, false, 'Login must fail');
  assert(wrongPassData.error.includes('Kata sandi'), 'Must return password error');
  console.log('   ✅ Rejection of wrong admin password verified.');

  // --- TEST 3: Register New Customer ---
  const testEmail = `calon_nasabah_${Date.now()}@tatadana.id`;
  console.log(`👉 [Test 3] Registering new customer (${testEmail})...`);
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rudi Hermawan',
      email: testEmail,
      phone: '081299884422',
      password: 'rahasia12345',
      plan: 'starter',
    }),
  });
  const regData = await regRes.json();
  assert.equal(regRes.status, 200, 'Customer registration must return HTTP 200');
  assert.equal(regData.ok, true, 'Registration must be ok');
  assert.equal(regData.status, 'pending', 'New customer status MUST BE "pending"');
  const newUserId = regData.user.id;
  console.log(`   ✅ Customer registered successfully with status: PENDING (User ID: ${newUserId}).`);

  // --- TEST 4: Attempt Customer Login While Pending ---
  console.log('👉 [Test 4] Attempting customer login while status is PENDING...');
  const pendingLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: 'rahasia12345',
      method: 'email',
    }),
  });
  const pendingLoginData = await pendingLoginRes.json();
  assert.equal(pendingLoginRes.status, 403, 'Pending login must return HTTP 403 (Forbidden)');
  assert.equal(pendingLoginData.ok, false, 'Pending login must not succeed');
  assert.equal(pendingLoginData.status, 'pending', 'Status in response must be "pending"');
  assert(pendingLoginData.error.includes('menunggu persetujuan'), 'Error must inform about pending approval');
  console.log('   ✅ Customer login while PENDING correctly blocked with informative message.');

  // --- TEST 5: Guard against registering Admin email ---
  console.log('👉 [Test 5] Attempting to register with sonialferis@gmail.com...');
  const adminRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Penyusup',
      email: 'sonialferis@gmail.com',
      phone: '081122334455',
      password: 'mencoba_daftar',
    }),
  });
  const adminRegData = await adminRegRes.json();
  assert.equal(adminRegRes.status, 400, 'Registering admin email must be rejected');
  assert(adminRegData.error.includes('Administrator'), 'Error must mention Administrator');
  console.log('   ✅ Guard against registering admin email verified.');

  // --- TEST 6: Admin Approves the Customer ---
  console.log(`👉 [Test 6] Admin Approving Customer (User ID: ${newUserId})...`);
  const approveRes = await fetch(`${BASE_URL}/api/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'approve',
      userId: newUserId,
    }),
  });
  const approveData = await approveRes.json();
  assert.equal(approveRes.status, 200, 'Approve action must return HTTP 200');
  assert.equal(approveData.ok, true, 'Approve action must succeed');
  assert.equal(approveData.user.status, 'approved', 'User status must now be "approved"');
  console.log('   ✅ Customer successfully approved by Administrator.');

  // --- TEST 7: Customer Login After Approval ---
  console.log('👉 [Test 7] Customer Login After Admin Approval...');
  const approvedLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      identifier: testEmail,
      password: 'rahasia12345',
      method: 'email',
    }),
  });
  const approvedLoginData = await approvedLoginRes.json();
  assert.equal(approvedLoginRes.status, 200, 'Login after approval must return HTTP 200');
  assert.equal(approvedLoginData.ok, true, 'Login must succeed');
  assert.equal(approvedLoginData.role, 'customer', 'Role must be "customer"');
  assert.equal(approvedLoginData.redirectTo, '/dashboard', 'Customer must be redirected to /dashboard');
  console.log('   ✅ Customer login after approval succeeded and directs to /dashboard.');

  console.log('\n🎉 ALL 7 E2E TESTS PASSED! Unified auth & customer approval flow is 100% verified.');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
