const pool = require('../db');
const bcrypt = require('bcrypt'); // Pastikan ini menggunakan 'bcrypt'
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware'); // Pastikan ini benar path-nya

// Mendapatkan semua pengguna (hanya admin)
exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, role FROM users');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching users:', err.message);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

// Mendapatkan pengguna berdasarkan ID (hanya admin)
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT id, username, role FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user by ID:', err.message);
        res.status(500).json({ error: 'Server error fetching user' });
    }
};

// Memperbarui pengguna (hanya admin)
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    try {
        let updateFields = [];
        let queryParams = [id];
        let paramIndex = 2;

        if (username) {
            updateFields.push(`username = $${paramIndex++}`);
            queryParams.push(username);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push(`password_hash = $${paramIndex++}`);
            queryParams.push(hashedPassword);
        }
        if (role) {
            updateFields.push(`role = $${paramIndex++}`);
            queryParams.push(role);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        const queryText = `UPDATE users SET ${updateFields.join(', ')} WHERE id = $1 RETURNING id, username, role`;
        const result = await pool.query(queryText, queryParams);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Error updating user:', err.message);
        if (err.code === '23505') { // Duplicate username error code
            return res.status(409).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Server error updating user' });
    }
};

// Menghapus pengguna (hanya admin)
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully', id: result.rows[0].id });
    } catch (err) {
        console.error('Error deleting user:', err.message);
        res.status(500).json({ error: 'Server error deleting user' });
    }
};
