const supabase = require('./supabase');

/**
 * Insert a new transaction.
 */
async function insertTransaction({ userId, type, amount, category, note, date }) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type,         // 'income' | 'expense'
      amount,       // integer rupiah
      category: category || 'Lainnya',
      note: note || null,
      date: date || new Date().toISOString().slice(0, 10),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get today's transactions for a user.
 */
async function getTodayTransactions(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get this month's transactions for a user.
 */
async function getMonthTransactions(userId) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .gte('date', firstDay)
    .lte('date', lastDay)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get the N most recent transactions for a user (for /hapus listing).
 */
async function getRecentTransactions(userId, limit = 10) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Delete a transaction by ID, only if it belongs to the user.
 */
async function deleteTransaction(transactionId, userId) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Summarise transactions: { totalIncome, totalExpense, balance }
 */
function summarise(transactions) {
  let totalIncome = 0;
  let totalExpense = 0;

  for (const t of transactions) {
    if (t.type === 'income') totalIncome += t.amount;
    else totalExpense += t.amount;
  }

  return { totalIncome, totalExpense, balance: totalIncome - totalExpense };
}

module.exports = {
  insertTransaction,
  getTodayTransactions,
  getMonthTransactions,
  getRecentTransactions,
  deleteTransaction,
  summarise,
};
