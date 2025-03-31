// src/app.js
const express = require('express');
const cors = require('cors');
const contactRoutes = require('./routes/contactRoute');
// Import routes lainnya jika ada

const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://karyabangunsemesta.vercel.app', 'https://www.karyabangunsemesta.com'] 
    : '*',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/contact', contactRoutes);
// Tambahkan routes lainnya jika ada

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).send('OK');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server' 
  });
});

// Untuk lingkungan non-serverless (development)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
  });
}

module.exports = app;