-- DompetKu Bot - Database Schema
-- Run this in Supabase SQL Editor

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id        BIGINT UNIQUE NOT NULL,
  chat_id            BIGINT NOT NULL,
  username           TEXT,
  full_name          TEXT,
  is_reminder_active BOOLEAN DEFAULT false,
  timezone           TEXT DEFAULT 'Asia/Jakarta',
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TABLE: transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount     BIGINT NOT NULL,       -- in Rupiah, no decimals
  category   TEXT DEFAULT 'Lainnya',
  note       TEXT,
  date       DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_date
  ON transactions(user_id, date);

CREATE INDEX IF NOT EXISTS idx_transactions_user_month
  ON transactions(user_id, date);

-- ============================================================
-- Row Level Security (optional but recommended for Supabase)
-- Enable if you want per-user data isolation via JWT
-- ============================================================
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
