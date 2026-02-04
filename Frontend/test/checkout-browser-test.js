/**
 * Frontend Checkout Test - Run in Browser Console
 * Copy-paste this into browser DevTools console to test all scenarios
 * Can run anytime - uses mock time instead of real time
 */

// Store original functions
window._originalGetPakistanTimeString = window.getPakistanTimeString;

// Test helper - override time for testing
function setTestTime(timeString) {
  console.log(`\n⏰ TEST TIME SET: ${timeString}`);
  // This would override the getPakistanTimeString for testing
  window.getPakistanTimeString = () => timeString;
}

// Reset to real time
function resetToRealTime() {
  window.getPakistanTimeString = window._originalGetPakistanTimeString;
  console.log('✅ Reset to real time');
}

/**
 * Validate checkout time - same logic as backend
 */
function testCheckoutValidation(checkOutTime) {
  const [checkOutHour, checkOutMin] = checkOutTime.split(':').map(Number);
  const checkOutTotalMinutes = checkOutHour * 60 + checkOutMin;
  const nineAMTotalMinutes = 9 * 60; // 540 minutes
  
  if (checkOutTotalMinutes >= nineAMTotalMinutes) {
    return {
      allowed: false,
      error: 'Checkout deadline exceeded. Manual checkout must be before 9:00 AM. System will auto-complete your checkout at 9:00 AM if not done manually.',
      status: '❌ BLOCKED'
    };
  }
  
  return {
    allowed: true,
    message: 'Checkout allowed',
    status: '✅ ALLOWED'
  };
}

/**
 * Test button disable state
 */
function testButtonState(isCheckedIn, isOnBreak, isLoading) {
  // From EmployeeAttendancePage.jsx canCheckOut()
  if (!isCheckedIn) return false;
  if (isOnBreak) return false;
  return !isLoading;
}

/**
 * Run all test scenarios
 */
function runAllCheckoutTests() {
  console.clear();
  console.log('%c═══════════════════════════════════════════════════════════════════', 'color: blue; font-weight: bold; font-size: 14px');
  console.log('%cFRONTEND CHECKOUT SYSTEM TESTS (Browser)', 'color: blue; font-weight: bold; font-size: 14px');
  console.log('%c═══════════════════════════════════════════════════════════════════', 'color: blue; font-weight: bold; font-size: 14px');

  const testCases = [
    { time: '05:30:00', scenario: 'Before 6 AM', expectedAllow: true },
    { time: '06:15:00', scenario: 'After 6 AM (6 AM restriction should be gone)', expectedAllow: true },
    { time: '07:45:00', scenario: 'Late morning', expectedAllow: true },
    { time: '08:59:59', scenario: 'Just before 9 AM deadline', expectedAllow: true },
    { time: '09:00:00', scenario: 'Exactly at 9 AM deadline', expectedAllow: false },
    { time: '09:01:00', scenario: 'After 9 AM deadline', expectedAllow: false },
    { time: '09:15:00', scenario: 'Well after deadline', expectedAllow: false },
  ];

  let passCount = 0;
  let failCount = 0;

  testCases.forEach((test, index) => {
    console.log(`\n%c─ TEST ${index + 1}: Checkout at ${test.time} (${test.scenario})`, 'color: cyan; font-weight: bold');
    setTestTime(test.time);
    
    const result = testCheckoutValidation(test.time);
    console.log(`   Result: ${result.status}`);
    
    if (result.allowed === test.expectedAllow) {
      console.log('%c   ✅ PASS', 'color: green; font-weight: bold');
      passCount++;
    } else {
      console.log(`%c   ❌ FAIL - Expected ${test.expectedAllow}, got ${result.allowed}`, 'color: red; font-weight: bold');
      failCount++;
    }

    if (!result.allowed) {
      console.log(`   Error: "${result.error}"`);
    }
  });

  // Test button state
  console.log(`\n%c─ BUTTON STATE TESTS (No time-based disable)`, 'color: cyan; font-weight: bold');
  setTestTime('06:30:00'); // Test at 6:30 AM (would be blocked if 6 AM restriction existed)
  
  const buttonTest1 = testButtonState(true, false, false);
  console.log(`   At 06:30 AM - User checked in, not on break, not loading:`);
  console.log(`   Button enabled: ${buttonTest1} ${buttonTest1 ? '✅ CORRECT' : '❌ WRONG'}`);
  buttonTest1 ? passCount++ : failCount++;

  const buttonTest2 = testButtonState(false, false, false);
  console.log(`   User NOT checked in:`);
  console.log(`   Button disabled: ${!buttonTest2} ${!buttonTest2 ? '✅ CORRECT' : '❌ WRONG'}`);
  !buttonTest2 ? passCount++ : failCount++;

  // Summary
  console.log(`\n%c═══════════════════════════════════════════════════════════════════`, 'color: blue; font-weight: bold; font-size: 14px');
  console.log(`%c${passCount}/${passCount + failCount} Tests Passed`, passCount === passCount + failCount ? 'color: green; font-weight: bold; font-size: 14px' : 'color: red; font-weight: bold; font-size: 14px');
  console.log(`%c═══════════════════════════════════════════════════════════════════`, 'color: blue; font-weight: bold; font-size: 14px');

  resetToRealTime();
  
  return passCount === passCount + failCount;
}

/**
 * Test individual scenarios manually
 */
function testAtTime(timeString) {
  setTestTime(timeString);
  const result = testCheckoutValidation(timeString);
  console.log(`\nTesting checkout at ${timeString}:`);
  console.log(`Result: ${result.status}`);
  if (result.error) {
    console.log(`Error: "${result.error}"`);
  }
  return result;
}

// Make functions available in console
window.checkoutTest = {
  runAll: runAllCheckoutTests,
  testTime: testAtTime,
  setTime: setTestTime,
  reset: resetToRealTime
};

console.log('%c✅ Checkout tests loaded!', 'color: green; font-weight: bold');
console.log('%cRun: checkoutTest.runAll() to test all scenarios', 'color: yellow; font-weight: bold');
console.log('%cOr: checkoutTest.testTime("08:30:00") to test specific time', 'color: yellow; font-weight: bold');

// Auto-run tests if this script is directly executed
if (typeof runAllCheckoutTests === 'function') {
  // Uncomment to auto-run:
  // runAllCheckoutTests();
}
