require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const cron = require('node-cron');

const { setupWebhook } = require('./webhook');
const registerCommands = require('./commands');
const { sendDailyReminders } = require('./scheduler');
const logger = require('./utils/logger');

const app = express();
app.use(express.json());

const bot = new Telegraf(process.env.BOT_TOKEN);

// Register all command handlers
registerCommands(bot);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start bot depending on environment
async function start() {
  try {
    if (process.env.NODE_ENV === 'production') {
      await setupWebhook(bot, app);
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT} (webhook mode)`);
      });
    } else {
      // Long polling for local development
      await bot.launch();
      logger.info('Bot running in polling mode (development)');
    }

    // Cron: daily reminder at 21:00 WIB (UTC+7 = 14:00 UTC)
    cron.schedule('0 14 * * *', async () => {
      logger.info('Running daily reminder cron job');
      await sendDailyReminders(bot);
    });

    logger.info('DompetKu Bot started successfully');
  } catch (err) {
    logger.error('Failed to start bot:', err);
    process.exit(1);
  }
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

start();
