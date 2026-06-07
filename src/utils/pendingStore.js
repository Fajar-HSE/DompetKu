/**
 * TTL-aware in-memory store untuk state sementara per user.
 * Mencegah memory leak dengan menghapus entry yang sudah expired.
 *
 * Digunakan oleh: delete.js (pendingDeletes), receipt.js (pendingReceipts)
 */
const TTL_MS = 5 * 60 * 1000; // 5 menit
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // cleanup tiap 10 menit

class PendingStore {
  constructor(ttlMs = TTL_MS) {
    this._store = new Map(); // key → { value, expiresAt }
    this._ttl = ttlMs;

    // Periodic cleanup untuk mencegah memory leak
    this._cleanupTimer = setInterval(() => this._cleanup(), CLEANUP_INTERVAL_MS);

    // Jangan block proses dari exit
    if (this._cleanupTimer.unref) this._cleanupTimer.unref();
  }

  set(key, value) {
    this._store.set(key, {
      value,
      expiresAt: Date.now() + this._ttl,
    });
  }

  get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  delete(key) {
    this._store.delete(key);
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, entry] of this._store.entries()) {
      if (now > entry.expiresAt) {
        this._store.delete(key);
      }
    }
  }
}

module.exports = { PendingStore };
