// backend/src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../../.env' }); // Pastikan path benar

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // Unauthorized (tidak ada token)

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error("Token verification error:", err.message); // Log error untuk debugging
            return res.sendStatus(403); // Forbidden (token tidak valid atau kadaluarsa)
        }
        req.user = user; // user payload dari JWT (misal: { id: 1, username: 'admin', role: 'admin' })
        next(); // Lanjutkan ke rute handler
    });
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk melakukan aksi ini.' });
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRoles };