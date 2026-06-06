const { findUserByTelegramId, setReminder } = require('../db/users');
const logger = require('../utils/logger');

async function on(ctx) {
  try {
    const user = await findUserByTelegramId(ctx.from.id);
    if (!user) return ctx.reply('Silakan kirim /start terlebih dahulu.');

    await setReminder(ctx.from.id, true);
    await ctx.reply(
      '🔔 Reminder harian diaktifkan!\nKamu akan mendapat ringkasan keuangan setiap malam pukul 21.00 WIB.'
    );
  } catch (err) {
    logger.error('reminder_on error:', err);
    await ctx.reply('❌ Gagal mengaktifkan reminder.');
  }
}

async function off(ctx) {
  try {
    const user = await findUserByTelegramId(ctx.from.id);
    if (!user) return ctx.reply('Silakan kirim /start terlebih dahulu.');

    await setReminder(ctx.from.id, false);
    await ctx.reply('🔕 Reminder harian dinonaktifkan.');
  } catch (err) {
    logger.error('reminder_off error:', err);
    await ctx.reply('❌ Gagal menonaktifkan reminder.');
  }
}

module.exports = { on, off };
