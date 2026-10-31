#!/usr/bin/env node
/**
 * TataDana Indonesian Fintech SaaS — Master E2E Test Runner Harness
 * Executes Suites R1 to R5 sequentially against http://localhost:3000 and filesystem.
 */

import { run as runR1 } from '../tests/e2e-r1-database.test.mjs';
import { run as runR2 } from '../tests/e2e-r2-telegram.test.mjs';
import { run as runR3 } from '../tests/e2e-r3-dashboard.test.mjs';
import { run as runR4 } from '../tests/e2e-r4-superadmin.test.mjs';
import { run as runR5 } from '../tests/e2e-r5-landing-auth.test.mjs';

const suites = [
  { id: 'R1', fn: runR1 },
  { id: 'R2', fn: runR2 },
  { id: 'R3', fn: runR3 },
  { id: 'R4', fn: runR4 },
  { id: 'R5', fn: runR5 },
];

async function main() {
  const globalStartTime = Date.now();
  console.log('============================================================');
  console.log('TATADANA FINTECH SAAS — E2E TEST SUITE REPORT');
  console.log('============================================================');
  console.log(`Target: ${process.env.TEST_BASE_URL || 'http://localhost:3000'}`);
  console.log(`Standard Timezone: Asia/Jakarta (WIB)`);
  console.log('------------------------------------------------------------');

  const results = [];
  let totalAssertions = 0;
  let totalPassed = 0;
  let totalFailed = 0;

  for (const suite of suites) {
    try {
      const res = await suite.fn();
      results.push(res);
      totalAssertions += res.total;
      totalPassed += res.passed;
      totalFailed += res.failed;

      const statusTag = res.failed === 0 ? '[PASS]' : '[FAIL]';
      console.log(`${statusTag} ${res.name} (${res.passed}/${res.total} assertions, ${(res.durationMs / 1000).toFixed(2)}s)`);

      if (res.failed > 0) {
        for (const a of res.assertions.filter((a) => !a.pass)) {
          console.error(`       ❌ FAILED: ${a.desc}`);
          if (a.error?.message) {
            console.error(`          ${a.error.message}`);
          }
        }
      }
    } catch (err) {
      totalFailed++;
      console.error(`[FAIL] ${suite.id} Uncaught Exception: ${err.message}`);
      if (err.stack) console.error(err.stack);
    }
  }

  const totalDurationSec = ((Date.now() - globalStartTime) / 1000).toFixed(2);
  const passPercentage = totalAssertions > 0 ? ((totalPassed / totalAssertions) * 100).toFixed(0) : '0';

  console.log('------------------------------------------------------------');
  console.log(
    `Total Suites: ${results.length} | Total Assertions: ${totalAssertions} | Passed: ${totalPassed} | Failed: ${totalFailed}`
  );
  console.log(`Execution Time: ${totalDurationSec}s`);

  if (totalFailed === 0) {
    console.log(`OVERALL STATUS: ALL TESTS PASSED (${passPercentage}%)`);
    console.log('============================================================');
    process.exit(0);
  } else {
    console.error(`OVERALL STATUS: TEST FAILURES DETECTED (${totalFailed} failed)`);
    console.log('============================================================');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal Runner Error:', err);
  process.exit(1);
});
