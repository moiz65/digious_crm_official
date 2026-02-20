const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkFatimaAttendance() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
  });

  try {
    const connection = await pool.getConnection();
    
    // First, get Fatima Khan's employee ID
    console.log('\n📋 Searching for Fatima Khan in employee_onboarding table...\n');
    const [employees] = await connection.execute(
      `SELECT id, name, employee_id, email FROM employee_onboarding WHERE name LIKE '%Fatima Khan%'`
    );
    
    if (employees.length === 0) {
      console.log('❌ Fatima Khan not found in employee_onboarding table');
      connection.release();
      pool.end();
      return;
    }
    
    console.log('✅ Found employee:');
    employees.forEach(emp => {
      console.log(`   - Name: ${emp.name}, ID: ${emp.id}, Employee ID: ${emp.employee_id}, Email: ${emp.email}`);
    });
    
    const fatimaId = employees[0].id;
    
    // Get February 2026 attendance
    console.log('\n📅 Fetching February 2026 attendance records...\n');
    const [records] = await connection.execute(
      `SELECT 
        id,
        employee_id,
        name,
        attendance_date,
        check_in_time,
        check_out_time,
        status,
        total_breaks_taken,
        total_break_duration_minutes,
        net_working_time_minutes,
        expected_working_time_minutes,
        overtime_minutes,
        late_by_minutes,
        created_at,
        updated_at
      FROM Employee_Attendance 
      WHERE employee_id = ? 
      AND YEAR(attendance_date) = 2026 
      AND MONTH(attendance_date) = 2
      ORDER BY attendance_date ASC`,
      [fatimaId]
    );
    
    if (records.length === 0) {
      console.log('⚠️  No attendance records found for Fatima Khan in February 2026');
    } else {
      console.log(`✅ Found ${records.length} attendance records for February 2026:\n`);
      console.log('┌─────────────────┬──────────────┬──────────────┬────────┬───────────┬──────────┐');
      console.log('│ Date            │ Check In     │ Check Out    │ Status │ Net Hours │ Breaks   │');
      console.log('├─────────────────┼──────────────┼──────────────┼────────┼───────────┼──────────┤');
      
      let totalNetMinutes = 0;
      let totalBreaks = 0;
      let presentDays = 0;
      let lateDays = 0;
      
      records.forEach(record => {
        const date = new Date(record.attendance_date).toLocaleDateString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: '2-digit'
        });
        const checkIn = record.check_in_time || '-';
        const checkOut = record.check_out_time || '-';
        const netHours = record.net_working_time_minutes ? 
          `${Math.floor(record.net_working_time_minutes / 60)}h ${record.net_working_time_minutes % 60}m` : '-';
        const breaks = `${record.total_breaks_taken}(${record.total_break_duration_minutes}m)`;
        
        console.log(`│ ${date.padEnd(15)} │ ${String(checkIn).padEnd(12)} │ ${String(checkOut).padEnd(12)} │ ${String(record.status).padEnd(6)} │ ${netHours.padEnd(9)} │ ${breaks.padEnd(8)} │`);
        
        totalNetMinutes += record.net_working_time_minutes || 0;
        totalBreaks += record.total_breaks_taken || 0;
        if (record.status === 'Present') presentDays++;
        if (record.status === 'Late') lateDays++;
      });
      
      console.log('└─────────────────┴──────────────┴──────────────┴────────┴───────────┴──────────┘');
      
      console.log('\n📊 Summary Statistics for February 2026:');
      console.log(`   Total Days Recorded: ${records.length}`);
      console.log(`   Present Days: ${presentDays}`);
      console.log(`   Late Days: ${lateDays}`);
      console.log(`   Total Net Working Time: ${Math.floor(totalNetMinutes / 60)}h ${totalNetMinutes % 60}m`);
      console.log(`   Total Breaks Taken: ${totalBreaks}`);
      console.log(`   Average Daily Hours: ${(totalNetMinutes / records.length / 60).toFixed(2)}h`);
    }
    
    connection.release();
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

checkFatimaAttendance();
