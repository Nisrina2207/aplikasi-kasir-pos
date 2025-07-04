const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware'); // PERUBAHAN: Pastikan ini menggunakan destructuring

// ... rute-rute lainnya ...

router.delete('/by-date', authenticateToken, authorizeRole(['admin']), transactionController.deleteTransactionsByDate);

// ... rute-rute lainnya ...

module.exports = router;
