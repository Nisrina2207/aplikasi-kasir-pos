const express = require('express');
// PENTING: Gunakan express.Router() untuk membuat instance router
const router = express.Router(); 
const transactionController = require('../controllers/transactionController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// Rute untuk mendapatkan semua transaksi (hanya admin)
router.get('/', verifyToken, authorizeRoles(['admin']), transactionController.getAllTransactions);

// Rute untuk mendapatkan transaksi berdasarkan ID (hanya admin)
router.get('/:id', verifyToken, authorizeRoles(['admin']), transactionController.getTransactionById);

// Rute untuk mendapatkan transaksi berdasarkan tanggal (hanya admin)
router.get('/by-date', verifyToken, authorizeRoles(['admin']), transactionController.getTransactionsByDate);

// Rute untuk membuat transaksi baru (kasir atau admin)
router.post('/', verifyToken, authorizeRoles(['kasir', 'admin']), transactionController.createTransaction);

// Rute untuk memperbarui transaksi (hanya admin)
router.put('/:id', verifyToken, authorizeRoles(['admin']), transactionController.updateTransaction);

// Rute untuk menghapus transaksi (hanya admin)
router.delete('/:id', verifyToken, authorizeRoles(['admin']), transactionController.deleteTransaction);

// Rute untuk menghapus transaksi berdasarkan tanggal (hanya admin)
router.delete('/by-date', verifyToken, authorizeRoles(['admin']), transactionController.deleteTransactionsByDate);

module.exports = router;
