/**
 * ============================================================================
 * EMPLOYEE LEAVES API - TEST SUITE
 * ============================================================================
 * Comprehensive tests for all leave management endpoints
 * 
 * Run with: npm test -- test_leaves_api.js
 * Or directly: node test_leaves_api.js
 * ============================================================================
 */

const http = require('http');

// Configuration
const BASE_URL = 'http://100.118.172.21:5000';
const API_VERSION = 'v1';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Helper function to make HTTP requests
const makeRequest = (method, endpoint, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}/api/${API_VERSION}${endpoint}`);
    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

// Test counter
let testsPassed = 0;
let testsFailed = 0;

// Test result logger
const logTest = (name, passed, details = '') => {
  if (passed) {
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    testsPassed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (details) console.log(`  ${colors.red}Error: ${details}${colors.reset}`);
    testsFailed++;
  }
};

// Test suite runner
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

/**
 * ============================================================================
 * TEST SUITE
 * ============================================================================
 */

async function runTests() {
  console.log(`\n${colors.cyan}=== EMPLOYEE LEAVES API TEST SUITE ===${colors.reset}\n`);

  // Test 1: Health check
  console.log(`${colors.blue}[1] Testing Server Connection...${colors.reset}`);
  try {
    const health = await makeRequest('GET', '/leaves/all');
    if (health.status === 200 || health.status === 404) {
      logTest('Server is accessible', true);
    } else {
      logTest('Server is accessible', false, `Got status ${health.status}`);
    }
  } catch (error) {
    logTest('Server is accessible', false, `Connection error: ${error.message}`);
    console.log(`\n${colors.red}Cannot connect to server. Make sure it's running on ${BASE_URL}${colors.reset}\n`);
    return;
  }

  // Test 2: Get all leaves
  console.log(`\n${colors.blue}[2] Testing GET /leaves/all...${colors.reset}`);
  try {
    const response = await makeRequest('GET', '/leaves/all');
    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.success === true, 'Response should have success: true');
    assert(Array.isArray(response.data.data), 'Response should contain data array');
    logTest('GET /leaves/all - Returns all employee leaves', true);
    console.log(`  Found ${colors.cyan}${response.data.data.length}${colors.reset} employees in leave system`);
  } catch (error) {
    logTest('GET /leaves/all - Returns all employee leaves', false, error.message);
  }

  // Test 3: Get specific employee leave balance
  console.log(`\n${colors.blue}[3] Testing GET /employee/:id/leaveBalance...${colors.reset}`);
  try {
    // First, get an employee ID from the all leaves endpoint
    const allLeaves = await makeRequest('GET', '/leaves/all');
    if (allLeaves.data.data.length === 0) {
      logTest('GET /employee/:id/leaveBalance - Valid employee', false, 'No employees in system');
    } else {
      const employeeId = allLeaves.data.data[0].employee_id;
      const response = await makeRequest('GET', `/leaves/employee/${employeeId}/leaveBalance`);
      assert(response.status === 200, `Expected 200, got ${response.status}`);
      assert(response.data.success === true, 'Response should have success: true');
      assert(response.data.casual !== undefined, 'Should have casual leave data');
      assert(response.data.sick !== undefined, 'Should have sick leave data');
      assert(response.data.annual !== undefined, 'Should have annual leave data');
      logTest(`GET /employee/:id/leaveBalance - Valid employee (ID: ${employeeId})`, true);
      console.log(`  Casual: ${response.data.casual.remaining}/${response.data.casual.total}`);
      console.log(`  Sick: ${response.data.sick.remaining}/${response.data.sick.total}`);
      console.log(`  Annual: ${response.data.annual.remaining}/${response.data.annual.total}`);
    }
  } catch (error) {
    logTest('GET /employee/:id/leaveBalance - Valid employee', false, error.message);
  }

  // Test 4: Get non-existent employee
  console.log(`\n${colors.blue}[4] Testing Error Handling...${colors.reset}`);
  try {
    const response = await makeRequest('GET', '/leaves/employee/99999/leaveBalance');
    assert(response.status === 404, `Expected 404 for non-existent employee, got ${response.status}`);
    logTest('GET /employee/:id/leaveBalance - Non-existent employee returns 404', true);
  } catch (error) {
    logTest('GET /employee/:id/leaveBalance - Non-existent employee returns 404', false, error.message);
  }

  // Test 5: Mark leave (using first employee)
  console.log(`\n${colors.blue}[5] Testing POST /employee/:id/markLeave...${colors.reset}`);
  try {
    const allLeaves = await makeRequest('GET', '/leaves/all');
    if (allLeaves.data.data.length === 0) {
      logTest('POST /employee/:id/markLeave - Mark 1 casual leave', false, 'No employees in system');
    } else {
      const employeeId = allLeaves.data.data[0].employee_id;
      const response = await makeRequest('POST', `/leaves/employee/${employeeId}/markLeave`, {
        leaveType: 'casual',
        days: 1,
        reason: 'Test leave marking'
      });
      
      if (response.status === 200 && response.data.success) {
        logTest('POST /employee/:id/markLeave - Mark 1 casual leave', true);
        console.log(`  New balance: ${response.data.new_balance.remaining}/${response.data.new_balance.total}`);
      } else {
        throw new Error(response.data?.message || `Status ${response.status}`);
      }
    }
  } catch (error) {
    logTest('POST /employee/:id/markLeave - Mark 1 casual leave', false, error.message);
  }

  // Test 6: Try to mark more leaves than available
  console.log(`\n${colors.blue}[6] Testing Leave Balance Validation...${colors.reset}`);
  try {
    const allLeaves = await makeRequest('GET', '/leaves/all');
    if (allLeaves.data.data.length === 0) {
      logTest('POST /employee/:id/markLeave - Insufficient balance', false, 'No employees in system');
    } else {
      const employeeId = allLeaves.data.data[0].employee_id;
      const response = await makeRequest('POST', `/leaves/employee/${employeeId}/markLeave`, {
        leaveType: 'casual',
        days: 1000, // More than available
        reason: 'Test insufficient balance'
      });
      
      if (response.status === 400 && response.data.error === 'INSUFFICIENT_BALANCE') {
        logTest('POST /employee/:id/markLeave - Insufficient balance returns 400', true);
      } else {
        logTest('POST /employee/:id/markLeave - Insufficient balance returns 400', false, 
          `Got status ${response.status}, error: ${response.data?.error}`);
      }
    }
  } catch (error) {
    logTest('POST /employee/:id/markLeave - Insufficient balance returns 400', false, error.message);
  }

  // Test 7: Invalid leave type
  console.log(`\n${colors.blue}[7] Testing Invalid Leave Type...${colors.reset}`);
  try {
    const allLeaves = await makeRequest('GET', '/leaves/all');
    if (allLeaves.data.data.length === 0) {
      logTest('POST /employee/:id/markLeave - Invalid leave type', false, 'No employees in system');
    } else {
      const employeeId = allLeaves.data.data[0].employee_id;
      const response = await makeRequest('POST', `/leaves/employee/${employeeId}/markLeave`, {
        leaveType: 'invalid_type',
        days: 1
      });
      
      if (response.status === 400 && response.data.error === 'INVALID_LEAVE_TYPE') {
        logTest('POST /employee/:id/markLeave - Invalid leave type returns 400', true);
      } else {
        logTest('POST /employee/:id/markLeave - Invalid leave type returns 400', false,
          `Got status ${response.status}, error: ${response.data?.error}`);
      }
    }
  } catch (error) {
    logTest('POST /employee/:id/markLeave - Invalid leave type returns 400', false, error.message);
  }

  // Test 8: Update leave allocation
  console.log(`\n${colors.blue}[8] Testing PUT /employee/:id/updateLeaveAllocation...${colors.reset}`);
  try {
    const allLeaves = await makeRequest('GET', '/leaves/all');
    if (allLeaves.data.data.length === 0) {
      logTest('PUT /employee/:id/updateLeaveAllocation - Update allocation', false, 'No employees in system');
    } else {
      const employeeId = allLeaves.data.data[0].employee_id;
      const response = await makeRequest('PUT', `/leaves/employee/${employeeId}/updateLeaveAllocation`, {
        casual_total: 10,
        sick_total: 10,
        annual_total: 15
      });
      
      if (response.status === 200 && response.data.success) {
        logTest('PUT /employee/:id/updateLeaveAllocation - Update allocation', true);
        console.log(`  New allocation - Casual: ${response.data.updated_allocation.casual}, Sick: ${response.data.updated_allocation.sick}, Annual: ${response.data.updated_allocation.annual}`);
      } else {
        throw new Error(response.data?.message || `Status ${response.status}`);
      }
    }
  } catch (error) {
    logTest('PUT /employee/:id/updateLeaveAllocation - Update allocation', false, error.message);
  }

  // Test 9: Get leave statistics
  console.log(`\n${colors.blue}[9] Testing GET /leaves/statistics...${colors.reset}`);
  try {
    const response = await makeRequest('GET', '/leaves/statistics');
    assert(response.status === 200, `Expected 200, got ${response.status}`);
    assert(response.data.success === true, 'Response should have success: true');
    assert(response.data.statistics !== undefined, 'Should have statistics');
    logTest('GET /leaves/statistics - Return statistics', true);
    console.log(`  Total employees: ${response.data.statistics.total_employees}`);
    console.log(`  Avg casual remaining: ${response.data.statistics.avg_casual_remaining}`);
    console.log(`  Avg sick remaining: ${response.data.statistics.avg_sick_remaining}`);
    console.log(`  Avg annual remaining: ${response.data.statistics.avg_annual_remaining}`);
  } catch (error) {
    logTest('GET /leaves/statistics - Return statistics', false, error.message);
  }

  // Test 10: Reset leaves for year
  console.log(`\n${colors.blue}[10] Testing PUT /leaves/resetYear...${colors.reset}`);
  try {
    const response = await makeRequest('PUT', '/leaves/resetYear', {
      year: new Date().getFullYear()
    });
    
    if (response.status === 200 && response.data.success) {
      logTest('PUT /leaves/resetYear - Reset leaves', true);
      console.log(`  Affected employees: ${response.data.affected_employees}`);
    } else {
      throw new Error(response.data?.message || `Status ${response.status}`);
    }
  } catch (error) {
    logTest('PUT /leaves/resetYear - Reset leaves', false, error.message);
  }

  // Test 11: Missing required fields
  console.log(`\n${colors.blue}[11] Testing Input Validation...${colors.reset}`);
  try {
    const response = await makeRequest('POST', '/leaves/employee/123/markLeave', {
      // Missing leaveType
      days: 1
    });
    
    if (response.status === 400) {
      logTest('POST /employee/:id/markLeave - Missing required field', true);
    } else {
      logTest('POST /employee/:id/markLeave - Missing required field', false,
        `Expected 400, got ${response.status}`);
    }
  } catch (error) {
    logTest('POST /employee/:id/markLeave - Missing required field', false, error.message);
  }

  // Summary
  console.log(`\n${colors.cyan}=== TEST SUMMARY ===${colors.reset}`);
  console.log(`${colors.green}Passed: ${testsPassed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testsFailed}${colors.reset}`);
  console.log(`Total: ${testsPassed + testsFailed}\n`);

  if (testsFailed === 0) {
    console.log(`${colors.green}All tests passed! ✓${colors.reset}\n`);
  } else {
    console.log(`${colors.red}Some tests failed. Check the errors above.${colors.reset}\n`);
  }
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test suite error:${colors.reset}`, error);
  process.exit(1);
});
