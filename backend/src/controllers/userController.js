const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Fungsi untuk pendaftaran pengguna baru
exports.registerUser = async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at',
            [username, hashedPassword, role]
        );
        res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Error registering user:', err.message);
        if (err.code === '23505') { // PostgreSQL unique violation error code
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Server error during registration' });
    }
};

// Fungsi untuk login pengguna
exports.loginUser = async (req, res) => {
    const { username, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key', // Gunakan JWT_SECRET dari .env atau default
            { expiresIn: '1h' }
        );

        res.json({ message: 'Logged in successfully', token, username: user.username, role: user.role });
    } catch (err) {
        console.error('Error logging in user:', err.message);
        res.status(500).json({ error: 'Server error during login' });
    }
};

// Mendapatkan semua pengguna (hanya admin)
exports.getAllUsers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching all users:', err.message);
        res.status(500).json({ error: 'Server error fetching users' });
    }
};

// Mendapatkan pengguna berdasarkan ID (admin atau pengguna itu sendiri)
exports.getUserById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT id, username, role, created_at FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        // Pastikan hanya admin atau pengguna itu sendiri yang bisa melihat detail lengkap
        if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
            return res.status(403).json({ message: 'Forbidden: You do not have permission to access this user.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error fetching user by ID:', err.message);
        res.status(500).json({ error: 'Server error fetching user' });
    }
};

// Memperbarui pengguna (admin atau pengguna itu sendiri)
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { username, password, role } = req.body;
    let query = 'UPDATE users SET username = $1, role = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING id, username, role, updated_at';
    let queryParams = [username, role, id];
    let paramIndex = 4;

    // Pastikan hanya admin atau pengguna itu sendiri yang bisa mengupdate
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
        return res.status(403).json({ message: 'Forbidden: You do not have permission to update this user.' });
    }

    try {
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            query = 'UPDATE users SET username = $1, password_hash = $2, role = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, username, role, updated_at';
            queryParams = [username, hashedPassword, role, id];
        }

        const result = await pool.query(query, queryParams);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully', user: result.rows[0] });
    } catch (err) {
        console.error('Error updating user:', err.message);
        if (err.code === '23505') { // PostgreSQL unique violation error code
            return res.status(400).json({ error: 'Username already exists' });
        }
        res.status(500).json({ error: 'Server error updating user' });
    }
};

// Menghapus pengguna (hanya admin)
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        // Pastikan admin tidak bisa menghapus dirinya sendiri
        if (req.user.id === parseInt(id)) {
            return res.status(400).json({ message: 'You cannot delete your own user account.' });
        }

        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully', id: id });
    } catch (err) {
        console.error('Error deleting user:', err.message);
        res.status(500).json({ error: 'Server error deleting user' });
    }
};
