# Frontend Timezone Tests

## Overview
Test files for verifying Pakistan timezone (PKT - UTC+5) functionality in the React frontend.

## Test Files

### 1. `timezone-test.js`
Comprehensive test suite for all timezone utility functions.

**Usage in Browser Console:**
```javascript
import { runAllTests } from './timezone-test.js';
runAllTests();
```

**Or from a React component:**
```javascript
import * as timezoneTests from './test/timezone-test.js';

useEffect(() => {
  timezoneTests.runAllTests();
}, []);
```

**Tests:**
- ✅ getPakistanDate()
- ✅ getPakistanDateString()
- ✅ getPakistanTimeString()
- ✅ getPakistanISO()
- ✅ convertToPakistanTime()
- ✅ formatPakistanDate()
- ✅ getPakistanYesterday()
- ✅ getPakistanYesterdayString()
- ✅ getPakistanNow()
- ✅ formatPakistanTime()
- ✅ localStorage persistence
- ✅ Timezone consistency

**Available Functions:**
```javascript
// Run all tests
runAllTests()

// Run specific test
runTest('testName')

// Get timezone report
getTimezoneReport()
```

---

### 2. `attendance-test.js`
Real-world attendance simulation scenarios.

**Usage:**
```javascript
import { runAttendanceTests, simulateCheckIn, simulateCheckOut } from './attendance-test.js';

// Run all tests
runAttendanceTests();

// Or use individual functions
const checkInData = simulateCheckIn();
const checkOutData = simulateCheckOut();
```

**Available Functions:**
```javascript
// Simulate check-in
simulateCheckIn()

// Simulate check-out
simulateCheckOut()

// Calculate working hours
calculateWorkingHours(checkInTime, checkOutTime, breakMinutes)

// Simulate break start
simulateBreakStart(breakType)

// Simulate break end
simulateBreakEnd(breakType, durationMinutes)

// Get today's summary
getTodayAttendanceSummary()

// Run all attendance tests
runAttendanceTests()
```

---

## How to Run Tests

### In React Component (Example)
```jsx
import { useEffect } from 'react';
import { runAllTests } from '../test/timezone-test.js';
import { runAttendanceTests } from '../test/attendance-test.js';

function TimezoneTestComponent() {
  useEffect(() => {
    // Run timezone tests
    const tzResult = runAllTests();
    console.log('Timezone tests:', tzResult);

    // Run attendance tests
    const attendanceResult = runAttendanceTests();
    console.log('Attendance tests:', attendanceResult);
  }, []);

  return <div>Check console for test results</div>;
}

export default TimezoneTestComponent;
```

### In Browser Console
```javascript
// Open DevTools (F12) and run:
import('./src/test/timezone-test.js').then(mod => mod.runAllTests());
import('./src/test/attendance-test.js').then(mod => mod.runAttendanceTests());
```

---

## Test Results Interpretation

### ✅ All Tests Pass
- All functions working correctly
- Timezone is set to PKT (UTC+5)
- Attendance simulations are accurate
- Ready for production

### ⚠️ Some Tests Fail
- Check browser console for error messages
- Verify timezone utility imports correctly
- Check that all dependencies are installed
- Review the specific test failure details

---

## What Each Test Checks

### Timezone Utility Tests
- **Date Object**: Verifies Date objects are created correctly
- **Date String**: Checks YYYY-MM-DD format
- **Time String**: Checks HH:MM:SS format
- **ISO Format**: Verifies ISO 8601 compliance
- **Conversion**: Tests UTC to PKT conversion (+5 hours)
- **Yesterday**: Verifies previous day calculations
- **localStorage**: Tests data persistence
- **Consistency**: Verifies same-day consistency

### Attendance Simulation Tests
- **Check-in**: Records time and date in PKT
- **Check-out**: Records time and date in PKT
- **Working Hours**: Calculates net hours after breaks
- **Breaks**: Records break start/end in PKT
- **Daily Summary**: Shows today's attendance status
- **Night Shift**: Handles times crossing midnight

---

## Integration with Components

Once tests pass, these utilities are safe to use in:

```javascript
// Attendance Page
import { getPakistanDateString, getPakistanTimeString } from '../utils/timezone';

function AttendancePage() {
  const today = getPakistanDateString();
  const currentTime = getPakistanTimeString();
  
  return <div>{today} {currentTime}</div>;
}
```

```javascript
// Break Tracking
import { getPakistanDate } from '../utils/timezone';

function BreakTracker() {
  const breakStartTime = getPakistanDate();
  // ...
}
```

---

## Troubleshooting

### Tests Not Running
1. Check that timezone utility file exists: `src/utils/timezone.js`
2. Verify imports are correct
3. Check browser console for error messages
4. Ensure JavaScript modules are supported

### Wrong Results
1. Verify browser timezone doesn't interfere
2. Check that timezone utility calculations are correct
3. Test on different devices/browsers
4. Check system time is correct

### localStorage Issues
1. Ensure localStorage is enabled in browser
2. Check for browser privacy settings blocking storage
3. Verify no quota exceeded errors

---

## Maintenance

When updating timezone utilities:
1. Update tests to match new functionality
2. Run full test suite before committing
3. Document any API changes
4. Test on multiple browsers if possible

---

**Created:** January 9, 2026  
**Timezone:** Asia/Karachi (PKT - UTC+5)  
**Status:** ✅ Ready for Testing
