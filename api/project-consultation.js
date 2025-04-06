const nodemailer = require('nodemailer');

// Enable detailed debugging
const DEBUG = true;

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
      console.log('Environment variables check:', {
        EMAIL_USER_SET: !!process.env.EMAIL_USER,
        EMAIL_APP_PASSWORD_SET: !!process.env.EMAIL_APP_PASSWORD,
        EMAIL_USER_LENGTH: process.env.EMAIL_USER ? process.env.EMAIL_USER.length : 0,
        EMAIL_APP_PASSWORD_LENGTH: process.env.EMAIL_APP_PASSWORD ? process.env.EMAIL_APP_PASSWORD.length : 0
      });
    }
    
    // Validasi input
    const { name, email, phone, company, projectType, projectDetails, subject } = req.body || {};
    
    if (!name || !email || !projectDetails) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data nama, email, dan detail proyek harus diisi' 
      });
    }

    // ==========================================
    // KONFIGURASI SMTP
    // ==========================================
    
    // Try different SMTP configuration options
    // Option 1: Gmail with direct SMTP settings
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Make sure this is an App Password
      },
      tls: {
        rejectUnauthorized: false // Less strict about certificates
      },
      debug: DEBUG, // Enable debug output
      logger: DEBUG  // Log information
    });

    // Verify SMTP configuration
    try {
      console.log('Verifying SMTP configuration...');
      await new Promise((resolve, reject) => {
        transporter.verify(function(error, success) {
          if (error) {
            console.error('SMTP verification failed:', error);
            reject(error);
          } else {
            console.log('SMTP server is ready to take messages');
            resolve(success);
          }
        });
      });
    } catch (verifyError) {
      console.error('SMTP verification failed. Trying alternate configuration...');
      
      // Option 2: Gmail with 'service' parameter
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD
        },
        debug: DEBUG,
        logger: DEBUG
      });
      
      try {
        await new Promise((resolve, reject) => {
          transporter.verify(function(error, success) {
            if (error) {
              console.error('Alternate SMTP verification failed:', error);
              reject(error);
            } else {
              console.log('Alternate SMTP configuration is ready');
              resolve(success);
            }
          });
        });
      } catch (altVerifyError) {
        console.error('All SMTP verification attempts failed');
        throw new Error('Failed to configure email transport');
      }
    }

    // ==========================================
    // SEND TEST EMAIL FIRST (debug mode only)
    // ==========================================
    if (DEBUG) {
      try {
        const testMailOptions = {
          from: `"KBS Website TEST" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER, // Send to self
          subject: `[TEST] Email Configuration Check ${new Date().toISOString()}`,
          html: `
            <h2>Test Email</h2>
            <p>This is a test email to confirm email delivery is working.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
          `
        };
        
        console.log('Sending test email to self...');
        const testInfo = await transporter.sendMail(testMailOptions);
        console.log('Test email sent successfully:', testInfo.messageId);
      } catch (testError) {
        console.error('Test email failed:', testError);
        // Continue anyway to try sending the actual email
      }
    }

    // ==========================================
    // SEND ACTUAL EMAIL
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
    
    // Define multiple recipients
    const to = ['karyabangunsemestas@gmail.com'];
    
    // Always CC yourself to ensure at least one email gets through
    const cc = [process.env.EMAIL_USER];
    
    // Send email with multiple configurations
    const mailOptions = {
      from: `"Website KBS" <${process.env.EMAIL_USER}>`,
      to: to.join(', '),
      cc: cc.join(', '),
      subject: subject || `[Konsultasi Proyek] Permintaan dari ${name}`,
      html: emailContent,
      replyTo: email,  // Set reply-to as sender's email
      priority: 'high',
      headers: {
        'Importance': 'high'
      },
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
    
    if (DEBUG) {
      console.log('Sending email with options:', {
        from: mailOptions.from,
        to: mailOptions.to,
        cc: mailOptions.cc,
        subject: mailOptions.subject
      });
    }
    
    // Send email and handle response
    try {
      const info = await transporter.sendMail(mailOptions);
      
      console.log('Email sent successfully:', info.messageId);
      
      // Try alternative delivery method if you have access to an alternative email service
      // This is a fallback in case the primary method fails silently
      let fallbackAttempted = false;
      
      try {
        // You can configure an alternative email service here if needed
        // For example: SendGrid, Mailgun, etc.
        // This is just a placeholder for future implementation
        fallbackAttempted = false;
      } catch (fallbackError) {
        console.log('Fallback email delivery also failed:', fallbackError);
        // Continue anyway since the primary method succeeded
      }
      
      return res.status(200).json({
        success: true,
        message: 'Permintaan konsultasi proyek berhasil dikirim!',
        details: DEBUG ? {
          messageId: info.messageId,
          fallbackAttempted
        } : undefined
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Log detailed error information
      if (DEBUG) {
        console.error('Detailed error:', JSON.stringify(emailError, null, 2));
        if (emailError.response) {
          console.error('SMTP Response:', emailError.response);
        }
      }
      
      // Try one more alternative configuration as last resort
      try {
        console.log('Attempting last resort email delivery...');
        
        // Create a new transport with OAuth2 if you have configured it
        // This is just an example, you would need to set up OAuth2 credentials
        // and store them in environment variables
        /*
        const oauth2Transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            type: 'OAuth2',
            user: process.env.EMAIL_USER,
            clientId: process.env.OAUTH_CLIENT_ID,
            clientSecret: process.env.OAUTH_CLIENT_SECRET,
            refreshToken: process.env.OAUTH_REFRESH_TOKEN,
            accessToken: process.env.OAUTH_ACCESS_TOKEN
          }
        });
        
        const lastResortInfo = await oauth2Transporter.sendMail(mailOptions);
        console.log('Last resort email sent successfully:', lastResortInfo.messageId);
        
        return res.status(200).json({
          success: true,
          message: 'Permintaan konsultasi proyek berhasil dikirim! (backup method)',
        });
        */
        
        // If you don't have OAuth2 set up, at least try to notify yourself about the issue
        const fallbackMailOptions = {
          from: `"KBS ERROR ALERT" <${process.env.EMAIL_USER}>`,
          to: process.env.EMAIL_USER,
          subject: `[ERROR] Failed to send consultation email from ${name}`,
          text: `Failed to send consultation email. Please check the logs. Customer details: ${name}, ${email}, ${phone}`
        };
        
        await transporter.sendMail(fallbackMailOptions);
        console.log('Error notification email sent');
        
        // Return success to the client but log the issue
        return res.status(200).json({
          success: true,
          message: 'Permintaan konsultasi proyek telah direkam, tetapi pengiriman email mungkin tertunda.',
        });
      } catch (lastResortError) {
        console.error('Last resort email failed too:', lastResortError);
        // At this point, we've tried everything we can
        return res.status(500).json({
          success: false,
          message: 'Gagal mengirim email. Silakan coba lagi nanti atau hubungi kami melalui telepon.',
          error: DEBUG ? emailError.message : undefined
        });
      }
    }
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim permintaan konsultasi, silakan coba lagi nanti.',
      error: DEBUG ? error.message : undefined
    });
  }
};  