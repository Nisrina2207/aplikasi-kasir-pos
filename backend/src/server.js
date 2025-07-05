const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// Memuat variabel lingkungan dari file .env
dotenv.config();

const app = express();
// Mengambil PORT dari variabel lingkungan atau menggunakan 5000 sebagai default
const PORT = process.env.PORT || 5000;

// ====================================================================================
// KONFIGURASI CORS YANG SANGAT PRESISI
// Pastikan ini adalah URL frontend Vercel Anda yang disalin LANGSUNG dari browser, TANPA GARIS MIRING DI AKHIR
const allowedOrigin = 'https://aplikasi-kasir-pos.vercel.app'; // GANTI DENGAN URL YANG ANDA SALIN

// Middleware untuk mengurai body permintaan JSON (HARUS DI ATAS CORS jika ada masalah)
app.use(express.json());

// Middleware CORS
app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Tambahkan OPTIONS secara eksplisit
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'] // Tambahkan header yang diizinkan
}));

// Tangani permintaan OPTIONS preflight secara eksplisit
// Ini memastikan bahwa preflight request direspons dengan benar
app.options('*', cors());
// ====================================================================================

// Mengatur rute-rute API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);

// Rute dasar untuk pengujian API
app.get('/', (req, res) => {
    res.send('POS Backend API is running!');
});

// Memulai server dan mendengarkan di port yang ditentukan
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
