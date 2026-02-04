const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  // keepAliveInitialDelayMs was removed because mysql2 warns about unrecognized options
  // If you need an initial delay, use a supported option when mysql2 exposes it.
  // REMOVED: timezone: '+05:00'
  // Reason: Application handles timezone conversion with getPakistanDate() in utils/timezone.js
  // Database stores times as-is without conversion to prevent double offset (+5 from app + 5 from DB = +10)
});

// Test the connection
pool.getConnection()
  .then(connection => {
    console.log('✅ MySQL Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
  });

// Create a wrapper to log queries
const originalQuery = pool.query;
pool.query = function(...args) {
  const sql = args[0];
  const values = args[1];
  
  if (process.env.SQL_LOG === 'true') {
    console.log('\n📊 SQL QUERY:');
    console.log(sql);
    if (values && values.length > 0) {
      console.log('📊 PARAMETERS:', values);
    }
    console.log('---');
  }
  
  return originalQuery.apply(this, args);
};

module.exports = pool;
