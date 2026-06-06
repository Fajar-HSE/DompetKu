const supabase = require('./supabase');

/**
 * Find user by telegram_id. Returns null if not found.
 */
async function findUserByTelegramId(telegramId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('telegram_id', telegramId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data || null;
}

/**
 * Upsert user on /start. Returns the user record.
 */
async function upsertUser({ telegramId, chatId, username, fullName }) {
  const { data, error } = await supabase
    .from('users')
    .upsert(
      {
        telegram_id: telegramId,
        chat_id: chatId,
        username: username || null,
        full_name: fullName || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'telegram_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle reminder for a user.
 */
async function setReminder(telegramId, isActive) {
  const { error } = await supabase
    .from('users')
    .update({ is_reminder_active: isActive, updated_at: new Date().toISOString() })
    .eq('telegram_id', telegramId);

  if (error) throw error;
}

/**
 * Get all users with active reminders.
 */
async function getUsersWithReminder() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_reminder_active', true);

  if (error) throw error;
  return data || [];
}

module.exports = { findUserByTelegramId, upsertUser, setReminder, getUsersWithReminder };
