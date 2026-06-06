const { findUserByTelegramId } = require('../db/users');
const { insertTransaction, getTodayTransactions, summarise } = require('../db/transactions');
const { parseTransactionArgs, formatRupiah } = require('../utils/format');
const logger = require('../utils/logger');

module.exports = async function expenseCommand(ctx) {
  const from = ctx.from;

  try {
    const parsed = parseTransactionArgs(ctx.message.text);

    if (!parsed) {
      return ctx.reply(
        '⚠️ Format salah.\n\nContoh: /k 15000 nasi goreng #makanan\n\n' +
          '• Angka pertama = nominal (wajib)\n' +
          '• Teks berikutnya = keterangan\n' +
          '• #tag = kategori (opsional, default: Lainnya)'
      );
    }

    const user = await findUserByTelegramId(from.id);
    if (!user) {
      return ctx.reply('Silakan kirim /start terlebih dahulu.');
    }

    await insertTransaction({
      userId: user.id,
      type: 'expense',
      amount: parsed.amount,
      category: parsed.category,
      note: parsed.note,
    });

    // Recalculate today's balance for feedback
    const todayTx = await getTodayTransactions(user.id);
    const { balance } = summarise(todayTx);

    const noteText = parsed.note ? ` - ${parsed.note}` : '';
    await ctx.replyWithMarkdown(
      `✅ *${formatRupiah(parsed.amount)}*${noteText} _(${parsed.category})_\n` +
        `📊 Sisa saldo hari ini: *${formatRupiah(balance)}*`
    );
  } catch (err) {
    logger.error('expenseCommand error:', err);
    await ctx.reply('❌ Gagal menyimpan pengeluaran. Coba lagi.');
  }
};
