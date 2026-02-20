const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAll() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  });

  try {
    const connection = await pool.getConnection();
    
    // Check Fatima's current check-in/check-out status
    console.log('\n🔍 Checking detailed records:\n');
    const [records] = await connection.execute(
      `SELECT 
        id, name, attendance_date, check_in_time, check_out_time, status,
        net_working_time_minutes, total_break_duration_minutes
      FROM Employee_Attendance 
      WHERE name = 'Fatima Khan' 
      AND YEAR(attendance_date) = 2026 
      AND MONTH(attendance_date) = 2
      ORDER BY attendance_date ASC`
    );
    
    console.log('Raw Database Records for Fatima Khan (Feb 2026):');
    console.log(JSON.stringify(records, null, 2));
    
    connection.release();
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

checkAll();
