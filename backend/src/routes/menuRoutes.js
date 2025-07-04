// backend/src/routes/menuRoutes.js
const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware'); // Mengimpor middleware

// Rute untuk melihat semua menu (publik, siapa pun bisa melihat)
router.get('/', menuController.getAllMenus);

// Rute untuk menambah menu (membutuhkan autentikasi dan peran 'admin')
router.post('/', authenticateToken, authorizeRoles('admin'), menuController.createMenu);

// Rute untuk memperbarui menu (membutuhkan autentikasi dan peran 'admin')
router.put('/:id', authenticateToken, authorizeRoles('admin'), menuController.updateMenu);

// Rute untuk menghapus menu (membutuhkan autentikasi dan peran 'admin')
router.delete('/:id', authenticateToken, authorizeRoles('admin'), menuController.deleteMenu);

module.exports = router;