const { findUserByTelegramId } = require('../db/users');
const { getRecentTransactions, deleteTransaction } = require('../db/transactions');
const { formatRupiah } = require('../utils/format');
const logger = require('../utils/logger');

// In-memory store for pending delete confirmations: telegramId → transactionId
const pendingDeletes = new Map();

module.exports = async function deleteCommand(ctx) {
  const from = ctx.from;

  try {
    const user = await findUserByTelegramId(from.id);
    if (!user) return ctx.reply('Silakan kirim /start terlebih dahulu.');

    const args = ctx.message.text.split(/\s+/).slice(1);

    // Step 1: "/hapus" with no argument → show list
    if (args.length === 0) {
      const recent = await getRecentTransactions(user.id, 10);

      if (recent.length === 0) {
        return ctx.reply('Belum ada transaksi yang bisa dihapus.');
      }

      let list = '🗑 *10 Transaksi Terakhir:*\n\n';
      recent.forEach((t, i) => {
        const sign = t.type === 'income' ? '+' : '-';
        list += `${i + 1}. ${sign}${formatRupiah(t.amount)} ${t.note || ''} _(${t.category})_ — ${t.date}\n`;
      });
      list += '\nBalas dengan `/hapus <nomor>` untuk menghapus.';

      // Store list for this user so we can map number → id
      pendingDeletes.set(from.id, recent.map((t) => t.id));

      return ctx.replyWithMarkdown(list);
    }

    // Step 2: "/hapus <number>"
    const index = parseInt(args[0], 10) - 1; // convert to 0-based
    const ids = pendingDeletes.get(from.id);

    if (!ids || isNaN(index) || index < 0 || index >= ids.length) {
      return ctx.reply(
        '⚠️ Nomor tidak valid. Kirim /hapus (tanpa angka) untuk melihat daftar dulu.'
      );
    }

    const transactionId = ids[index];
    await deleteTransaction(transactionId, user.id);
    pendingDeletes.delete(from.id);

    await ctx.reply(`✅ Transaksi nomor ${index + 1} berhasil dihapus.`);
  } catch (err) {
    logger.error('deleteCommand error:', err);
    await ctx.reply('❌ Gagal menghapus transaksi. Coba lagi.');
  }
};
