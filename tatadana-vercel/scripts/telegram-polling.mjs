/**
 * TataDana Telegram Long-Polling Bridge for Localhost Development
 * Forwards live updates from Telegram API (getUpdates) directly to http://127.0.0.1:3005/api/telegram/webhook
 */

const botToken = process.argv[2] || process.env.TELEGRAM_BOT_TOKEN;
const localWebhookUrl = process.env.WEBHOOK_LOCAL_URL || 'http://127.0.0.1:3005/api/telegram/webhook';

if (!botToken || botToken === 'mock_telegram_bot_token') {
  console.error('[TataDana Bot Bridge] ERROR: Silakan sertakan token bot Telegram.');
  console.error('Penggunaan: node scripts/telegram-polling.mjs <TELEGRAM_BOT_TOKEN>');
  console.error('Contoh: node scripts/telegram-polling.mjs 123456789:ABCdefGhIjkLmNoPqRsTuVwXyZ');
  process.exit(1);
}

async function startBridge() {
  console.log('====================================================');
  console.log('TATADANA TELEGRAM BOT BRIDGE (LOCALHOST)');
  console.log('====================================================');
  console.log(`Forwarding updates to: ${localWebhookUrl}`);

  // 1. Verify Bot Token with getMe
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const meData = await meRes.json();
    if (!meData.ok) {
      console.error(`[ERROR] Token bot tidak valid: ${meData.description}`);
      process.exit(1);
    }
    console.log(`[CONNECTED] Bot Terverifikasi: @${meData.result.username} (${meData.result.first_name})`);
  } catch (err) {
    console.error(`[ERROR] Gagal terhubung ke Telegram API: ${err.message}`);
    process.exit(1);
  }

  // 2. Clear active webhook so getUpdates receives messages
  try {
    console.log('[CONFIG] Menyiapkan polling mode (membersihkan webhook lama)...');
    await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook?drop_pending_updates=false`);
  } catch (err) {
    console.warn('[WARN] deleteWebhook notice:', err.message);
  }

  console.log('[READY] Bridge aktif! Kirim pesan ke bot Anda di Telegram sekarang.');
  console.log('----------------------------------------------------');

  let offset = 0;
  while (true) {
    try {
      const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${offset}&timeout=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(18000) });
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = Math.max(offset, update.update_id + 1);

          const sender = update.message?.from?.username || update.message?.from?.first_name || 'User';
          const chatId = update.message?.chat?.id;
          const text = update.message?.text || update.message?.caption || (update.message?.photo ? '[Foto Struk]' : (update.message?.voice ? '[Voice Note]' : '[Pesan]'));
          console.log(`[UPDATE #${update.update_id}] Dari @${sender} (Chat ID: ${chatId}): "${text}"`);

          // Forward to local Next.js webhook route
          try {
            const hookRes = await fetch(localWebhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(update),
            });
            const hookData = await hookRes.json();
            console.log(`  └─> Webhook response: status=${hookData.status || (hookData.ok ? 'ok' : 'error')}`);
          } catch (hookErr) {
            console.error(`  └─> Gagal meneruskan ke webhook lokal: ${hookErr.message}`);
          }
        }
      } else if (!data.ok) {
        console.error(`[POLLING ERROR] ${data.description}`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    } catch (pollErr) {
      // Ignore normal long poll aborts or retry cleanly
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

startBridge();
