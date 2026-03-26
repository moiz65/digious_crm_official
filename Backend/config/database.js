const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 25,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 100,
  enableKeepAlive: true,
  connectTimeout: 10000,       // 10s - fail fast if DB unreachable
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

// ── Connection Pool Health Monitor ──────────────────────────────────────
// Log pool stats every 60s to detect connection leaks early
setInterval(() => {
  const { _allConnections, _freeConnections, _connectionQueue } = pool.pool;
  const total = _allConnections ? _allConnections.length : 0;
  const free = _freeConnections ? _freeConnections.length : 0;
  const queued = _connectionQueue ? _connectionQueue.length : 0;
  const used = total - free;

  // Only log when pool is under pressure (>60% used or any queued requests)
  if (used > 15 || queued > 0) {
    console.warn(`⚠️  Pool pressure: ${used}/${total} active, ${free} free, ${queued} queued`);
  }
}, 60000);

// Create a wrapper to log queries and add timeout
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
