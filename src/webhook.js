const logger = require('./utils/logger');

/**
 * Setup Telegram webhook for production.
 * The RENDER_EXTERNAL_URL env variable is set automatically by Render.com.
 */
async function setupWebhook(bot, app) {
  const secret = process.env.WEBHOOK_SECRET;
  const host = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL;

  if (!host) {
    throw new Error('APP_URL or RENDER_EXTERNAL_URL env variable is required in production');
  }

  const webhookUrl = `${host}/webhook`;

  // Register express route for webhook
  app.post('/webhook', (req, res, next) => {
    // Validate secret token sent by Telegram in X-Telegram-Bot-Api-Secret-Token header
    const incoming = req.headers['x-telegram-bot-api-secret-token'];
    if (secret && incoming !== secret) {
      logger.warn('Invalid webhook secret token received');
      return res.status(403).json({ error: 'Forbidden' });
    }
    return bot.handleUpdate(req.body, res);
  });

  await bot.telegram.setWebhook(webhookUrl, {
    secret_token: secret,
  });

  logger.info(`Webhook set to: ${webhookUrl}`);
}

module.exports = { setupWebhook };
