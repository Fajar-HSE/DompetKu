/**
 * Validasi environment variables wajib sebelum aplikasi start.
 * Mencegah silent failure akibat config yang tidak lengkap.
 */
function validateEnv() {
  const required = [
    'BOT_TOKEN',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'WEBHOOK_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `[FATAL] Environment variables tidak lengkap: ${missing.join(', ')}\n` +
      `Salin .env.example ke .env dan isi semua nilai yang diperlukan.`
    );
    process.exit(1);
  }

  // Validasi format BOT_TOKEN: harus berupa angka:string
  if (!/^\d+:[A-Za-z0-9_-]{35,}$/.test(process.env.BOT_TOKEN)) {
    console.error('[FATAL] BOT_TOKEN format tidak valid. Dapatkan token dari @BotFather.');
    process.exit(1);
  }

  // Validasi format SUPABASE_URL
  if (!process.env.SUPABASE_URL.startsWith('https://')) {
    console.error('[FATAL] SUPABASE_URL harus diawali dengan https://');
    process.exit(1);
  }
}

module.exports = { validateEnv };
