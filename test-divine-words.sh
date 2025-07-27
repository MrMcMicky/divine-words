#!/bin/bash

echo "🧪 Divine Words Comprehensive Testing Suite"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="https://divine-words.assistent.my.id"
API_BASE="https://api.bible-api.com"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0

# Function to perform a test
test_endpoint() {
    local test_name="$1"
    local url="$2"
    local expected_code="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$response" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name (HTTP $response)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name (Expected: $expected_code, Got: $response)"
    fi
}

# Function to test content
test_content() {
    local test_name="$1"
    local url="$2"
    local search_string="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    content=$(curl -s "$url")
    
    if echo "$content" | grep -q "$search_string"; then
        echo -e "${GREEN}✅ PASS${NC}: $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAIL${NC}: $test_name (String not found: $search_string)"
    fi
}

echo "📋 1. FUNCTIONAL TESTING"
echo "========================"
echo ""

# Test main page
echo "Testing main page..."
test_endpoint "Main page loads" "$BASE_URL" "200"
test_content "Language switcher - German button" "$BASE_URL" "Deutsch"
test_content "Language switcher - English button" "$BASE_URL" "English"
test_content "App title present" "$BASE_URL" "Divine Words"

echo ""
echo "Testing Bible API endpoints..."
# Test German translations
test_endpoint "German: Elberfelder translation" "$API_BASE/elberfelder+1:1" "200"
test_endpoint "German: Luther translation" "$API_BASE/luther+1:1" "200"
test_endpoint "German: Schlachter translation" "$API_BASE/schlachter+1:1" "200"

# Test English translations
test_endpoint "English: KJV translation" "$API_BASE/kjv+john+3:16" "200"
test_endpoint "English: WEB translation" "$API_BASE/web+john+3:16" "200"
test_endpoint "English: ASV translation" "$API_BASE/asv+john+3:16" "200"

# Test verse search
test_endpoint "Valid verse search (Romans 8:28)" "$API_BASE/romans+8:28" "200"

echo ""
echo "🎨 2. UI/UX TESTING"
echo "==================="
echo ""

# Test UI elements
test_content "Romantic design - Heart elements" "$BASE_URL" "heart"
test_content "Romantic design - Pink/Rose colors" "$BASE_URL" "romantic-"
test_content "Script fonts" "$BASE_URL" "font-script"
test_content "Responsive design classes" "$BASE_URL" "md:"
test_content "Animations present" "$BASE_URL" "animate-"
test_content "Tailwind CSS" "$BASE_URL" "tailwind"

echo ""
echo "⚠️  3. ERROR TESTING"
echo "===================="
echo ""

# Test error handling
test_endpoint "Invalid verse reference" "$API_BASE/invalid+999:999" "404"
test_endpoint "404 page handling" "$BASE_URL/invalid-page" "404"

echo ""
echo "🌐 4. PERFORMANCE TESTING"
echo "========================="
echo ""

# Test page load time
TOTAL_TESTS=$((TOTAL_TESTS + 1))
start_time=$(date +%s.%N)
curl -s "$BASE_URL" > /dev/null
end_time=$(date +%s.%N)
load_time=$(echo "$end_time - $start_time" | bc)

if (( $(echo "$load_time < 3" | bc -l) )); then
    echo -e "${GREEN}✅ PASS${NC}: Page load time: ${load_time}s (< 3s)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ FAIL${NC}: Page load time: ${load_time}s (> 3s)"
fi

# Test page size
TOTAL_TESTS=$((TOTAL_TESTS + 1))
page_size=$(curl -s "$BASE_URL" | wc -c)
page_size_kb=$((page_size / 1024))

if [ $page_size_kb -lt 500 ]; then
    echo -e "${GREEN}✅ PASS${NC}: Page size: ${page_size_kb}KB (< 500KB)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Page size: ${page_size_kb}KB (> 500KB)"
fi

echo ""
echo "📊 TEST RESULTS SUMMARY"
echo "======================="
echo ""

# Calculate percentage
if [ $TOTAL_TESTS -gt 0 ]; then
    percentage=$((PASSED_TESTS * 100 / TOTAL_TESTS))
else
    percentage=0
fi

echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $((TOTAL_TESTS - PASSED_TESTS))"
echo "Success Rate: ${percentage}%"

echo ""
echo "📝 DETAILED FINDINGS:"
echo "===================="
echo ""

# Check SSL certificate
echo "SSL Certificate Status:"
ssl_info=$(echo | openssl s_client -servername divine-words.assistent.my.id -connect divine-words.assistent.my.id:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅${NC} SSL certificate is valid"
    echo "$ssl_info" | sed 's/^/   /'
else
    echo -e "${RED}❌${NC} SSL certificate check failed"
fi

echo ""
echo "Service Status:"
if lsof -i :8016 > /dev/null 2>&1; then
    echo -e "${GREEN}✅${NC} Service is running on port 8016"
    echo "   PID: $(lsof -ti :8016)"
else
    echo -e "${RED}❌${NC} Service is not running on port 8016"
fi

echo ""
echo "🔍 Recommendations:"
echo "=================="

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo -e "${GREEN}✅${NC} All tests passed! The application is functioning perfectly."
else
    echo -e "${YELLOW}⚠️${NC} Some tests failed. Please review the failures above."
    echo ""
    echo "Common issues to check:"
    echo "- Ensure the service is running: ./start-service.sh"
    echo "- Check nginx configuration for proxy settings"
    echo "- Verify API endpoints are accessible"
    echo "- Check browser console for JavaScript errors"
fi

echo ""
echo "Testing completed at: $(date)"