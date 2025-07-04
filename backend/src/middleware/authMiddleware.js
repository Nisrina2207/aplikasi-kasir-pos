const jwt = require('jsonwebtoken');

// Middleware untuk otentikasi (memverifikasi token JWT)
exports.authenticateToken = (req, res, next) => { // Mengubah nama ekspor menjadi authenticateToken
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Invalid token format, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Error verifying token:', err.message);
    res.status(401).json({ message: 'Token is not valid, authorization denied' });
  }
};

// Middleware untuk otorisasi (memeriksa peran pengguna)
exports.authorizeRoles = (...roles) => { // Menggunakan rest parameter untuk menerima banyak peran
  return (req, res, next) => {
    // Pastikan req.user ada dan memiliki properti role (dari authenticateToken)
    if (!req.user || !req.user.role) {
      return res.status(403).json({ message: 'User role not found, authorization denied' });
    }
    // Periksa apakah peran pengguna termasuk dalam daftar peran yang diizinkan
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Access denied. Requires one of: ${roles.join(', ')} roles.` });
    }
    next(); // Lanjutkan jika peran diizinkan
  };
};