// server.js

// 1. Muat variabel lingkungan dari file .env
// Penting: Ini harus menjadi baris pertama di server.js
require('dotenv').config();

// 2. Impor modul yang diperlukan
const express = require('express'); // Framework web Express.js
const cors = require('cors');       // Middleware untuk mengizinkan Cross-Origin Resource Sharing
const pool = require('./db');       // Impor objek pool koneksi database dari db.js

// Impor rute-rute API Anda
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userRoutes = require('./routes/userRoutes'); // <--- BARIS BARU: Import route pengguna

// 3. Inisialisasi aplikasi Express
const app = express();
const PORT = process.env.PORT || 5000; // Ambil port dari .env atau gunakan 5000 sebagai default

// 4. Konfigurasi Middleware Global
// Middleware CORS: Mengizinkan permintaan dari domain lain (misalnya, frontend Anda)
app.use(cors());

// Middleware express.json(): Mengurai body permintaan dalam format JSON
// Ini penting agar Anda bisa menerima data JSON dari Postman atau frontend
app.use(express.json());

// 5. Definisikan Rute API
// Anda akan mengatur base path untuk setiap set rute.

// Rute test sederhana untuk memastikan server berjalan
// Ketika Anda mengakses http://localhost:5000/ di browser, ini akan merespons
app.get('/', (req, res) => {
  res.send('Backend Aplikasi Kasir Berjalan!');
});

// Gunakan rute otentikasi
// Semua rute yang didefinisikan di authRoutes.js akan di-prefix dengan /api/auth
// Contoh: POST /api/auth/register, POST /api/auth/login
app.use('/api/auth', authRoutes);

// Gunakan rute produk
// Semua rute yang didefinisikan di productRoutes.js akan di-prefix dengan /api/products
app.use('/api/products', productRoutes);

// Gunakan rute kategori
// Semua rute yang didefinisikan di categoryRoutes.js akan di-prefix dengan /api/categories
app.use('/api/categories', categoryRoutes);

// Gunakan rute transaksi
// Semua rute yang didefinisikan di transactionRoutes.js akan di-prefix dengan /api/transactions
app.use('/api/transactions', transactionRoutes);

app.use('/api/reports', reportRoutes);

app.use('/api/users', userRoutes); // <--- BARIS BARU: Daftarkan route pengguna

// 6. Penanganan Error (Opsional, tapi direkomendasikan untuk aplikasi nyata)
// Ini adalah middleware catch-all untuk error yang tidak tertangkap
app.use((err, req, res, next) => {
  console.error(err.stack); // Log error stack trace ke konsol server
  res.status(500).send('Something broke!'); // Kirim respons error generik ke klien
});


// 7. Mulai Server
app.listen(PORT, () => {
  console.log(`Server backend berjalan di http://localhost:${PORT}`);
});