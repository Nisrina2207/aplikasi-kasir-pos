// Memuat variabel lingkungan dari file .env
// Pastikan baris ini ada di paling atas file utama atau file konfigurasi Anda
// Namun, jika Anda sudah memanggil dotenv.config() di server.js,
// Anda tidak perlu memanggilnya lagi di sini.
// Untuk keamanan, lebih baik panggil dotenv.config() hanya sekali di entry point aplikasi Anda (misal: server.js).
// Jika db.js adalah modul yang di-require oleh server.js, maka env sudah tersedia.
// require('dotenv').config(); 

const { Pool } = require('pg');

// Log untuk debugging: Menampilkan nilai DATABASE_URL yang dibaca
// Ini sangat penting untuk memastikan aplikasi Anda membaca variabel lingkungan dengan benar.
console.log("Nilai DATABASE_URL yang dibaca oleh db.js:", process.env.DATABASE_URL);

// Konfigurasi Pool koneksi PostgreSQL
// pool akan mengelola beberapa koneksi ke database secara efisien.

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Kunci untuk mengatasi "self-signed certificate in certificate chain"
    // Ini memberitahu Node.js untuk tidak menolak koneksi karena sertifikat yang tidak dikenal
    // Sangat direkomendasikan HANYA UNTUK PENGEMBANGAN!
    rejectUnauthorized: false
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
    // console.error("Detail error:", err);
    process.exit(1); // Menghentikan aplikasi jika tidak bisa terhubung ke DB
  });

// Mengekspor objek pool agar bisa digunakan di file lain (misalnya controllers atau routes)
module.exports = pool;