// db.js — MySQL connection pool (mysql2/promise)
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'course_reg',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const conn = await db.getConnection();
    await conn.ping();
    console.log('✅ Connected to MySQL database');
    conn.release();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

module.exports = db;
