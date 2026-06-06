/**
 * Format integer rupiah → "Rp15.000"
 */
function formatRupiah(amount) {
  return 'Rp' + Number(amount).toLocaleString('id-ID');
}

/**
 * Parse command arguments for /k and /m:
 *   "/k 15000 nasi goreng #makanan"
 * Returns { amount, note, category } or null if invalid.
 */
function parseTransactionArgs(text) {
  // Remove command prefix (/k, /m, /keluar, /masuk) then trim
  const body = text.replace(/^\/\S+\s*/, '').trim();

  if (!body) return null;

  // Extract category from #tag
  const categoryMatch = body.match(/#(\S+)/);
  const category = categoryMatch ? categoryMatch[1] : 'Lainnya';
  const withoutCategory = body.replace(/#\S+/, '').trim();

  // First token must be the amount
  const parts = withoutCategory.split(/\s+/);
  const rawAmount = parts[0];

  // Allow amounts like 15000, 15.000, 15,000
  const amount = parseInt(rawAmount.replace(/[.,]/g, ''), 10);
  if (isNaN(amount) || amount <= 0) return null;

  const note = parts.slice(1).join(' ').trim() || null;

  return { amount, note, category };
}

/**
 * Build a summary report string from a list of transactions.
 */
function buildSummaryText(transactions, label) {
  const { summarise } = require('../db/transactions');
  const { totalIncome, totalExpense, balance } = summarise(transactions);

  // Group expenses by category
  const byCategory = {};
  for (const t of transactions) {
    if (t.type === 'expense') {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    }
  }

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
