const logger = require('./utils/logger');

/**
 * Setup Telegram webhook untuk production.
 * WEBHOOK_SECRET wajib ada (divalidasi di validateEnv).
 * Host diambil dari RENDER_EXTERNAL_URL atau APP_URL.
 */
async function setupWebhook(bot, app) {
  const secret = process.env.WEBHOOK_SECRET;
  const host = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;

  if (!host) {
    throw new Error(
      'APP_URL atau RENDER_EXTERNAL_URL wajib diset di production. ' +
      'Contoh: APP_URL=https://yourdomain.com'
    );
  }

  // Pastikan host tidak trailing slash
  const baseUrl = host.replace(/\/$/, '');
  const webhookUrl = `${baseUrl}/webhook`;

  // Register express route untuk webhook
  app.post('/webhook', (req, res) => {
    const incoming = req.headers['x-telegram-bot-api-secret-token'];

    // Secret wajib ada dan harus cocok
    if (incoming !== secret) {
      logger.warn(`Webhook request ditolak: secret tidak cocok (IP: ${req.ip})`);
      return res.status(403).json({ error: 'Forbidden' });
    }

    return bot.handleUpdate(req.body, res);
  });

  await bot.telegram.setWebhook(webhookUrl, {
    secret_token: secret,
  });

  logger.info(`Webhook aktif: ${webhookUrl}`);
}

module.exports = { setupWebhook };
