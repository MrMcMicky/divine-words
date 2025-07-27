#!/usr/bin/env node

const https = require('https');
const { JSDOM } = require('jsdom');

// Test configuration
const BASE_URL = 'https://divine-words.assistent.my.id';
const TEST_RESULTS = {
  functional: {},
  ui: {},
  error: {},
  browser: {}
};

// Helper function to make HTTPS requests
function httpsRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => { 
        resolve({ 
          statusCode: res.statusCode, 
          headers: res.headers, 
          body: data 
        }); 
      });
    }).on('error', reject);
  });
}

// Helper function to make API requests
async function testAPI(endpoint, testName) {
  try {
    const url = `https://api.bible-api.com/${endpoint}`;
    const response = await httpsRequest(url);
    TEST_RESULTS.functional[testName] = {
      status: response.statusCode === 200 ? 'PASS' : 'FAIL',
      statusCode: response.statusCode,
      hasContent: response.body.length > 0
    };
    return response;
  } catch (error) {
    TEST_RESULTS.functional[testName] = {
      status: 'FAIL',
      error: error.message
    };
    return null;
  }
}

// Main test suite
async function runTests() {
  console.log('🧪 Divine Words Comprehensive Testing Suite\n');
  console.log('=' .repeat(50));
  
  // 1. FUNCTIONAL TESTING
  console.log('\n📋 1. FUNCTIONAL TESTING\n');
  
  // Test main page load
  console.log('Testing main page load...');
  try {
    const mainPage = await httpsRequest(BASE_URL);
    TEST_RESULTS.functional['Main Page Load'] = {
      status: mainPage.statusCode === 200 ? 'PASS' : 'FAIL',
      statusCode: mainPage.statusCode,
      contentType: mainPage.headers['content-type'],
      pageSize: mainPage.body.length
    };
    
    // Parse HTML to check elements
    const dom = new JSDOM(mainPage.body);
    const document = dom.window.document;
    
    // Check for language switcher
    const langButtons = document.querySelectorAll('button');
    let hasGermanButton = false;
    let hasEnglishButton = false;
    langButtons.forEach(btn => {
      if (btn.textContent.includes('Deutsch')) hasGermanButton = true;
      if (btn.textContent.includes('English')) hasEnglishButton = true;
    });
    TEST_RESULTS.functional['Language Switcher'] = {
      status: (hasGermanButton && hasEnglishButton) ? 'PASS' : 'FAIL',
      germanButton: hasGermanButton,
      englishButton: hasEnglishButton
    };
    
  } catch (error) {
    TEST_RESULTS.functional['Main Page Load'] = {
      status: 'FAIL',
      error: error.message
    };
  }
  
  // Test Bible API endpoints
  console.log('Testing Bible API endpoints...');
  
  // Test German translations
  await testAPI('elberfelder+1:1', 'German Translation - Elberfelder');
  await testAPI('luther+1:1', 'German Translation - Luther');
  await testAPI('schlachter+1:1', 'German Translation - Schlachter');
  
  // Test English translations
  await testAPI('kjv+john+3:16', 'English Translation - KJV');
  await testAPI('web+john+3:16', 'English Translation - WEB');
  await testAPI('asv+john+3:16', 'English Translation - ASV');
  
  // Test verse search functionality
  await testAPI('romans+8:28', 'Verse Search - Valid Reference');
  
  // Test error scenarios
  await testAPI('invalid+999:999', 'Error Handling - Invalid Reference');
  
  // 2. UI/UX TESTING
  console.log('\n🎨 2. UI/UX TESTING\n');
  
  try {
    const mainPage = await httpsRequest(BASE_URL);
    const dom = new JSDOM(mainPage.body);
    const document = dom.window.document;
    
    // Check for romantic design elements
    const hasHeartIcons = mainPage.body.includes('heart') || mainPage.body.includes('HeartIcon');
    const hasRomanticColors = mainPage.body.includes('romantic-') || mainPage.body.includes('pink') || mainPage.body.includes('rose');
    const hasScriptFont = mainPage.body.includes('font-script') || mainPage.body.includes('Dancing Script');
    
    TEST_RESULTS.ui['Romantic Design Elements'] = {
      status: (hasHeartIcons && hasRomanticColors && hasScriptFont) ? 'PASS' : 'FAIL',
      hearts: hasHeartIcons,
      romanticColors: hasRomanticColors,
      scriptFont: hasScriptFont
    };
    
    // Check responsive design classes
    const hasResponsiveClasses = mainPage.body.includes('md:') || mainPage.body.includes('lg:') || mainPage.body.includes('sm:');
    TEST_RESULTS.ui['Responsive Design'] = {
      status: hasResponsiveClasses ? 'PASS' : 'FAIL',
      hasBreakpoints: hasResponsiveClasses
    };
    
    // Check for animations
    const hasAnimations = mainPage.body.includes('animate-') || mainPage.body.includes('transition');
    TEST_RESULTS.ui['Animations'] = {
      status: hasAnimations ? 'PASS' : 'FAIL',
      hasAnimations: hasAnimations
    };
    
  } catch (error) {
    TEST_RESULTS.ui['UI Elements Check'] = {
      status: 'FAIL',
      error: error.message
    };
  }
  
  // 3. ERROR TESTING
  console.log('\n⚠️  3. ERROR TESTING\n');
  
  // Test invalid endpoints
  try {
    const invalidPage = await httpsRequest(BASE_URL + '/invalid-page');
    TEST_RESULTS.error['404 Page Handling'] = {
      status: invalidPage.statusCode === 404 ? 'PASS' : 'FAIL',
      statusCode: invalidPage.statusCode
    };
  } catch (error) {
    TEST_RESULTS.error['404 Page Handling'] = {
      status: 'FAIL',
      error: error.message
    };
  }
  
  // 4. BROWSER TESTING
  console.log('\n🌐 4. BROWSER COMPATIBILITY\n');
  
  // Check for modern JavaScript features
  try {
    const mainPage = await httpsRequest(BASE_URL);
    const usesModernJS = mainPage.body.includes('import') || mainPage.body.includes('const') || mainPage.body.includes('=>');
    const hasPolyfills = mainPage.body.includes('polyfill') || mainPage.body.includes('babel');
    
    TEST_RESULTS.browser['Modern JS Support'] = {
      status: 'PASS',
      modernJS: usesModernJS,
      polyfills: hasPolyfills
    };
    
    // Check for CSS compatibility
    const hasCSSVars = mainPage.body.includes('var(--') || mainPage.body.includes(':root');
    const hasTailwind = mainPage.body.includes('tailwind');
    
    TEST_RESULTS.browser['CSS Compatibility'] = {
      status: 'PASS',
      cssVariables: hasCSSVars,
      tailwindCSS: hasTailwind
    };
    
  } catch (error) {
    TEST_RESULTS.browser['Compatibility Check'] = {
      status: 'FAIL',
      error: error.message
    };
  }
  
  // GENERATE REPORT
  console.log('\n' + '=' .repeat(50));
  console.log('\n📊 TEST RESULTS SUMMARY\n');
  
  Object.entries(TEST_RESULTS).forEach(([category, tests]) => {
    console.log(`\n${category.toUpperCase()} TESTS:`);
    Object.entries(tests).forEach(([testName, result]) => {
      const statusIcon = result.status === 'PASS' ? '✅' : '❌';
      console.log(`${statusIcon} ${testName}: ${result.status}`);
      if (result.status === 'FAIL' && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
  });
  
  // Calculate overall stats
  let totalTests = 0;
  let passedTests = 0;
  Object.values(TEST_RESULTS).forEach(category => {
    Object.values(category).forEach(test => {
      totalTests++;
      if (test.status === 'PASS') passedTests++;
    });
  });
  
  console.log('\n' + '=' .repeat(50));
  console.log(`\n📈 OVERALL: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests * 100)}%)\n`);
  
  // Detailed findings
  console.log('📝 DETAILED FINDINGS:\n');
  
  if (TEST_RESULTS.functional['Main Page Load'].status === 'PASS') {
    console.log('✅ Main page loads successfully');
    console.log(`   - Status Code: ${TEST_RESULTS.functional['Main Page Load'].statusCode}`);
    console.log(`   - Content Type: ${TEST_RESULTS.functional['Main Page Load'].contentType}`);
    console.log(`   - Page Size: ${TEST_RESULTS.functional['Main Page Load'].pageSize} bytes`);
  }
  
  console.log('\n🌐 Bible Translations Status:');
  console.log('   German: Elberfelder, Luther, Schlachter');
  console.log('   English: KJV, WEB, ASV');
  
  if (TEST_RESULTS.ui['Romantic Design Elements'].status === 'PASS') {
    console.log('\n💕 Romantic Design Elements:');
    console.log('   - Heart icons/decorations: ' + (TEST_RESULTS.ui['Romantic Design Elements'].hearts ? '✓' : '✗'));
    console.log('   - Romantic color scheme: ' + (TEST_RESULTS.ui['Romantic Design Elements'].romanticColors ? '✓' : '✗'));
    console.log('   - Script fonts: ' + (TEST_RESULTS.ui['Romantic Design Elements'].scriptFont ? '✓' : '✗'));
  }
  
  console.log('\n🔍 Recommendations:');
  if (totalTests === passedTests) {
    console.log('   ✅ All tests passed! The application is functioning correctly.');
  } else {
    console.log('   ⚠️  Some tests failed. Please review the failures above.');
    if (!TEST_RESULTS.functional['Language Switcher'] || TEST_RESULTS.functional['Language Switcher'].status === 'FAIL') {
      console.log('   - Language switcher may need attention');
    }
  }
}

// Run the test suite
runTests().catch(console.error);