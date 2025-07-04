const pool = require('../db'); // Impor koneksi database

// Mendapatkan semua produk
exports.getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching products:', err.message);
    res.status(500).json({ error: 'Server error fetching products' });
  }
};

// Mendapatkan produk berdasarkan ID
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching product by ID:', err.message);
    res.status(500).json({ error: 'Server error fetching product' });
  }
};

// Membuat produk baru (hanya admin)
exports.createProduct = async (req, res) => {
  const { name, description, price, stock, barcode, category_id } = req.body;
  try {
    // Validasi dasar
    if (!name || price === undefined || stock === undefined) { // Perbaikan: price bisa 0, tapi tidak boleh undefined/null
      return res.status(400).json({ message: 'Name, price, and stock are required.' });
    }
    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) { // Perbaikan: price bisa 0, tidak harus > 0
        return res.status(400).json({ message: 'Invalid price or stock value. Must be a number >= 0.' });
    }

    const newProduct = await pool.query(
      'INSERT INTO products (name, description, price, stock, barcode, category_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, stock, barcode, category_id]
    );
    res.status(201).json({ message: 'Product created successfully', product: newProduct.rows[0] });
  } catch (err) {
        // --- START PERUBAHAN UTAMA UNTUK DEBUGGING LEBIH DETAIL ---
        console.error('SEVERE ERROR: Full PostgreSQL error object for createProduct:', err);
        console.error('Request Body that caused the error:', req.body);

    if (err.code === '23505') { // Unique violation for barcode
        return res.status(400).json({ error: 'Barcode already exists. Please use a unique barcode.' });
    }
        if (err.code === '23502') { // Not-null violation (jika ada kolom NOT NULL yang tidak diisi)
            // err.column akan berisi nama kolom yang menyebabkan violation
        return res.status(400).json({ error: `Missing required field: '${err.column}'. Please provide a value.` });
    }
        if (err.code === '23503') { // Foreign key violation (kategori tidak ditemukan jika diisi ID yang tidak ada)
        return res.status(400).json({ error: `Invalid category ID: category with ID ${req.body.category_id} does not exist.` });
    }
    res.status(500).json({ error: 'Server error creating product', details: err.message });
        // --- END PERUBAHAN UTAMA ---
  }
};

// Memperbarui produk (hanya admin)
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, barcode, category_id } = req.body;
  try {
    // Validasi dasar untuk update juga
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Name, price, and stock are required for update.' });
    }
    if (isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
        return res.status(400).json({ message: 'Invalid price or stock value for update. Must be a number >= 0.' });
    }

    const updatedProduct = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, stock = $4, barcode = $5, category_id = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, description, price, stock, barcode, category_id, id]
    );

    if (updatedProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product updated successfully', product: updatedProduct.rows[0] });
  } catch (err) {
        // --- START PERUBAHAN UTAMA UNTUK DEBUGGING LEBIH DETAIL PADA UPDATE ---
        console.error('SEVERE ERROR: Full PostgreSQL error object for updateProduct:', err);
        console.error('Request Body for failed product update (ID: %s):', id, req.body);

    if (err.code === '23505') { // Unique violation for barcode
        return res.status(400).json({ error: 'Barcode already exists for another product.' });
    }
        if (err.code === '23502') { // Not-null violation
        return res.status(400).json({ error: `Missing required field for update: '${err.column}'.` });
    }
        if (err.code === '23503') { // Foreign key violation
        return res.status(400).json({ error: `Invalid category ID for update: category with ID ${req.body.category_id} does not exist.` });
    }
    res.status(500).json({ error: 'Server error updating product', details: err.message });
        // --- END PERUBAHAN UTAMA ---
  }
};

// Menghapus produk (hanya admin)
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully', id: id });
  } catch (err) {
    console.error('Error deleting product:', err.message);
    if (err.code === '23503') { // Foreign key violation (if product is in transaction_items)
        return res.status(400).json({ error: 'Cannot delete product: it is still part of existing transactions.' });
    }
    res.status(500).json({ error: 'Server error deleting product' });
  }
};