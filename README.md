# DompetKu Bot 💰

Telegram bot untuk pencatatan keuangan pribadi. Catat pemasukan & pengeluaran langsung dari chat, lihat laporan harian/bulanan.

## Stack
- **Bot Framework**: Telegraf.js (Node.js)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Render / Railway
- **Scheduler**: node-cron

## Struktur Proyek

```
src/
├── index.js          ← Entry point
├── webhook.js        ← Setup webhook (production)
├── scheduler.js      ← Cron jobs (reminder harian)
├── commands/
│   ├── index.js      ← Register semua command
│   ├── start.js      ← /start
│   ├── expense.js    ← /k, /keluar
│   ├── income.js     ← /m, /masuk
│   ├── today.js      ← /hariini
│   ├── month.js      ← /bulanini
│   ├── delete.js     ← /hapus
│   └── reminder.js   ← /reminder_on, /reminder_off
├── db/
│   ├── supabase.js   ← Supabase client
│   ├── users.js      ← Query users
│   └── transactions.js ← Query transactions
└── utils/
    ├── format.js     ← Format Rupiah, parse args, build summary
    ├── logger.js     ← Structured logging
    └── rateLimiter.js ← Rate limiting (10 req/s per user)

supabase/
└── schema.sql        ← DDL untuk Supabase
```

## Setup Lokal

```bash
# 1. Clone & install
npm install

# 2. Copy env
copy .env.example .env
# Isi BOT_TOKEN, SUPABASE_URL, SUPABASE_ANON_KEY

# 3. Jalankan schema di Supabase SQL Editor
#    (buka file supabase/schema.sql, paste & run)

# 4. Start development
npm run dev
```

## Deploy ke Render

1. Push ke GitHub
2. Buat **New Web Service** di Render.com
   - Build Command: `npm install`
   - Start Command: `node src/index.js`
3. Set environment variables:
   - `BOT_TOKEN`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `WEBHOOK_SECRET`
   - `NODE_ENV=production`
4. Webhook akan diset otomatis saat bot start (menggunakan `RENDER_EXTERNAL_URL`)

## Perintah Bot

| Command | Fungsi | Contoh |
|---------|--------|--------|
| `/start` | Inisialisasi & panduan | `/start` |
| `/k` atau `/keluar` | Catat pengeluaran | `/k 15000 nasi goreng #makanan` |
| `/m` atau `/masuk` | Catat pemasukan | `/m 5000000 gaji bulanan` |
| `/hariini` | Ringkasan hari ini | `/hariini` |
| `/bulanini` | Ringkasan bulan ini | `/bulanini` |
| `/hapus` | Hapus transaksi | `/hapus` lalu `/hapus 3` |
| `/reminder_on` | Aktifkan reminder 21.00 WIB | `/reminder_on` |
| `/reminder_off` | Matikan reminder | `/reminder_off` |

## Environment Variables

| Variable | Keterangan |
|----------|------------|
| `BOT_TOKEN` | Token dari @BotFather |
| `SUPABASE_URL` | URL project Supabase |
| `SUPABASE_ANON_KEY` | Anon key Supabase |
| `WEBHOOK_SECRET` | Secret token untuk validasi webhook |
| `NODE_ENV` | `development` (polling) atau `production` (webhook) |
| `PORT` | Port server (default 3000) |
