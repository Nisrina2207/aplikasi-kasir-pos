const pool = require('../db'); // Impor koneksi database

// Fungsi Pembantu: Mengambil harga produk
const getProductPrice = async (productId) => {
    const productResult = await pool.query('SELECT price FROM products WHERE id = $1', [productId]);
    if (productResult.rows.length === 0) {
        throw new Error(`Product with ID ${productId} not found.`);
    }
    return parseFloat(productResult.rows[0].price);
};

// Fungsi Pembantu: Mengupdate stok produk
const updateProductStock = async (productId, quantity) => {
    await pool.query(
        'UPDATE products SET stock = stock - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [quantity, productId]
    );
};

// Membuat Transaksi Baru
exports.createTransaction = async (req, res) => {
    const user_id = req.user.id;
    const {
        total_amount,
        paid_amount,
        change_amount,
        payment_method,
        notes,
        items,
        customer_name,
        table_number,
        discount_amount, // Tambahkan ini
        tax_percentage,  // Tambahkan ini
        tax_amount       // Tambahkan ini
    } = req.body;

    try {
        await pool.query('BEGIN');

        const newTransaction = await pool.query(
            `INSERT INTO transactions (
                user_id,
                total_amount,
                paid_amount,
                change_amount,
                payment_method,
                notes,
                customer_name,
                table_number,
                discount_amount,  -- Tambahkan kolom ini
                tax_percentage,   -- Tambahkan kolom ini
                tax_amount        -- Tambahkan kolom ini
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [
                user_id,
                total_amount,
                paid_amount,
                change_amount,
                payment_method,
                notes || null,
                customer_name || null,
                table_number || null,
                discount_amount || 0.00, // Default 0.00 jika kosong
                tax_percentage || 0.00,  // Default 0.00 jika kosong
                tax_amount || 0.00       // Default 0.00 jika kosong
            ]
        );
        const transactionId = newTransaction.rows[0].id;

        for (const item of items) {
            const { product_id, quantity, item_price } = item;
            const actualPrice = await getProductPrice(product_id);
            if (actualPrice !== parseFloat(item_price)) {
                console.warn(`Price mismatch for product ${product_id}: Expected ${actualPrice}, received ${item_price}`);
            }

            await pool.query(
                'INSERT INTO transaction_items (transaction_id, product_id, quantity, item_price) VALUES ($1, $2, $3, $4) RETURNING *',
                [transactionId, product_id, quantity, item_price]
            );

            await updateProductStock(product_id, quantity);
        }

        await pool.query('COMMIT');

        res.status(201).json({
            message: 'Transaction created successfully',
            transaction: newTransaction.rows[0],
            items: items
        });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error creating transaction:', err.message);
        res.status(500).json({ error: 'Server error creating transaction' });
    }
};

// Mendapatkan Semua Transaksi (hanya admin/user yang login) dengan filter tanggal
exports.getAllTransactions = async (req, res) => {
    const { startDate, endDate } = req.query;
    let query = `
        SELECT
            t.id, t.user_id, u.username as cashier_username,
            t.total_amount, t.paid_amount, t.change_amount, t.payment_method,
            t.created_at, t.updated_at,
            t.customer_name,
            t.table_number,
            t.discount_amount,  -- Ambil kolom ini
            t.tax_percentage,   -- Ambil kolom ini
            t.tax_amount        -- Ambil kolom ini
        FROM
            transactions t
        JOIN
            users u ON t.user_id = u.id
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (startDate && endDate) {
        query += ` WHERE CAST(t.created_at AS DATE) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        queryParams.push(startDate);
        queryParams.push(endDate);
    }

    query += ` ORDER BY t.created_at DESC`;

    try {
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all transactions:', err.message);
        res.status(500).json({ error: 'Server error fetching transactions' });
    }
};

// Mendapatkan Transaksi berdasarkan ID (hanya admin/user yang login)
exports.getTransactionById = async (req, res) => {
    const { id } = req.params;
    try {
        const transactionResult = await pool.query(
            `SELECT
                t.id, t.user_id, u.username as cashier_username,
                t.total_amount, t.paid_amount, t.change_amount, t.payment_method,
                t.created_at, t.updated_at,
                t.customer_name,
                t.table_number,
                t.discount_amount,  -- Ambil kolom ini
                t.tax_percentage,   -- Ambil kolom ini
                t.tax_amount        -- Ambil kolom ini
            FROM
                transactions t
            JOIN
                users u ON t.user_id = u.id
            WHERE t.id = $1`,
            [id]
        );

        if (transactionResult.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        const transaction = transactionResult.rows[0];

        const itemsResult = await pool.query(
            `SELECT
                ti.id as item_id, ti.product_id, p.name as product_name,
                ti.quantity, ti.item_price
            FROM
                transaction_items ti
            JOIN
                products p ON ti.product_id = p.id
            WHERE ti.transaction_id = $1`,
            [id]
        );

        transaction.items = itemsResult.rows;

        res.json(transaction);
    } catch (err) {
        console.error('Error fetching transaction by ID:', err.message);
        res.status(500).json({ error: 'Server error fetching transaction' });
    }
};

// Fungsi baru: Menghapus transaksi berdasarkan rentang tanggal (hanya admin)
exports.deleteTransactionsByDate = async (req, res) => {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        return res.status(400).json({ message: 'Start date and end date are required.' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Only admin can delete transactions by date.' });
    }

    try {
        await pool.query('BEGIN');

        const getTransactionIdsQuery = `
            SELECT id FROM transactions
            WHERE CAST(created_at AS DATE) BETWEEN $1 AND $2
        `;
        const transactionIdsResult = await pool.query(getTransactionIdsQuery, [startDate, endDate]);
        const transactionIds = transactionIdsResult.rows.map(row => row.id);

        if (transactionIds.length === 0) {
            await pool.query('COMMIT');
            return res.status(200).json({ message: 'No transactions found to delete in the specified date range.' });
        }

        const deleteItemsQuery = `DELETE FROM transaction_items WHERE transaction_id = ANY($1::int[])`;
        await pool.query(deleteItemsQuery, [transactionIds]);

        const deleteTransactionsQuery = `DELETE FROM transactions WHERE id = ANY($1::int[]) RETURNING id`;
        const deletedResult = await pool.query(deleteTransactionsQuery, [transactionIds]);

        await pool.query('COMMIT');

        res.status(200).json({
            message: `${deletedResult.rows.length} transactions and their items deleted successfully.`,
            deletedIds: deletedResult.rows.map(row => row.id)
        });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error deleting transactions by date:', err.message);
        res.status(500).json({ error: 'Server error deleting transactions by date' });
    }
};

// Endpoint untuk membatalkan transaksi (opsional, hanya admin)
exports.cancelTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'UPDATE transactions SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            ['cancelled', id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.json({ message: 'Transaction cancelled successfully', transaction: result.rows[0] });
    } catch (err) {
        console.error('Error cancelling transaction:', err.message);
        res.status(500).json({ error: 'Server error cancelling transaction' });
    }
};

// Hapus transaksi (biasanya tidak direkomendasikan dalam sistem kasir nyata)
exports.deleteTransaction = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('BEGIN');

        await pool.query('DELETE FROM transaction_items WHERE transaction_id = $1', [id]);
        const result = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ message: 'Transaction not found' });
        }

        await pool.query('COMMIT');

        res.json({ message: 'Transaction and its items deleted successfully', id: id });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error deleting transaction:', err.message);
        res.status(500).json({ error: 'Server error deleting transaction' });
    }
};
