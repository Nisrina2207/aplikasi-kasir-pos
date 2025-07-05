const express = require('express');
const router = express.Router(); // Pastikan ini express.Router()
const categoryController = require('../controllers/categoryController');
// PENTING: Impor verifyToken dan authorizeRoles dengan benar
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Rute publik: Mendapatkan semua kategori
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Rute yang dilindungi: Membutuhkan login untuk operasi selain GET kategori
// Semua rute di bawah ini akan memerlukan token JWT yang valid
router.use(verifyToken); // PENTING: Gunakan verifyToken di sini

// Rute yang hanya bisa diakses oleh 'admin' (membutuhkan otorisasi peran)
// Operasi CRUD (Create, Update, Delete) kategori biasanya hanya untuk admin
router.post('/', authorizeRoles(['admin']), categoryController.createCategory);
router.put('/:id', authorizeRoles(['admin']), categoryController.updateCategory);
router.delete('/:id', authorizeRoles(['admin']), categoryController.deleteCategory);

module.exports = router;
