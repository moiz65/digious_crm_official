const pool = require('../config/database');

async function test() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      `SELECT id, attendance_date, check_in_time, check_out_time, DATE(attendance_date) as date_only
       FROM Employee_Attendance WHERE employee_id = 1 ORDER BY created_at DESC LIMIT 5`
    );
    console.log('Records:');
    rows.forEach(r => {
      console.log(`ID: ${r.id}, attendance_date: ${r.attendance_date}, date_only: ${r.date_only}, Check-in: ${r.check_in_time}`);
    });
    
    console.log('\nSearching for 2026-01-28:');
    const [searchResult] = await connection.query(
      `SELECT * FROM Employee_Attendance WHERE employee_id = 1 AND DATE(attendance_date) = '2026-01-28'`
    );
    console.log('Found:', searchResult.length, 'records');
    
    console.log('\nSearching for 2026-01-27:');
    const [searchResult2] = await connection.query(
      `SELECT * FROM Employee_Attendance WHERE employee_id = 1 AND DATE(attendance_date) = '2026-01-27'`
    );
    console.log('Found:', searchResult2.length, 'records');
  } finally {
    connection.release();
  }
}

test().catch(console.error);
