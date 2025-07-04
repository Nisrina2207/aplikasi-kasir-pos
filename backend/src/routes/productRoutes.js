const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware'); // PERUBAHAN: Pastikan ini menggunakan authorizeRole singular

// Rute untuk mendapatkan semua produk
router.get('/', productController.getAllProducts);

// Rute untuk mendapatkan produk berdasarkan ID
router.get('/:id', productController.getProductById);

// Rute untuk membuat produk baru (hanya admin)
router.post('/', authenticateToken, authorizeRole(['admin']), productController.createProduct);

// Rute untuk memperbarui produk (hanya admin)
router.put('/:id', authenticateToken, authorizeRole(['admin']), productController.updateProduct);

// Rute untuk menghapus produk (hanya admin)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), productController.deleteProduct);

module.exports = router;
