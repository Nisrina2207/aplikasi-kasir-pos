const jwt = require('jsonwebtoken');

// Middleware untuk otentikasi token JWT
exports.authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('JWT verification error:', err.message);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user; // Menambahkan payload user ke objek request
        next();
    });
};

// Middleware untuk otorisasi berdasarkan peran
exports.authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied: User role not found' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};
