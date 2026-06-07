const { rateLimitMiddleware } = require('../utils/rateLimiter');
const logger = require('../utils/logger');

const startCommand = require('./start');
const expenseCommand = require('./expense');
const incomeCommand = require('./income');
const todayCommand = require('./today');
const monthCommand = require('./month');
const deleteCommand = require('./delete');
const reminderCommand = require('./reminder');
const { handlePhoto, handleReceiptCallback } = require('./receipt');

/**
 * Register all commands and middleware on the bot instance.
 */
function registerCommands(bot) {
  // Global rate limiter
  bot.use(rateLimitMiddleware());

  // Log every incoming message
  bot.use(async (ctx, next) => {
    if (ctx.from) {
      logger.command(ctx.from.id, ctx.message?.text || ctx.updateType);
    }
    return next();
  });

  // Commands
  bot.command('start', startCommand);
  bot.command(['k', 'keluar'], expenseCommand);
  bot.command(['m', 'masuk'], incomeCommand);
  bot.command('hariini', todayCommand);
  bot.command('bulanini', monthCommand);
  bot.command('hapus', deleteCommand);
  bot.command('reminder_on', reminderCommand.on);
  bot.command('reminder_off', reminderCommand.off);

  // Handler foto struk
  bot.on('photo', handlePhoto);
  bot.on('callback_query', handleReceiptCallback);

  // Handle unknown text
  bot.on('text', async (ctx) => {
    await ctx.reply(
      '❓ Perintah tidak dikenali.\n\nGunakan /start untuk melihat panduan.'
    );
  });

  // Global error handler
  bot.catch((err, ctx) => {
    logger.error(`Error for ${ctx.updateType}:`, err);
    ctx.reply('❌ Terjadi kesalahan. Silakan coba lagi.').catch(() => {});
  });
}

module.exports = registerCommands;
