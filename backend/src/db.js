    const { Pool } = require('pg');
    require('dotenv').config(); // Pastikan dotenv dimuat untuk membaca .env lokal

    // Konfigurasi koneksi database
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL, // Gunakan DATABASE_URL
        ssl: {
            rejectUnauthorized: false // Diperlukan untuk koneksi ke Railway/Heroku dari lingkungan lokal
        }
    });

    pool.on('connect', () => {
        console.log('Connected to the database');
    });

    pool.on('error', (err) => {
        console.error('Database error:', err);
    });

    module.exports = pool;
    