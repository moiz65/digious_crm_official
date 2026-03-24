const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
require('dotenv').config();
const { getPakistanISO, getPakistanDate, getPakistanDateString } = require('./utils/timezone');
const pool = require('./config/database');

const app = express();

// Middleware
// Increase request body size to accommodate base64 image uploads (e.g., profile/banner/images)
app.use(express.json({ limit: process.env.REQUEST_SIZE_LIMIT || '20mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.REQUEST_SIZE_LIMIT || '20mb' }));

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Base allowed origins - always allow localhost for development
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000'
    ];

    // Add environment-specific origins from .env
    const envOrigins = process.env.CORS_ORIGINS 
      ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
      : [];
    
    const allAllowedOrigins = [...allowedOrigins, ...envOrigins];

    // In development, log the origin for debugging. In production, avoid printing origins or allowlist to logs.
    if (process.env.NODE_ENV === 'development') {
      console.debug('🔐 CORS Check - Origin:', origin);
    }

    // Allow requests with no origin (like mobile apps or curl requests)
    // Also allow any origin that matches our allowlist
    if (!origin || allAllowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ CORS Blocked - Origin not in allowlist:', origin);
      } else {
        // Keep production logs minimal to avoid exposing sensitive configuration
        console.error('❌ CORS Blocked - Origin not allowed');
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));
console.log('✅ Static file serving enabled for /uploads directory');

// Test route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: getPakistanISO()
  });
});

// Routes
const onboardingRoutes = require('./routes/onboarding');
const authRoutes = require('./routes/auth');
const userSystemInfoRoutes = require('./routes/userSystemInfo');
const attendanceRoutes = require('./routes/attendance');
const rulesRoutes = require('./routes/rules');
const activitiesRoutes = require('./routes/activities');
const employeeProfileRoutes = require('./routes/employeeProfile');
const leavesRoutes = require('./routes/leavesRoutes');
const applicationsRoutes = require('./routes/applicationsRoutes');
const checkoutMissingRoutes = require('./routes/checkoutMissing');
const adjustmentRoutes = require('./routes/adjustmentRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const salesRoutes = require('./routes/salesRoutes');
const salesTargetRoutes = require('./routes/salesTargetRoutes');
const customerRoutes = require('./routes/customerRoutes');

app.use(`/api/${process.env.API_VERSION}`, onboardingRoutes);
app.use(`/api/${process.env.API_VERSION}/auth`, authRoutes);
app.use(`/api/${process.env.API_VERSION}/system-info`, userSystemInfoRoutes);
app.use(`/api/${process.env.API_VERSION}/attendance`, attendanceRoutes);
app.use(`/api/${process.env.API_VERSION}/activities`, activitiesRoutes);
app.use(`/api/${process.env.API_VERSION}/rules`, rulesRoutes);
app.use(`/api/${process.env.API_VERSION}/employees`, employeeProfileRoutes);
app.use(`/api/${process.env.API_VERSION}/leaves`, leavesRoutes);
app.use(`/api/${process.env.API_VERSION}/applications`, applicationsRoutes);
app.use(`/api/${process.env.API_VERSION}/checkout-missing`, checkoutMissingRoutes);
app.use(`/api/${process.env.API_VERSION}/adjustments`, adjustmentRoutes);
app.use(`/api/${process.env.API_VERSION}/payroll`, payrollRoutes);
app.use(`/api/${process.env.API_VERSION}/expenses`, expenseRoutes);
app.use(`/api/${process.env.API_VERSION}/sales`, salesRoutes);
app.use(`/api/${process.env.API_VERSION}/sales-targets`, salesTargetRoutes);
app.use(`/api/${process.env.API_VERSION}/customers`, customerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);

  // Handle large payloads from body-parser
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      success: false,
      message: 'Payload too large. The server limits request body size — upload smaller files or use multipart upload.',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;

// ============================================================
// STARTUP FUNCTIONS
// ============================================================
// Auto-mark absent employees on server start
// Finds all employees missing from Employee_Attendance and creates absence records
// ============================================================
async function autoMarkAbsentOnStartup() {
  try {
    console.log('\n🔍 AUTO-MARKING ABSENT EMPLOYEES ON SERVER START...');
    
    const connection = await pool.getConnection();
    
    // Get today's date and yesterday's date
    const today = getPakistanDateString();
    const yesterday = new Date(getPakistanDate());
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    
    // Process both yesterday and today (in case server was down yesterday)
    const datesToProcess = [yesterdayStr, today];
    let totalCreated = 0;
    
    for (const dateToProcess of datesToProcess) {
      console.log(`\n📅 Processing date: ${dateToProcess}`);
      
      // Get all active employees
      const [allEmployees] = await connection.query(
        `SELECT id, employee_id, name, email, department FROM employee_onboarding WHERE status = 'Active'`
      );
      
      // Get employees who checked in on this date
      const [checkedInDate] = await connection.query(
        `SELECT DISTINCT employee_id FROM Employee_Attendance WHERE attendance_date = ?`,
        [dateToProcess]
      );
      
      const checkedInIds = new Set(checkedInDate.map(e => e.employee_id));
      
      // Find employees who haven't checked in
      const absentEmployees = allEmployees.filter(emp => !checkedInIds.has(emp.id));
      
      console.log(`   ✅ Checked in: ${checkedInIds.size}, ❌ Absent: ${absentEmployees.length}`);
      
      // Auto-mark absent employees
      if (absentEmployees.length > 0) {
        for (const emp of absentEmployees) {
          try {
            // Check if absent record already exists
            const [existingAbsent] = await connection.query(
              `SELECT id FROM Employee_Absent WHERE employee_id = ? AND absent_date = ?`,
              [emp.id, dateToProcess]
            );
            
            if (existingAbsent.length === 0) {
              // Create absence record
              await connection.query(
                `INSERT INTO Employee_Absent
                (employee_id, email, name, absent_date, reason_type, reason, is_approved, remarks, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'No Check-in', 'Auto-generated on server start: Employee did not check in', 0, 'System auto-marked', NOW(), NOW())`,
                [emp.id, emp.email, emp.name, dateToProcess]
              );
              totalCreated++;
            }
          } catch (err) {
            console.error(`   ⚠️ Error marking employee ${emp.id} as absent:`, err.message);
          }
        }
      }
    }
    
    connection.release();
    
    console.log(`\n✅ AUTO-MARKING COMPLETE: ${totalCreated} absence records created`);
    
  } catch (error) {
    console.error('❌ Auto-mark absent startup error:', error);
  }
}

// ============================================================
// Remove conflicting absence records when attendance exists
// This cleans up any Employee_Absent records where the employee actually checked in
// ============================================================
async function removeAbsenceWhenAttendanceExists() {
  try {
    console.log('\n🧹 CLEANING UP CONFLICTING ABSENCE RECORDS...');
    
    const connection = await pool.getConnection();
    
    // Find all absence records that have matching attendance records
    const [conflicting] = await connection.query(
      `SELECT DISTINCT ea.id, ea.employee_id, ea.email, ea.name, ea.absent_date
       FROM Employee_Absent ea
       INNER JOIN Employee_Attendance et ON ea.employee_id = et.employee_id AND ea.absent_date = et.attendance_date`
    );
    
    if (conflicting.length > 0) {
      console.log(`   Found ${conflicting.length} conflicting records to remove`);
      
      for (const record of conflicting) {
        try {
          await connection.query(
            `DELETE FROM Employee_Absent WHERE id = ?`,
            [record.id]
          );
          console.log(`   ✅ Removed: ${record.name} (${record.email}) from ${record.absent_date}`);
        } catch (err) {
          console.error(`   ⚠️ Error removing record ID ${record.id}:`, err.message);
        }
      }
    } else {
      console.log(`   ✅ No conflicting records found - all absence records are valid`);
    }
    
    connection.release();
    console.log(`\n✅ CLEANUP COMPLETE`);
    
  } catch (error) {
    console.error('❌ Error cleaning up absence records:', error);
  }
}

// ============================================================
// SCHEDULED JOBS
// ============================================================
// Auto-checkout job: Runs daily at 9:00 AM Pakistan Time
// This automatically completes check-out for any employees who 
// haven't manually checked out before the 9 AM deadline
// ============================================================
const attendanceController = require('./routes/controllers/attendanceController');
const checkoutMissingController = require('./routes/controllers/checkoutMissingController');

// Schedule auto-checkout for 9:00 AM every day (Pakistan timezone)
// Using cron expression: 0 9 * * * = 09:00 every day
const autoCheckoutJob = schedule.scheduleJob('0 9 * * *', async () => {
  console.log('\n⏰ SCHEDULED JOB: Auto-checkout triggered at 9:00 AM');
  try {
    const result = await attendanceController.autoCheckoutExpiredSessions(null, null);
    if (result.success) {
      console.log(`✅ Scheduled auto-checkout completed: ${result.processedCount} records processed`);
    } else {
      console.error('❌ Scheduled auto-checkout failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Scheduled auto-checkout error:', error);
  }
});

// Schedule checkout missing detection for 9:01 AM every day
// This runs 1 minute after auto-checkout to capture any remaining missing checkouts
// Using cron expression: 1 9 * * * = 09:01 every day
const checkoutMissingJob = schedule.scheduleJob('1 9 * * *', async () => {
  console.log('\n⏰ SCHEDULED JOB: Checkout missing detection triggered at 9:01 AM');
  try {
    const connection = await pool.getConnection();
    
    // Call the stored procedure
    const [results] = await connection.query('CALL ProcessMissingCheckouts()');
    const summary = results[0][0];
    
    console.log(`✅ Scheduled checkout missing detection completed: ${summary.records_moved} records moved`);
    
    connection.release();
  } catch (error) {
    console.error('❌ Scheduled checkout missing detection error:', error);
  }
});

console.log('📅 Scheduled Jobs initialized:');
console.log('   • Auto-checkout: 09:00 AM every day');
console.log('   • Checkout missing detection: 09:01 AM every day');

app.listen(PORT, async () => {
  console.log(`
╔════════════════════════════════════════╗
║   Digious CRM Backend Server Started   ║
║   🚀 Running on: http://localhost:${PORT}    ║
║   📊 Environment: ${process.env.NODE_ENV}       ║
╚════════════════════════════════════════╝
  `);
  
  // Run auto-mark absent on startup (with a small delay to ensure DB is ready)
  setTimeout(() => {
    autoMarkAbsentOnStartup();
  }, 2000);

  // Run cleanup of conflicting absence records (after auto-marking completes)
  setTimeout(() => {
    removeAbsenceWhenAttendanceExists();
  }, 5000);

  // Schedule daily auto-mark absent job
  // Runs every day at 11:59 PM Pakistan Time to mark employees who didn't check in during the day
  const dailySchedule = schedule.scheduleJob('59 23 * * *', async () => {
    console.log('\n📅 SCHEDULED DAILY AUTO-MARK ABSENT JOB RUNNING...');
    try {
      const connection = await pool.getConnection();
      const today = getPakistanDateString();
      
      console.log(`🔍 Processing date: ${today}`);
      
      // Get all active employees
      const [allEmployees] = await connection.query(
        `SELECT id, employee_id, name, email FROM employee_onboarding WHERE status = 'Active'`
      );
      
      // Get employees who checked in today
      const [checkedInToday] = await connection.query(
        `SELECT DISTINCT employee_id FROM Employee_Attendance WHERE attendance_date = ?`,
        [today]
      );
      
      const checkedInIds = new Set(checkedInToday.map(e => e.employee_id));
      const absentEmployees = allEmployees.filter(emp => !checkedInIds.has(emp.id));
      
      console.log(`   ✅ Checked in: ${checkedInIds.size}, ❌ Absent: ${absentEmployees.length}`);
      
      if (absentEmployees.length > 0) {
        let createdCount = 0;
        for (const emp of absentEmployees) {
          try {
            const [existingAbsent] = await connection.query(
              `SELECT id FROM Employee_Absent WHERE employee_id = ? AND absent_date = ?`,
              [emp.id, today]
            );
            
            if (existingAbsent.length === 0) {
              await connection.query(
                `INSERT INTO Employee_Absent 
                (employee_id, email, name, absent_date, reason_type, reason, is_approved, remarks, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'No Check-in', 'Auto-generated by daily scheduler: Employee did not check in', 0, 'System auto-marked', NOW(), NOW())`,
                [emp.id, emp.email, emp.name, today]
              );
              createdCount++;
            }
          } catch (err) {
            console.error(`   ⚠️ Error marking employee ${emp.id} as absent:`, err.message);
          }
        }
        console.log(`✅ SCHEDULED JOB COMPLETE: ${createdCount} absence records created for ${today}`);
      } else {
        console.log(`✅ SCHEDULED JOB COMPLETE: All employees checked in for ${today}`);
      }
      
      connection.release();
    } catch (err) {
      console.error('❌ Error in scheduled auto-mark absent job:', err.message);
    }
  });

  console.log('✅ Daily auto-mark absent job scheduled (runs at 11:59 PM Pakistan Time)');
});

// blank_commit
// blank_commit
// blank commit