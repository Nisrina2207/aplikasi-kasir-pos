const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Rute untuk mendapatkan semua pengguna (hanya admin)
router.get('/', authenticateToken, authorizeRole(['admin']), userController.getAllUsers);

// Rute untuk mendapatkan pengguna berdasarkan ID (hanya admin)
router.get('/:id', authenticateToken, authorizeRole(['admin']), userController.getUserById);

// Rute untuk memperbarui pengguna (hanya admin)
router.put('/:id', authenticateToken, authorizeRole(['admin']), userController.updateUser);

// Rute untuk menghapus pengguna (hanya admin)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), userController.deleteUser);

module.exports = router;
