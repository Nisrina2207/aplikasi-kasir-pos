// backend/src/controllers/menuController.js
const pool = require('../config/db'); // Mengimpor koneksi database

const getAllMenus = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM menus ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Error fetching menus:", err);
        res.status(500).json({ message: 'Gagal mengambil data menu.' });
    }
};

const createMenu = async (req, res) => {
    const { name, price, description, category, image_url } = req.body;
    if (!name || !price) {
        return res.status(400).json({ message: 'Nama dan harga menu harus diisi.' });
    }
    try {
        const result = await pool.query(
            'INSERT INTO menus (name, price, description, category, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, price, description, category, image_url]
        );
        res.status(201).json({ message: 'Menu berhasil ditambahkan', menu: result.rows[0] });
    } catch (err) {
        console.error("Error creating menu:", err);
        if (err.code === '23505') { // Duplicate name error code
            return res.status(400).json({ message: 'Nama menu sudah ada.' });
        }
        res.status(500).json({ message: 'Gagal menambahkan menu.' });
    }
};

const updateMenu = async (req, res) => {
    const { id } = req.params; // ID menu dari URL parameter
    const { name, price, description, category, image_url, is_available } = req.body;
    if (!name || !price) {
        return res.status(400).json({ message: 'Nama dan harga menu harus diisi.' });
    }
    try {
        const result = await pool.query(
            'UPDATE menus SET name = $1, price = $2, description = $3, category = $4, image_url = $5, is_available = $6, updated_at = NOW() WHERE id = $7 RETURNING *',
            [name, price, description, category, image_url, is_available, id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Menu tidak ditemukan.' });
        }
        res.json({ message: 'Menu berhasil diperbarui', menu: result.rows[0] });
    } catch (err) {
        console.error("Error updating menu:", err);
        if (err.code === '23505') { // Duplicate name error code
            return res.status(400).json({ message: 'Nama menu sudah ada.' });
        }
        res.status(500).json({ message: 'Gagal memperbarui menu.' });
    }
};

const deleteMenu = async (req, res) => {
    const { id } = req.params; // ID menu dari URL parameter
    try {
        const result = await pool.query('DELETE FROM menus WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Menu tidak ditemukan.' });
        }
        res.json({ message: 'Menu berhasil dihapus.' });
    } catch (err) {
        console.error("Error deleting menu:", err);
        res.status(500).json({ message: 'Gagal menghapus menu.' });
    }
};

module.exports = { getAllMenus, createMenu, updateMenu, deleteMenu };