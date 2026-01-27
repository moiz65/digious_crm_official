#!/bin/bash

# Checkout System Test Runner
# Run this script to test all checkout scenarios anytime

echo "════════════════════════════════════════════════════════════════"
echo "CHECKOUT SYSTEM TEST RUNNER"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/Backend"

echo "Running checkout validation tests..."
echo ""

# Run the test
node test/checkout-scenarios-test.js

TEST_RESULT=$?

echo ""
echo "════════════════════════════════════════════════════════════════"

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ ALL TESTS PASSED"
    echo ""
    echo "Your checkout system is working correctly!"
    echo "✓ Users can checkout before 6 AM"
    echo "✓ Users can checkout after 6 AM (before 9 AM)"
    echo "✓ System blocks checkout at/after 9 AM"
    echo "✓ Auto-checkout triggers at 9 AM as fallback"
    echo ""
    echo "Ready for production deployment! 🚀"
else
    echo "❌ TESTS FAILED"
    echo ""
    echo "Please review the errors above and fix the issues."
fi

echo "════════════════════════════════════════════════════════════════"

exit $TEST_RESULT
