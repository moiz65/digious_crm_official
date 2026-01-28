const pool = require('./config/database');

async function test() {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      'DESCRIBE Employee_Attendance'
    );
    console.log('Column definitions:');
    rows.forEach(r => {
      console.log(`${r.Field}: ${r.Type}, Null: ${r.Null}, Key: ${r.Key}, Default: ${r.Default}`);
    });
  } finally {
    connection.release();
  }
}

test().catch(console.error);
