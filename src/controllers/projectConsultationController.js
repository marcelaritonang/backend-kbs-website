// src/controllers/projectConsultationController.js
const emailService = require('../utils/emailService');
const pool = require('../config/database');

exports.submitProjectConsultation = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      company, 
      projectType, 
      projectDetails, 
      budget, 
      timeline 
    } = req.body;
    
    // Validasi input dasar
    if (!name || !email || !phone || !projectDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mohon lengkapi data yang diperlukan (nama, email, telepon, dan detail proyek)'
      });
    }
    
    // Format email message
    const emailContent = `
      <h2>Permintaan Konsultasi Proyek Baru</h2>
      <p><strong>Nama:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Telepon:</strong> ${phone}</p>
      ${company ? `<p><strong>Perusahaan:</strong> ${company}</p>` : ''}
      ${projectType ? `<p><strong>Jenis Proyek:</strong> ${projectType}</p>` : ''}
      <p><strong>Detail Proyek:</strong></p>
      <p>${projectDetails.replace(/\n/g, '<br>')}</p>
      ${budget ? `<p><strong>Anggaran:</strong> ${budget}</p>` : ''}
      ${timeline ? `<p><strong>Tenggat Waktu/Timeline:</strong> ${timeline}</p>` : ''}
      <p>Dikirim pada: ${new Date().toLocaleString('id-ID')}</p>
    `;
    
    // Kirim email
    await emailService.sendEmail({
      to: 'karyabangunsemestas@gmail.com', // Email penerima
      subject: `[Konsultasi Proyek] Permintaan dari ${name}`,
      html: emailContent
    });
    
    // Simpan ke database (opsional, tergantung kebutuhan)
    // Karena tabel contact_messages tidak memiliki kolom khusus untuk data konsultasi proyek,
    // kita bisa menyesuaikan data atau membuat tabel baru nanti jika diperlukan
    const connection = await pool.getConnection();
    try {
      await connection.query(
        'INSERT INTO contact_messages (name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [name, email, phone, `Konsultasi Proyek: ${projectType || 'Umum'}`, projectDetails]
      );
    } finally {
      connection.release();
    }
    
    return res.status(200).json({
      success: true,
      message: 'Permintaan konsultasi proyek berhasil dikirim!'
    });
  } catch (error) {
    console.error('Error submitting project consultation:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim permintaan konsultasi. Silakan coba lagi nanti.'
    });
  }
};