import puppeteer from 'puppeteer';

const BASE_URL = 'https://divine-words.assistent.my.id';

console.log('🧪 Divine Words Browser-Based Comprehensive Testing\n');
console.log('=' .repeat(50) + '\n');

async function runBrowserTests() {
  let browser;
  const testResults = {
    functional: [],
    ui: [],
    error: [],
    browser: []
  };

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Set viewport for desktop testing
    await page.setViewport({ width: 1280, height: 800 });
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.error.push({
          test: 'Console Errors',
          status: 'FAIL',
          message: msg.text()
        });
      }
    });
    
    // 1. FUNCTIONAL TESTING
    console.log('📋 1. FUNCTIONAL TESTING\n');
    
    // Test page load
    console.log('Testing page load...');
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
    testResults.functional.push({
      test: 'Page Load',
      status: response.status() === 200 ? 'PASS' : 'FAIL',
      statusCode: response.status()
    });
    
    // Wait for Vue app to mount
    await page.waitForTimeout(2000);
    
    // Test language switcher
    console.log('Testing language switcher...');
    const germanButton = await page.$('button:has-text("Deutsch")');
    const englishButton = await page.$('button:has-text("English")');
    
    testResults.functional.push({
      test: 'Language Switcher - German Button',
      status: germanButton ? 'PASS' : 'FAIL'
    });
    
    testResults.functional.push({
      test: 'Language Switcher - English Button',
      status: englishButton ? 'PASS' : 'FAIL'
    });
    
    // Test language switching
    if (germanButton && englishButton) {
      await germanButton.click();
      await page.waitForTimeout(500);
      
      const germanContent = await page.content();
      const hasGermanText = germanContent.includes('Täglicher Vers') || germanContent.includes('Bibelstelle');
      
      testResults.functional.push({
        test: 'German Language Switch',
        status: hasGermanText ? 'PASS' : 'FAIL'
      });
      
      await englishButton.click();
      await page.waitForTimeout(500);
      
      const englishContent = await page.content();
      const hasEnglishText = englishContent.includes('Daily Verse') || englishContent.includes('Search');
      
      testResults.functional.push({
        test: 'English Language Switch',
        status: hasEnglishText ? 'PASS' : 'FAIL'
      });
    }
    
    // Test Bible translation selector
    console.log('Testing Bible translations...');
    const translationSelect = await page.$('select');
    if (translationSelect) {
      const options = await page.$$eval('select option', opts => opts.map(opt => opt.textContent));
      
      testResults.functional.push({
        test: 'Translation Selector',
        status: options.length > 0 ? 'PASS' : 'FAIL',
        translations: options
      });
    }
    
    // Test verse search
    console.log('Testing verse search...');
    const bookInput = await page.$('input[type="text"]');
    if (bookInput) {
      // Test with valid verse
      await bookInput.type('John');
      await page.keyboard.press('Tab');
      await page.type('3');
      await page.keyboard.press('Tab');
      await page.type('16');
      
      const searchButton = await page.$('button:has-text("Search"), button:has-text("Suchen")');
      if (searchButton) {
        await searchButton.click();
        await page.waitForTimeout(2000);
        
        const verseText = await page.$('.verse-text');
        testResults.functional.push({
          test: 'Verse Search - Valid Reference',
          status: verseText ? 'PASS' : 'FAIL'
        });
      }
    }
    
    // 2. UI/UX TESTING
    console.log('\n🎨 2. UI/UX TESTING\n');
    
    // Test romantic design elements
    const pageContent = await page.content();
    const hasHearts = await page.$$('.heart, [class*="heart"], svg[class*="heart"]');
    testResults.ui.push({
      test: 'Heart Decorations',
      status: hasHearts.length > 0 ? 'PASS' : 'FAIL',
      count: hasHearts.length
    });
    
    // Check for romantic colors
    const romanticColors = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="romantic-"], [class*="pink"], [class*="rose"]');
      return elements.length;
    });
    
    testResults.ui.push({
      test: 'Romantic Color Scheme',
      status: romanticColors > 0 ? 'PASS' : 'FAIL',
      count: romanticColors
    });
    
    // Check fonts
    const scriptFont = await page.evaluate(() => {
      const elements = document.querySelectorAll('[class*="font-script"], .font-script');
      return elements.length;
    });
    
    testResults.ui.push({
      test: 'Script Font Usage',
      status: scriptFont > 0 ? 'PASS' : 'FAIL'
    });
    
    // Test responsive design
    console.log('Testing responsive design...');
    
    // Mobile viewport
    await page.setViewport({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileLayout = await page.evaluate(() => {
      const container = document.querySelector('.max-w-4xl');
      return container && window.getComputedStyle(container).display !== 'none';
    });
    
    testResults.ui.push({
      test: 'Mobile Responsive Layout',
      status: mobileLayout ? 'PASS' : 'FAIL'
    });
    
    // Tablet viewport
    await page.setViewport({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const tabletLayout = await page.evaluate(() => {
      const container = document.querySelector('.max-w-4xl');
      return container && window.getComputedStyle(container).display !== 'none';
    });
    
    testResults.ui.push({
      test: 'Tablet Responsive Layout',
      status: tabletLayout ? 'PASS' : 'FAIL'
    });
    
    // Reset to desktop
    await page.setViewport({ width: 1280, height: 800 });
    
    // 3. ERROR TESTING
    console.log('\n⚠️  3. ERROR TESTING\n');
    
    // Clear previous inputs
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    // Test invalid verse reference
    const bookInputError = await page.$('input[type="text"]');
    if (bookInputError) {
      await bookInputError.type('InvalidBook');
      await page.keyboard.press('Tab');
      await page.type('999');
      await page.keyboard.press('Tab');
      await page.type('999');
      
      const searchButtonError = await page.$('button:has-text("Search"), button:has-text("Suchen")');
      if (searchButtonError) {
        await searchButtonError.click();
        await page.waitForTimeout(2000);
        
        // Check for error message
        const errorMessage = await page.$('.error, [class*="error"], .text-red-500');
        testResults.error.push({
          test: 'Invalid Verse Error Handling',
          status: errorMessage ? 'PASS' : 'FAIL'
        });
      }
    }
    
    // 4. PERFORMANCE TESTING
    console.log('\n🚀 4. PERFORMANCE TESTING\n');
    
    const metrics = await page.metrics();
    const performance = await page.evaluate(() => {
      const timing = window.performance.timing;
      return {
        domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        loadComplete: timing.loadEventEnd - timing.navigationStart
      };
    });
    
    testResults.browser.push({
      test: 'DOM Content Loaded Time',
      status: performance.domContentLoaded < 3000 ? 'PASS' : 'FAIL',
      time: performance.domContentLoaded + 'ms'
    });
    
    testResults.browser.push({
      test: 'Page Load Complete Time',
      status: performance.loadComplete < 5000 ? 'PASS' : 'FAIL',
      time: performance.loadComplete + 'ms'
    });
    
    // Print results
    console.log('\n' + '=' .repeat(50));
    console.log('\n📊 TEST RESULTS SUMMARY\n');
    
    let totalTests = 0;
    let passedTests = 0;
    
    Object.entries(testResults).forEach(([category, tests]) => {
      console.log(`\n${category.toUpperCase()} TESTS:`);
      tests.forEach(result => {
        totalTests++;
        if (result.status === 'PASS') passedTests++;
        
        const icon = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${result.test}: ${result.status}`);
        if (result.message) console.log(`   Message: ${result.message}`);
        if (result.time) console.log(`   Time: ${result.time}`);
        if (result.count !== undefined) console.log(`   Count: ${result.count}`);
      });
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log(`\n📈 OVERALL: ${passedTests}/${totalTests} tests passed (${Math.round(passedTests/totalTests * 100)}%)\n`);
    
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the tests
runBrowserTests().catch(console.error);