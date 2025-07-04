const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

const router = express.Router();

// Rute pendaftaran (publik, tidak memerlukan token)
router.post('/register', [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('role').isIn(['cashier', 'admin']).withMessage('Invalid role')
], userController.registerUser);

// Rute login (publik, tidak memerlukan token)
router.post('/login', userController.loginUser);

// Semua rute di bawah ini memerlukan token JWT yang valid
router.use(authenticateToken);

// Mendapatkan semua pengguna (hanya admin)
router.get('/', authorizeRoles('admin'), userController.getAllUsers);

// Mendapatkan pengguna berdasarkan ID (admin atau pengguna itu sendiri)
router.get('/:id', userController.getUserById);

// Memperbarui pengguna (admin atau pengguna itu sendiri)
router.put('/:id', userController.updateUser);

// Menghapus pengguna (hanya admin)
router.delete('/:id', authorizeRoles('admin'), userController.deleteUser);

module.exports = router;
