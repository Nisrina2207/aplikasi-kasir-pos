const express = require('express');
const transactionController = require('../controllers/transactionController');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken); // Semua rute di bawah ini memerlukan token JWT yang valid

// Validasi untuk membuat transaksi baru
const createTransactionValidationRules = [
    body('total_amount').isFloat({ gt: 0 }).withMessage('Total amount must be a positive number'),
    body('paid_amount').isFloat({ gt: 0 }).withMessage('Paid amount must be a positive number'),
    body('change_amount').isFloat({ min: 0 }).withMessage('Change amount must be a non-negative number'),
    body('payment_method').notEmpty().withMessage('Payment method is required'),
    body('items').isArray().withMessage('Items must be an array').notEmpty().withMessage('Items array cannot be empty'),
    body('items.*.product_id').isInt({ gt: 0 }).withMessage('Product ID must be a positive integer'),
    body('items.*.quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
    body('items.*.item_price').isFloat({ gt: 0 }).withMessage('Item price at sale must be a positive number'),
];

router.post('/', createTransactionValidationRules, transactionController.createTransaction);

// Mendapatkan semua transaksi (dengan filter tanggal opsional)
router.get('/', transactionController.getAllTransactions);
router.get('/:id', transactionController.getTransactionById);

// Rute baru untuk menghapus transaksi berdasarkan rentang tanggal (hanya admin)
router.delete('/by-date',
    authorizeRoles('admin'), // Hanya admin yang bisa menghapus massal
    [
        body('startDate').isISO8601().toDate().withMessage('Start date must be a valid date'),
        body('endDate').isISO8601().toDate().withMessage('End date must be a valid date'),
    ],
    transactionController.deleteTransactionsByDate
);

router.put('/:id/cancel', authorizeRoles('admin'), transactionController.cancelTransaction);
router.delete('/:id', authorizeRoles('admin'), transactionController.deleteTransaction);

module.exports = router;
