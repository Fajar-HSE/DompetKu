const { findUserByTelegramId } = require('../db/users');
const { insertTransaction, getTodayTransactions, summarise } = require('../db/transactions');
const { extractTextFromImage, extractTotalFromText } = require('../utils/ocr');
const { formatRupiah } = require('../utils/format');
const { PendingStore } = require('../utils/pendingStore');
const logger = require('../utils/logger');

// TTL 5 menit: konfirmasi struk expired otomatis, mencegah memory leak
const pendingReceipts = new PendingStore();

/**
 * Handler saat user kirim foto struk.
 */
async function handlePhoto(ctx) {
  const from = ctx.from;

  try {
    const user = await findUserByTelegramId(from.id);
    if (!user) {
      return ctx.reply('Silakan kirim /start terlebih dahulu.');
    }

    await ctx.reply('🔍 Memproses struk... Mohon tunggu sebentar.');

    // Ambil foto resolusi tertinggi
    const photos = ctx.message.photo;
    const bestPhoto = photos[photos.length - 1];

    // Batasi ukuran file: Telegram max ~20MB, tapi kita batasi 5MB
    if (bestPhoto.file_size && bestPhoto.file_size > 5 * 1024 * 1024) {
      return ctx.reply('⚠️ Foto terlalu besar (maks 5MB). Kompres foto terlebih dahulu.');
    }

    // Dapatkan URL file dari Telegram
    const fileLink = await ctx.telegram.getFileLink(bestPhoto.file_id);
    const fileUrl = fileLink.href;

    // Ekstrak teks via OCR
    const text = await extractTextFromImage(fileUrl);

    if (!text || text.trim().length === 0) {
      return ctx.reply(
        '⚠️ Tidak bisa membaca teks dari foto ini.\n\n' +
        'Tips:\n• Pastikan foto jelas dan tidak blur\n• Pencahayaan cukup\n• Teks struk terlihat penuh'
      );
    }

    // Ekstrak total dari teks
    const amount = extractTotalFromText(text);

    if (!amount) {
      return ctx.replyWithMarkdown(
        '⚠️ Tidak bisa menemukan total di struk ini.\n\n' +
        'Kamu bisa input manual:\n`/k <nominal> <keterangan> #kategori`'
      );
    }

    // Simpan pending confirmation dengan TTL
    pendingReceipts.set(from.id, { amount, note: 'struk belanja' });

    // Tanya konfirmasi ke user dengan inline keyboard
    await ctx.replyWithMarkdown(
      `🧾 *Struk terdeteksi!*\n\n` +
      `💸 Total: *${formatRupiah(amount)}*\n\n` +
      `Simpan sebagai pengeluaran? _(berlaku 5 menit)_`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Ya, simpan', callback_data: 'receipt_confirm' },
              { text: '❌ Batal', callback_data: 'receipt_cancel' },
            ],
            [
              { text: '✏️ Edit nominal', callback_data: 'receipt_edit' },
            ],
          ],
        },
      }
    );
  } catch (err) {
    logger.error('handlePhoto error:', err);
    await ctx.reply(
      '❌ Gagal memproses foto. Coba lagi atau input manual:\n`/k <nominal> <keterangan>`'
    );
  }
}

/**
 * Handler untuk callback button konfirmasi struk.
 * Hanya proses action yang dikenal untuk mencegah unexpected behavior.
 */
async function handleReceiptCallback(ctx) {
  const from = ctx.from;
  const action = ctx.callbackQuery?.data;

  // Hanya proses callback yang relevan dengan receipt
  if (!action || !['receipt_confirm', 'receipt_cancel', 'receipt_edit'].includes(action)) {
    return ctx.answerCbQuery();
  }

  await ctx.answerCbQuery();

  try {
    const user = await findUserByTelegramId(from.id);
    if (!user) return ctx.reply('Silakan kirim /start terlebih dahulu.');

    const pending = pendingReceipts.get(from.id);

    if (action === 'receipt_confirm') {
      if (!pending) {
        return ctx.editMessageText('⚠️ Konfirmasi expired. Kirim ulang foto struk.');
      }

      await insertTransaction({
        userId: user.id,
        type: 'expense',
        amount: pending.amount,
        category: 'Struk',
        note: pending.note,
      });

      pendingReceipts.delete(from.id);

      const todayTx = await getTodayTransactions(user.id);
      const { balance } = summarise(todayTx);

      await ctx.editMessageText(
        `✅ ${formatRupiah(pending.amount)} - struk belanja (Struk)\n` +
        `📊 Sisa saldo hari ini: ${formatRupiah(balance)}`
      );

    } else if (action === 'receipt_cancel') {
      pendingReceipts.delete(from.id);
      await ctx.editMessageText('❌ Dibatalkan. Struk tidak disimpan.');

    } else if (action === 'receipt_edit') {
      if (!pending) {
        return ctx.editMessageText('⚠️ Konfirmasi expired. Kirim ulang foto struk.');
      }
      const savedAmount = pending.amount;
      pendingReceipts.delete(from.id);
      await ctx.editMessageText(
        `✏️ Input manual nominal yang benar:\n\n` +
        `/k ${savedAmount} struk belanja #belanja`
      );
    }
  } catch (err) {
    logger.error('handleReceiptCallback error:', err);
    await ctx.reply('❌ Terjadi kesalahan. Coba lagi.').catch(() => {});
  }
}

module.exports = { handlePhoto, handleReceiptCallback };
