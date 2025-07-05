const express = require('express');
const router = express.Router(); 
const transactionController = require('../controllers/transactionController');
const { verifyToken, authorizeRoles } = require('../middleware/authMiddleware');

// ====================================================================================
// DEBUG LOGS SANGAT SPESIFIK TEPAT SEBELUM RUTE
console.log('Debug (transactionRoutes.js - Pre-route): transactionController:', transactionController);
console.log('Debug (transactionRoutes.js - Pre-route): transactionController.getAllTransactions:', transactionController.getAllTransactions);
// ====================================================================================

// Rute untuk mendapatkan semua transaksi (hanya admin)
router.get('/', 
    verifyToken, 
    authorizeRoles(['admin']), 
    // PENTING: Gunakan fungsi anonim sebagai wrapper untuk handler
    (req, res, next) => {
        console.log('Debug (transactionRoutes.js - Inside GET /): Calling getAllTransactions');
        if (typeof transactionController.getAllTransactions === 'function') {
            transactionController.getAllTransactions(req, res, next);
        } else {
            console.error('Error: transactionController.getAllTransactions is NOT a function inside handler!');
            res.status(500).json({ error: 'Server error: getAllTransactions is undefined at runtime.' });
        }
    }
);

// Rute untuk mendapatkan transaksi berdasarkan ID (hanya admin)
router.get('/:id', verifyToken, authorizeRoles(['admin']), (req, res, next) => {
    if (typeof transactionController.getTransactionById === 'function') {
        transactionController.getTransactionById(req, res, next);
    } else {
        res.status(500).json({ error: 'Server error: getTransactionById is undefined at runtime.' });
    }
});

// Rute untuk mendapatkan transaksi berdasarkan tanggal (hanya admin)
router.get('/by-date', verifyToken, authorizeRoles(['admin']), (req, res, next) => {
    if (typeof transactionController.getTransactionsByDate === 'function') {
        transactionController.getTransactionsByDate(req, res, next);
    } else {
        res.status(500).json({ error: 'Server error: getTransactionsByDate is undefined at runtime.' });
    }
});

// Rute untuk membuat transaksi baru (kasir atau admin)
router.post('/', verifyToken, authorizeRoles(['kasir', 'admin']), (req, res, next) => {
    if (typeof transactionController.createTransaction === 'function') {
        transactionController.createTransaction(req, res, next);
    } else {
        res.status(500).json({ error: 'Server error: createTransaction is undefined at runtime.' });
    }
});

// Rute untuk memperbarui transaksi (hanya admin)
router.put('/:id', verifyToken, authorizeRoles(['admin']), (req, res, next) => {
    if (typeof transactionController.updateTransaction === 'function') {
        transactionController.updateTransaction(req, res, next);
    } else {
        res.status(500).json({ error: 'Server error: updateTransaction is undefined at runtime.' });
    }
});

// Rute untuk menghapus transaksi (hanya admin)
router.delete('/:id', verifyToken, authorizeRoles(['admin']), (req, res, next) => {
    if (typeof transactionController.deleteTransaction === 'function') {
        transactionController.deleteTransaction(req, res, next);
    } else {
        res.status(500).json({ error: 'Server error: deleteTransaction is undefined at runtime.' });
    }
});

// Rute untuk menghapus transaksi berdasarkan tanggal (hanya admin)
router.delete('/by-date', verifyToken, authorizeRoles(['admin']), (req, res, next) => {
    if (typeof transactionController.deleteTransactionsByDate === 'function') {
        transactionController.deleteTransactionsByDate(req, res, next);
    } else {
        res.status(500).json({ error: 'Server error: deleteTransactionsByDate is undefined at runtime.' });
    }
});

module.exports = router;
