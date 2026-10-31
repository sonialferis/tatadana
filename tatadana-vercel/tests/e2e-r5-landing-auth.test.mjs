/**
 * TataDana Fintech SaaS — E2E Test Suite R5: Landing Page & Auth Flow
 * Target: http://localhost:3000/ & Auth Routes (/auth/login, /auth/register, /auth/forgot-password)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
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

  // 1. Landing Page Source & Structure Inspection
  const landingPagePath = path.join(PROJECT_ROOT, 'src', 'app', 'page.tsx');
  assert(fs.existsSync(landingPagePath), 'Landing page source exists at src/app/page.tsx');
  const pageContent = fs.readFileSync(landingPagePath, 'utf8');

  // Verify All 12 Distinct Landing Page Sections
  const requiredSections = [
    { num: '1', id: 'navbar', name: 'Header / Navbar' },
    { num: '2', id: 'hero', name: 'Hero with Animated Live Preview' },
    { num: '3', id: 'problem', name: 'Problem Statement (Dilema Finansial)' },
    { num: '4', id: 'solusi', name: 'Core Value Proposition & Solution' },
    { num: '5', id: 'telegram-showcase', name: 'Interactive Telegram Bot Simulator' },
    { num: '6', id: 'multi-wallet', name: 'Multi-Wallet & Indonesian Banking Ecosystem' },
    { num: '7', id: 'ai-multimodal', name: 'AI Multimodal Capabilities (Vision, Voice, NLP)' },
    { num: '8', id: 'keamanan', name: 'Security, Privacy & UU PDP Compliance' },
    { num: '9', id: 'harga', name: '3-Tier Transparent Pricing (Gratis, Pro, Bisnis)' },
    { num: '10', id: 'testimoni', name: 'Indonesian Customer Testimonials' },
    { num: '11', id: 'faq', name: 'FAQ Accordion' },
    { num: '12', id: 'footer', name: 'Trust & Compliance Footer' },
  ];

  for (const s of requiredSections) {
    const hasDataSection = pageContent.includes(`data-section="${s.num}"`);
    const hasId = pageContent.includes(`id="${s.id}"`);
    assert(
      hasDataSection && hasId,
      `Landing Section ${s.num} (${s.name}) is present with data-section="${s.num}" and id="${s.id}"`
    );
  }

  // 2. Fetch Live Landing Page over HTTP
  try {
    const homeRes = await fetch(`${BASE_URL}/`);
    assert(homeRes.status === 200, 'GET / responds with HTTP 200');
    const homeHtml = await homeRes.text();
    assert(homeHtml.includes('TataDana') || homeHtml.includes('tatadana'), 'Live HTML contains TataDana branding');
    assert(homeHtml.includes('Telegram') || homeHtml.includes('telegram'), 'Live HTML showcases Telegram integration');
  } catch (err) {
    assert(false, `Live landing page fetch failed: ${err.message}`);
  }

  // 3. Auth Page Routes (HTTP 200 Availability)
  const authRoutes = [
    { path: '/auth/login', name: 'Login Page' },
    { path: '/auth/register', name: 'Registration Page' },
    { path: '/auth/forgot-password', name: 'Password Recovery Page' },
  ];

  for (const route of authRoutes) {
    try {
      const authRes = await fetch(`${BASE_URL}${route.path}`);
      assert(authRes.status === 200, `GET ${route.path} (${route.name}) responds with HTTP 200`);
      const authHtml = await authRes.text();
      assert(authHtml.length > 500, `${route.name} returns substantive HTML body`);
    } catch (err) {
      assert(false, `Auth route ${route.path} fetch failed: ${err.message}`);
    }
  }

  // 4. Split-Layout Auth UI Elements Verification
  const loginFilePath = path.join(PROJECT_ROOT, 'src', 'app', 'auth', 'login', 'page.tsx');
  const registerFilePath = path.join(PROJECT_ROOT, 'src', 'app', 'auth', 'register', 'page.tsx');
  const forgotFilePath = path.join(PROJECT_ROOT, 'src', 'app', 'auth', 'forgot-password', 'page.tsx');

  assert(fs.existsSync(loginFilePath), 'Login page component exists at src/app/auth/login/page.tsx');
  assert(fs.existsSync(registerFilePath), 'Register page component exists at src/app/auth/register/page.tsx');
  assert(fs.existsSync(forgotFilePath), 'Forgot-password page component exists at src/app/auth/forgot-password/page.tsx');

  const loginContent = fs.readFileSync(loginFilePath, 'utf8');
  const registerContent = fs.readFileSync(registerFilePath, 'utf8');
  const forgotContent = fs.readFileSync(forgotFilePath, 'utf8');

  // Verify Split-Layout Grid (Left 40% branding panel, Right 60% form pane)
  assert(
    loginContent.includes('lg:flex') && loginContent.includes('from-orange-600'),
    'Login page implements responsive split-layout with left branding panel'
  );
  assert(
    registerContent.includes('lg:flex') && registerContent.includes('from-orange-600'),
    'Register page implements responsive split-layout with left branding panel'
  );
  assert(
    forgotContent.includes('lg:flex') && forgotContent.includes('from-orange-600'),
    'Forgot-password page implements responsive split-layout with left branding panel'
  );

  // 5. OTP 60s Countdown Timer & Multi-Step Verification
  assert(
    forgotContent.includes('setCountdown(60)') || forgotContent.includes('countdown > 0'),
    'Password recovery implements 60-second OTP resend countdown timer'
  );
  assert(
    forgotContent.includes('otpCode.trim().length !== 6') || forgotContent.includes('otpCode.length === 6'),
    'Password recovery enforces 6-digit OTP verification code length'
  );
  assert(
    loginContent.includes('handleSendOtp') || loginContent.includes('handleVerifyOtp') || loginContent.includes('otp'),
    'Login page supports alternative phone OTP authentication flow'
  );

  // 6. Pricing Tier Details
  assert(
    pageContent.includes('Gratis / Starter') &&
      pageContent.includes('TataDana Pro') &&
      pageContent.includes('Bisnis / UMKM'),
    'Landing page features all 3 tiers: Gratis / Starter, TataDana Pro, and Bisnis / UMKM'
  );
  assert(
    pageContent.includes('99.000') || pageContent.includes('29.000'),
    'Pricing section specifies official Indonesian nominals (Rp 29.000/bln atau Rp 99.000 lifetime)'
  );

  // 7. Security & Compliance Badges
  assert(
    pageContent.includes('Kominfo PSE') &&
      pageContent.includes('ISO/IEC 27001') &&
      pageContent.includes('QRIS'),
    'Footer highlights trust badges: Kominfo PSE, ISO/IEC 27001, and QRIS National Standard'
  );

  const passed = assertions.filter((a) => a.pass).length;
  const failed = assertions.filter((a) => !a.pass).length;

  return {
    name: 'E2E-R5: 12-Section Landing Page & Split-Layout Auth',
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
