// Modifikasi file setup-db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log("Connecting to MySQL server...");
    // Konfigurasi koneksi dasar tanpa database (untuk membuat database)
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      // Jangan tentukan database dulu
    });
    
    console.log("Connected successfully");

    // Buat database jika belum ada
    const dbName = process.env.DB_NAME || 'kbs_website';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`Database ${dbName} created or already exists`);

    // Gunakan database
    await connection.query(`USE ${dbName}`);

    // Buat tabel
    await connection.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME NOT NULL,
        status ENUM('unread', 'read', 'replied', 'archived') NOT NULL DEFAULT 'unread',
        notes TEXT
      )
    `);
    console.log('Table contact_messages created or already exists');

    await connection.end();
    console.log('Database setup completed successfully');
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();