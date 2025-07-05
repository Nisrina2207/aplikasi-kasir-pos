const jwt = require('jsonwebtoken');

// Middleware untuk memverifikasi token JWT
const verifyToken = (req, res, next) => {
    // Ambil token dari header Authorization
    // Format: Bearer <token>
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // Jika tidak ada token, kembalikan error 401 Unauthorized
    if (!token) {
        return res.status(401).json({ message: 'Akses ditolak. Tidak ada token yang diberikan.' });
    }

    try {
        // Verifikasi token menggunakan secret key
        // Pastikan process.env.JWT_SECRET_KEY sama dengan yang digunakan saat membuat token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        // Tambahkan informasi user yang didekode ke objek request
        req.user = decoded;
        
        // Lanjutkan ke middleware atau route berikutnya
        next();
    } catch (error) {
        // Jika token tidak valid (misalnya kadaluarsa, salah tanda tangan)
        console.error('Verifikasi token gagal:', error.message);
        return res.status(403).json({ message: 'Token tidak valid.' });
    }
};

// Middleware untuk memeriksa peran pengguna (misalnya, admin)
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        // Pastikan req.user ada (dari middleware verifyToken)
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Akses ditolak. Informasi peran tidak ditemukan.' });
        }

        // Periksa apakah peran pengguna termasuk dalam peran yang diizinkan
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki izin yang diperlukan.' });
        }
        
        // Lanjutkan ke middleware atau route berikutnya
        next();
    };
};

module.exports = { verifyToken, authorizeRoles };
