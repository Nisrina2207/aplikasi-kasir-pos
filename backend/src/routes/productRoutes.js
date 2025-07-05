const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware'); // Pastikan authorizeRole diimpor dengan benar

// Rute publik: Mendapatkan semua produk
// Ini diperlukan agar halaman POS dapat memuat daftar produk tanpa perlu login terlebih dahulu.
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Rute yang dilindungi: Membutuhkan login untuk operasi selain GET produk
// Semua rute di bawah ini akan memerlukan token JWT yang valid
router.use(authenticateToken); // Middleware autentikasi diterapkan untuk semua rute di bawah ini

// Rute yang hanya bisa diakses oleh 'admin' (membutuhkan otorisasi peran)
// Operasi CRUD (Create, Update, Delete) produk biasanya hanya untuk admin
router.post('/', authorizeRole(['admin']), productController.createProduct); // Menggunakan authorizeRole
router.put('/:id', authorizeRole(['admin']), productController.updateProduct); // Menggunakan authorizeRole
router.delete('/:id', authorizeRole(['admin']), productController.deleteProduct); // Menggunakan authorizeRole

module.exports = router;
