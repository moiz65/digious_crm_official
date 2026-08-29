#!/bin/bash

# Employee Profile API Test Suite
# Base URL: http://100.118.172.21:5000/api/v1/employees

BASE_URL="http://100.118.172.21:5000/api/v1/employees"
EMPLOYEE_ID=1

echo "================================================"
echo "🧪 Employee Profile API Test Suite"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Get Employee Profile
echo -e "${BLUE}Test 1: GET /profile/:id${NC}"
echo "URL: $BASE_URL/profile/$EMPLOYEE_ID"
echo "---"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/profile/$EMPLOYEE_ID")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Status: $HTTP_STATUS${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
  echo "$BODY"
fi
echo ""
echo "================================================"
echo ""

# Test 2: Get Profile Summary
echo -e "${BLUE}Test 2: GET /profile/:id/summary${NC}"
echo "URL: $BASE_URL/profile/$EMPLOYEE_ID/summary"
echo "---"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/profile/$EMPLOYEE_ID/summary")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Status: $HTTP_STATUS${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
  echo "$BODY"
fi
echo ""
echo "================================================"
echo ""

# Test 3: Get Financial Summary
echo -e "${BLUE}Test 3: GET /profile/:id/financial${NC}"
echo "URL: $BASE_URL/profile/$EMPLOYEE_ID/financial"
echo "---"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/profile/$EMPLOYEE_ID/financial")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Status: $HTTP_STATUS${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
  echo "$BODY"
fi
echo ""
echo "================================================"
echo ""

# Test 4: Get Attendance Summary
echo -e "${BLUE}Test 4: GET /profile/:id/attendance${NC}"
echo "URL: $BASE_URL/profile/$EMPLOYEE_ID/attendance"
echo "---"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/profile/$EMPLOYEE_ID/attendance")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Status: $HTTP_STATUS${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
  echo "$BODY"
fi
echo ""
echo "================================================"
echo ""

# Test 5: Get Performance Summary
echo -e "${BLUE}Test 5: GET /profile/:id/performance${NC}"
echo "URL: $BASE_URL/profile/$EMPLOYEE_ID/performance"
echo "---"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/profile/$EMPLOYEE_ID/performance")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Status: $HTTP_STATUS${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
  echo "$BODY"
fi
echo ""
echo "================================================"
echo ""

# Test 6: Update Employee Profile (Bio and LinkedIn)
echo -e "${BLUE}Test 6: PUT /profile/:id (Update bio and LinkedIn)${NC}"
echo "URL: $BASE_URL/profile/$EMPLOYEE_ID"
echo "---"
UPDATE_DATA='{
  "bio": "Senior Full-Stack Developer with expertise in React, Node.js, and MySQL",
  "linkedin_url": "https://linkedin.com/in/muhammad-hunain",
  "preferred_work_location": "Karachi Office",
  "work_mode_preference": "Hybrid"
}'
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT "$BASE_URL/profile/$EMPLOYEE_ID" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Status: $HTTP_STATUS${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
  echo "$BODY"
fi
echo ""
echo "================================================"
echo ""

# Test 7: Update Banner
echo -e "${BLUE}Test 7: PUT /profile/:id/banner${NC}"
echo "URL: $BASE_URL/profile/$EMPLOYEE_ID/banner"
echo "---"
BANNER_DATA='{"banner_url": "https://example.com/banners/employee-1-banner.jpg"}'
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT "$BASE_URL/profile/$EMPLOYEE_ID/banner" \
  -H "Content-Type: application/json" \
  -d "$BANNER_DATA")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Status: $HTTP_STATUS${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
  echo "$BODY"
fi
echo ""
echo "================================================"
echo ""

# Test 8: Update Documents
echo -e "${BLUE}Test 8: PUT /profile/:id/documents${NC}"
echo "URL: $BASE_URL/profile/$EMPLOYEE_ID/documents"
echo "---"
DOCS_DATA='{
  "documents": [
    {"id": 1, "title": "CNIC Copy", "url": "/docs/cnic.pdf", "type": "identification", "uploadedAt": "2026-01-31"},
    {"id": 2, "title": "Degree Certificate", "url": "/docs/degree.pdf", "type": "education", "uploadedAt": "2026-01-31"}
  ]
}'
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT "$BASE_URL/profile/$EMPLOYEE_ID/documents" \
  -H "Content-Type: application/json" \
  -d "$DOCS_DATA")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Status: $HTTP_STATUS${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
  echo "$BODY"
fi
echo ""
echo "================================================"
echo ""

# Test 9: Update Resources
echo -e "${BLUE}Test 9: PUT /profile/:id/resources${NC}"
echo "URL: $BASE_URL/profile/$EMPLOYEE_ID/resources"
echo "---"
RESOURCES_DATA='{
  "resources": [
    {"id": 1, "name": "MacBook Pro 16\"", "type": "laptop", "serial": "SN123456", "assignedDate": "2025-11-01", "status": "active"},
    {"id": 2, "name": "iPhone 14 Pro", "type": "mobile", "serial": "SN789012", "assignedDate": "2025-11-01", "status": "active"}
  ]
}'
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X PUT "$BASE_URL/profile/$EMPLOYEE_ID/resources" \
  -H "Content-Type: application/json" \
  -d "$RESOURCES_DATA")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Status: $HTTP_STATUS${NC}"
  echo "$BODY" | jq '.'
else
  echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
  echo "$BODY"
fi
echo ""
echo "================================================"
echo ""

# Test 10: Verify Updates (Get Profile Summary Again)
echo -e "${BLUE}Test 10: Verify Updates - GET /profile/:id/summary${NC}"
echo "URL: $BASE_URL/profile/$EMPLOYEE_ID/summary"
echo "---"
RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}" "$BASE_URL/profile/$EMPLOYEE_ID/summary")
HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo -e "${GREEN}✓ Status: $HTTP_STATUS${NC}"
  echo "$BODY" | jq '.'
  echo ""
  echo -e "${BLUE}Checking updated fields:${NC}"
  echo "$BODY" | jq '.data.profile | {bio, linkedin_url, banner_url, has_documents: (.documents_json != null), has_resources: (.resources_json != null)}'
else
  echo -e "${RED}✗ Status: $HTTP_STATUS${NC}"
  echo "$BODY"
fi
echo ""
echo "================================================"
echo ""

echo -e "${GREEN}✅ All tests completed!${NC}"
