// backend/src/controllers/orderController.js
const pool = require('../config/db'); // Mengimpor koneksi database

const createOrder = async (req, res) => {
    const { customer_name, table_number, items } = req.body;
    const user_id = req.user.id; // ID kasir yang login, diambil dari token JWT oleh middleware

    if (!customer_name || !items || items.length === 0) {
        return res.status(400).json({ message: 'Nama pelanggan dan item pesanan harus diisi.' });
    }

    // Memulai transaksi database
    const client = await pool.connect();
    try {
        await client.query('BEGIN'); // Mulai transaksi

        let total_amount = 0;
        // Loop untuk memvalidasi item dan menghitung total
        for (const item of items) {
            const menuResult = await client.query('SELECT price FROM menus WHERE id = $1', [item.menu_id]);
            if (menuResult.rows.length === 0) {
                throw new Error(`Menu dengan ID ${item.menu_id} tidak ditemukan.`);
            }
            const menuPrice = parseFloat(menuResult.rows[0].price);
            if (isNaN(item.quantity) || item.quantity <= 0) {
                 throw new Error(`Kuantitas untuk menu ID ${item.menu_id} tidak valid.`);
            }
            const subtotal = menuPrice * item.quantity;
            total_amount += subtotal;
            item.price_at_order = menuPrice; // Simpan harga saat pesanan dibuat (untuk laporan nanti)
            item.subtotal = subtotal;
        }

        // Masukkan data pesanan ke tabel orders
        const orderResult = await client.query(
            'INSERT INTO orders (customer_name, table_number, user_id, total_amount, payment_status, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [customer_name, table_number, user_id, total_amount, 'pending', 'new']
        );
        const newOrder = orderResult.rows[0];

        // Masukkan setiap item pesanan ke tabel order_items
        for (const item of items) {
            await client.query(
                'INSERT INTO order_items (order_id, menu_id, quantity, price_at_order, subtotal) VALUES ($1, $2, $3, $4, $5)',
                [newOrder.id, item.menu_id, item.quantity, item.price_at_order, item.subtotal]
            );
        }

        await client.query('COMMIT'); // Commit transaksi jika semua berhasil
        res.status(201).json({ message: 'Pesanan berhasil dibuat', order: newOrder });
    } catch (err) {
        await client.query('ROLLBACK'); // Rollback transaksi jika ada error
        console.error('Error creating order:', err);
        res.status(500).json({ message: 'Gagal membuat pesanan.', error: err.message });
    } finally {
        client.release(); // Pastikan koneksi dikembalikan ke pool
    }
};

const getOrderDetails = async (req, res) => {
    const { id } = req.params; // ID pesanan dari URL parameter
    try {
        // Ambil detail pesanan dan nama kasir
        const orderResult = await pool.query(
            `SELECT o.*, u.username AS kasir_name
             FROM orders o
             JOIN users u ON o.user_id = u.id
             WHERE o.id = $1`,
            [id]
        );
        if (orderResult.rows.length === 0) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
        }
        const order = orderResult.rows[0];

        // Ambil detail item dalam pesanan, termasuk nama menu dan URL gambar
        const itemsResult = await pool.query(
            `SELECT oi.*, m.name AS menu_name, m.image_url
             FROM order_items oi
             JOIN menus m ON oi.menu_id = m.id
             WHERE oi.order_id = $1`,
            [id]
        );
        order.items = itemsResult.rows; // Tambahkan item ke objek pesanan

        res.json(order);
    } catch (err) {
        console.error("Error fetching order details:", err);
        res.status(500).json({ message: 'Gagal mengambil detail pesanan.' });
    }
};

const updateOrderStatus = async (req, res) => {
    const { id } = req.params; // ID pesanan dari URL parameter
    const { payment_status, status } = req.body; // Status pembayaran atau status pesanan yang akan diupdate
    try {
        const result = await pool.query(
            'UPDATE orders SET payment_status = COALESCE($1, payment_status), status = COALESCE($2, status) WHERE id = $3 RETURNING *',
            [payment_status, status, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Pesanan tidak ditemukan.' });
        }
        res.json({ message: 'Status pesanan berhasil diperbarui', order: result.rows[0] });
    } catch (err) {
        console.error("Error updating order status:", err);
        res.status(500).json({ message: 'Gagal memperbarui status pesanan.' });
    }
};

module.exports = { createOrder, getOrderDetails, updateOrderStatus };