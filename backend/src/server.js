const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const userRoutes = require('./routes/userRoutes');
const reportRoutes = require('./routes/reportRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ====================================================================================
// KONFIGURASI CORS PALING LONGGAR (HANYA UNTUK UJI COBA)
app.use(cors()); // Ini akan mengizinkan SEMUA origin
// ====================================================================================

app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);

app.get('/', (req, res) => {
    res.send('POS Backend API is running!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
