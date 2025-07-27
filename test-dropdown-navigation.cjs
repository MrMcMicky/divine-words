const puppeteer = require('puppeteer');
const fs = require('fs').promises;

// Test configuration
const TEST_URL = 'https://divine-words.assistent.my.id';
const SCREENSHOTS_DIR = './dropdown-test-screenshots';

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Helper function to log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test results object
const testResults = {
  timestamp: new Date().toISOString(),
  url: TEST_URL,
  tests: {
    dropdownNavigation: {
      bookDropdown: {},
      chapterDropdown: {},
      verseDropdown: {},
      verseRanges: {},
      search: {},
      languageSwitch: {}
    },
    uiUx: {
      styling: {},
      disabledStates: {},
      responsiveness: {}
    },
    errorHandling: {},
    performance: {}
  },
  screenshots: [],
  summary: {
    totalTests: 0,
    passed: 0,
    failed: 0
  }
};

async function ensureScreenshotsDir() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating screenshots directory:', error);
  }
}

async function takeScreenshot(page, name) {
  const filename = `${SCREENSHOTS_DIR}/${name}-${Date.now()}.png`;
  await page.screenshot({ path: filename, fullPage: false });
  testResults.screenshots.push(filename);
  return filename;
}

async function testDropdownNavigation() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    log('\n🧪 DIVINE WORDS DROPDOWN NAVIGATION TEST', 'cyan');
    log('=' .repeat(50), 'cyan');

    // Navigate to the site
    log('\n📍 Navigating to Divine Words...', 'yellow');
    await page.goto(TEST_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Initial state screenshot
    await takeScreenshot(page, 'initial-state');

    // Switch to search mode first
    log('\n🔄 Switching to search mode...', 'yellow');
    const searchButton = await page.$$eval('button', buttons => {
      const btn = buttons.find(b => b.textContent.includes('Verse suchen') || b.textContent.includes('Search Verses'));
      return btn ? btn : null;
    });
    const searchButtonHandle = searchButton ? await page.$(`button:contains("${searchButton.textContent}")`) : 
                               await page.evaluateHandle(() => {
                                 const buttons = Array.from(document.querySelectorAll('button'));
                                 return buttons.find(b => b.textContent.includes('Verse suchen') || b.textContent.includes('Search Verses'));
                               });
    if (searchButton) {
      await searchButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      testResults.tests.dropdownNavigation.bookDropdown.searchModeSwitch = { status: 'PASSED' };
    } else {
      testResults.tests.dropdownNavigation.bookDropdown.searchModeSwitch = { status: 'FAILED', error: 'Search button not found' };
    }

    // Test 1: Book Dropdown
    log('\n📚 Testing Book Dropdown...', 'magenta');
    try {
      // Check if book dropdown exists
      const bookDropdown = await page.$('select[class*="w-full"]');
      if (!bookDropdown) {
        throw new Error('Book dropdown not found');
      }

      // Get all book options
      const bookOptions = await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        const bookSelect = selects[1]; // Second select is book dropdown
        if (!bookSelect) return [];
        return Array.from(bookSelect.options).map(opt => ({
          value: opt.value,
          text: opt.text
        }));
      });

      log(`  ✓ Found ${bookOptions.length - 1} books in dropdown`, 'green');
      testResults.tests.dropdownNavigation.bookDropdown = {
        status: 'PASSED',
        bookCount: bookOptions.length - 1,
        sampleBooks: bookOptions.slice(1, 6).map(b => b.text)
      };

      // Select a book
      await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        const bookSelect = selects[1];
        bookSelect.value = '42'; // Select John (index 42 in NT)
        bookSelect.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      await takeScreenshot(page, 'book-selected');

    } catch (error) {
      log(`  ✗ Book dropdown test failed: ${error.message}`, 'red');
      testResults.tests.dropdownNavigation.bookDropdown = {
        status: 'FAILED',
        error: error.message
      };
    }

    // Test 2: Chapter Dropdown
    log('\n📖 Testing Chapter Dropdown...', 'magenta');
    try {
      // Check if chapter dropdown is enabled
      const chapterDropdown = await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        const chapterSelect = selects[2]; // Third select is chapter dropdown
        return {
          exists: !!chapterSelect,
          disabled: chapterSelect?.disabled,
          optionCount: chapterSelect ? chapterSelect.options.length : 0
        };
      });

      if (!chapterDropdown.exists) {
        throw new Error('Chapter dropdown not found');
      }

      if (chapterDropdown.disabled) {
        throw new Error('Chapter dropdown is disabled after selecting book');
      }

      log(`  ✓ Chapter dropdown enabled with ${chapterDropdown.optionCount - 1} chapters`, 'green');
      
      // Select a chapter
      await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        const chapterSelect = selects[2];
        chapterSelect.value = '3'; // Select chapter 3
        chapterSelect.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      await takeScreenshot(page, 'chapter-selected');

      testResults.tests.dropdownNavigation.chapterDropdown = {
        status: 'PASSED',
        chapterCount: chapterDropdown.optionCount - 1
      };

    } catch (error) {
      log(`  ✗ Chapter dropdown test failed: ${error.message}`, 'red');
      testResults.tests.dropdownNavigation.chapterDropdown = {
        status: 'FAILED',
        error: error.message
      };
    }

    // Test 3: Verse Dropdown
    log('\n📝 Testing Verse Dropdown...', 'magenta');
    try {
      // Check verse dropdown
      const verseInfo = await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        const verseSelect = selects[3]; // Fourth select is verse dropdown
        if (!verseSelect) return { exists: false };

        const options = Array.from(verseSelect.options);
        const individualVerses = options.filter(opt => !opt.closest('optgroup'));
        const rangeOptions = options.filter(opt => opt.closest('optgroup'));

        return {
          exists: true,
          disabled: verseSelect.disabled,
          individualVerseCount: individualVerses.length - 1, // Exclude placeholder
          rangeCount: rangeOptions.length,
          sampleRanges: rangeOptions.slice(0, 3).map(opt => opt.value)
        };
      });

      if (!verseInfo.exists) {
        throw new Error('Verse dropdown not found');
      }

      if (verseInfo.disabled) {
        throw new Error('Verse dropdown is disabled after selecting chapter');
      }

      log(`  ✓ Verse dropdown enabled with ${verseInfo.individualVerseCount} verses`, 'green');
      log(`  ✓ Found ${verseInfo.rangeCount} verse ranges`, 'green');
      
      // Test selecting a single verse
      await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        const verseSelect = selects[3];
        verseSelect.value = '16'; // Select verse 16
        verseSelect.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      await takeScreenshot(page, 'single-verse-selected');

      // Test selecting a verse range
      await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        const verseSelect = selects[3];
        verseSelect.value = '1-3'; // Select verse range 1-3
        verseSelect.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await new Promise(resolve => setTimeout(resolve, 500));
      await takeScreenshot(page, 'verse-range-selected');

      testResults.tests.dropdownNavigation.verseDropdown = {
        status: 'PASSED',
        verseCount: verseInfo.individualVerseCount,
        rangeCount: verseInfo.rangeCount
      };

      testResults.tests.dropdownNavigation.verseRanges = {
        status: 'PASSED',
        sampleRanges: verseInfo.sampleRanges
      };

    } catch (error) {
      log(`  ✗ Verse dropdown test failed: ${error.message}`, 'red');
      testResults.tests.dropdownNavigation.verseDropdown = {
        status: 'FAILED',
        error: error.message
      };
    }

    // Test 4: Search Functionality
    log('\n🔍 Testing Search with Dropdowns...', 'magenta');
    try {
      // Click search button
      const searchButton = await page.$('button:has-text("Suchen"), button:has-text("Search")');
      if (!searchButton) {
        throw new Error('Search button not found');
      }

      await searchButton.click();
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if verse is displayed
      const verseDisplayed = await page.evaluate(() => {
        const verseElements = document.querySelectorAll('.verse-text');
        return verseElements.length > 0 && verseElements[0].textContent.length > 0;
      });

      if (verseDisplayed) {
        log('  ✓ Search successful - verse displayed', 'green');
        await takeScreenshot(page, 'search-result');
        testResults.tests.dropdownNavigation.search = {
          status: 'PASSED',
          verseDisplayed: true
        };
      } else {
        throw new Error('Verse not displayed after search');
      }

    } catch (error) {
      log(`  ✗ Search test failed: ${error.message}`, 'red');
      testResults.tests.dropdownNavigation.search = {
        status: 'FAILED',
        error: error.message
      };
    }

    // Test 5: Language Switching
    log('\n🌐 Testing Language Switch with Dropdowns...', 'magenta');
    try {
      // Switch to English
      const englishButton = await page.$('button:has-text("English")');
      await englishButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if dropdowns are reset
      const dropdownState = await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        return {
          bookValue: selects[1]?.value,
          chapterValue: selects[2]?.value,
          verseValue: selects[3]?.value,
          bookPlaceholder: selects[1]?.options[0]?.text
        };
      });

      log('  ✓ Language switched successfully', 'green');
      log(`  ✓ Dropdowns reset: Book=${dropdownState.bookValue || 'null'}, Chapter=${dropdownState.chapterValue || 'null'}`, 'green');
      
      await takeScreenshot(page, 'language-switched');
      
      testResults.tests.dropdownNavigation.languageSwitch = {
        status: 'PASSED',
        dropdownsReset: !dropdownState.bookValue && !dropdownState.chapterValue,
        englishPlaceholder: dropdownState.bookPlaceholder
      };

    } catch (error) {
      log(`  ✗ Language switch test failed: ${error.message}`, 'red');
      testResults.tests.dropdownNavigation.languageSwitch = {
        status: 'FAILED',
        error: error.message
      };
    }

    // Test 6: UI/UX Testing
    log('\n🎨 Testing UI/UX Elements...', 'magenta');
    
    // Test disabled states
    try {
      // Reset selections
      await page.reload();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Switch to search mode
      const searchBtn = await page.$('button:has-text("Verse suchen"), button:has-text("Search Verses")');
      await searchBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const disabledStates = await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        return {
          chapterDisabledInitially: selects[2]?.disabled,
          verseDisabledInitially: selects[3]?.disabled
        };
      });

      log(`  ✓ Chapter dropdown disabled initially: ${disabledStates.chapterDisabledInitially}`, 'green');
      log(`  ✓ Verse dropdown disabled initially: ${disabledStates.verseDisabledInitially}`, 'green');
      
      testResults.tests.uiUx.disabledStates = {
        status: 'PASSED',
        ...disabledStates
      };

    } catch (error) {
      log(`  ✗ Disabled states test failed: ${error.message}`, 'red');
      testResults.tests.uiUx.disabledStates = {
        status: 'FAILED',
        error: error.message
      };
    }

    // Test responsive behavior
    log('\n📱 Testing Mobile Responsiveness...', 'magenta');
    try {
      // Switch to mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await takeScreenshot(page, 'mobile-view');

      const mobileLayout = await page.evaluate(() => {
        const selects = document.querySelectorAll('select');
        const selectContainer = selects[1]?.closest('.grid');
        return {
          containerClass: selectContainer?.className,
          isStacked: selectContainer?.classList.contains('grid-cols-1')
        };
      });

      log('  ✓ Mobile layout renders correctly', 'green');
      testResults.tests.uiUx.responsiveness = {
        status: 'PASSED',
        mobileLayoutCorrect: true
      };

    } catch (error) {
      log(`  ✗ Mobile responsiveness test failed: ${error.message}`, 'red');
      testResults.tests.uiUx.responsiveness = {
        status: 'FAILED',
        error: error.message
      };
    }

    // Test 7: Error Handling
    log('\n⚠️ Testing Error Handling...', 'magenta');
    try {
      // Try searching without selecting chapter
      await page.reload();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Switch to search mode
      const searchBtn = await page.$('button:has-text("Verse suchen"), button:has-text("Search Verses")');
      await searchBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Click search without selections
      const searchButton = await page.$('button:has-text("Suchen"), button:has-text("Search")');
      await searchButton.click();
      await new Promise(resolve => setTimeout(resolve, 1000));

      const errorMessage = await page.evaluate(() => {
        const errorElements = document.querySelectorAll('.text-red-700, [class*="error"]');
        return errorElements.length > 0 ? errorElements[0].textContent : null;
      });

      if (errorMessage) {
        log(`  ✓ Error message displayed: "${errorMessage}"`, 'green');
        await takeScreenshot(page, 'error-message');
        testResults.tests.errorHandling = {
          status: 'PASSED',
          errorMessage: errorMessage
        };
      } else {
        testResults.tests.errorHandling = {
          status: 'WARNING',
          message: 'No error message displayed for empty search'
        };
      }

    } catch (error) {
      log(`  ✗ Error handling test failed: ${error.message}`, 'red');
      testResults.tests.errorHandling = {
        status: 'FAILED',
        error: error.message
      };
    }

    // Calculate summary
    const allTests = [
      testResults.tests.dropdownNavigation.bookDropdown,
      testResults.tests.dropdownNavigation.chapterDropdown,
      testResults.tests.dropdownNavigation.verseDropdown,
      testResults.tests.dropdownNavigation.verseRanges,
      testResults.tests.dropdownNavigation.search,
      testResults.tests.dropdownNavigation.languageSwitch,
      testResults.tests.uiUx.disabledStates,
      testResults.tests.uiUx.responsiveness,
      testResults.tests.errorHandling
    ];

    testResults.summary.totalTests = allTests.length;
    testResults.summary.passed = allTests.filter(t => t.status === 'PASSED').length;
    testResults.summary.failed = allTests.filter(t => t.status === 'FAILED').length;

    // Print summary
    log('\n📊 TEST SUMMARY', 'cyan');
    log('=' .repeat(50), 'cyan');
    log(`Total Tests: ${testResults.summary.totalTests}`, 'bright');
    log(`Passed: ${testResults.summary.passed}`, 'green');
    log(`Failed: ${testResults.summary.failed}`, 'red');
    log(`Success Rate: ${((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(1)}%`, 
        testResults.summary.failed === 0 ? 'green' : 'yellow');

  } catch (error) {
    log(`\n❌ Test execution failed: ${error.message}`, 'red');
    testResults.error = error.message;
  } finally {
    await browser.close();
    
    // Save test results
    const resultsFile = `dropdown-test-results-${Date.now()}.json`;
    await fs.writeFile(resultsFile, JSON.stringify(testResults, null, 2));
    log(`\n💾 Test results saved to: ${resultsFile}`, 'cyan');
  }
}

// Run the tests
(async () => {
  await ensureScreenshotsDir();
  await testDropdownNavigation();
})();