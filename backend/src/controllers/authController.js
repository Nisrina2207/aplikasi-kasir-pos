// src/backend/src/controllers/authController.js

const bcrypt = require('bcryptjs'); // Untuk hashing password
const jwt = require('jsonwebtoken'); // Untuk membuat dan memverifikasi token JWT
const User = require('../models/User'); // Model pengguna (asumsi Anda memiliki model ini)

// ====================================================================================
// PENTING: GANTI INI DENGAN KUNCI RAHSIA YANG KUAT DAN UNIK DI LINGKUNGAN PRODUKSI ANDA
// Anda bisa menggunakan alat seperti `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
// untuk menghasilkan kunci yang kuat.
const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_JWT_SECRET_KEY';
// ====================================================================================

// Fungsi untuk registrasi pengguna baru
exports.register = async (req, res) => {
    const { username, password, role } = req.body;

    // Validasi input
    if (!username || !password || !role) {
        return res.status(400).json({ message: 'Semua bidang (username, password, role) harus diisi.' });
    }

    try {
        // Periksa apakah username sudah ada
        let user = await User.findOne({ username });
        if (user) {
            return res.status(400).json({ message: 'Username sudah terdaftar.' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Buat pengguna baru
        user = new User({
            username,
            password: hashedPassword,
            role
        });

        // Simpan pengguna ke database
        await user.save();

        res.status(201).json({ message: 'Registrasi berhasil', user: { id: user._id, username: user.username, role: user.role } });

    } catch (error) {
        console.error('Error during user registration:', error.message);
        res.status(500).json({ error: 'Server error during registration' });
    }
};

// Fungsi untuk login pengguna
exports.login = async (req, res) => {
    const { username, password } = req.body;

    // Validasi input
    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password harus diisi.' });
    }

    try {
        // Cari pengguna berdasarkan username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Kredensial tidak valid.' });
        }

        // Bandingkan password yang dimasukkan dengan password yang di-hash di database
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Kredensial tidak valid.' });
        }

        // Buat token JWT
        const payload = {
            user: {
                id: user._id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Token akan kadaluarsa dalam 1 jam
            (err, token) => {
                if (err) throw err;
                res.json({ token, username: user.username, role: user.role, message: 'Login berhasil!' });
            }
        );

    } catch (error) {
        console.error('Error during user login:', error.message);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// Fungsi untuk mendapatkan profil pengguna (membutuhkan token)
exports.getProfile = async (req, res) => {
    try {
        // req.user akan tersedia dari middleware verifyToken
        const user = await User.findById(req.user.id).select('-password'); // Jangan kirim password
        if (!user) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        res.status(500).json({ error: 'Server error fetching profile' });
    }
};

// Fungsi untuk memperbarui profil pengguna (membutuhkan token)
exports.updateProfile = async (req, res) => {
    const { username, role } = req.body; // Contoh: hanya username dan role yang bisa diupdate
    const userId = req.user.id; // ID pengguna dari token

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        // Update bidang yang diizinkan
        if (username) user.username = username;
        // Hanya izinkan update role jika pengguna adalah admin atau memiliki izin khusus
        // if (role && req.user.role === 'admin') user.role = role; // Contoh: hanya admin yang bisa mengubah role

        await user.save();
        res.json({ message: 'Profil berhasil diperbarui', user: { id: user._id, username: user.username, role: user.role } });

    } catch (error) {
        console.error('Error updating user profile:', error.message);
        res.status(500).json({ error: 'Server error updating profile' });
    }
};

// Fungsi untuk mengubah password pengguna (membutuhkan token)
exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id; // ID pengguna dari token

    // Validasi input
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Password saat ini dan password baru harus diisi.' });
    }

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        }

        // Verifikasi password saat ini
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Password saat ini salah.' });
        }

        // Hash password baru
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();
        res.json({ message: 'Password berhasil diubah.' });

    } catch (error) {
        console.error('Error changing password:', error.message);
        res.status(500).json({ error: 'Server error changing password' });
    }
};
