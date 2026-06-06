const { findUserByTelegramId } = require('../db/users');
const { getTodayTransactions } = require('../db/transactions');
const { buildSummaryText } = require('../utils/format');
const logger = require('../utils/logger');

module.exports = async function todayCommand(ctx) {
  try {
    const user = await findUserByTelegramId(ctx.from.id);
    if (!user) return ctx.reply('Silakan kirim /start terlebih dahulu.');

    const transactions = await getTodayTransactions(user.id);
    const summary = buildSummaryText(transactions, 'Hari Ini');

    await ctx.replyWithMarkdown(summary);
  } catch (err) {
    logger.error('todayCommand error:', err);
    await ctx.reply('❌ Gagal mengambil data. Coba lagi.');
  }
};
