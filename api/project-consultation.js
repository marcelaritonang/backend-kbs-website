// api/project-consultation.js
const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '3600');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Cek method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method Not Allowed' 
    });
  }

  try {
    console.log('Received project consultation request:', req.body);
    
    // Validasi input
    const { 
      name, 
      email, 
      phone, 
      company, 
      projectType, 
      projectDetails,
      subject 
    } = req.body || {};
    
    if (!name || !email || !phone || !projectDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mohon lengkapi data yang diperlukan (nama, email, telepon, dan detail proyek)' 
      });
    }

    // Konfigurasi email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      },
      debug: true,
      logger: true
    });

    // Format email message
    const emailContent = `
      <h2>Permintaan Konsultasi Proyek Baru</h2>
      <p><strong>Nama:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Telepon:</strong> ${phone}</p>
      ${company ? `<p><strong>Perusahaan:</strong> ${company}</p>` : ''}
      ${projectType ? `<p><strong>Jenis Proyek:</strong> ${projectType}</p>` : ''}
      <p><strong>Detail Proyek:</strong></p>
      <p style="white-space: pre-line;">${projectDetails}</p>
      <p>Dikirim pada: ${new Date().toLocaleString('id-ID')}</p>
    `;
    
    // Kirim email
    try {
      // Verifikasi konfigurasi SMTP terlebih dahulu
      console.log('Verifying SMTP configuration...');
      await new Promise((resolve, reject) => {
        transporter.verify(function(error, success) {
          if (error) {
            console.error('SMTP verification failed:', error);
            reject(error);
          } else {
            console.log('SMTP server is ready');
            resolve(success);
          }
        });
      });
      
      // Kirim email
      const mailOptions = {
        from: `"Website KBS" <${process.env.EMAIL_USER}>`,
        to: 'karyabangunsemestas@gmail.com',
        subject: subject || `[Konsultasi Proyek] Permintaan dari ${name}`,
        html: emailContent,
        replyTo: email
      };
      
      console.log('Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject
      });
      
      const info = await transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', info.messageId);
      
      return res.status(200).json({
        success: true,
        message: 'Permintaan konsultasi proyek berhasil dikirim!'
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengirim email. Silakan coba lagi nanti.',
        error: emailError.message
      });
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim permintaan konsultasi, silakan coba lagi nanti.',
      error: error.message
    });
  }
};