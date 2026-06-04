import "dotenv/config";
import pg from "pg";
const { Pool } = pg;

// Debugging: Kita pastikan apakah Node.js benar-benar membaca file .env
console.log(
  "Status DATABASE_URL:",
  process.env.DATABASE_URL ? "Berhasil Terbaca" : "KOSONG/UNDEFINED",
);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Konfigurasi wajib untuk terhubung ke Supabase
  },
});
