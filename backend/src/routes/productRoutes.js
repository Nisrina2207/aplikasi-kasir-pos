const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
// PENTING: Impor verifyToken, bukan authenticateToken
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware'); 

// Rute publik: Mendapatkan semua produk
// Ini diperlukan agar halaman POS dapat memuat daftar produk tanpa perlu login terlebih dahulu.
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Rute yang dilindungi: Membutuhkan login untuk operasi selain GET produk
// Semua rute di bawah ini akan memerlukan token JWT yang valid
router.use(verifyToken); // PENTING: Gunakan verifyToken di sini

// Rute yang hanya bisa diakses oleh 'admin' (membutuhkan otorisasi peran)
// Operasi CRUD (Create, Update, Delete) produk biasanya hanya untuk admin
router.post('/', authorizeRoles(['admin']), productController.createProduct);
router.put('/:id', authorizeRoles(['admin']), productController.updateProduct);
router.delete('/:id', authorizeRoles(['admin']), productController.deleteProduct);

module.exports = router;
