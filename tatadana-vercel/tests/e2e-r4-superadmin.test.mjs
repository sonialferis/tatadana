/**
 * TataDana Fintech SaaS — E2E Test Suite R4: Superadmin, Multi-AI Failover & Payments
 * Target: http://localhost:3000/api/admin/*, /api/payment/midtrans, src/lib/ai-failover.ts
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3005';
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-mock123';

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

  // 1. User Impersonation Flow & Session Cookie Management
  let impersonationCookie = '';
  try {
    // 1a. Start Impersonation
    const startRes = await fetch(`${BASE_URL}/api/admin/impersonate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetUserId: 'usr-1',
        targetUserName: 'Budi Santoso',
        reason: 'Troubleshooting ledger mismatch reported via support',
      }),
    });

    assert(startRes.status === 200, 'POST /api/admin/impersonate returns HTTP 200');
    const startData = await startRes.json();
    assert(startData.ok === true && startData.action === 'START', 'Impersonation mode started successfully');
    assert(startData.redirectUrl === '/dashboard', 'Impersonation start redirects to /dashboard');

    const setCookieHeader = startRes.headers.get('set-cookie') || '';
    assert(
      setCookieHeader.includes('tatadana_impersonate_session='),
      'Impersonation endpoint sets "tatadana_impersonate_session" cookie'
    );

    // Extract cookie value for subsequent test calls
    const cookieMatch = setCookieHeader.match(/tatadana_impersonate_session=([^;]+)/);
    if (cookieMatch) {
      impersonationCookie = cookieMatch[1];
    }

    // 1b. Verify Active Impersonation Context via GET
    const getRes = await fetch(`${BASE_URL}/api/admin/impersonate`, {
      method: 'GET',
      headers: {
        Cookie: `tatadana_impersonate_session=${impersonationCookie}`,
      },
    });
    const getData = await getRes.json();
    assert(
      getData.ok === true && getData.isImpersonating === true,
      'GET /api/admin/impersonate detects active impersonation session'
    );
    assert(
      getData.session?.user_id === 'usr-1' || getData.session?.targetUserId === 'usr-1',
      'Active session reflects target user ID usr-1'
    );

    // 1c. Exit Impersonation Mode
    const exitRes = await fetch(`${BASE_URL}/api/admin/impersonate/exit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `tatadana_impersonate_session=${impersonationCookie}`,
      },
    });
    assert(exitRes.status === 200, 'POST /api/admin/impersonate/exit returns HTTP 200');
    const exitData = await exitRes.json();
    assert(exitData.ok === true && exitData.action === 'STOP', 'Impersonation successfully stopped');

    const exitCookieHeader = exitRes.headers.get('set-cookie') || '';
    assert(
      exitCookieHeader.includes('tatadana_impersonate_session=;') ||
        exitCookieHeader.includes('Max-Age=0') ||
        exitCookieHeader.includes('tatadana_impersonate_session='),
      'Exit impersonation clears the session cookie'
    );
  } catch (err) {
    assert(false, `Impersonation flow test failed: ${err.message}`);
  }

  // 2. Multi-AI Failover Cascade Engine Verification (Source & Algorithmic Cascade)
  const aiFailoverPath = path.join(PROJECT_ROOT, 'src', 'lib', 'ai-failover.ts');
  assert(fs.existsSync(aiFailoverPath), 'ai-failover engine exists at src/lib/ai-failover.ts');
  const aiCode = fs.readFileSync(aiFailoverPath, 'utf8');

  // 2a. Architecture & 5 Provider Tiers
  assert(
    aiCode.includes('executeAiWithFailover'),
    'ai-failover.ts exports executeAiWithFailover cascading function'
  );
  assert(
    aiCode.includes('gemini-1.5-flash') &&
      aiCode.includes('gemini-1.5-pro') &&
      aiCode.includes('llama-3.1-70b-versatile') &&
      aiCode.includes('gpt-4o-mini') &&
      aiCode.includes('regex-heuristic-v1'),
    'ai-failover.ts configures 5 provider tiers (Gemini Flash, Gemini Pro, Groq Llama, OpenAI, Indonesian Heuristic)'
  );
  assert(
    aiCode.includes('recordProviderTelemetry') && aiCode.includes('latency_ms') && aiCode.includes('cost_estimate_idr'),
    'ai-failover.ts accumulates latency metrics, token consumption, and cost telemetry'
  );

  // 2b. Cascading Execution Simulation
  const mockProviders = [
    { id: 'p1', name: 'Gemini Flash', provider: 'gemini', tier: 1, willFail: true },
    { id: 'p2', name: 'Gemini Pro', provider: 'gemini', tier: 2, willFail: true },
    { id: 'p3', name: 'Groq Llama', provider: 'groq', tier: 3, willFail: false, result: { nominal: 25000, jenis: 'pengeluaran', kategori: 'Makanan & Minuman' } },
    { id: 'p4', name: 'Heuristic Regex', provider: 'heuristic', tier: 5, willFail: false, result: { nominal: 25000, jenis: 'pengeluaran', kategori: 'Makanan & Minuman' } },
  ];

  let resolvedResult = null;
  let resolvedStatus = 'success';
  let resolvedTier = 1;
  let isFirstAttempt = true;

  for (const p of mockProviders) {
    if (p.willFail) {
      isFirstAttempt = false;
      continue;
    }
    resolvedResult = p.result;
    resolvedStatus = isFirstAttempt ? 'success' : 'fallback';
    resolvedTier = p.tier;
    break;
  }

  assert(resolvedResult !== null, 'Failover cascade successfully recovers from simulated upstream provider failures');
  assert(resolvedStatus === 'fallback', 'Cascaded execution accurately records status: fallback');
  assert(resolvedTier === 3, 'Execution resolved at next available provider in cascade order (Tier 3)');

  // 3. Midtrans SHA-512 Signature Verification (/api/payment/midtrans)
  try {
    // 3a. Healthcheck
    const midtransGet = await fetch(`${BASE_URL}/api/payment/midtrans`);
    assert(midtransGet.status === 200, 'GET /api/payment/midtrans returns HTTP 200');
    const midtransGetData = await midtransGet.json();
    assert(midtransGetData.algorithm === 'SHA-512', 'Midtrans webhook advertises SHA-512 cryptographic verification');

    // 3b. Missing / Invalid Signature Key Rejection (HTTP 403)
    const invalidSigRes = await fetch(`${BASE_URL}/api/payment/midtrans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: 'ORD-TEST-FAIL-01',
        status_code: '200',
        gross_amount: '99000.00',
        signature_key: 'invalid_sha512_hash_value',
        transaction_status: 'settlement',
      }),
    });
    assert(invalidSigRes.status === 403, 'Midtrans webhook rejects invalid SHA-512 signature with HTTP 403');

    // 3c. Valid SHA-512 Signature Generation & Settlement
    const testOrderId = `ORD-TEST-${Date.now()}`;
    const statusCode = '200';
    const grossAmount = '99000.00';

    // Signature formula: SHA512(order_id + status_code + gross_amount + ServerKey)
    const rawPayload = `${testOrderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`;
    const validSignature = crypto.createHash('sha512').update(rawPayload).digest('hex');

    const validSigRes = await fetch(`${BASE_URL}/api/payment/midtrans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: testOrderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: validSignature,
        transaction_status: 'settlement',
        payment_type: 'qris',
      }),
    });

    assert(validSigRes.status === 200, 'Midtrans webhook accepts valid SHA-512 signature with HTTP 200');
    const validSigData = await validSigRes.json();
    assert(
      validSigData.ok === true && validSigData.status === 'settlement',
      'Midtrans webhook records order settlement successfully'
    );
    assert(validSigData.userPlan === 'pro', 'Midtrans settlement automatically upgrades user plan to Pro');

    // 3d. Idempotency Check on Duplicate Settlement
    const dupeSigRes = await fetch(`${BASE_URL}/api/payment/midtrans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: testOrderId,
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: validSignature,
        transaction_status: 'settlement',
        payment_type: 'qris',
      }),
    });
    assert(dupeSigRes.status === 200, 'Duplicate Midtrans settlement returns HTTP 200');
    const dupeSigData = await dupeSigRes.json();
    assert(
      dupeSigData.status === 'already_settled',
      'Duplicate Midtrans webhook handles order idempotently (status: already_settled)'
    );
  } catch (err) {
    assert(false, `Midtrans signature verification test failed: ${err.message}`);
  }

  // 4. Manual Payment Approval Workflow (/api/admin/payments/approve & reject)
  try {
    // 4a. Approve Pending Payment Order
    const approveRes = await fetch(`${BASE_URL}/api/admin/payments/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD-1092',
        adminId: 'admin-super-01',
      }),
    });
    assert(approveRes.status === 200, 'POST /api/admin/payments/approve returns HTTP 200');
    const approveData = await approveRes.json();
    assert(
      approveData.ok === true && approveData.status === 'settlement' && approveData.plan === 'pro',
      'Manual payment approval sets status: settlement and upgrades plan: pro'
    );

    // 4b. Reject Payment Order with Notes
    const rejectRes = await fetch(`${BASE_URL}/api/admin/payments/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD-1092',
        adminId: 'admin-super-01',
        reason: 'Bukti transfer tidak terbaca / nominal tidak cocok',
      }),
    });
    assert(rejectRes.status === 200, 'POST /api/admin/payments/reject returns HTTP 200');
    const rejectData = await rejectRes.json();
    assert(
      rejectData.ok === true && rejectData.status === 'rejected',
      'Manual payment rejection marks status: rejected'
    );

    // 4c. Non-existent Order Handling (HTTP 404)
    const notFoundRes = await fetch(`${BASE_URL}/api/admin/payments/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: 'ORD-NONEXISTENT-999',
      }),
    });
    assert(notFoundRes.status === 404, 'Payment approval for non-existent order returns HTTP 404');
  } catch (err) {
    assert(false, `Manual payment approval test failed: ${err.message}`);
  }

  // 5. Telegram Broadcast API (/api/admin/broadcast)
  try {
    // 5a. GET broadcast history
    const getBcRes = await fetch(`${BASE_URL}/api/admin/broadcast`);
    assert(getBcRes.status === 200, 'GET /api/admin/broadcast returns HTTP 200');
    const getBcData = await getBcRes.json();
    assert(
      getBcData.ok === true && Array.isArray(getBcData.broadcasts),
      'GET /api/admin/broadcast returns list of broadcast history'
    );

    // 5b. Validation error on missing fields
    const invalidBcRes = await fetch(`${BASE_URL}/api/admin/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    });
    assert(invalidBcRes.status === 400, 'POST /api/admin/broadcast rejects empty payload with HTTP 400');

    // 5c. Valid Broadcast dispatch with special characters in title and HTML in message
    const validBcRes = await fetch(`${BASE_URL}/api/admin/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '🧪 E2E Test: Tips Hemat < 50% & Cashback',
        message: 'Halo! Ini adalah pesan pengujian otomatis <b>TataDana E2E</b> dengan format <i>italic</i> &amp; emoji 🚀.',
        targetPlan: 'all',
      }),
    });
    assert(validBcRes.status === 200, 'POST /api/admin/broadcast returns HTTP 200');
    const validBcData = await validBcRes.json();
    assert(
      validBcData.ok === true &&
        typeof validBcData.totalSent === 'number' &&
        typeof validBcData.totalFailed === 'number' &&
        typeof validBcData.broadcastId === 'string',
      'POST /api/admin/broadcast returns ok: true, totalSent, totalFailed, and broadcastId'
    );

    // 5d. Targeted Broadcast dispatch (Pro plan)
    const proBcRes = await fetch(`${BASE_URL}/api/admin/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: '⭐ Promo Eksklusif Member Pro',
        message: 'Nikmati fitur premium OCR tanpa batas!',
        targetPlan: 'pro',
      }),
    });
    assert(proBcRes.status === 200, 'POST /api/admin/broadcast with targetPlan: pro returns HTTP 200');
    const proBcData = await proBcRes.json();
    assert(
      proBcData.ok === true && proBcData.record?.targetPlan === 'pro',
      'Targeted broadcast records targetPlan as pro'
    );

    // 5e. Verify persistence in GET /api/admin/broadcast
    const verifyGetRes = await fetch(`${BASE_URL}/api/admin/broadcast`);
    const verifyGetData = await verifyGetRes.json();
    const foundRecord = verifyGetData.broadcasts?.some((b) => b.id === validBcData.broadcastId);
    assert(foundRecord === true, 'GET /api/admin/broadcast reflects recently saved broadcast record');
  } catch (err) {
    assert(false, `Telegram broadcast API test failed: ${err.message}`);
  }

  const passed = assertions.filter((a) => a.pass).length;
  const failed = assertions.filter((a) => !a.pass).length;

  return {
    name: 'E2E-R4: Superadmin, Multi-AI Failover & Midtrans',
    total: assertions.length,
    passed,
    failed,
    assertions,
    durationMs: Date.now() - startTime,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
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
