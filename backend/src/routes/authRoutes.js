const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Rute untuk registrasi pengguna baru (public)
router.post('/register', authController.register);

// Rute untuk login pengguna (public)
// Pastikan ini adalah POST dan memanggil authController.login
router.post('/login', authController.login);

// Rute untuk mendapatkan profil pengguna (dilindungi, butuh token)
router.get('/profile', verifyToken, authController.getProfile);

// Rute untuk memperbarui profil pengguna (dilindungi, butuh token)
router.put('/profile', verifyToken, authController.updateProfile);

// Rute untuk mengubah password (dilindungi, butuh token)
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
