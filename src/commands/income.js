const { findUserByTelegramId } = require('../db/users');
const { insertTransaction } = require('../db/transactions');
const { parseTransactionArgs, formatRupiah } = require('../utils/format');
const logger = require('../utils/logger');

module.exports = async function incomeCommand(ctx) {
  const from = ctx.from;

  try {
    const parsed = parseTransactionArgs(ctx.message.text);

    if (!parsed) {
      return ctx.reply(
        '⚠️ Format salah.\n\nContoh: /m 5000000 gaji bulanan\n\n' +
          '• Angka pertama = nominal (wajib)\n' +
          '• Teks berikutnya = keterangan (opsional)'
      );
    }

    const user = await findUserByTelegramId(from.id);
    if (!user) {
      return ctx.reply('Silakan kirim /start terlebih dahulu.');
    }

    await insertTransaction({
      userId: user.id,
      type: 'income',
      amount: parsed.amount,
      category: parsed.category,
      note: parsed.note,
    });

    const noteText = parsed.note ? ` - ${parsed.note}` : '';
    await ctx.replyWithMarkdown(
      `✅ *+${formatRupiah(parsed.amount)}*${noteText} _(${parsed.category})_`
    );
  } catch (err) {
    logger.error('incomeCommand error:', err);
    await ctx.reply('❌ Gagal menyimpan pemasukan. Coba lagi.');
  }
};
