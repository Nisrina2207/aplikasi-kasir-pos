const express = require('express');
const categoryController = require('../controllers/categoryController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// Rute publik: Mendapatkan semua kategori dan kategori berdasarkan ID
// Ini diperlukan agar halaman Manajemen Produk dapat memuat daftar kategori tanpa perlu login terlebih dahulu.
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Rute yang dilindungi: Membutuhkan login untuk operasi selain GET kategori
// Semua rute di bawah ini akan memerlukan token JWT yang valid
router.use(authenticateToken);

// Rute yang hanya bisa diakses oleh 'admin' (membutuhkan otorisasi peran)
// Operasi CRUD (Create, Update, Delete) kategori biasanya hanya untuk admin
router.post('/', authorizeRoles('admin'), categoryController.createCategory);
router.put('/:id', authorizeRoles('admin'), categoryController.updateCategory);
router.delete('/:id', authorizeRoles('admin'), categoryController.deleteCategory);

module.exports = router;
