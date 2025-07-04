// backend/src/routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

// Rute untuk membuat pesanan baru (membutuhkan autentikasi, bisa 'kasir' atau 'admin')
router.post('/', authenticateToken, authorizeRoles('kasir', 'admin'), orderController.createOrder);

// Rute untuk mendapatkan detail pesanan (membutuhkan autentikasi, bisa 'kasir' atau 'admin')
router.get('/:id', authenticateToken, authorizeRoles('kasir', 'admin'), orderController.getOrderDetails);

// Rute untuk memperbarui status pesanan (misal: pembayaran, status persiapan)
router.put('/:id/status', authenticateToken, authorizeRoles('kasir', 'admin'), orderController.updateOrderStatus);

module.exports = router;