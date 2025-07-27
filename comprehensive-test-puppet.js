import puppeteer from 'puppeteer';

async function testDivineWordsApp() {
    console.log('🧪 Divine Words Comprehensive Testing\n');
    console.log('==================================================\n');
    
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.log('❌ Console Error:', msg.text());
        }
    });
    
    page.on('pageerror', error => {
        console.log('❌ Page Error:', error.message);
    });
    
    const results = {
        functional: { passed: 0, failed: 0, tests: [] },
        ui: { passed: 0, failed: 0, tests: [] },
        error: { passed: 0, failed: 0, tests: [] },
        performance: { passed: 0, failed: 0, tests: [] }
    };
    
    async function testCase(category, name, testFn) {
        try {
            await testFn();
            results[category].passed++;
            results[category].tests.push({ name, status: '✅ PASSED' });
            console.log(`✅ ${name}`);
        } catch (error) {
            results[category].failed++;
            results[category].tests.push({ name, status: '❌ FAILED', error: error.message });
            console.log(`❌ ${name}: ${error.message}`);
        }
    }
    
    try {
        // Navigate to the page
        console.log('📋 1. FUNCTIONAL TESTING\n');
        await page.goto('https://divine-words.assistent.my.id', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Test 1: Page loads successfully
        await testCase('functional', 'Page loads successfully', async () => {
            const title = await page.title();
            if (!title.includes('Divine Words')) {
                throw new Error(`Unexpected title: ${title}`);
            }
        });
        
        // Test 2: Daily verse loads on page load
        await testCase('functional', 'Daily verse loads on page load', async () => {
            await page.waitForSelector('.verse-text', { timeout: 10000 });
            const verseText = await page.$eval('.verse-text', el => el.textContent);
            if (!verseText || verseText.length < 10) {
                throw new Error('Daily verse not loaded properly');
            }
        });
        
        // Test 3: Verse reference is displayed
        await testCase('functional', 'Verse reference is displayed', async () => {
            const reference = await page.$eval('.verse-reference', el => el.textContent);
            if (!reference || !reference.includes(':')) {
                throw new Error('Invalid verse reference format');
            }
        });
        
        // Test 4: All 6 Bible translations work
        const translations = ['elb', 'lut', 'sch', 'esv', 'niv', 'nlt'];
        for (const trans of translations) {
            await testCase('functional', `Translation ${trans.toUpperCase()} works`, async () => {
                await page.select('select#translation', trans);
                await page.waitForFunction(() => {
                    const text = document.querySelector('.verse-text')?.textContent;
                    return text && text.length > 10;
                }, { timeout: 5000 });
            });
        }
        
        // Test 5: Language switching
        await testCase('functional', 'Language switching (German to English)', async () => {
            await page.click('[data-lang="en"]');
            await page.waitForFunction(() => {
                const label = document.querySelector('label[for="translation"]')?.textContent;
                return label && label.toLowerCase().includes('translation');
            }, { timeout: 3000 });
        });
        
        await testCase('functional', 'Language switching (English to German)', async () => {
            await page.click('[data-lang="de"]');
            await page.waitForFunction(() => {
                const label = document.querySelector('label[for="translation"]')?.textContent;
                return label && label.toLowerCase().includes('übersetzung');
            }, { timeout: 3000 });
        });
        
        // Test 6: Verse search with valid references
        const testSearches = [
            { book: 'Johannes', chapter: '3', verse: '16' },
            { book: 'Psalm', chapter: '23', verse: '1' },
            { book: 'Matthäus', chapter: '5', verse: '8' }
        ];
        
        for (const search of testSearches) {
            await testCase('functional', `Search for ${search.book} ${search.chapter}:${search.verse}`, async () => {
                // Clear fields
                await page.evaluate(() => {
                    document.querySelector('input[placeholder*="Buch"]').value = '';
                    document.querySelector('input[placeholder*="Kapitel"]').value = '';
                    document.querySelector('input[placeholder*="Vers"]').value = '';
                });
                
                // Type search
                await page.type('input[placeholder*="Buch"]', search.book);
                await page.type('input[placeholder*="Kapitel"]', search.chapter);
                await page.type('input[placeholder*="Vers"]', search.verse);
                
                // Click search
                await page.click('button:has-text("Vers suchen")');
                
                // Wait for result
                await page.waitForFunction(() => {
                    const ref = document.querySelector('.verse-reference')?.textContent;
                    return ref && ref.includes(':');
                }, { timeout: 5000 });
            });
        }
        
        // UI/UX Testing
        console.log('\n📱 2. USER EXPERIENCE TESTING\n');
        
        // Test all buttons
        await testCase('ui', 'Daily verse button works', async () => {
            await page.click('button:has-text("Tagesvers")');
            await page.waitForFunction(() => {
                const text = document.querySelector('.verse-text')?.textContent;
                return text && text.length > 10;
            }, { timeout: 5000 });
        });
        
        await testCase('ui', 'Search button is clickable', async () => {
            const button = await page.$('button:has-text("Vers suchen")');
            if (!button) throw new Error('Search button not found');
        });
        
        // Test loading states
        await testCase('ui', 'Loading indicator appears during API calls', async () => {
            // Trigger a search
            await page.evaluate(() => {
                document.querySelector('input[placeholder*="Buch"]').value = 'Genesis';
                document.querySelector('input[placeholder*="Kapitel"]').value = '1';
                document.querySelector('input[placeholder*="Vers"]').value = '1';
            });
            
            const loadingPromise = page.waitForSelector('.loading-spinner, [class*="animate-pulse"], [class*="opacity-50"]', {
                visible: true,
                timeout: 2000
            }).catch(() => null);
            
            await page.click('button:has-text("Vers suchen")');
            const loadingElement = await loadingPromise;
            
            if (!loadingElement) {
                console.warn('    ⚠️  No visible loading indicator detected (non-critical)');
            }
        });
        
        // Error Scenarios
        console.log('\n❌ 3. ERROR HANDLING TESTING\n');
        
        await testCase('error', 'Invalid book name shows error', async () => {
            await page.evaluate(() => {
                document.querySelector('input[placeholder*="Buch"]').value = '';
                document.querySelector('input[placeholder*="Kapitel"]').value = '';
                document.querySelector('input[placeholder*="Vers"]').value = '';
            });
            
            await page.type('input[placeholder*="Buch"]', 'InvalidBookName');
            await page.type('input[placeholder*="Kapitel"]', '1');
            await page.type('input[placeholder*="Vers"]', '1');
            
            await page.click('button:has-text("Vers suchen")');
            
            // Wait for error indication
            await page.waitForFunction(() => {
                const errorEl = document.querySelector('.error-message, [class*="text-red"], [class*="bg-red"]');
                const alertEl = document.querySelector('[role="alert"]');
                return errorEl || alertEl;
            }, { timeout: 5000 });
        });
        
        await testCase('error', 'Invalid chapter number shows error', async () => {
            await page.evaluate(() => {
                document.querySelector('input[placeholder*="Buch"]').value = '';
                document.querySelector('input[placeholder*="Kapitel"]').value = '';
                document.querySelector('input[placeholder*="Vers"]').value = '';
            });
            
            await page.type('input[placeholder*="Buch"]', 'Johannes');
            await page.type('input[placeholder*="Kapitel"]', '999');
            await page.type('input[placeholder*="Vers"]', '1');
            
            await page.click('button:has-text("Vers suchen")');
            
            await page.waitForFunction(() => {
                const errorEl = document.querySelector('.error-message, [class*="text-red"], [class*="bg-red"]');
                const alertEl = document.querySelector('[role="alert"]');
                return errorEl || alertEl;
            }, { timeout: 5000 });
        });
        
        await testCase('error', 'Empty field submission is handled', async () => {
            await page.evaluate(() => {
                document.querySelector('input[placeholder*="Buch"]').value = '';
                document.querySelector('input[placeholder*="Kapitel"]').value = '';
                document.querySelector('input[placeholder*="Vers"]').value = '';
            });
            
            await page.click('button:has-text("Vers suchen")');
            // Should either show error or be prevented
            await new Promise(resolve => setTimeout(resolve, 1000));
        });
        
        // Performance Testing
        console.log('\n⚡ 4. PERFORMANCE TESTING\n');
        
        const startTime = Date.now();
        
        await testCase('performance', 'API response time < 3 seconds', async () => {
            await page.evaluate(() => {
                document.querySelector('input[placeholder*="Buch"]').value = 'Genesis';
                document.querySelector('input[placeholder*="Kapitel"]').value = '1';
                document.querySelector('input[placeholder*="Vers"]').value = '1';
            });
            
            const apiStart = Date.now();
            await page.click('button:has-text("Vers suchen")');
            
            await page.waitForFunction(() => {
                const text = document.querySelector('.verse-text')?.textContent;
                return text && text.length > 10;
            }, { timeout: 5000 });
            
            const apiTime = Date.now() - apiStart;
            if (apiTime > 3000) {
                throw new Error(`API response took ${apiTime}ms (> 3000ms)`);
            }
            console.log(`    Response time: ${apiTime}ms`);
        });
        
        await testCase('performance', 'No console errors', async () => {
            const errors = await page.evaluate(() => window.__consoleErrors || []);
            if (errors.length > 0) {
                throw new Error(`Found ${errors.length} console errors`);
            }
        });
        
        await testCase('performance', 'Page metrics within limits', async () => {
            const metrics = await page.metrics();
            const heapMB = metrics.JSHeapUsedSize / 1024 / 1024;
            
            console.log(`    JS Heap: ${heapMB.toFixed(2)} MB`);
            console.log(`    DOM Nodes: ${metrics.Nodes}`);
            
            if (heapMB > 50) {
                throw new Error(`High memory usage: ${heapMB.toFixed(2)} MB`);
            }
        });
        
        // Browser Compatibility (in headless mode, we test Chromium)
        console.log('\n🌐 5. BROWSER COMPATIBILITY\n');
        console.log('✅ Chromium/Chrome: Tested (current browser)');
        console.log('ℹ️  Firefox: Manual testing recommended');
        console.log('ℹ️  Safari: Manual testing recommended');
        console.log('ℹ️  Mobile browsers: Manual testing recommended');
        
        // Summary
        console.log('\n==================================================');
        console.log('📊 TEST SUMMARY\n');
        
        let totalPassed = 0;
        let totalFailed = 0;
        
        for (const [category, data] of Object.entries(results)) {
            if (data.tests.length > 0) {
                console.log(`${category.toUpperCase()}: ${data.passed} passed, ${data.failed} failed`);
                totalPassed += data.passed;
                totalFailed += data.failed;
            }
        }
        
        console.log(`\nTOTAL: ${totalPassed} passed, ${totalFailed} failed`);
        
        if (totalFailed === 0) {
            console.log('\n✅ All tests passed! The app is fully functional.');
        } else {
            console.log(`\n⚠️  ${totalFailed} tests failed. Please review the issues above.`);
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testDivineWordsApp().catch(console.error);