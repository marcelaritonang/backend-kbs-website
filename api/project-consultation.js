const nodemailer = require('nodemailer');

// Enable detailed debugging
const DEBUG = true;

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
  
  // Check method
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method Not Allowed' 
    });
  }
  
  // Test endpoint for GET request
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Project Consultation API endpoint is working!',
      timestamp: new Date().toISOString(),
      env_check: {
        email_user_exists: !!process.env.EMAIL_USER,
        email_password_exists: !!process.env.EMAIL_APP_PASSWORD
      }
    });
  }

  try {
    // Log the request body for debugging
    if (DEBUG) {
      console.log('Received project consultation request:');
      console.log(JSON.stringify(req.body, null, 2));
    }
    
    // Extract fields from request body with basic validation
    const { name, email, phone, company, projectType, projectDetails, subject } = req.body || {};
    
    // Log individual fields for debugging
    if (DEBUG) {
      console.log('Extracted fields:');
      console.log({
        name: name || 'MISSING',
        email: email || 'MISSING',
        phone: phone || 'OPTIONAL',
        company: company || 'OPTIONAL',
        projectType: projectType || 'OPTIONAL',
        projectDetails: projectDetails ? (projectDetails.substring(0, 50) + '...') : 'MISSING',
        subject: subject || 'OPTIONAL'
      });
    }
    
    // Simplified validation with better error message
    // Only require name, email and projectDetails
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nama harus diisi' 
      });
    }
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email harus diisi' 
      });
    }
    
    if (!projectDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'Detail proyek harus diisi' 
      });
    }

    // Create email transporter
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });

    // Format email content
    const emailContent = `
      <h2>Permintaan Konsultasi Proyek Baru</h2>
      <p><strong>Nama:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Telepon:</strong> ${phone || 'Tidak disertakan'}</p>
      ${company ? `<p><strong>Perusahaan:</strong> ${company}</p>` : ''}
      ${projectType ? `<p><strong>Jenis Proyek:</strong> ${projectType}</p>` : ''}
      <hr />
      <h3>Detail Proyek:</h3>
      <div style="white-space: pre-line">${projectDetails}</div>
    `;
    
    // Try to send email
    try {
      const mailOptions = {
        from: `"Website KBS" <${process.env.EMAIL_USER}>`,
        to: 'karyabangunsemestas@gmail.com',
        cc: process.env.EMAIL_USER, // CC yourself to ensure delivery
        subject: subject || `[Konsultasi Proyek] Permintaan dari ${name}`,
        html: emailContent,
        replyTo: email,  // Set reply-to as sender's email
        text: `
Permintaan Konsultasi Proyek Baru

Nama: ${name}
Email: ${email}
Telepon: ${phone || 'Tidak disertakan'}
${company ? `Perusahaan: ${company}\n` : ''}
${projectType ? `Jenis Proyek: ${projectType}\n` : ''}

Detail Proyek:
${projectDetails.replace(/<br>/g, '\n')}
        `
      };
      
      if (DEBUG) {
        console.log('Attempting to send email with options:', {
          from: mailOptions.from,
          to: mailOptions.to,
          cc: mailOptions.cc,
          subject: mailOptions.subject
        });
      }
      
      const info = await transporter.sendMail(mailOptions);
      
      if (DEBUG) {
        console.log('Email sent successfully:', info.messageId);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Permintaan konsultasi proyek berhasil dikirim!',
        details: DEBUG ? { messageId: info.messageId } : undefined
      });
    } catch (emailError) {
      // Log the error but don't fail the request
      console.error('Failed to send email:', emailError);
      
      // Return an error response
      return res.status(500).json({
        success: false,
        message: 'Sistem email sedang mengalami gangguan. Tim kami akan segera menghubungi Anda.',
        error: DEBUG ? emailError.message : undefined
      });
    }
  } catch (error) {
    // Log the full error in debug mode
    if (DEBUG) {
      console.error('Server error:', error);
    }
    
    // Return a friendly error to the client
    return res.status(500).json({
      success: false,
      message: 'Gagal memproses permintaan konsultasi. Silakan coba lagi nanti.',
      error: DEBUG ? error.message : undefined
    });
  }
};
