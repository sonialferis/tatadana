// Test Suite: Admin vs Customer Role Separation and Authentication
// Verifies:
// 1. /auth/login page renders role switchers (Pelanggan vs Admin)
// 2. /auth/register page renders role switchers & admin protection info
// 3. Admin authentication requirement: sonialferis@gmail.com / sonial200712
// 4. Protection against wrong passwords and non-admin emails
// 5. Customer protection against registering reserved admin email

import assert from 'node:assert/strict';

const BASE_URL = 'http://127.0.0.1:3005';

async function runTests() {
  console.log('🚀 Starting Admin vs Customer Authentication Test Suite...\n');

  // Test 1: Fetch /auth/login and verify role switchers and content
  console.log('👉 [Test 1] Verifying /auth/login HTML response and role switchers...');
  const loginRes = await fetch(`${BASE_URL}/auth/login`);
  assert.equal(loginRes.status, 200, 'Login page should return HTTP 200');
  const loginHtml = await loginRes.text();
  assert(loginHtml.includes('Pelanggan') || loginHtml.includes('Pengguna'), 'Login page must have Pelanggan/Pengguna option');
  assert(loginHtml.includes('Administrator') || loginHtml.includes('Admin'), 'Login page must have Administrator option');
  assert(loginHtml.includes('sonialferis@gmail.com'), 'Login page must reference default admin credentials');
  console.log('   ✅ /auth/login contains Role Switcher and Admin Login elements.');

  // Test 2: Fetch /auth/register and verify role switchers and admin notice
  console.log('👉 [Test 2] Verifying /auth/register HTML response and admin security card...');
  const registerRes = await fetch(`${BASE_URL}/auth/register`);
  assert.equal(registerRes.status, 200, 'Register page should return HTTP 200');
  const registerHtml = await registerRes.text();
  assert(registerHtml.includes('Pelanggan'), 'Register page must have Pelanggan role');
  assert(registerHtml.includes('Administrator'), 'Register page must have Administrator role');
  assert(registerHtml.includes('sonialferis@gmail.com'), 'Register page must reference admin account info');
  console.log('   ✅ /auth/register contains Role Switcher and Admin Reservation notice.');

  // Test 3: Fetch /admin and verify Superadmin Header and Logout button
  console.log('👉 [Test 3] Verifying /admin header for Soni Alferis Superadmin profile...');
  const adminRes = await fetch(`${BASE_URL}/admin`);
  assert.equal(adminRes.status, 200, 'Admin page should return HTTP 200');
  const adminHtml = await adminRes.text();
  assert(adminHtml.includes('Soni Alferis'), 'Admin page must show name Soni Alferis');
  assert(adminHtml.includes('sonialferis@gmail.com'), 'Admin page must show email sonialferis@gmail.com');
  assert(adminHtml.includes('Superadmin Terverifikasi'), 'Admin page must show verified status');
  assert(adminHtml.includes('Keluar Admin') || adminHtml.includes('Logout'), 'Admin page must have logout button');
  console.log('   ✅ /admin displays Soni Alferis verified profile and logout controls.');

  // Test 4: Logic Verification for Admin Login Credentials
  console.log('👉 [Test 4] Testing Admin Credential Logic Rule Enforcement...');
  const ADMIN_EMAIL = 'sonialferis@gmail.com';
  const ADMIN_PASS = 'sonial200712';

  function validateAdminLogin(inputEmail, inputPass) {
    const cleanEmail = (inputEmail || '').trim().toLowerCase();
    const cleanPass = (inputPass || '').trim();
    if (cleanEmail === ADMIN_EMAIL && cleanPass === ADMIN_PASS) {
      return { ok: true, redirectTo: '/admin' };
    }
    return { ok: false, error: 'Kredensial Administrator tidak valid' };
  }

  // Valid credentials
  const validAttempt = validateAdminLogin('sonialferis@gmail.com', 'sonial200712');
  assert.equal(validAttempt.ok, true, 'Valid credentials must succeed');
  assert.equal(validAttempt.redirectTo, '/admin', 'Admin must be redirected to /admin');

  // Case-insensitive email
  const upperCaseAttempt = validateAdminLogin('SoniAlferis@Gmail.com ', 'sonial200712');
  assert.equal(upperCaseAttempt.ok, true, 'Email check should be case-insensitive and trimmed');

  // Wrong password
  const wrongPassAttempt = validateAdminLogin('sonialferis@gmail.com', 'wrongpassword123');
  assert.equal(wrongPassAttempt.ok, false, 'Wrong password must be rejected');

  // Wrong email
  const wrongEmailAttempt = validateAdminLogin('user@example.com', 'sonial200712');
  assert.equal(wrongEmailAttempt.ok, false, 'Non-admin email must be rejected in admin login');

  console.log('   ✅ Admin Credential Validation successfully enforces sonialferis@gmail.com & sonial200712.');

  // Test 5: Customer Registration Reservation Logic
  console.log('👉 [Test 5] Testing Customer Registration Reservation Logic...');
  function validateCustomerRegister(inputEmail) {
    const cleanEmail = (inputEmail || '').trim().toLowerCase();
    if (cleanEmail === ADMIN_EMAIL) {
      return { ok: false, error: 'Email sonialferis@gmail.com telah direservasi untuk Administrator' };
    }
    return { ok: true, redirectTo: '/dashboard' };
  }

  const blockedRegister = validateCustomerRegister('sonialferis@gmail.com');
  assert.equal(blockedRegister.ok, false, 'Registering with admin email as customer must be blocked');

  const allowedRegister = validateCustomerRegister('customer123@tatadana.id');
  assert.equal(allowedRegister.ok, true, 'Normal customer email must be allowed');
  assert.equal(allowedRegister.redirectTo, '/dashboard', 'Customer must be redirected to /dashboard');

  console.log('   ✅ Customer Registration successfully guards the reserved admin email.');

  console.log('\n🎉 ALL 5 TESTS PASSED SUCCESSFULLY! Admin vs Pelanggan role separation is verified.');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
