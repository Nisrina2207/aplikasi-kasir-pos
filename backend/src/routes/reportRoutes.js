const express = require('express');
const reportController = require('../controllers/reportController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Semua rute laporan memerlukan otentikasi (pengguna harus login)
router.use(authenticateToken);

// Rute untuk ringkasan penjualan (bisa diakses kasir atau admin)
router.get('/sales', reportController.getSalesSummary);

// Rute untuk produk terlaris (bisa diakses kasir atau admin)
router.get('/top-products', reportController.getTopSellingProducts);

// Rute untuk detail penjualan (bisa diakses kasir atau admin)
router.get('/detailed-sales', reportController.getDetailedSales);

// Contoh rute yang hanya bisa diakses admin (jika ada laporan khusus admin)
// router.get('/admin-only-report', authorizeRoles('admin'), reportController.getAdminReport);

module.exports = router;
