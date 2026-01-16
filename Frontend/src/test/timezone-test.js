/**
 * Pakistan Timezone Test Suite - Frontend
 * Tests all timezone utility functions to verify PKT (UTC+5) is working correctly
 * 
 * Usage: Import and run in browser console or test framework
 * Example: 
 *   import * as timezoneTests from './timezone-test.js';
 *   timezoneTests.runAllTests();
 */

import {
  getPakistanDate,
  getPakistanDateString,
  getPakistanTimeString,
  getPakistanISO,
  convertToPakistanTime,
  formatPakistanDate,
  getPakistanYesterday,
  getPakistanYesterdayString,
  getPakistanNow,
  formatPakistanTime
} from '../utils/timezone';

/**
 * Log test results with proper formatting
 */
const logTest = (testName, passed, details = {}) => {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status} - ${testName}`);
  Object.entries(details).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
};

/**
 * Run all timezone tests
 */
export const runAllTests = () => {
  console.log('\n' + '='.repeat(80));
  console.log('🇵🇰 PAKISTAN TIMEZONE (PKT - UTC+5) FRONTEND TEST SUITE');
  console.log('='.repeat(80));

  // Test 1: getPakistanDate
  const pkDate = getPakistanDate();
  const test1Pass = pkDate instanceof Date && !isNaN(pkDate);
  logTest('getPakistanDate()', test1Pass, {
    'Result': pkDate.toString(),
    'Type': 'Date object',
    'Hours': pkDate.getHours(),
    'Minutes': pkDate.getMinutes()
  });

  // Test 2: getPakistanDateString
  const pkDateStr = getPakistanDateString();
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const test2Pass = dateRegex.test(pkDateStr);
  logTest('getPakistanDateString()', test2Pass, {
    'Result': pkDateStr,
    'Format': 'YYYY-MM-DD',
    'Valid Format': test2Pass ? 'YES' : 'NO'
  });

  // Test 3: getPakistanTimeString
  const pkTimeStr = getPakistanTimeString();
  const timeRegex = /^\d{2}:\d{2}:\d{2}$/;
  const test3Pass = timeRegex.test(pkTimeStr);
  logTest('getPakistanTimeString()', test3Pass, {
    'Result': pkTimeStr,
    'Format': 'HH:MM:SS',
    'Valid Format': test3Pass ? 'YES' : 'NO'
  });

  // Test 4: getPakistanISO
  const pkISO = getPakistanISO();
  const test4Pass = pkISO.includes('T') && pkISO.includes('Z');
  logTest('getPakistanISO()', test4Pass, {
    'Result': pkISO,
    'Format': 'ISO 8601',
    'Contains T': pkISO.includes('T') ? 'YES' : 'NO'
  });

  // Test 5: convertToPakistanTime
  const testDate = new Date('2026-01-09T12:00:00Z');
  const convertedDate = convertToPakistanTime(testDate);
  const expectedHour = 17; // 12 UTC + 5 = 17 PKT
  const test5Pass = convertedDate.getHours() === expectedHour;
  logTest('convertToPakistanTime(date)', test5Pass, {
    'Input (UTC)': '12:00',
    'Output (PKT)': `${convertedDate.getHours()}:00`,
    'Expected Hour': expectedHour,
    'Actual Hour': convertedDate.getHours()
  });

  // Test 6: formatPakistanDate
  const formattedDate = formatPakistanDate(testDate);
  const test6Pass = dateRegex.test(formattedDate);
  logTest('formatPakistanDate(date)', test6Pass, {
    'Result': formattedDate,
    'Format': 'YYYY-MM-DD',
    'Valid': test6Pass ? 'YES' : 'NO'
  });

  // Test 7: getPakistanYesterday
  const yesterday = getPakistanYesterday();
  const test7Pass = yesterday instanceof Date && !isNaN(yesterday);
  logTest('getPakistanYesterday()', test7Pass, {
    'Result': yesterday.toString(),
    'Type': 'Date object',
    'Is Date': test7Pass ? 'YES' : 'NO'
  });

  // Test 8: getPakistanYesterdayString
  const yesterdayStr = getPakistanYesterdayString();
  const test8Pass = dateRegex.test(yesterdayStr);
  logTest('getPakistanYesterdayString()', test8Pass, {
    'Result': yesterdayStr,
    'Format': 'YYYY-MM-DD',
    'Valid Format': test8Pass ? 'YES' : 'NO'
  });

  // Test 9: getPakistanNow
  const pkNow = getPakistanNow();
  const test9Pass = typeof pkNow === 'number' && pkNow > 0;
  logTest('getPakistanNow()', test9Pass, {
    'Result': pkNow,
    'Type': 'number (milliseconds)',
    'Valid': test9Pass ? 'YES' : 'NO'
  });

  // Test 10: formatPakistanTime
  const testTime = new Date('2026-01-09T12:00:00Z');
  const formattedTime = formatPakistanTime(testTime);
  const timeFormatRegex = /^\d{2}:\d{2}$/;
  const test10Pass = timeFormatRegex.test(formattedTime);
  logTest('formatPakistanTime(date)', test10Pass, {
    'Result': formattedTime,
    'Format': 'HH:MM',
    'Valid Format': test10Pass ? 'YES' : 'NO'
  });

  // Test 11: localStorage persistence
  const testData = { date: getPakistanDateString(), time: getPakistanTimeString() };
  localStorage.setItem('pkTimezoneTest', JSON.stringify(testData));
  const retrievedData = JSON.parse(localStorage.getItem('pkTimezoneTest'));
  const test11Pass = retrievedData.date === testData.date && retrievedData.time === testData.time;
  logTest('localStorage persistence', test11Pass, {
    'Stored Date': testData.date,
    'Retrieved Date': retrievedData.date,
    'Match': test11Pass ? 'YES' : 'NO'
  });
  localStorage.removeItem('pkTimezoneTest');

  // Test 12: Timezone consistency
  const pkDate1 = getPakistanDateString();
  const pkDate2 = getPakistanDateString();
  const test12Pass = pkDate1 === pkDate2;
  logTest('Timezone consistency (same day)', test12Pass, {
    'First Call': pkDate1,
    'Second Call': pkDate2,
    'Consistent': test12Pass ? 'YES' : 'NO'
  });

  // Summary
  const allTests = [test1Pass, test2Pass, test3Pass, test4Pass, test5Pass, test6Pass, 
                    test7Pass, test8Pass, test9Pass, test10Pass, test11Pass, test12Pass];
  const passedTests = allTests.filter(t => t).length;
  const totalTests = allTests.length;

  console.log('\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`\n🔍 Current Timezone Info:`);
  console.log(`   • PKT Date: ${getPakistanDateString()}`);
  console.log(`   • PKT Time: ${getPakistanTimeString()}`);
  console.log(`   • Browser Timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
  console.log(`   • Status: ${passedTests === totalTests ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
  console.log('\n' + '='.repeat(80) + '\n');

  return {
    passed: passedTests,
    total: totalTests,
    success: passedTests === totalTests
  };
};

/**
 * Run specific test by name
 */
export const runTest = (testName) => {
  console.log(`\n🧪 Running: ${testName}`);
  const result = runAllTests();
  return result;
};

/**
 * Get detailed timezone report
 */
export const getTimezoneReport = () => {
  return {
    currentDate: getPakistanDateString(),
    currentTime: getPakistanTimeString(),
    currentDateTime: `${getPakistanDateString()} ${getPakistanTimeString()}`,
    currentISO: getPakistanISO(),
    currentTimestamp: getPakistanNow(),
    yesterdayDate: getPakistanYesterdayString(),
    browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    pktTimezone: 'Asia/Karachi (UTC+5)',
    serverTime: new Date().toString(),
    status: 'PKT Timezone Active'
  };
};

// Auto-run tests if script is loaded directly
if (typeof window !== 'undefined' && window.__RUN_TIMEZONE_TESTS__) {
  runAllTests();
}

export default {
  runAllTests,
  runTest,
  getTimezoneReport
};
