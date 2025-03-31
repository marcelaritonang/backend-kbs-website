const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Set CORS headers yang lebih lengkap
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '3600');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Cek method
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method Not Allowed' 
    });
  }
  
  // Endpoint test untuk GET request
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Contact API endpoint is working!',
      timestamp: new Date().toISOString(),
      env_check: {
        email_user_exists: !!process.env.EMAIL_USER,
        email_password_exists: !!process.env.EMAIL_APP_PASSWORD
      }
    });
  }

  try {
    console.log('Received request:', req.body);
    console.log('Environment variables check:', {
      EMAIL_USER_SET: !!process.env.EMAIL_USER,
      EMAIL_APP_PASSWORD_SET: !!process.env.EMAIL_APP_PASSWORD,
      EMAIL_USER_LENGTH: process.env.EMAIL_USER ? process.env.EMAIL_USER.length : 0,
      EMAIL_APP_PASSWORD_LENGTH: process.env.EMAIL_APP_PASSWORD ? process.env.EMAIL_APP_PASSWORD.length : 0
    });
    
    // Validasi input
    const { name, email, phone, subject, message } = req.body || {};
    
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Semua field wajib diisi kecuali nomor telepon' 
      });
    }

    // Konfigurasi email transporter dengan service bukan host/port
    const transporter = nodemailer.createTransport({
      service: 'gmail',  // Menggunakan service alih-alih host/port
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Pastikan ini adalah App Password dari Google
      },
      debug: true,  // Aktifkan debug mode
      logger: true  // Aktifkan logging
    });

    // Format email message
    const emailContent = `
      <h2>Pesan Baru dari Website KBS</h2>
      <p><strong>Nama:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Telepon:</strong> ${phone || 'Tidak disertakan'}</p>
      <p><strong>Subjek:</strong> ${subject}</p>
      <hr />
      <h3>Pesan:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `;
    
    // Kirim email
    try {
      // Verifikasi konfigurasi SMTP terlebih dahulu
      console.log('Verifying SMTP configuration...');
      const verification = await new Promise((resolve, reject) => {
        transporter.verify(function(error, success) {
          if (error) {
            console.error('SMTP verification failed:', error);
            reject(error);
          } else {
            console.log('SMTP server is ready to take our messages');
            resolve(success);
          }
        });
      });
      
      console.log('SMTP verification result:', verification);
      
      // Kirim email
      const mailOptions = {
        from: `"Website KBS" <${process.env.EMAIL_USER}>`,
        to: 'karyabangunsemestas@gmail.com',
        subject: `[Pesan Website] ${subject}`,
        html: emailContent,
        replyTo: email  // Set reply-to sebagai email pengirim
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
        message: 'Pesan berhasil dikirim!'
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
      message: 'Gagal mengirim pesan, silakan coba lagi nanti.',
      error: error.message
    });
  }
};