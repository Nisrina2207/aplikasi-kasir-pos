// api/auth/login.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Pastikan path ini benar relatif ke api/auth/login.js
// ../../backend/src/db.js  -> Naik 2 level ke root, lalu masuk backend/src/db.js
const pool = require('../../backend/src/db'); 
const User = require('../../backend/src/models/User'); 

// Pastikan JWT_SECRET diambil dari process.env di Vercel
const JWT_SECRET = process.env.JWT_SECRET; 

module.exports = async (req, res) => {
    // Hanya tangani metode POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password harus diisi.' });
    }

    try {
        // Cari pengguna berdasarkan username
        const user = await User.findByUsername(username); 
        if (!user) {
            return res.status(400).json({ error: 'Username atau password salah.' });
        }

        // Bandingkan password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Username atau password salah.' });
        }

        // Buat token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        // Beri respons sukses dengan token
        res.status(200).json({ message: 'Login berhasil!', token, user: { id: user.id, username: user.username, role: user.role } });

    } catch (error) {
        console.error('Error during login (Vercel Serverless Function):', error);
        res.status(500).json({ error: 'Terjadi kesalahan server saat login.' });
    }
};
