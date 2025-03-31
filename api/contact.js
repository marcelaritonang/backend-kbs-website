const nodemailer = require('nodemailer');

// Konfigurasi email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Endpoint handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Tambahkan GET handler untuk testing
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Contact API endpoint is working!',
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validasi metode POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { name, email, phone, subject, message } = req.body;
    
    // Validasi input
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Semua field wajib diisi kecuali nomor telepon' 
      });
    }

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
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'karyabangunsemestas@gmail.com',
      subject: `[Pesan Website] ${subject}`,
      html: emailContent
    });

    return res.status(200).json({
      success: true,
      message: 'Pesan berhasil dikirim!'
    });
  } catch (error) {
    console.error('Error sending email:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim pesan, silakan coba lagi nanti.',
      error: error.message
    });
  }
};