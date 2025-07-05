const pool = require('../db');

// Fungsi untuk mendapatkan ringkasan penjualan
exports.getSalesSummary = async (req, res) => {
    const { startDate, endDate } = req.query;
    let revisedQuery = `
        SELECT
            COUNT(DISTINCT t.id) AS total_transactions,
            COALESCE(SUM(t.total_amount), 0) AS total_sales_amount, -- Ini adalah Netto
            COALESCE(SUM(t.paid_amount), 0) AS total_paid_amount,
            COALESCE(SUM(t.change_amount), 0) AS total_change_amount,
            COALESCE(SUM(t.discount_amount), 0) AS total_discount_amount,
            COALESCE(SUM(t.tax_amount), 0) AS total_tax_amount,
            COALESCE(SUM(subquery.bruto_per_transaction), 0) AS total_sales_amount_bruto
        FROM
            transactions t
        LEFT JOIN (
            SELECT
                transaction_id,
                SUM(quantity * item_price) AS bruto_per_transaction
            FROM
                transaction_items
            GROUP BY
                transaction_id
        ) AS subquery ON t.id = subquery.transaction_id
        WHERE
            t.status = 'completed'
    `;
    const revisedQueryParams = [];
    let revisedParamIndex = 1;

    if (startDate && endDate) {
        revisedQuery += ` AND t.created_at BETWEEN $${revisedParamIndex} AND $${revisedParamIndex + 1}`;
        revisedQueryParams.push(startDate + ' 00:00:00');
        revisedQueryParams.push(endDate + ' 23:59:59');
    }

    try {
        const revisedResult = await pool.query(revisedQuery, revisedQueryParams);
        res.json(revisedResult.rows[0] || {});

    } catch (err) {
        console.error('Error fetching sales summary:', err.message);
        res.status(500).json({ error: 'Server error fetching sales summary' });
    }
};

// Fungsi untuk mendapatkan produk terlaris (tidak ada perubahan)
exports.getTopSellingProducts = async (req, res) => {
    const { startDate, endDate, limit = 5 } = req.query;
    let query = `
        SELECT
            p.id,
            p.name,
            SUM(ti.quantity) AS total_quantity_sold,
            COALESCE(SUM(ti.quantity * ti.item_price), 0) AS total_revenue
        FROM
            transaction_items ti
        JOIN
            transactions t ON ti.transaction_id = t.id
        JOIN
            products p ON ti.product_id = p.id
        WHERE
            t.status = 'completed'
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (startDate && endDate) {
        query += ` AND t.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        queryParams.push(startDate + ' 00:00:00');
        queryParams.push(endDate + ' 23:59:59');
        paramIndex += 2;
    }

    query += `
        GROUP BY
            p.id, p.name
        ORDER BY
            total_quantity_sold DESC
        LIMIT $${paramIndex}
    `;
    queryParams.push(limit);

    try {
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching top selling products:', err.message);
        res.status(500).json({ error: 'Server error fetching top selling products' });
    }
};

// Fungsi untuk mendapatkan detail penjualan (daftar transaksi dengan ringkasan item)
exports.getDetailedSales = async (req, res) => {
    const { startDate, endDate } = req.query;
    let query = `
        SELECT
            t.id,
            t.created_at,
            t.total_amount,
            t.paid_amount,
            t.change_amount,
            t.payment_method,
            u.username AS cashier_username,
            t.customer_name,
            t.table_number,
            t.discount_amount,
            t.tax_percentage,
            t.tax_amount,
            (SELECT SUM(quantity) FROM transaction_items WHERE transaction_id = t.id) AS total_items
        FROM
            transactions t
        JOIN
            users u ON t.user_id = u.id
        WHERE
            t.status = 'completed'
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (startDate && endDate) {
        query += ` AND t.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        queryParams.push(startDate + ' 00:00:00');
        queryParams.push(endDate + ' 23:59:59');
        paramIndex += 2;
    }

    query += ` ORDER BY t.created_at DESC`;

    try {
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching detailed sales:', err.message);
        res.status(500).json({ error: 'Server error fetching detailed sales' });
    }
};

// ====================================================================================
// FUNGSI-FUNGSI LAPORAN YANG HILANG (DITAMBAHKAN)
// Anda bisa mengisi logika query database yang sesuai di sini
// Ini adalah placeholder agar aplikasi tidak crash
// ====================================================================================

// Mendapatkan Laporan Penjualan Harian
exports.getDailySalesReport = async (req, res) => {
    const { date } = req.query; // Expects a single date, e.g., 'YYYY-MM-DD'
    if (!date) {
        return res.status(400).json({ message: 'Date is required for daily sales report.' });
    }
    try {
        const query = `
            SELECT
                CAST(t.created_at AS DATE) AS sale_date,
                COUNT(t.id) AS total_transactions,
                COALESCE(SUM(t.total_amount), 0) AS total_sales_amount
            FROM
                transactions t
            WHERE
                CAST(t.created_at AS DATE) = $1 AND t.status = 'completed'
            GROUP BY
                CAST(t.created_at AS DATE)
            ORDER BY
                sale_date;
        `;
        const result = await pool.query(query, [date]);
        res.json(result.rows[0] || { sale_date: date, total_transactions: 0, total_sales_amount: 0 });
    } catch (err) {
        console.error('Error fetching daily sales report:', err.message);
        res.status(500).json({ error: 'Server error fetching daily sales report' });
    }
};

// Mendapatkan Laporan Penjualan Bulanan
exports.getMonthlySalesReport = async (req, res) => {
    const { year, month } = req.query; // Expects year and month, e.g., '2023', '01'
    if (!year || !month) {
        return res.status(400).json({ message: 'Year and month are required for monthly sales report.' });
    }
    try {
        const query = `
            SELECT
                EXTRACT(YEAR FROM t.created_at) AS sale_year,
                EXTRACT(MONTH FROM t.created_at) AS sale_month,
                COUNT(t.id) AS total_transactions,
                COALESCE(SUM(t.total_amount), 0) AS total_sales_amount
            FROM
                transactions t
            WHERE
                EXTRACT(YEAR FROM t.created_at) = $1 AND EXTRACT(MONTH FROM t.created_at) = $2
                AND t.status = 'completed'
            GROUP BY
                sale_year, sale_month
            ORDER BY
                sale_year, sale_month;
        `;
        const result = await pool.query(query, [year, month]);
        res.json(result.rows[0] || { sale_year: year, sale_month: month, total_transactions: 0, total_sales_amount: 0 });
    } catch (err) {
        console.error('Error fetching monthly sales report:', err.message);
        res.status(500).json({ error: 'Server error fetching monthly sales report' });
    }
};

// Mendapatkan Laporan Penjualan Berdasarkan Produk
exports.getProductSalesReport = async (req, res) => {
    const { startDate, endDate, productId } = req.query; // Can filter by date range and/or specific product
    let query = `
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            COALESCE(SUM(ti.quantity), 0) AS total_quantity_sold,
            COALESCE(SUM(ti.quantity * ti.item_price), 0) AS total_revenue
        FROM
            transaction_items ti
        JOIN
            products p ON ti.product_id = p.id
        JOIN
            transactions t ON ti.transaction_id = t.id
        WHERE
            t.status = 'completed'
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (startDate && endDate) {
        query += ` AND t.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        queryParams.push(startDate + ' 00:00:00');
        queryParams.push(endDate + ' 23:59:59');
        paramIndex += 2;
    }
    if (productId) {
        query += ` AND p.id = $${paramIndex}`;
        queryParams.push(productId);
        paramIndex++;
    }

    query += `
        GROUP BY
            p.id, p.name
        ORDER BY
            total_quantity_sold DESC, total_revenue DESC;
    `;

    try {
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching product sales report:', err.message);
        res.status(500).json({ error: 'Server error fetching product sales report' });
    }
};

// Mendapatkan Laporan Laba Rugi
exports.getProfitLossReport = async (req, res) => {
    const { startDate, endDate } = req.query;
    // Ini adalah contoh sederhana. Laba rugi sebenarnya jauh lebih kompleks
    // dan melibatkan biaya produk, biaya operasional, dll.
    // Untuk tujuan ini, kita akan menghitung total_sales_amount (netto) sebagai "pendapatan"
    // dan Anda bisa menambahkan logika untuk "biaya" jika ada di database Anda.
    let query = `
        SELECT
            COALESCE(SUM(t.total_amount), 0) AS total_revenue,
            -- Anda bisa menambahkan kolom untuk total_cost_of_goods_sold, total_expenses, dll.
            -- Contoh: COALESCE(SUM(ti.quantity * p.cost_price), 0) AS total_cogs
            -- Dimana p.cost_price adalah kolom biaya di tabel produk
            0 AS total_cogs, -- Placeholder
            0 AS total_expenses, -- Placeholder
            COALESCE(SUM(t.total_amount), 0) - 0 - 0 AS net_profit -- Pendapatan - COGS - Beban
        FROM
            transactions t
        WHERE
            t.status = 'completed'
    `;
    const queryParams = [];
    let paramIndex = 1;

    if (startDate && endDate) {
        query += ` AND t.created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
        queryParams.push(startDate + ' 00:00:00');
        queryParams.push(endDate + ' 23:59:59');
    }

    try {
        const result = await pool.query(query, queryParams);
        res.json(result.rows[0] || { total_revenue: 0, total_cogs: 0, total_expenses: 0, net_profit: 0 });
    } catch (err) {
        console.error('Error fetching profit loss report:', err.message);
        res.status(500).json({ error: 'Server error fetching profit loss report' });
    }
};
