// src/routes/contactRoute.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');

// Route untuk mengirim pesan kontak
router.post('/send-message', contactController.sendContactMessage);

module.exports = router;