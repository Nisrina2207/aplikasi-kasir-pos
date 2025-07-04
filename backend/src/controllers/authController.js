// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // Mengimpor koneksi database
require('dotenv').config({ path: '../../.env' }); // Pastikan path benar

const register = async (req, res) => {
    const { username, password, role } = req.body;
    try {
        // Hashing password sebelum menyimpannya di database
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
            [username, hashedPassword, role || 'kasir'] // Default role 'kasir' jika tidak disediakan
        );
        res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
    } catch (err) {
        console.error("Error during registration:", err);
        if (err.code === '23505') { // PostgreSQL error code for unique violation
            return res.status(400).json({ message: 'Username sudah terdaftar.' });
        }
        res.status(500).json({ message: 'Gagal mendaftar user.' });
    }
};

const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ message: 'Username atau password salah.' });
        }

        // Membandingkan password yang dimasukkan dengan hash di database
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Username atau password salah.' });
        }

        // Membuat JSON Web Token (JWT)
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role }, // Payload token
            process.env.JWT_SECRET, // Kunci rahasia dari .env
            { expiresIn: '1h' } // Token berlaku 1 jam
        );

        res.json({ message: 'Login berhasil', token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (err) {
        console.error("Error during login:", err);
        res.status(500).json({ message: 'Gagal login.' });
    }
};

module.exports = { register, login };