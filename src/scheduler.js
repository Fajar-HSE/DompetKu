const { getUsersWithReminder } = require('./db/users');
const { getTodayTransactions, summarise } = require('./db/transactions');
const { formatRupiah } = require('./utils/format');
const logger = require('./utils/logger');

/**
 * Send a daily summary reminder to all users with is_reminder_active = true.
 * Called by the 21:00 WIB cron job.
 */
async function sendDailyReminders(bot) {
  try {
    const users = await getUsersWithReminder();
    logger.info(`Sending reminders to ${users.length} user(s)`);

    for (const user of users) {
      try {
        const transactions = await getTodayTransactions(user.id);
        const { totalIncome, totalExpense, balance } = summarise(transactions);

        const message =
          `🌙 *Reminder Keuangan Harian*\n\n` +
          `💰 Pemasukan  : ${formatRupiah(totalIncome)}\n` +
          `💸 Pengeluaran: ${formatRupiah(totalExpense)}\n` +
          `📈 Saldo hari ini: *${formatRupiah(balance)}*\n\n` +
          (transactions.length === 0
            ? '_Belum ada transaksi hari ini. Jangan lupa dicatat ya!_'
            : `_Total ${transactions.length} transaksi hari ini._`);

        await bot.telegram.sendMessage(user.chat_id, message, {
          parse_mode: 'Markdown',
        });
      } catch (userErr) {
        // Don't stop reminders for other users if one fails
        logger.error(`Reminder failed for user ${user.telegram_id}:`, userErr);
      }
    }
  } catch (err) {
    logger.error('sendDailyReminders error:', err);
  }
}

module.exports = { sendDailyReminders };
