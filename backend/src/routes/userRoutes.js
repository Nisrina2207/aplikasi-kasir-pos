const express = require('express');
const router = express.Router(); // Pastikan ini express.Router()
const userController = require('../controllers/userController');
// PENTING: Impor verifyToken dan authorizeRoles dengan benar
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Rute untuk mendapatkan semua pengguna (hanya admin)
router.get('/', verifyToken, authorizeRoles(['admin']), userController.getAllUsers);

// Rute untuk mendapatkan pengguna berdasarkan ID (hanya admin)
router.get('/:id', verifyToken, authorizeRoles(['admin']), userController.getUserById);

// Rute untuk memperbarui pengguna (hanya admin)
router.put('/:id', verifyToken, authorizeRoles(['admin']), userController.updateUser);

// Rute untuk menghapus pengguna (hanya admin)
router.delete('/:id', verifyToken, authorizeRoles(['admin']), userController.deleteUser);

module.exports = router;
