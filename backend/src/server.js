const express = require('express');
const cors = require('cors'); // Tetap impor cors
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
const PORT = process.env.PORT || 5000;

// Middleware untuk mengurai body permintaan JSON
app.use(express.json());

// ====================================================================================
// KONFIGURASI CORS UNTUK DIGUNAKAN PADA RUTE TERTENTU
// Definisikan corsOptions di sini
const corsOptions = {
    origin: 'https://aplikasi-kasir-pos.vercel.app', // PASTIKAN URL INI SAMA PERSIS TANPA GARIS MIRING AKHIR
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
};

// ====================================================================================

// Mengatur rute-rute API
// Terapkan middleware cors() secara spesifik untuk setiap rute
app.use('/api/auth', cors(corsOptions), authRoutes); // Terapkan CORS di sini
app.use('/api/products', cors(corsOptions), productRoutes); // Terapkan CORS di sini
app.use('/api/transactions', cors(corsOptions), transactionRoutes); // Terapkan CORS di sini
app.use('/api/users', cors(corsOptions), userRoutes); // Terapkan CORS di sini
app.use('/api/reports', cors(corsOptions), reportRoutes); // Terapkan CORS di sini
app.use('/api/categories', cors(corsOptions), categoryRoutes); // Terapkan CORS di sini

// Rute dasar untuk pengujian API (tidak perlu CORS khusus jika hanya GET)
app.get('/', (req, res) => {
    res.send('POS Backend API is running!');
});

// Memulai server dan mendengarkan di port yang ditentukan
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
