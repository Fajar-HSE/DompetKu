const { upsertUser } = require('../db/users');
const logger = require('../utils/logger');

module.exports = async function startCommand(ctx) {
  const from = ctx.from;

  try {
    await upsertUser({
      telegramId: from.id,
      chatId: ctx.chat.id,
      username: from.username,
      fullName: [from.first_name, from.last_name].filter(Boolean).join(' '),
    });

    const name = from.first_name || 'Kawan';

    await ctx.replyWithMarkdown(
      `👋 Halo, *${name}*! Selamat datang di *DompetKu Bot* 💰\n\n` +
        `Aku akan membantu kamu mencatat keuangan langsung dari Telegram.\n\n` +
        `*📋 Perintah yang tersedia:*\n` +
        `• \`/k 15000 makan siang #makanan\` – catat pengeluaran\n` +
        `• \`/m 5000000 gaji bulanan\` – catat pemasukan\n` +
        `• \`/hariini\` – ringkasan hari ini\n` +
        `• \`/bulanini\` – ringkasan bulan ini\n` +
        `• \`/hapus\` – hapus transaksi\n` +
        `• \`/reminder_on\` / \`/reminder_off\` – aktifkan/matikan reminder harian\n\n` +
        `_Tip: kategori ditulis dengan #tag di akhir, misal #makanan, #transport_`
    );
  } catch (err) {
    logger.error('startCommand error:', err);
    await ctx.reply('❌ Gagal inisialisasi. Coba lagi dengan /start');
  }
};
