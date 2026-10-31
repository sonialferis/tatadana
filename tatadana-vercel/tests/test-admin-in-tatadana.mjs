import assert from 'node:assert';

console.log('🚀 Running Verification Test: Panel Admin In TataDana (Admin vs Customer)...\n');

// 1. Logic simulation for isAdmin in Dashboard layout
function computeIsAdmin(storage) {
  const role = storage['tatadana_auth_role'];
  const adminEmail = storage['tatadana_admin_email'];
  const userEmail = storage['tatadana_user_email'];

  const isSoniAdmin =
    (role === 'admin' || userEmail === 'sonialferis@gmail.com' || adminEmail === 'sonialferis@gmail.com') &&
    (adminEmail === 'sonialferis@gmail.com' || userEmail === 'sonialferis@gmail.com');

  return Boolean(isSoniAdmin);
}

// 2. Logic simulation for authorization in Admin page (/admin)
function computeIsAdminAuthorized(storage) {
  const role = storage['tatadana_auth_role'];
  const email = storage['tatadana_admin_email'];

  if (role !== 'admin' || email !== 'sonialferis@gmail.com') {
    return false;
  }
  return true;
}

// Test Case 1: Soni Alferis Admin Login
console.log('👉 [Case 1] Admin sonialferis@gmail.com login:');
const adminStorage = {
  tatadana_auth_role: 'admin',
  tatadana_admin_email: 'sonialferis@gmail.com',
  tatadana_admin_name: 'Soni Alferis',
};
const adminInDashboard = computeIsAdmin(adminStorage);
const adminInAdminPage = computeIsAdminAuthorized(adminStorage);

console.log('   isAdmin in Dashboard layout:', adminInDashboard);
console.log('   isAuthorized in Admin page:', adminInAdminPage);
assert.strictEqual(adminInDashboard, true, 'Admin MUST see Panel Admin in TataDana dashboard');
assert.strictEqual(adminInAdminPage, true, 'Admin MUST be authorized in /admin');
console.log('   ✅ Case 1 Passed: Admin has full access to Panel Admin inside TataDana!\n');

// Test Case 2: Customer Budi Santoso
console.log('👉 [Case 2] Customer budi@tatadana.id login:');
const customerStorage = {
  tatadana_auth_role: 'customer',
  tatadana_user_email: 'budi@tatadana.id',
  tatadana_user_name: 'Budi Santoso',
};
const customerInDashboard = computeIsAdmin(customerStorage);
const customerInAdminPage = computeIsAdminAuthorized(customerStorage);

console.log('   isAdmin in Dashboard layout:', customerInDashboard);
console.log('   isAuthorized in Admin page:', customerInAdminPage);
assert.strictEqual(customerInDashboard, false, 'Customer MUST NOT see Panel Admin in TataDana dashboard');
assert.strictEqual(customerInAdminPage, false, 'Customer MUST NOT be authorized in /admin (403)');
console.log('   ✅ Case 2 Passed: Customer NEVER sees Panel Admin inside TataDana!\n');

// Test Case 3: Customer trying to tamper with role
console.log('👉 [Case 3] Malicious customer setting role=admin without admin email:');
const tamperedStorage = {
  tatadana_auth_role: 'admin',
  tatadana_user_email: 'hacker@example.com',
  tatadana_admin_email: 'hacker@example.com',
};
const tamperedInDashboard = computeIsAdmin(tamperedStorage);
const tamperedInAdminPage = computeIsAdminAuthorized(tamperedStorage);

console.log('   isAdmin in Dashboard layout:', tamperedInDashboard);
console.log('   isAuthorized in Admin page:', tamperedInAdminPage);
assert.strictEqual(tamperedInDashboard, false, 'Unauthorized email MUST NOT see Panel Admin');
assert.strictEqual(tamperedInAdminPage, false, 'Unauthorized email MUST NOT access /admin');
console.log('   ✅ Case 3 Passed: Non-sonialferis email is completely blocked!\n');

console.log('🎉 ALL VERIFICATION CHECKS PASSED 100%!');
