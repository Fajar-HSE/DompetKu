const { findUserByTelegramId } = require('../db/users');
const { getMonthTransactions } = require('../db/transactions');
const { buildSummaryText } = require('../utils/format');
const logger = require('../utils/logger');

module.exports = async function monthCommand(ctx) {
  try {
    const user = await findUserByTelegramId(ctx.from.id);
    if (!user) return ctx.reply('Silakan kirim /start terlebih dahulu.');

    const now = new Date();
    const monthName = now.toLocaleString('id-ID', { month: 'long', year: 'numeric' });

    const transactions = await getMonthTransactions(user.id);
    const summary = buildSummaryText(transactions, monthName);

    await ctx.replyWithMarkdown(summary);
  } catch (err) {
    logger.error('monthCommand error:', err);
    await ctx.reply('❌ Gagal mengambil data. Coba lagi.');
  }
};
