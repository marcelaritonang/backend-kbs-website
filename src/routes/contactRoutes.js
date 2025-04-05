// src/routes/contactRoute.js
const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const projectConsultationController = require('../controllers/projectConsultationController');

// Route untuk mengirim pesan kontak
router.post('/send-message', contactController.sendContactMessage);

// Route untuk konsultasi proyek
router.post('/project-consultation', projectConsultationController.submitProjectConsultation);

module.exports = router;