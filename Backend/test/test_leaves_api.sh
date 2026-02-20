#!/bin/bash
##############################################################################
# EMPLOYEE LEAVES API - CURL TEST COMMANDS
##############################################################################
# Use these commands to manually test the API endpoints
# 
# Prerequisites:
# 1. Backend server running on http://localhost:5000
# 2. Employee leaves data populated (run employee_leaves_QUICK_FIX.sql)
# 3. Replace :EMPLOYEE_ID with an actual employee ID from database
#
# Usage: bash test_leaves_api.sh
# Or run individual commands below
##############################################################################

BASE_URL="http://localhost:5000/api/v1"
EMPLOYEE_ID=1  # Change this to a valid employee ID from your database

echo "=========================================="
echo "EMPLOYEE LEAVES API - CURL TEST COMMANDS"
echo "=========================================="
echo ""
echo "Base URL: $BASE_URL"
echo "Test Employee ID: $EMPLOYEE_ID"
echo ""

# Test 1: Get all employee leaves
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[1] GET all employee leaves"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -X GET $BASE_URL/leaves/all"
echo ""
curl -X GET "$BASE_URL/leaves/all" | jq '.'
echo ""
echo ""

# Test 2: Get specific employee leave balance
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[2] GET employee leave balance"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -X GET $BASE_URL/leaves/employee/$EMPLOYEE_ID/leaveBalance"
echo ""
curl -X GET "$BASE_URL/leaves/employee/$EMPLOYEE_ID/leaveBalance" | jq '.'
echo ""
echo ""

# Test 3: Mark leave (use 1 casual day)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[3] POST - Mark 1 casual leave"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -X POST $BASE_URL/leaves/employee/$EMPLOYEE_ID/markLeave \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"leaveType\": \"casual\", \"days\": 1, \"reason\": \"Test leave\"}'"
echo ""
curl -X POST "$BASE_URL/leaves/employee/$EMPLOYEE_ID/markLeave" \
  -H 'Content-Type: application/json' \
  -d '{"leaveType": "casual", "days": 1, "reason": "Test leave marking"}' | jq '.'
echo ""
echo ""

# Test 4: Get updated leave balance
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[4] GET updated leave balance (should show used +1)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -X GET $BASE_URL/leaves/employee/$EMPLOYEE_ID/leaveBalance"
echo ""
curl -X GET "$BASE_URL/leaves/employee/$EMPLOYEE_ID/leaveBalance" | jq '.'
echo ""
echo ""

# Test 5: Update leave allocation
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[5] PUT - Update leave allocation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -X PUT $BASE_URL/leaves/employee/$EMPLOYEE_ID/updateLeaveAllocation \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"casual_total\": 10, \"sick_total\": 10, \"annual_total\": 15}'"
echo ""
curl -X PUT "$BASE_URL/leaves/employee/$EMPLOYEE_ID/updateLeaveAllocation" \
  -H 'Content-Type: application/json' \
  -d '{"casual_total": 10, "sick_total": 10, "annual_total": 15}' | jq '.'
echo ""
echo ""

# Test 6: Get leave statistics
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[6] GET leave statistics"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -X GET $BASE_URL/leaves/statistics"
echo ""
curl -X GET "$BASE_URL/leaves/statistics" | jq '.'
echo ""
echo ""

# Test 7: Reset leaves for year
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[7] PUT - Reset leaves for current year"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -X PUT $BASE_URL/leaves/resetYear \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"year\": $(date +%Y)}'"
echo ""
curl -X PUT "$BASE_URL/leaves/resetYear" \
  -H 'Content-Type: application/json' \
  -d "{\"year\": $(date +%Y)}" | jq '.'
echo ""
echo ""

# Test 8: Test error - non-existent employee
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[8] GET - Non-existent employee (should error)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -X GET $BASE_URL/leaves/employee/99999/leaveBalance"
echo ""
curl -X GET "$BASE_URL/leaves/employee/99999/leaveBalance" | jq '.'
echo ""
echo ""

# Test 9: Test error - invalid leave type
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[9] POST - Invalid leave type (should error)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -X POST $BASE_URL/leaves/employee/$EMPLOYEE_ID/markLeave \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"leaveType\": \"invalid\", \"days\": 1}'"
echo ""
curl -X POST "$BASE_URL/leaves/employee/$EMPLOYEE_ID/markLeave" \
  -H 'Content-Type: application/json' \
  -d '{"leaveType": "invalid", "days": 1}' | jq '.'
echo ""
echo ""

# Test 10: Test error - insufficient balance
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "[10] POST - Try to mark excessive leave (should error)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Command:"
echo "curl -X POST $BASE_URL/leaves/employee/$EMPLOYEE_ID/markLeave \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"leaveType\": \"casual\", \"days\": 999}'"
echo ""
curl -X POST "$BASE_URL/leaves/employee/$EMPLOYEE_ID/markLeave" \
  -H 'Content-Type: application/json' \
  -d '{"leaveType": "casual", "days": 999}' | jq '.'
echo ""
echo ""

echo "=========================================="
echo "CURL TESTS COMPLETED"
echo "=========================================="
echo ""
echo "Tips for manual testing:"
echo "1. Replace $EMPLOYEE_ID with a valid employee ID from your database"
echo "2. Install jq for pretty JSON output: sudo apt-get install jq"
echo "3. Use Postman (https://www.postman.com) for a GUI alternative"
echo "4. Check Backend/test/test_leaves_api.js for automated testing"
echo ""
