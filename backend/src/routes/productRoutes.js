const express = require('express');
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Rute publik: Mendapatkan semua produk dan produk berdasarkan ID
// Ini diperlukan agar halaman POS dapat memuat daftar produk tanpa perlu login terlebih dahulu.
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Rute yang dilindungi: Membutuhkan login untuk operasi selain GET produk
// Semua rute di bawah ini akan memerlukan token JWT yang valid
router.use(authenticateToken); 

// Rute yang hanya bisa diakses oleh 'admin' (membutuhkan otorisasi peran)
// Operasi CRUD (Create, Update, Delete) produk biasanya hanya untuk admin
router.post('/', authorizeRoles('admin'), productController.createProduct);
router.put('/:id', authorizeRoles('admin'), productController.updateProduct);
router.delete('/:id', authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;
