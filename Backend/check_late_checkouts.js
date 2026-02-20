const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0
});

async function checkLateCheckouts() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('='.repeat(70));
    console.log('SEARCHING FOR LATE CHECKOUTS (9 AM - 9 PM = 09:00 to 21:00)');
    console.log('='.repeat(70));

    // Get records where checkout is between 9 AM and 9 PM (540 to 1260 minutes)
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
      ORDER BY ea.attendance_date DESC
      LIMIT 100
    `);

    console.log('\nAnalyzing checkout times...\n');
    
    const lateCheckouts = [];
    const earlyCheckouts = [];
    
    records.forEach(r => {
      const checkOutHour = r.check_out_hour;
      const checkOutMin = r.check_out_minute;
      const checkInHour = r.check_in_hour;
      const checkInMin = r.check_in_minute;
      
      const checkInTotalMinutes = checkInHour * 60 + checkInMin;
      const checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;
      const nineAM = 9 * 60; // 540 minutes
      const isValidShiftCheckIn = checkInTotalMinutes >= 21 * 60 || checkInTotalMinutes <= 6 * 60;
      
      // Check if it's after 9 AM and is a valid shift check-in
      if (checkOutTotalMinutes >= nineAM && isValidShiftCheckIn) {
        lateCheckouts.push({
          id: r.id,
          employee: r.name || `ID: ${r.employee_id}`,
          date: r.attendance_date,
          checkInTime: r.check_in_time,
          checkOutTime: r.check_out_time,
          checkOutMinutes: checkOutTotalMinutes
        });
      }
      
      // Track early checkouts before 9 AM for reference
      if (checkOutTotalMinutes < nineAM && isValidShiftCheckIn) {
        earlyCheckouts.push({
          id: r.id,
          checkOutTime: r.check_out_time,
          checkOutMinutes: checkOutTotalMinutes
        });
      }
    });

    if (lateCheckouts.length > 0) {
      console.log(`⚠️ FOUND ${lateCheckouts.length} LATE CHECKOUTS (AFTER 9 AM):\n`);
      lateCheckouts.forEach(record => {
        const hours = Math.floor(record.checkOutMinutes / 60);
        const mins = record.checkOutMinutes % 60;
        console.log(`ID ${record.id}: ${record.employee}`);
        console.log(`  Date: ${record.date}`);
        console.log(`  Check-in: ${record.checkInTime} → Check-out: ${record.checkOutTime} (${hours}:${String(mins).padStart(2, '0')})`);
        console.log('');
      });
    } else {
      console.log('✅ NO LATE CHECKOUTS FOUND!');
      console.log(`✅ All ${earlyCheckouts.length} valid night shift records have checkout times before 9 AM\n`);
    }

    console.log('='.repeat(70));
    console.log('CHECKING CURRENT PENDING CHECKOUTS (No checkout yet)');
    console.log('='.repeat(70));
    
    const [pending] = await connection.query(`
      SELECT 
        ea.id,
        ea.employee_id,
        eu.name,
        eu.email,
        ea.attendance_date,
        ea.check_in_time,
        EXTRACT(HOUR FROM STR_TO_DATE(ea.check_in_time, '%H:%i:%s')) as check_in_hour,
        EXTRACT(MINUTE FROM STR_TO_DATE(ea.check_in_time, '%H:%i:%s')) as check_in_minute
      FROM Employee_Attendance ea
      LEFT JOIN user_as_employees eu ON ea.employee_id = eu.id
      WHERE ea.check_out_time IS NULL
      ORDER BY ea.attendance_date DESC
    `);

    if (pending.length > 0) {
      console.log(`\n⚠️ FOUND ${pending.length} PENDING CHECKOUTS:\n`);
      
      pending.forEach(record => {
        const checkInHour = record.check_in_hour;
        const checkInMin = record.check_in_minute;
        const checkInTotalMinutes = checkInHour * 60 + checkInMin;
        const isNightShift = checkInTotalMinutes >= 21 * 60 || checkInTotalMinutes <= 6 * 60;
        const shiftType = isNightShift ? '🌙 NIGHT SHIFT' : '☀️ DAY SHIFT';
        
        console.log(`${shiftType} - ID ${record.id}: ${record.name || record.email}`);
        console.log(`  Date: ${record.attendance_date}`);
        console.log(`  Check-in: ${record.check_in_time}`);
        console.log('  ⚠️ MUST CHECKOUT BEFORE 9:00 AM\n');
      });
    } else {
      console.log('\n✅ NO PENDING CHECKOUTS - All employees have completed their shifts');
    }

  } catch (error) {
    console.error('Database Error:', error);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

checkLateCheckouts();
