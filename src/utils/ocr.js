const axios = require('axios');
const FormData = require('form-data');
const logger = require('./logger');

/**
 * Download foto dari Telegram dan kirim ke OCR.space untuk ekstrak teks.
 * @param {string} fileUrl - URL file dari Telegram
 * @returns {string} teks hasil OCR
 */
async function extractTextFromImage(fileUrl) {
  try {
    // Download foto dari Telegram sebagai buffer
    const imageResponse = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      timeout: 15000,
    });

    // Kirim ke OCR.space
    const form = new FormData();
    form.append('file', Buffer.from(imageResponse.data), {
      filename: 'struk.jpg',
      contentType: 'image/jpeg',
    });
    form.append('language', 'ind');   // Bahasa Indonesia
    form.append('isOverlayRequired', 'false');
    form.append('detectOrientation', 'true');
    form.append('scale', 'true');
    form.append('OCREngine', '2');    // Engine 2 lebih akurat untuk struk

    const ocrResponse = await axios.post(
      'https://api.ocr.space/parse/image',
      form,
      {
        headers: {
          ...form.getHeaders(),
          apikey: process.env.OCR_API_KEY,
        },
        timeout: 30000,
      }
    );

    const result = ocrResponse.data;

    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage || 'OCR processing failed');
    }

    const text = result.ParsedResults?.[0]?.ParsedText || '';
    return text;
  } catch (err) {
    logger.error('OCR error:', err.message);
    throw err;
  }
}

/**
 * Ekstrak total belanja dari teks struk.
 * Mencari pola: TOTAL, GRAND TOTAL, JUMLAH, dll.
 * @param {string} text - teks hasil OCR
 * @returns {number|null} nominal dalam rupiah, atau null jika tidak ditemukan
 */
function extractTotalFromText(text) {
  if (!text) return null;

  const lines = text.split('\n');

  // Kata kunci total yang umum di struk Indonesia
  const totalKeywords = [
    /total\s*:?\s*([\d.,]+)/i,
    /grand\s*total\s*:?\s*([\d.,]+)/i,
    /jumlah\s*:?\s*([\d.,]+)/i,
    /total\s*bayar\s*:?\s*([\d.,]+)/i,
    /tagihan\s*:?\s*([\d.,]+)/i,
    /subtotal\s*:?\s*([\d.,]+)/i,
    /amount\s*:?\s*([\d.,]+)/i,
    /rp\.?\s*([\d.,]+)/i,
  ];

  // Cari di tiap baris
  for (const line of lines) {
    for (const pattern of totalKeywords) {
      const match = line.match(pattern);
      if (match) {
        // Bersihkan angka: hapus titik/koma pemisah ribuan
        const raw = match[1].replace(/\./g, '').replace(/,/g, '');
        const amount = parseInt(raw, 10);
        if (!isNaN(amount) && amount > 0 && amount < 1_000_000_000) {
          return amount;
        }
      }
    }
  }

  // Fallback: ambil angka terbesar di teks (sering kali adalah total)
  const allNumbers = [];
  const numberPattern = /(?:rp\.?\s*)?([\d]{4,}(?:[.,]\d{3})*)/gi;
  let m;
  while ((m = numberPattern.exec(text)) !== null) {
    const clean = m[1].replace(/\./g, '').replace(/,/g, '');
    const n = parseInt(clean, 10);
    if (!isNaN(n) && n > 0 && n < 1_000_000_000) {
      allNumbers.push(n);
    }
  }

  if (allNumbers.length > 0) {
    return Math.max(...allNumbers);
  }

  return null;
}

module.exports = { extractTextFromImage, extractTotalFromText };
