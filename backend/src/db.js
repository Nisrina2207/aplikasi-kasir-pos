// require('dotenv').config(); // Baris ini TIDAK perlu di sini jika sudah ada di server.js

const { Pool } = require('pg');

// Log untuk debugging: Menampilkan nilai DATABASE_URL yang dibaca
console.log("Nilai DATABASE_URL yang dibaca oleh db.js:", process.env.DATABASE_URL);

// Konfigurasi Pool koneksi PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Kunci untuk mengatasi "self-signed certificate in certificate chain"
    // Ini memberitahu Node.js untuk tidak menolak koneksi karena sertifikat yang tidak dikenal
    // Sangat direkomendasikan HANYA UNTUK PENGEMBANGAN!
    rejectUnauthorized: false // <--- PASTIKAN BARIS INI ADA DAN TIDAK ADA TANDA "//" DI DEPANNYA
  }
});

// Tes koneksi database saat aplikasi dimulai
pool.connect()
  .then(client => {
    console.log("✅ Berhasil terhubung ke PostgreSQL di Railway!");
    client.release(); // Melepaskan client kembali ke pool setelah tes
  })
  .catch(err => {
    console.error("❌ Gagal terhubung ke PostgreSQL di Railway:", err.message);
    // Log objek error penuh untuk debugging lebih lanjut
    console.error("Detail error:", err); // <--- Baris ini akan memberikan info lebih jika masih gagal
    process.exit(1); // Menghentikan aplikasi jika tidak bisa terhubung ke DB
  });

// Mengekspor objek pool agar bisa digunakan di file lain
module.exports = pool;