/**
 * In-memory rate limiter: maks 10 request per 1 detik per user.
 * Bucket lama dibersihkan secara periodik untuk mencegah memory leak.
 */
const buckets = new Map(); // telegramId → { count, resetAt }

const MAX_REQUESTS = 10;
const WINDOW_MS = 1000;           // 1 detik
const CLEANUP_INTERVAL_MS = 60_000; // cleanup tiap 1 menit

// Hapus bucket yang sudah expired
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}, CLEANUP_INTERVAL_MS);

// Jangan block proses dari exit
if (cleanupTimer.unref) cleanupTimer.unref();

function isRateLimited(telegramId) {
  const now = Date.now();
  const bucket = buckets.get(telegramId);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(telegramId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (bucket.count >= MAX_REQUESTS) return true;

  bucket.count += 1;
  return false;
}

// Middleware factory untuk Telegraf
function rateLimitMiddleware() {
  return async (ctx, next) => {
    const telegramId = ctx.from?.id;
    if (telegramId && isRateLimited(telegramId)) {
      return ctx.reply('⚠️ Terlalu banyak permintaan. Coba lagi sebentar.');
    }
    return next();
  };
}

module.exports = { rateLimitMiddleware };
