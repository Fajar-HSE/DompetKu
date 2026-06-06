/**
 * Simple in-memory rate limiter: max 10 requests per 1 second per user.
 */
const buckets = new Map(); // telegramId → { count, resetAt }

const MAX_REQUESTS = 10;
const WINDOW_MS = 1000; // 1 second

function isRateLimited(telegramId) {
  const now = Date.now();
  const bucket = buckets.get(telegramId);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(telegramId, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  if (bucket.count >= MAX_REQUESTS) {
    return true;
  }

  bucket.count += 1;
  return false;
}

// Middleware factory for Telegraf
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
