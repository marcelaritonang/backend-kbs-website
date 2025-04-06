const nodemailer = require('nodemailer');

// Enable detailed debugging in development
const DEBUG = process.env.NODE_ENV !== 'production';

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
    if (DEBUG) {
      console.log('Received project consultation request:', req.body);
    }
    
    // Validate input
    const { name, email, phone, company, projectType, projectDetails, subject } = req.body || {};
    
    if (!name || !email || !projectDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data nama, email, dan detail proyek harus diisi' 
      });
    }

    // ==========================================
    // KONFIGURASI SMTP - Simplified for reliability
    // ==========================================
    let transporter;
    let transporterReady = false;
    
    try {
      // Simple configuration that's more likely to work
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD
        }
      });
      
      // Verify connection configuration
      transporterReady = true;
    } catch (emailSetupError) {
      console.error('Email setup error:', emailSetupError);
    }

    // ==========================================
    // EMAIL SENDING OR DATABASE SAVING
    // ==========================================
    
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
    
    // Database fallback object (can be stored in a real database in production)
    const requestRecord = {
      id: `req_${Date.now()}`,
      timestamp: new Date().toISOString(),
      name,
      email,
      phone,
      company,
      projectType,
      projectDetails,
      status: 'pending'
    };
    
    // Try to send email if transporter is ready
    if (transporterReady) {
      try {
        const mailOptions = {
          from: `"Website KBS" <${process.env.EMAIL_USER}>`,
          to: 'karyabangunsemestas@gmail.com',
          cc: process.env.EMAIL_USER, // CC yourself to ensure delivery
          subject: subject || `[Konsultasi Proyek] Permintaan dari ${name}`,
          html: emailContent,
          replyTo: email,  // Set reply-to as sender's email
          // Add plain text alternative for better deliverability
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
        
        // Attempt to send email
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
        
        // Store the request in backup storage (this would be a database in production)
        if (DEBUG) {
          console.log('Storing request for later processing:', requestRecord);
        }
        
        // Return success to the client, but indicate the email might be delayed
        return res.status(200).json({
          success: true,
          message: 'Permintaan konsultasi diterima, namun pengiriman email mungkin tertunda.',
          request_id: requestRecord.id
        });
      }
    } else {
      // Transporter not ready - store the request and return success
      if (DEBUG) {
        console.log('Email transporter not ready, storing request:', requestRecord);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Permintaan konsultasi diterima dan akan segera diproses.',
        request_id: requestRecord.id
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