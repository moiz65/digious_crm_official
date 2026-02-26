const mysql = require('mysql2/promise');

// Test the checkout validation logic
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'Digious_CRM_DataBase',
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

async function testCheckoutIssue() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('='.repeat(60));
    console.log('CHECKOUT DEADLINE VALIDATION TEST');
    console.log('='.repeat(60));
    console.log('Current Time: ' + new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' }));
    console.log('');

    // Get recent attendance records where checkout > 9 AM
    const [records] = await connection.query(`
      SELECT 
        ea.id,
        ea.employee_id,
        eu.name,
        ea.attendance_date,
        ea.check_in_time,
        ea.check_out_time,
        EXTRACT(HOUR FROM STR_TO_DATE(ea.check_in_time, '%H:%i:%s')) as check_in_hour,
        EXTRACT(MINUTE FROM STR_TO_DATE(ea.check_in_time, '%H:%i:%s')) as check_in_minute,
        EXTRACT(HOUR FROM STR_TO_DATE(ea.check_out_time, '%H:%i:%s')) as check_out_hour,
        EXTRACT(MINUTE FROM STR_TO_DATE(ea.check_out_time, '%H:%i:%s')) as check_out_minute
      FROM Employee_Attendance ea
      LEFT JOIN user_as_employees eu ON ea.employee_id = eu.id
      WHERE ea.check_out_time IS NOT NULL
      ORDER BY ea.attendance_date DESC, ea.check_in_time DESC
      LIMIT 20
    `);

    console.log('RECENT ATTENDANCE RECORDS WITH CHECKOUT:');
    console.log('-'.repeat(60));
    
    records.forEach(r => {
      const checkOutHour = r.check_out_hour;
      const checkOutMin = r.check_out_minute;
      const checkInHour = r.check_in_hour;
      const checkInMin = r.check_in_minute;
      
      const checkInTotalMinutes = checkInHour * 60 + checkInMin;
      const checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;
      const nineAM = 9 * 60; // 540 minutes
      
      const isValidShiftCheckIn = checkInTotalMinutes >= 21 * 60 || checkInTotalMinutes <= 6 * 60;
      const exceedsDeadline = checkOutTotalMinutes >= nineAM && isValidShiftCheckIn;
      
      console.log(`\n📋 Record ID: ${r.id}`);
      console.log(`   Employee: ${r.name} (ID: ${r.employee_id})`);
      console.log(`   Date: ${r.attendance_date}`);
      console.log(`   Check-in: ${r.check_in_time} (${checkInTotalMinutes} mins)`);
      console.log(`   Check-out: ${r.check_out_time} (${checkOutTotalMinutes} mins)`);
      console.log(`   Valid Shift Check-in? ${isValidShiftCheckIn} (≥21:00 or ≤06:00)`);
      console.log(`   Exceeds 9 AM Deadline? ${exceedsDeadline ? '⚠️ YES - SHOULD BE REJECTED' : '✅ NO - Allowed'}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('RECORDS WITH INVALID LATE CHECKOUTS:');
    console.log('='.repeat(60));
    
    const invalidRecords = records.filter(r => {
      const checkOutHour = r.check_out_hour;
      const checkOutMin = r.check_out_minute;
      const checkInHour = r.check_in_hour;
      const checkInMin = r.check_in_minute;
      
      const checkInTotalMinutes = checkInHour * 60 + checkInMin;
      const checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;
      const nineAM = 9 * 60;
      
      const isValidShiftCheckIn = checkInTotalMinutes >= 21 * 60 || checkInTotalMinutes <= 6 * 60;
      return checkOutTotalMinutes >= nineAM && isValidShiftCheckIn;
    });

    if (invalidRecords.length === 0) {
      console.log('✅ No invalid late checkouts found!');
    } else {
      console.log(`⚠️ Found ${invalidRecords.length} invalid late checkouts that should have been rejected:`);
      invalidRecords.forEach(r => {
        console.log(`\n   ID: ${r.id} - ${r.name}`);
        console.log(`   Check-in: ${r.check_in_time}, Check-out: ${r.check_out_time}`);
      });
    }

  } catch (error) {
    console.error('Database Error:', error);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

testCheckoutIssue();
