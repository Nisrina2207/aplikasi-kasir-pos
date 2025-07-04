const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware'); // Pastikan ini benar path-nya

// Rute untuk membuat transaksi baru (membutuhkan otentikasi)
router.post('/', authenticateToken, transactionController.createTransaction);

// Rute untuk mendapatkan semua transaksi (membutuhkan otentikasi)
router.get('/', authenticateToken, transactionController.getAllTransactions);

// Rute untuk mendapatkan transaksi berdasarkan ID (membutuhkan otentikasi)
router.get('/:id', authenticateToken, transactionController.getTransactionById);

// Rute untuk menghapus transaksi berdasarkan rentang tanggal (hanya admin)
router.delete('/by-date', authenticateToken, authorizeRole(['admin']), transactionController.deleteTransactionsByDate);

// Rute untuk membatalkan transaksi (opsional, hanya admin)
router.put('/:id/cancel', authenticateToken, authorizeRole(['admin']), transactionController.cancelTransaction);

// Rute untuk menghapus transaksi (opsional, hanya admin)
router.delete('/:id', authenticateToken, authorizeRole(['admin']), transactionController.deleteTransaction);

module.exports = router;
