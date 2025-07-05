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
// Glitch menggunakan file .env, jadi biarkan dotenv.config()
dotenv.config(); 

const app = express();
// Glitch akan menyediakan PORT secara otomatis melalui variabel lingkungan
const PORT = process.env.PORT || 3000; // Glitch default ke 3000

// Middleware untuk mengurai body permintaan JSON
app.use(express.json());

// ====================================================================================
// KONFIGURASI CORS UNTUK GLITCH.COM
// Pastikan ini adalah URL frontend Vercel Anda yang disalin LANGSUNG dari browser, TANPA GARIS MIRING DI AKHIR
const allowedOrigin = 'https://aplikasi-kasir-pos.vercel.app'; 

// Middleware CORS
app.use(cors({
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Tangani permintaan OPTIONS preflight secara eksplisit
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
