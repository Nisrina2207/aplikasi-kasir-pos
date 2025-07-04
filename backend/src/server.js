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

// Middleware CORS
// Mengizinkan permintaan dari URL frontend Vercel Anda
app.use(cors({
    origin: 'https://aplikasi-kasir-pos.vercel.app', // GANTI DENGAN URL FRONTEND VERCEL ANDA YANG SEBENARNYA
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

// Middleware untuk mengurai body permintaan JSON
app.use(express.json());

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
