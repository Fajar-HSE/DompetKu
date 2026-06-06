/**
 * Simple structured logger.
 * In production swap console with Logtail/BetterStack SDK if needed.
 */
const logger = {
  info(message, ...args) {
    console.log(`[${new Date().toISOString()}] INFO:`, message, ...args);
  },
  warn(message, ...args) {
    console.warn(`[${new Date().toISOString()}] WARN:`, message, ...args);
  },
  error(message, ...args) {
    console.error(`[${new Date().toISOString()}] ERROR:`, message, ...args);
  },
  command(telegramId, command) {
    console.log(
      `[${new Date().toISOString()}] CMD: user=${telegramId} command=${command}`
    );
  },
};

module.exports = logger;
