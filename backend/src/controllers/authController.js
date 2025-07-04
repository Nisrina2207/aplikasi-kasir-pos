    const pool = require('../db');
    const bcrypt = require('bcrypt'); // PERUBAHAN: Ubah dari 'bcryptjs' menjadi 'bcrypt'
    const jwt = require('jsonwebtoken');

    // Mendaftar pengguna baru
    exports.register = async (req, res) => {
        const { username, password, role } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await pool.query(
                'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
                [username, hashedPassword, role || 'cashier'] // Default role 'cashier'
            );
            res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
        } catch (err) {
            console.error('Error registering user:', err.message);
            if (err.code === '23505') { // Duplicate username error code
                return res.status(409).json({ error: 'Username already exists' });
            }
            res.status(500).json({ error: 'Server error during registration' });
        }
    };

    // Login pengguna
    exports.login = async (req, res) => {
        const { username, password } = req.body;
        try {
            const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
            if (userResult.rows.length === 0) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const user = userResult.rows[0];
            const isPasswordValid = await bcrypt.compare(password, user.password_hash);

            if (!isPasswordValid) {
                return res.status(400).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '1h' } // Token berlaku 1 jam
            );

            res.json({ message: 'Logged in successfully', token, user: { id: user.id, username: user.username, role: user.role } });

        } catch (err) {
            console.error('Error logging in:', err.message);
            res.status(500).json({ error: 'Server error during login' });
        }
    };

    // Mendapatkan profil pengguna (hanya untuk pengguna yang diautentikasi)
    exports.getProfile = async (req, res) => {
        try {
            // req.user datang dari middleware authMiddleware
            const user = await pool.query('SELECT id, username, role FROM users WHERE id = $1', [req.user.id]);
            if (user.rows.length === 0) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user.rows[0]);
        } catch (err) {
            console.error('Error fetching user profile:', err.message);
            res.status(500).json({ error: 'Server error fetching profile' });
        }
    };
    