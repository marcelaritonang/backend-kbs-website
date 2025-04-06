module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With');
    
    // Return environment info and request details
    return res.status(200).json({
      message: 'Debug endpoint',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      env: {
        email_user_exists: !!process.env.EMAIL_USER,
        email_password_length: process.env.EMAIL_APP_PASSWORD ? process.env.EMAIL_APP_PASSWORD.length : 0,
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV
      }
    });
  };