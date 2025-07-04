// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router(); // Membuat router baru
const authController = require('../controllers/authController'); // Mengimpor controller

router.post('/register', authController.register); // Rute untuk pendaftaran user baru
router.post('/login', authController.login);       // Rute untuk login user

module.exports = router;