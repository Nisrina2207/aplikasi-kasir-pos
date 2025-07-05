const express = require('express');
const router = express.Router(); // Pastikan ini express.Router()
const reportController = require('../controllers/reportController');
// PENTING: Impor verifyToken dan authorizeRoles dengan benar
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Rute untuk mendapatkan laporan penjualan harian (hanya admin)
router.get('/daily-sales', verifyToken, authorizeRoles(['admin']), reportController.getDailySalesReport);

// Rute untuk mendapatkan laporan penjualan bulanan (hanya admin)
router.get('/monthly-sales', verifyToken, authorizeRoles(['admin']), reportController.getMonthlySalesReport);

// Rute untuk mendapatkan laporan penjualan berdasarkan produk (hanya admin)
router.get('/product-sales', verifyToken, authorizeRoles(['admin']), reportController.getProductSalesReport);

// Rute untuk mendapatkan laporan laba rugi (hanya admin)
router.get('/profit-loss', verifyToken, authorizeRoles(['admin']), reportController.getProfitLossReport);

module.exports = router;
