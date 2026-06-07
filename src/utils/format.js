/**
 * Format integer rupiah → "Rp15.000"
 */
function formatRupiah(amount) {
  return 'Rp' + Number(amount).toLocaleString('id-ID');
}

/**
 * Parse command arguments untuk /k dan /m:
 *   "/k 15000 nasi goreng #makanan"
 * Returns { amount, note, category } atau null jika tidak valid.
 */
function parseTransactionArgs(text) {
  // Hapus command prefix (/k, /m, /keluar, /masuk) lalu trim
  const body = text.replace(/^\/\S+\s*/, '').trim();

  if (!body) return null;

  // Ekstrak kategori dari #tag
  const categoryMatch = body.match(/#([A-Za-z0-9_\u00C0-\u024F]+)/);
  const rawCategory = categoryMatch ? categoryMatch[1] : 'Lainnya';

  // Sanitasi kategori: maks 50 karakter, hanya karakter aman
  const category = rawCategory.slice(0, 50);
  const withoutCategory = body.replace(/#\S+/, '').trim();

  // Token pertama harus nominal
  const parts = withoutCategory.split(/\s+/);
  const rawAmount = parts[0];

  if (!rawAmount) return null;

  // Izinkan format: 15000, 15.000, 15,000
  const amount = parseInt(rawAmount.replace(/[.,]/g, ''), 10);

  // Validasi: harus angka positif, maksimal 1 triliun
  if (isNaN(amount) || amount <= 0 || amount > 1_000_000_000_000) return null;

  // Sanitasi note: maks 200 karakter
  const rawNote = parts.slice(1).join(' ').trim();
  const note = rawNote ? rawNote.slice(0, 200) : null;

  return { amount, note, category };
}

/**
 * Buat teks ringkasan dari daftar transaksi.
 */
function buildSummaryText(transactions, label) {
  // Import di dalam fungsi dihindari — gunakan parameter langsung
  let totalIncome = 0;
  let totalExpense = 0;
  const byCategory = {};

  for (const t of transactions) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else {
      totalExpense += t.amount;
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
  }

  const balance = totalIncome - totalExpense;

  let text = `📊 *Ringkasan ${label}*\n\n`;
  text += `💰 Pemasukan : ${formatRupiah(totalIncome)}\n`;
  text += `💸 Pengeluaran: ${formatRupiah(totalExpense)}\n`;
  text += `📈 Saldo      : ${formatRupiah(balance)}\n`;

  if (Object.keys(byCategory).length > 0) {
    text += `\n🗂 *Pengeluaran per Kategori:*\n`;
    for (const [cat, total] of Object.entries(byCategory)) {
      text += `  • ${cat}: ${formatRupiah(total)}\n`;
    }
  }

  if (transactions.length === 0) {
    text += '\n_Belum ada transaksi._';
  }

  return text;
}

module.exports = { formatRupiah, parseTransactionArgs, buildSummaryText };
