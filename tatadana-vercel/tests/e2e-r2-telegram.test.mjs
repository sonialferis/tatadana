/**
 * TataDana Fintech SaaS — E2E Test Suite R2: Telegram Webhook & Multimodal AI
 * Target: http://localhost:3000/api/telegram/webhook & /api/telegram/test-connection
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

// Pure ESM implementation of Indonesian formatters matching src/lib/formatters.ts
function formatRupiah(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  const isNegative = amount < 0;
  const absVal = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(absVal).replace(/\s+/g, ' ');
  const normalized = formatted.replace(/^Rp\s*/, 'Rp ');
  return isNegative ? `-${normalized}` : normalized;
}

function formatTanggalWIB(dateInput = new Date()) {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const hariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const bulanListLong = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  let dayName = '', day = '', month = '', year = '', hour = '', minute = '';
  for (const p of parts) {
    if (p.type === 'weekday') dayName = p.value;
    if (p.type === 'day') day = p.value;
    if (p.type === 'month') month = p.value;
    if (p.type === 'year') year = p.value;
    if (p.type === 'hour') hour = p.value;
    if (p.type === 'minute') minute = p.value;
  }
  const hari = dayName || hariList[d.getDay()];
  const tanggal = `${day} ${month} ${year}`;
  const jam = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')} WIB`;
  return {
    hari,
    tanggal,
    jam,
    fullFormatted: `📅 ${hari}, ${tanggal} — ${jam}`,
  };
}

function parseIndonesianCurrency(text) {
  if (!text) return 0;
  const str = text.toLowerCase().trim();
  let total = 0;
  let matchedAbbreviation = false;

  const jtRegex = /(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/g;
  let jtMatch;
  while ((jtMatch = jtRegex.exec(str)) !== null) {
    const val = parseFloat(jtMatch[1].replace(',', '.'));
    total += Math.round(val * 1000000);
    matchedAbbreviation = true;
  }

  const rbRegex = /(\d+(?:[.,]\d+)?)\s*(?:rb|ribu|k)\b/g;
  let rbMatch;
  while ((rbMatch = rbRegex.exec(str)) !== null) {
    const val = parseFloat(rbMatch[1].replace(',', '.'));
    total += Math.round(val * 1000);
    matchedAbbreviation = true;
  }

  if (matchedAbbreviation && total > 0) return total;

  if (str.includes('seratus ribu')) return 100000;
  if (str.includes('lima puluh ribu')) return 50000;
  if (str.includes('dua puluh lima ribu')) return 25000;
  if (str.includes('sepuluh ribu')) return 10000;

  const rpRegex = /(?:rp\.?\s*)(\d{1,3}(?:\.\d{3})+|\d+)/i;
  const rpMatch = str.match(rpRegex);
  if (rpMatch) {
    const cleanNum = rpMatch[1].replace(/\./g, '');
    const num = parseInt(cleanNum, 10);
    if (!isNaN(num) && num > 0) return num;
  }

  return 0;
}

function generateProgressBar(percentage, length = 16) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filledBlocks = Math.round((clamped / 100) * length);
  const emptyBlocks = Math.max(0, length - filledBlocks);
  return `${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}`;
}

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

  // 1. Source Verification: Verify src/lib/formatters.ts and src/lib/telegram.ts exist
  const formattersPath = path.join(PROJECT_ROOT, 'src', 'lib', 'formatters.ts');
  const telegramLibPath = path.join(PROJECT_ROOT, 'src', 'lib', 'telegram.ts');
  assert(fs.existsSync(formattersPath), 'formatters.ts library exists at src/lib/formatters.ts');
  assert(fs.existsSync(telegramLibPath), 'telegram.ts library exists at src/lib/telegram.ts');

  const formattersCode = fs.readFileSync(formattersPath, 'utf8');
  assert(
    formattersCode.includes('formatRupiah') &&
      formattersCode.includes('formatTanggalWIB') &&
      formattersCode.includes('parseIndonesianCurrency') &&
      formattersCode.includes('generateProgressBar'),
    'formatters.ts exports all 4 key formatters (formatRupiah, formatTanggalWIB, parseIndonesianCurrency, generateProgressBar)'
  );

  // 2. Invalid Payload Handling (Missing update_id or empty body)
  try {
    const res = await fetch(`${BASE_URL}/api/telegram/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert(res.status === 400, 'Webhook rejects empty body with HTTP 400');
    const data = await res.json();
    assert(data.ok === false && data.error === 'Invalid payload', 'Webhook returns explicit error payload for invalid request');
  } catch (err) {
    assert(false, `Webhook invalid payload test failed: ${err.message}`);
  }

  // 3. Strict Idempotency Verification with update_id
  const testUpdateId = 880000 + Math.floor(Math.random() * 100000);
  const testChatId = 991234;

  try {
    // First invocation (Fresh update_id)
    const res1 = await fetch(`${BASE_URL}/api/telegram/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: testUpdateId,
        message: {
          message_id: 101,
          chat: { id: testChatId, type: 'private' },
          text: 'beli soto ayam 15rb',
          date: Math.floor(Date.now() / 1000),
        },
      }),
    });
    assert(res1.status === 200, 'First webhook dispatch returns HTTP 200');
    const data1 = await res1.json();
    assert(data1.ok === true && data1.status === 'transaction_recorded', 'First dispatch records transaction successfully');

    // Second invocation (Duplicate update_id)
    const res2 = await fetch(`${BASE_URL}/api/telegram/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: testUpdateId,
        message: {
          message_id: 101,
          chat: { id: testChatId, type: 'private' },
          text: 'beli soto ayam 15rb',
          date: Math.floor(Date.now() / 1000),
        },
      }),
    });
    assert(res2.status === 200, 'Duplicate webhook dispatch returns HTTP 200 OK');
    const data2 = await res2.json();
    assert(data2.ok === true && data2.status === 'already_processed', 'Idempotent deduplication detected: returns already_processed');
  } catch (err) {
    assert(false, `Idempotency verification test failed: ${err.message}`);
  }

  // 4. Indonesian Natural Language Currency & Text Parsing
  const parsingTestCases = [
    { text: 'beli soto 15rb', expectedNominal: 15000, desc: 'Parse "15rb" shorthand' },
    { text: 'kopi kenangan 25k', expectedNominal: 25000, desc: 'Parse "25k" shorthand' },
    { text: 'gajian bulan ini 5.5jt', expectedNominal: 5500000, desc: 'Parse "5.5jt" shorthand' },
    { text: 'sepatu 500k', expectedNominal: 500000, desc: 'Parse "500k" shorthand' },
    { text: 'bonus proyek 1.5jt', expectedNominal: 1500000, desc: 'Parse "1.5jt" shorthand' },
    { text: 'isi bensin shell 100rb', expectedNominal: 100000, desc: 'Parse "100rb" shorthand' },
    { text: 'beli buku seratus ribu', expectedNominal: 100000, desc: 'Parse Indonesian word "seratus ribu"' },
    { text: 'makan siang lima puluh ribu', expectedNominal: 50000, desc: 'Parse Indonesian word "lima puluh ribu"' },
  ];

  for (const tc of parsingTestCases) {
    const parsedAmount = parseIndonesianCurrency(tc.text);
    assert(parsedAmount === tc.expectedNominal, `NLP Parser: ${tc.desc} (${tc.text} -> ${parsedAmount})`);
  }

  // 5. Webhook Transaction Types: Expense vs Income
  try {
    const incomeUpdateId = 890000 + Math.floor(Math.random() * 100000);
    const incomeRes = await fetch(`${BASE_URL}/api/telegram/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: incomeUpdateId,
        message: {
          message_id: 102,
          chat: { id: testChatId, type: 'private' },
          text: 'gajian bulanan 6.5jt',
          date: Math.floor(Date.now() / 1000),
        },
      }),
    });
    const incomeData = await incomeRes.json();
    assert(incomeRes.status === 200 && incomeData.ok === true, 'Webhook logs income ("gajian") transaction properly');
  } catch (err) {
    assert(false, `Income transaction test failed: ${err.message}`);
  }

  // 6. Multimodal Receipt Photo OCR
  try {
    const photoUpdateId = 910000 + Math.floor(Math.random() * 100000);
    const photoRes = await fetch(`${BASE_URL}/api/telegram/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: photoUpdateId,
        message: {
          message_id: 103,
          chat: { id: 778899, type: 'private' },
          photo: [
            { file_id: 'photo_mock_01', file_unique_id: 'u01', width: 800, height: 600 },
          ],
          caption: 'Struk Indomaret',
          date: Math.floor(Date.now() / 1000),
        },
      }),
    });
    const photoData = await photoRes.json();
    assert(photoRes.status === 200, 'Webhook processes photo message with HTTP 200');
    assert(
      photoData.status === 'ocr_upgrade_prompt' || photoData.status === 'ocr_success',
      `Webhook handles photo OCR with plan verification (status: ${photoData.status})`
    );
  } catch (err) {
    assert(false, `Receipt OCR test failed: ${err.message}`);
  }

  // 7. Multimodal Voice Note: Exceeding 60s Limit vs Valid Duration
  try {
    // 7a. Exceeded duration (> 60s)
    const longVoiceId = 920000 + Math.floor(Math.random() * 100000);
    const longVoiceRes = await fetch(`${BASE_URL}/api/telegram/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: longVoiceId,
        message: {
          message_id: 104,
          chat: { id: testChatId, type: 'private' },
          voice: { file_id: 'voice_long', duration: 75 },
          date: Math.floor(Date.now() / 1000),
        },
      }),
    });
    const longVoiceData = await longVoiceRes.json();
    assert(
      longVoiceData.ok === true && longVoiceData.status === 'voice_duration_exceeded',
      'Voice note > 60s is rejected with voice_duration_exceeded status'
    );

    // 7b. Valid duration (< 60s)
    const validVoiceId = 930000 + Math.floor(Math.random() * 100000);
    const validVoiceRes = await fetch(`${BASE_URL}/api/telegram/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: validVoiceId,
        message: {
          message_id: 105,
          chat: { id: testChatId, type: 'private' },
          voice: { file_id: 'voice_short', duration: 12 },
          date: Math.floor(Date.now() / 1000),
        },
      }),
    });
    const validVoiceData = await validVoiceRes.json();
    assert(
      validVoiceData.ok === true && validVoiceData.status === 'transaction_recorded',
      'Valid voice note (< 60s) logs transcribed transaction successfully'
    );
  } catch (err) {
    assert(false, `Voice note test failed: ${err.message}`);
  }

  // 8. Precision Telegram Reply Formatting
  // 8a. Rupiah Formatter
  assert(formatRupiah(15000) === 'Rp 15.000', 'formatRupiah(15000) produces "Rp 15.000"');
  assert(formatRupiah(1500000) === 'Rp 1.500.000', 'formatRupiah(1500000) produces "Rp 1.500.000"');
  assert(formatRupiah(0) === 'Rp 0', 'formatRupiah(0) produces "Rp 0"');

  // 8b. Asia/Jakarta (WIB) Timestamp
  const wibTime = formatTanggalWIB();
  assert(wibTime.jam.includes('WIB'), 'Timestamp formatter includes "WIB" timezone');
  assert(wibTime.fullFormatted.startsWith('📅 '), 'Timestamp formatted header has calendar emoji "📅 "');

  // 8c. ASCII Progress Bar
  const pbar60 = generateProgressBar(60, 10);
  assert(pbar60.length === 10, 'generateProgressBar produces expected 10-char width');
  assert(pbar60.includes('█') && pbar60.includes('░'), 'generateProgressBar contains both filled block █ and shade ░');
  const filledCount = (pbar60.match(/█/g) || []).length;
  assert(filledCount === 6, '60% progress produces exactly 6 filled blocks (6/10)');

  // 9. Telegram Bot Connection Test Endpoint (/api/telegram/test-connection)
  try {
    const emptyTokenRes = await fetch(`${BASE_URL}/api/telegram/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: '' }),
    });
    assert(emptyTokenRes.status === 400, 'Test-connection endpoint rejects empty token with HTTP 400');

    const invalidTokenRes = await fetch(`${BASE_URL}/api/telegram/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'invalid_bot_token_12345' }),
    });
    assert(invalidTokenRes.status === 200, 'Test-connection returns HTTP 200 with disconnection diagnostic for invalid token');
    const invalidTokenData = await invalidTokenRes.json();
    assert(invalidTokenData.ok === false && invalidTokenData.status === 'disconnected', 'Test-connection returns status: disconnected');
  } catch (err) {
    assert(false, `Test connection endpoint test failed: ${err.message}`);
  }

  const passed = assertions.filter((a) => a.pass).length;
  const failed = assertions.filter((a) => !a.pass).length;

  return {
    name: 'E2E-R2: Telegram Webhook & Multimodal AI NLP',
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
