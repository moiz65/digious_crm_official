#!/bin/bash

echo "=== Testing Dynamic Document Upload ==="
echo ""

# Create test file
echo "This is a test document" > /tmp/test_doc.txt
BASE64_CONTENT=$(base64 /tmp/test_doc.txt | tr -d '\n')

echo "1. Get current documents (should be empty or only show uploaded):"
curl -s http://100.118.172.21:5000/api/v1/employees/profile/1/required-documents | jq .
echo ""
echo ""

echo "2. Upload a dynamic document (Medical Certificate):"
curl -s -X POST http://100.118.172.21:5000/api/v1/employees/profile/1/upload-required-documents \
  -H "Content-Type: application/json" \
  -d "{
    \"documents\": [{
      \"base64\": \"data:text/plain;base64,${BASE64_CONTENT}\",
      \"document_type\": \"medical_certificate\",
      \"document_name\": \"Medical Certificate\",
      \"fileName\": \"medical_cert.txt\"
    }]
  }" | jq .
echo ""
echo ""

echo "3. Get documents after upload (should show only uploaded document):"
curl -s http://100.118.172.21:5000/api/v1/employees/profile/1/required-documents | jq .
echo ""
echo ""

echo "4. Upload another document (Tax Form):"
curl -s -X POST http://100.118.172.21:5000/api/v1/employees/profile/1/upload-required-documents \
  -H "Content-Type: application/json" \
  -d "{
    \"documents\": [{
      \"base64\": \"data:text/plain;base64,${BASE64_CONTENT}\",
      \"document_type\": \"tax_form\",
      \"document_name\": \"Tax Form 2026\",
      \"fileName\": \"tax_form.txt\"
    }]
  }" | jq .
echo ""
echo ""

echo "5. Final documents list (should show both uploaded documents):"
curl -s http://100.118.172.21:5000/api/v1/employees/profile/1/required-documents | jq .

# Cleanup
rm /tmp/test_doc.txt
