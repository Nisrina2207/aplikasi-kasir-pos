// aplikasi-kasir/backend/controllers/categoryController.js
const pool = require('../db'); // Pastikan path ini benar sesuai lokasi db.js Anda

// Mendapatkan semua kategori
exports.getAllCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Server error fetching categories' });
    }
};

// Mendapatkan kategori berdasarkan ID
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching category by ID:', err);
        res.status(500).json({ message: 'Server error fetching category' });
    }
};

// Membuat kategori baru
exports.createCategory = async (req, res) => {
    const errors = validationResult(req); // Gunakan validationResult
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    try {
        // Cek apakah nama kategori sudah ada
        const existingCategory = await pool.query('SELECT id FROM categories WHERE name = $1', [name]);
        if (existingCategory.rows.length > 0) {
            return res.status(409).json({ message: 'Category with this name already exists' });
        }

        const result = await pool.query(
            'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *', // Pastikan 'description' ada di tabel
            [name, description || null] // Kirim null jika description kosong
        );
        res.status(201).json(result.rows[0]); // Mengembalikan objek kategori langsung
    } catch (err) {
        console.error('Error creating category:', err);
        res.status(500).json({ message: 'Server error creating category' });
    }
};

// Memperbarui kategori
exports.updateCategory = async (req, res) => {
    const errors = validationResult(req); // Gunakan validationResult
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, description } = req.body;
    try {
        // Cek apakah nama kategori sudah ada untuk kategori lain (saat update)
        if (name) {
            const existingCategory = await pool.query('SELECT id FROM categories WHERE name = $1 AND id != $2', [name, id]);
            if (existingCategory.rows.length > 0) {
                return res.status(409).json({ message: 'Category with this name already exists for another category' });
            }
        }

        const result = await pool.query(
            'UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *', // Pastikan 'description' ada di tabel
            [name, description || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(result.rows[0]); // Mengembalikan objek kategori langsung
    } catch (err) {
        console.error('Error updating category:', err);
        res.status(500).json({ message: 'Server error updating category' });
    }
};

// Menghapus kategori
exports.deleteCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.status(200).json({ message: 'Category deleted successfully', id: id });
    } catch (err) {
        console.error('Error deleting category:', err);
        // Error code '23503' adalah foreign key violation
        if (err.code === '23503') {
            return res.status(400).json({ error: 'Cannot delete category: products are still associated with it.' });
        }
        res.status(500).json({ error: 'Server error deleting category' });
    }
};