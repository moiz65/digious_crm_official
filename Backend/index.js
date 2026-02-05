const express = require('express');
const cors = require('cors');
const schedule = require('node-schedule');
require('dotenv').config();
const { getPakistanISO } = require('./utils/timezone');

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

app.use(`/api/${process.env.API_VERSION}`, onboardingRoutes);
app.use(`/api/${process.env.API_VERSION}/auth`, authRoutes);
app.use(`/api/${process.env.API_VERSION}/system-info`, userSystemInfoRoutes);
app.use(`/api/${process.env.API_VERSION}/attendance`, attendanceRoutes);
app.use(`/api/${process.env.API_VERSION}/activities`, activitiesRoutes);
app.use(`/api/${process.env.API_VERSION}/rules`, rulesRoutes);
app.use(`/api/${process.env.API_VERSION}/employees`, employeeProfileRoutes);

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
// SCHEDULED JOBS
// ============================================================
// Auto-checkout job: Runs daily at 9:00 AM Pakistan Time
// This automatically completes check-out for any employees who 
// haven't manually checked out before the 9 AM deadline
// ============================================================
const attendanceController = require('./routes/controllers/attendanceController');

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

console.log('📅 Scheduled Jobs initialized:');
console.log('   • Auto-checkout: 09:00 AM every day');

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Digious CRM Backend Server Started   ║
║   🚀 Running on: http://localhost:${PORT}    ║
║   📊 Environment: ${process.env.NODE_ENV}       ║
╚════════════════════════════════════════╝
  `);
});

// blank_commit
// blank_commit
