
const emailService = require('../utils/emailService');

exports.sendContactMessage = async (req, res) => {
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
    await emailService.sendEmail({
      to: 'karyabangunsemestas@gmail.com', // Email penerima
      subject: `[Pesan Website] ${subject}`,
      html: emailContent
    });
    
    return res.status(200).json({
      success: true,
      message: 'Pesan berhasil dikirim!'
    });
  } catch (error) {
    console.error('Error sending contact message:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi nanti.'
    });
  }
};