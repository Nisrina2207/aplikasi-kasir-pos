const pool = require('../db');

// Fungsi untuk mendapatkan ringkasan penjualan
exports.getSalesSummary = async (req, res) => {
    const { startDate, endDate } = req.query;
    let query = `
        SELECT
            COUNT(t.id) AS total_transactions,
            COALESCE(SUM(t.total_amount), 0) AS total_sales_amount, -- Ini adalah Netto
            COALESCE(SUM(t.paid_amount), 0) AS total_paid_amount,
            COALESCE(SUM(t.change_amount), 0) AS total_change_amount,
            COALESCE(SUM(t.discount_amount), 0) AS total_discount_amount, -- Tambahkan ini
            COALESCE(SUM(t.tax_amount), 0) AS total_tax_amount,         -- Tambahkan ini
            COALESCE(SUM(ti.quantity * ti.item_price), 0) AS total_sales_amount_bruto -- Hitung Bruto dari item
        FROM
            transactions t
        JOIN
            transaction_items ti ON t.id = ti.transaction_id -- Join untuk menghitung bruto
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

    // Perlu GROUP BY jika ada join dengan one-to-many relationship (transaction_items)
    // Namun, karena kita SUM di atas, kita perlu memastikan setiap transaksi dihitung sekali
    // Solusi yang lebih baik adalah menggunakan subquery atau CTE jika data items sangat banyak
    // Untuk ringkasan, kita bisa menganggap setiap baris transaksi sudah unik untuk SUM total_amount, discount, tax
    // Untuk total_sales_amount_bruto, kita SUM semua item.
    // Jika ada duplikasi transaksi karena join, ini bisa bermasalah.
    // Mari kita coba dengan DISTINCT ON jika perlu, atau pastikan SUM(ti.quantity * ti.item_price)
    // hanya menghitung total bruto untuk setiap transaksi sekali.

    // Pendekatan yang lebih aman untuk total_sales_amount_bruto:
    // Hitung bruto per transaksi, lalu SUM hasilnya.
    // Untuk kesederhanaan saat ini, kita akan asumsikan SUM(ti.quantity * ti.item_price) akan bekerja untuk ringkasan.
    // Jika ada masalah, kita bisa revisi ini dengan subquery.
    query += ` GROUP BY t.id, t.total_amount, t.paid_amount, t.change_amount, t.discount_amount, t.tax_amount`; // Group by untuk menghindari duplikasi saat SUM ti.quantity * ti.item_price

    try {
        const result = await pool.query(query, queryParams);
        // Karena ada GROUP BY t.id, kita perlu SUM lagi di JS jika ingin satu baris ringkasan
        // Atau ubah query agar hanya menghasilkan 1 baris ringkasan.
        // Mari kita ubah query untuk menghasilkan 1 baris ringkasan tanpa GROUP BY ID transaksi.
        // Ini akan memerlukan SUM dari SUM jika ada join.

        // Revisi query untuk getSalesSummary agar menghasilkan satu baris ringkasan
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
