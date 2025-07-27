const puppeteer = require('puppeteer');
const fs = require('fs').promises;

// Test configuration
const TEST_URL = 'https://divine-words.assistent.my.id';

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testDropdownNavigation() {
  console.log('\n🧪 DIVINE WORDS DROPDOWN NAVIGATION TEST\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    timestamp: new Date().toISOString(),
    url: TEST_URL,
    tests: [],
    summary: { total: 0, passed: 0, failed: 0 }
  };

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to the site
    console.log('📍 Navigating to Divine Words...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await wait(2000);

    // Take initial screenshot
    await page.screenshot({ path: 'dropdown-test-1-initial.png' });

    // Switch to search mode
    console.log('\n🔄 Switching to search mode...');
    const searchModeButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => 
        b.textContent.includes('Verse suchen') || 
        b.textContent.includes('Search Verses')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    
    await wait(1000);
    results.tests.push({
      name: 'Switch to Search Mode',
      status: searchModeButton ? 'PASSED' : 'FAILED'
    });

    // Test 1: Check dropdown existence
    console.log('\n📚 Testing Dropdown Existence...');
    const dropdownInfo = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      return {
        count: selects.length,
        translationDropdown: selects[0] ? true : false,
        bookDropdown: selects[1] ? true : false,
        chapterDropdown: selects[2] ? true : false,
        verseDropdown: selects[3] ? true : false
      };
    });
    
    console.log(`  Found ${dropdownInfo.count} dropdowns`);
    results.tests.push({
      name: 'Dropdown Existence',
      status: dropdownInfo.count >= 4 ? 'PASSED' : 'FAILED',
      details: dropdownInfo
    });

    // Test 2: Test Book Dropdown
    console.log('\n📖 Testing Book Dropdown...');
    const bookTest = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      const bookSelect = selects[1];
      if (!bookSelect) return { error: 'Book dropdown not found' };
      
      const bookCount = bookSelect.options.length - 1; // Exclude placeholder
      const sampleBooks = Array.from(bookSelect.options).slice(1, 6).map(opt => opt.text);
      
      // Select John (usually around index 42-43)
      for (let i = 0; i < bookSelect.options.length; i++) {
        if (bookSelect.options[i].text.includes('Johannes') || bookSelect.options[i].text.includes('John')) {
          bookSelect.value = bookSelect.options[i].value;
          bookSelect.dispatchEvent(new Event('change', { bubbles: true }));
          break;
        }
      }
      
      return {
        bookCount,
        sampleBooks,
        selectedBook: bookSelect.options[bookSelect.selectedIndex]?.text
      };
    });
    
    await wait(500);
    console.log(`  Books found: ${bookTest.bookCount}`);
    console.log(`  Selected: ${bookTest.selectedBook}`);
    results.tests.push({
      name: 'Book Dropdown Functionality',
      status: bookTest.bookCount > 0 ? 'PASSED' : 'FAILED',
      details: bookTest
    });

    // Test 3: Test Chapter Dropdown
    console.log('\n📖 Testing Chapter Dropdown...');
    const chapterTest = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      const chapterSelect = selects[2];
      if (!chapterSelect) return { error: 'Chapter dropdown not found' };
      
      const wasDisabled = chapterSelect.disabled;
      const chapterCount = chapterSelect.options.length - 1;
      
      // Select chapter 3
      if (chapterSelect.options[3]) {
        chapterSelect.value = chapterSelect.options[3].value;
        chapterSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      return {
        wasDisabled,
        isEnabled: !chapterSelect.disabled,
        chapterCount,
        selectedChapter: chapterSelect.value
      };
    });
    
    await wait(500);
    console.log(`  Chapter dropdown enabled: ${chapterTest.isEnabled}`);
    console.log(`  Chapters available: ${chapterTest.chapterCount}`);
    results.tests.push({
      name: 'Chapter Dropdown Functionality',
      status: chapterTest.isEnabled && chapterTest.chapterCount > 0 ? 'PASSED' : 'FAILED',
      details: chapterTest
    });

    // Test 4: Test Verse Dropdown
    console.log('\n📝 Testing Verse Dropdown...');
    const verseTest = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      const verseSelect = selects[3];
      if (!verseSelect) return { error: 'Verse dropdown not found' };
      
      const wasDisabled = verseSelect.disabled;
      const verseOptions = Array.from(verseSelect.options);
      const individualVerses = verseOptions.filter(opt => !opt.parentElement.tagName.toLowerCase() === 'optgroup');
      const rangeOptions = verseOptions.filter(opt => opt.value.includes('-'));
      
      // Select verse 16
      const verse16 = verseOptions.find(opt => opt.value === '16');
      if (verse16) {
        verseSelect.value = '16';
        verseSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      return {
        wasDisabled,
        isEnabled: !verseSelect.disabled,
        totalOptions: verseOptions.length,
        verseCount: individualVerses.length,
        rangeCount: rangeOptions.length,
        hasRanges: rangeOptions.length > 0,
        selectedVerse: verseSelect.value
      };
    });
    
    await wait(500);
    console.log(`  Verse dropdown enabled: ${verseTest.isEnabled}`);
    console.log(`  Individual verses: ${verseTest.verseCount}`);
    console.log(`  Verse ranges: ${verseTest.rangeCount}`);
    results.tests.push({
      name: 'Verse Dropdown Functionality',
      status: verseTest.isEnabled && verseTest.verseCount > 0 ? 'PASSED' : 'FAILED',
      details: verseTest
    });

    // Take screenshot of selections
    await page.screenshot({ path: 'dropdown-test-2-selections.png' });

    // Test 5: Search Functionality
    console.log('\n🔍 Testing Search...');
    const searchTest = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const searchBtn = buttons.find(b => 
        b.textContent === 'Suchen' || 
        b.textContent === 'Search' ||
        b.textContent.includes('Lädt')
      );
      if (searchBtn && !searchBtn.textContent.includes('Lädt')) {
        searchBtn.click();
        return true;
      }
      return false;
    });
    
    await wait(3000); // Wait for API response
    
    const verseDisplayed = await page.evaluate(() => {
      const verseElements = document.querySelectorAll('.verse-text');
      const verseText = verseElements[0]?.textContent || '';
      return {
        found: verseElements.length > 0,
        text: verseText.substring(0, 100) + '...',
        reference: document.querySelector('.text-romantic-rose')?.textContent
      };
    });
    
    console.log(`  Verse displayed: ${verseDisplayed.found}`);
    if (verseDisplayed.found) {
      console.log(`  Reference: ${verseDisplayed.reference}`);
    }
    results.tests.push({
      name: 'Search Functionality',
      status: verseDisplayed.found ? 'PASSED' : 'FAILED',
      details: verseDisplayed
    });
    
    await page.screenshot({ path: 'dropdown-test-3-search-result.png' });

    // Test 6: Language Switch
    console.log('\n🌐 Testing Language Switch...');
    const langTest = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const englishBtn = buttons.find(b => b.textContent === 'English');
      if (englishBtn) {
        englishBtn.click();
        return true;
      }
      return false;
    });
    
    await wait(1000);
    
    const afterLangSwitch = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      return {
        bookValue: selects[1]?.value,
        chapterValue: selects[2]?.value,
        verseValue: selects[3]?.value,
        bookPlaceholder: selects[1]?.options[0]?.text,
        uiLanguage: document.querySelector('button')?.textContent.includes('Search') ? 'English' : 'German'
      };
    });
    
    console.log(`  Language switched to: ${afterLangSwitch.uiLanguage}`);
    console.log(`  Dropdowns reset: ${!afterLangSwitch.bookValue && !afterLangSwitch.chapterValue}`);
    results.tests.push({
      name: 'Language Switch',
      status: afterLangSwitch.uiLanguage === 'English' ? 'PASSED' : 'FAILED',
      details: afterLangSwitch
    });

    // Test 7: Mobile Responsiveness
    console.log('\n📱 Testing Mobile View...');
    await page.setViewport({ width: 375, height: 667 });
    await wait(1000);
    
    const mobileLayout = await page.evaluate(() => {
      const selects = document.querySelectorAll('select');
      const container = selects[1]?.closest('.grid');
      const containerWidth = container?.offsetWidth;
      const selectWidth = selects[1]?.offsetWidth;
      
      return {
        containerClass: container?.className,
        isStacked: container?.classList.contains('grid-cols-1') || false,
        containerWidth,
        selectWidth,
        fitsScreen: selectWidth <= 375
      };
    });
    
    console.log(`  Mobile layout stacked: ${mobileLayout.isStacked}`);
    console.log(`  Fits mobile screen: ${mobileLayout.fitsScreen}`);
    results.tests.push({
      name: 'Mobile Responsiveness',
      status: mobileLayout.fitsScreen ? 'PASSED' : 'FAILED',
      details: mobileLayout
    });
    
    await page.screenshot({ path: 'dropdown-test-4-mobile.png' });

    // Test 8: Error Handling
    console.log('\n⚠️ Testing Error Handling...');
    await page.setViewport({ width: 1280, height: 800 });
    await page.reload();
    await wait(2000);
    
    // Try to search without selections
    const errorTest = await page.evaluate(() => {
      // First switch to search mode
      const buttons = Array.from(document.querySelectorAll('button'));
      const searchModeBtn = buttons.find(b => 
        b.textContent.includes('Verse suchen') || 
        b.textContent.includes('Search Verses')
      );
      if (searchModeBtn) searchModeBtn.click();
      
      setTimeout(() => {
        const searchBtn = buttons.find(b => 
          b.textContent === 'Suchen' || 
          b.textContent === 'Search'
        );
        if (searchBtn) searchBtn.click();
      }, 500);
      
      return true;
    });
    
    await wait(2000);
    
    const errorMessage = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('.bg-red-50, .text-red-700, [class*="error"]');
      return {
        found: errorElements.length > 0,
        message: errorElements[0]?.textContent || 'No error message found'
      };
    });
    
    console.log(`  Error handling works: ${errorMessage.found}`);
    if (errorMessage.found) {
      console.log(`  Error message: "${errorMessage.message}"`);
    }
    results.tests.push({
      name: 'Error Handling',
      status: errorMessage.found ? 'PASSED' : 'WARNING',
      details: errorMessage
    });

    // Calculate summary
    results.summary.total = results.tests.length;
    results.summary.passed = results.tests.filter(t => t.status === 'PASSED').length;
    results.summary.failed = results.tests.filter(t => t.status === 'FAILED').length;
    results.summary.warnings = results.tests.filter(t => t.status === 'WARNING').length;

    // Print summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${results.summary.total}`);
    console.log(`✅ Passed: ${results.summary.passed}`);
    console.log(`❌ Failed: ${results.summary.failed}`);
    console.log(`⚠️ Warnings: ${results.summary.warnings || 0}`);
    console.log(`Success Rate: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error(`\n❌ Test execution failed: ${error.message}`);
    results.error = error.message;
  } finally {
    await browser.close();
    
    // Save results
    const resultsFile = `dropdown-test-results-${Date.now()}.json`;
    await fs.writeFile(resultsFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${resultsFile}`);
  }
}

// Run the test
testDropdownNavigation();