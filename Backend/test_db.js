const pool = require('./config/database');

async function test() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'SELECT id, attendance_date, check_in_time, check_out_time, created_at FROM Employee_Attendance WHERE employee_id = 1 ORDER BY created_at DESC LIMIT 10'
    );
    console.log('Records found:', rows.length);
    rows.forEach(r => {
      console.log(`ID: ${r.id}, Date: ${r.attendance_date}, Check-in: ${r.check_in_time}, Check-out: ${r.check_out_time}, Created: ${r.created_at}`);
    });
  } finally {
    connection.release();
  }
}

test().catch(console.error);
