// src/utils/emailService.js
const nodemailer = require('nodemailer');
require('dotenv').config();

// Membuat transporter untuk nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Bisa diganti dengan service lain seperti 'sendgrid', 'mailgun', dll
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

exports.sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.messageId);
    return info;
  } catch (error) {
    console.error('Error in sending email: ', error);
    throw error;
  }
};