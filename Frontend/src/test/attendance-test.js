/**
 * Frontend Attendance Component Test - Pakistan Timezone
 * Tests real attendance scenarios with PKT timezone
 */

import { getPakistanDate, getPakistanDateString, getPakistanTimeString } from '../utils/timezone';

/**
 * Simulate attendance check-in
 */
export const simulateCheckIn = () => {
  const now = getPakistanDate();
  const checkInTime = getPakistanTimeString();
  const checkInDate = getPakistanDateString();
  
  const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
  
  return {
    success: true,
    checkInTime,
    checkInDate,
    timestamp: now,
    status: isLate ? 'Late' : 'On Time',
    message: isLate ? 'Check-in recorded as late' : 'Check-in recorded on time',
    details: {
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds()
    }
  };
};

/**
 * Simulate attendance check-out
 */
export const simulateCheckOut = () => {
  const now = getPakistanDate();
  const checkOutTime = getPakistanTimeString();
  const checkOutDate = getPakistanDateString();
  
  return {
    success: true,
    checkOutTime,
    checkOutDate,
    timestamp: now,
    status: 'Checked Out',
    message: 'Check-out recorded successfully',
    details: {
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds()
    }
  };
};

/**
 * Calculate working hours between two times
 */
export const calculateWorkingHours = (checkInTime, checkOutTime, breakMinutes = 30) => {
  const [inHour, inMin] = checkInTime.split(':').map(Number);
  const [outHour, outMin] = checkOutTime.split(':').map(Number);
  
  const inTotalMin = inHour * 60 + inMin;
  const outTotalMin = outHour * 60 + outMin;
  
  let grossMinutes = outTotalMin - inTotalMin;
  
  // Handle night shift
  if (grossMinutes < 0) {
    grossMinutes += 24 * 60;
  }
  
  const netMinutes = Math.max(0, grossMinutes - breakMinutes);
  const hours = (netMinutes / 60).toFixed(2);
  
  return {
    checkInTime,
    checkOutTime,
    grossMinutes,
    netMinutes,
    hours,
    breakMinutes,
    status: 'Calculated'
  };
};

/**
 * Simulate break start
 */
export const simulateBreakStart = (breakType = 'Lunch') => {
  const now = getPakistanDate();
  const breakStartTime = getPakistanTimeString();
  
  return {
    success: true,
    breakType,
    breakStartTime,
    timestamp: now,
    date: getPakistanDateString(),
    message: `${breakType} break started`,
    status: 'In Break'
  };
};

/**
 * Simulate break end
 */
export const simulateBreakEnd = (breakType = 'Lunch', durationMinutes = 30) => {
  const now = getPakistanDate();
  const breakEndTime = getPakistanTimeString();
  
  return {
    success: true,
    breakType,
    breakEndTime,
    duration: durationMinutes,
    timestamp: now,
    date: getPakistanDateString(),
    message: `${breakType} break ended (${durationMinutes} minutes)`,
    status: 'Break Completed'
  };
};

/**
 * Get attendance summary for today
 */
export const getTodayAttendanceSummary = () => {
  const today = getPakistanDateString();
  const now = getPakistanDate();
  
  return {
    date: today,
    currentTime: getPakistanTimeString(),
    status: 'In Progress',
    checkedIn: true,
    checkedOut: false,
    workedMinutes: 0,
    breaksTaken: 0,
    message: 'Attendance in progress for today',
    timezone: 'PKT (UTC+5)',
    dayOfWeek: getDayOfWeek(now)
  };
};

/**
 * Helper: Get day of week
 */
const getDayOfWeek = (date) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

/**
 * Run all attendance simulation tests
 */
export const runAttendanceTests = () => {
  console.log('\n' + '='.repeat(80));
  console.log('🇵🇰 FRONTEND ATTENDANCE TIMEZONE TESTS');
  console.log('='.repeat(80));

  // Test 1: Check-in
  console.log('\n✅ Test 1: Check-in Simulation');
  const checkInResult = simulateCheckIn();
  console.log(`   Time: ${checkInResult.checkInTime}`);
  console.log(`   Date: ${checkInResult.checkInDate}`);
  console.log(`   Status: ${checkInResult.status}`);
  console.log(`   Message: ${checkInResult.message}`);

  // Test 2: Check-out
  console.log('\n✅ Test 2: Check-out Simulation');
  const checkOutResult = simulateCheckOut();
  console.log(`   Time: ${checkOutResult.checkOutTime}`);
  console.log(`   Date: ${checkOutResult.checkOutDate}`);
  console.log(`   Status: ${checkOutResult.status}`);

  // Test 3: Working hours calculation
  console.log('\n✅ Test 3: Working Hours Calculation');
  const workingHours = calculateWorkingHours('09:00', '17:30', 30);
  console.log(`   Check-in: ${workingHours.checkInTime}`);
  console.log(`   Check-out: ${workingHours.checkOutTime}`);
  console.log(`   Gross Minutes: ${workingHours.grossMinutes}`);
  console.log(`   Break Duration: ${workingHours.breakMinutes} minutes`);
  console.log(`   Net Working Hours: ${workingHours.hours} hours`);

  // Test 4: Break start
  console.log('\n✅ Test 4: Break Start');
  const breakStart = simulateBreakStart('Lunch');
  console.log(`   Break Type: ${breakStart.breakType}`);
  console.log(`   Start Time: ${breakStart.breakStartTime}`);
  console.log(`   Date: ${breakStart.date}`);

  // Test 5: Break end
  console.log('\n✅ Test 5: Break End');
  const breakEnd = simulateBreakEnd('Lunch', 45);
  console.log(`   Break Type: ${breakEnd.breakType}`);
  console.log(`   End Time: ${breakEnd.breakEndTime}`);
  console.log(`   Duration: ${breakEnd.duration} minutes`);

  // Test 6: Today's summary
  console.log('\n✅ Test 6: Today\'s Attendance Summary');
  const summary = getTodayAttendanceSummary();
  console.log(`   Date: ${summary.date} (${summary.dayOfWeek})`);
  console.log(`   Current Time: ${summary.currentTime}`);
  console.log(`   Status: ${summary.status}`);
  console.log(`   Timezone: ${summary.timezone}`);

  console.log('\n' + '='.repeat(80));
  console.log('✅ All Frontend Attendance Tests Completed!');
  console.log('='.repeat(80) + '\n');

  return {
    checkIn: checkInResult,
    checkOut: checkOutResult,
    workingHours,
    breakStart,
    breakEnd,
    summary
  };
};

export default {
  simulateCheckIn,
  simulateCheckOut,
  calculateWorkingHours,
  simulateBreakStart,
  simulateBreakEnd,
  getTodayAttendanceSummary,
  runAttendanceTests
};
