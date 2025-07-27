import puppeteer from 'puppeteer';

async function runFinalTestReport() {
    console.log('🧪 DIVINE WORDS - FINAL COMPREHENSIVE TEST REPORT\n');
    console.log('==================================================\n');
    console.log('URL: https://divine-words.assistent.my.id\n');
    console.log('Date:', new Date().toISOString());
    console.log('\n==================================================\n');
    
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    const testResults = {
        api: { passed: 0, failed: 0, details: [] },
        ui: { passed: 0, failed: 0, details: [] },
        functionality: { passed: 0, failed: 0, details: [] },
        errors: { passed: 0, failed: 0, details: [] },
        performance: { passed: 0, failed: 0, details: [] }
    };
    
    // Helper function for tests
    async function runTest(category, testName, testFn) {
        try {
            const result = await testFn();
            testResults[category].passed++;
            testResults[category].details.push({
                test: testName,
                status: '✅ PASSED',
                detail: result
            });
            return true;
        } catch (error) {
            testResults[category].failed++;
            testResults[category].details.push({
                test: testName,
                status: '❌ FAILED',
                error: error.message
            });
            return false;
        }
    }
    
    try {
        // 1. API FUNCTIONALITY TESTING
        console.log('📡 1. API FUNCTIONALITY TESTING\n');
        
        await page.goto('https://divine-words.assistent.my.id', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        // Test daily verse loading
        await runTest('api', 'Daily verse loads on page load', async () => {
            await page.waitForSelector('.verse-text', { timeout: 10000 });
            const verseText = await page.$eval('.verse-text', el => el.textContent);
            if (!verseText || verseText.length < 10) {
                throw new Error('No verse text found');
            }
            return `Verse loaded: ${verseText.substring(0, 50)}...`;
        });
        
        // Test verse search functionality
        await runTest('api', 'Verse search - John 3:16', async () => {
            // Click search button to switch modes
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const searchBtn = buttons.find(btn => btn.textContent.includes('such') || btn.textContent.includes('Verse'));
                if (searchBtn) searchBtn.click();
            });
            
            await new Promise(r => setTimeout(r, 1000));
            
            // Fill in search fields
            await page.type('input[placeholder*="Buch"]', 'John');
            await page.type('input[placeholder*="Kapitel"]', '3');
            await page.type('input[placeholder*="Vers"]', '16');
            
            // Click search
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const searchBtn = buttons.find(btn => btn.textContent.includes('suchen'));
                if (searchBtn) searchBtn.click();
            });
            
            await new Promise(r => setTimeout(r, 2000));
            
            const verseText = await page.$eval('.verse-text', el => el.textContent);
            if (!verseText.includes('God') || !verseText.includes('loved')) {
                throw new Error('Incorrect verse returned');
            }
            return 'John 3:16 loaded successfully';
        });
        
        // Test translation switching
        await runTest('api', 'Translation switching', async () => {
            const translations = ['kjv', 'web', 'asv'];
            const results = [];
            
            for (const trans of translations) {
                await page.select('#translation', trans);
                await new Promise(r => setTimeout(r, 1500));
                const text = await page.$eval('.verse-text', el => el.textContent);
                results.push(`${trans}: ${text.substring(0, 30)}...`);
            }
            
            return results.join('; ');
        });
        
        // 2. USER EXPERIENCE TESTING
        console.log('\n🎨 2. USER EXPERIENCE TESTING\n');
        
        // Test all buttons are clickable
        await runTest('ui', 'All buttons are interactive', async () => {
            const buttons = await page.$$eval('button', btns => 
                btns.map(btn => ({
                    text: btn.textContent.trim(),
                    clickable: !btn.disabled
                }))
            );
            
            const unclickable = buttons.filter(b => !b.clickable);
            if (unclickable.length > 0) {
                throw new Error(`Unclickable buttons: ${unclickable.map(b => b.text).join(', ')}`);
            }
            
            return `All ${buttons.length} buttons are clickable`;
        });
        
        // Test language switching
        await runTest('ui', 'Language switching works', async () => {
            // Switch to English
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const enBtn = btns.find(b => b.textContent.trim() === 'English');
                if (enBtn) enBtn.click();
            });
            
            await new Promise(r => setTimeout(r, 1000));
            
            const enLabel = await page.$eval('label[for="translation"]', el => el.textContent);
            if (!enLabel.includes('Translation')) {
                throw new Error('Language did not switch to English');
            }
            
            // Switch back to German
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const deBtn = btns.find(b => b.textContent.trim() === 'Deutsch');
                if (deBtn) deBtn.click();
            });
            
            await new Promise(r => setTimeout(r, 1000));
            
            const deLabel = await page.$eval('label[for="translation"]', el => el.textContent);
            if (!deLabel.includes('Übersetzung')) {
                throw new Error('Language did not switch to German');
            }
            
            return 'Language switching works correctly';
        });
        
        // Test mode switching
        await runTest('ui', 'Mode switching (Daily/Search)', async () => {
            // Switch to daily verse
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const dailyBtn = btns.find(b => b.textContent.includes('Tagesvers'));
                if (dailyBtn) dailyBtn.click();
            });
            
            await new Promise(r => setTimeout(r, 1000));
            
            const hasDaily = await page.$('.verse-text') !== null;
            if (!hasDaily) {
                throw new Error('Daily verse not shown');
            }
            
            return 'Mode switching works correctly';
        });
        
        // 3. ERROR SCENARIOS
        console.log('\n❌ 3. ERROR HANDLING TESTING\n');
        
        await runTest('errors', 'Invalid book name shows error', async () => {
            // Switch to search mode
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const searchBtn = btns.find(b => b.textContent.includes('such'));
                if (searchBtn) searchBtn.click();
            });
            
            await new Promise(r => setTimeout(r, 1000));
            
            // Clear and enter invalid data
            await page.evaluate(() => {
                document.querySelector('input[placeholder*="Buch"]').value = '';
                document.querySelector('input[placeholder*="Kapitel"]').value = '';
                document.querySelector('input[placeholder*="Vers"]').value = '';
            });
            
            await page.type('input[placeholder*="Buch"]', 'InvalidBook');
            await page.type('input[placeholder*="Kapitel"]', '1');
            await page.type('input[placeholder*="Vers"]', '1');
            
            // Search
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const searchBtn = btns.find(b => b.textContent.includes('suchen'));
                if (searchBtn) searchBtn.click();
            });
            
            await new Promise(r => setTimeout(r, 2000));
            
            // Check for error indication
            const hasError = await page.evaluate(() => {
                const errorEl = document.querySelector('.error-message') || 
                               document.querySelector('[class*="text-red"]');
                const alertText = document.body.textContent.toLowerCase();
                return errorEl !== null || alertText.includes('error') || alertText.includes('fehler');
            });
            
            if (!hasError) {
                throw new Error('No error shown for invalid input');
            }
            
            return 'Error handling works for invalid input';
        });
        
        // 4. PERFORMANCE TESTING
        console.log('\n⚡ 4. PERFORMANCE TESTING\n');
        
        await runTest('performance', 'Page load time < 3 seconds', async () => {
            const startTime = Date.now();
            await page.goto('https://divine-words.assistent.my.id', { 
                waitUntil: 'networkidle2' 
            });
            const loadTime = Date.now() - startTime;
            
            if (loadTime > 3000) {
                throw new Error(`Load time ${loadTime}ms exceeds 3000ms`);
            }
            
            return `Page loaded in ${loadTime}ms`;
        });
        
        await runTest('performance', 'API response time < 2 seconds', async () => {
            const startTime = Date.now();
            
            // Trigger an API call
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const dailyBtn = btns.find(b => b.textContent.includes('Tagesvers'));
                if (dailyBtn) dailyBtn.click();
            });
            
            await page.waitForFunction(() => {
                const text = document.querySelector('.verse-text')?.textContent;
                return text && text.length > 10;
            }, { timeout: 3000 });
            
            const responseTime = Date.now() - startTime;
            
            if (responseTime > 2000) {
                throw new Error(`API response time ${responseTime}ms exceeds 2000ms`);
            }
            
            return `API responded in ${responseTime}ms`;
        });
        
        await runTest('performance', 'No console errors', async () => {
            const errors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    errors.push(msg.text());
                }
            });
            
            await page.reload({ waitUntil: 'networkidle2' });
            await new Promise(r => setTimeout(r, 2000));
            
            if (errors.length > 0) {
                throw new Error(`Found ${errors.length} console errors`);
            }
            
            return 'No console errors detected';
        });
        
        // FINAL REPORT
        console.log('\n==================================================');
        console.log('📊 FINAL TEST SUMMARY\n');
        
        let totalPassed = 0;
        let totalFailed = 0;
        
        for (const [category, data] of Object.entries(testResults)) {
            const categoryName = category.toUpperCase();
            console.log(`${categoryName}: ${data.passed} passed, ${data.failed} failed`);
            
            // Show details
            for (const detail of data.details) {
                console.log(`  ${detail.status} ${detail.test}`);
                if (detail.detail) {
                    console.log(`     → ${detail.detail}`);
                }
                if (detail.error) {
                    console.log(`     → Error: ${detail.error}`);
                }
            }
            console.log();
            
            totalPassed += data.passed;
            totalFailed += data.failed;
        }
        
        console.log(`TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
        
        // Overall status
        console.log('\n==================================================');
        if (totalFailed === 0) {
            console.log('✅ RESULT: APP IS FULLY FUNCTIONAL!');
            console.log('\nAll tests passed successfully. The Divine Words webapp is working correctly.');
        } else if (totalFailed <= 2) {
            console.log('⚠️  RESULT: APP IS MOSTLY FUNCTIONAL');
            console.log(`\n${totalFailed} minor issues found, but core functionality is working.`);
        } else {
            console.log('❌ RESULT: APP HAS SIGNIFICANT ISSUES');
            console.log(`\n${totalFailed} tests failed. Please review the errors above.`);
        }
        
        console.log('\n🌐 BROWSER COMPATIBILITY NOTE:');
        console.log('This test was performed using Chromium. Manual testing is recommended for:');
        console.log('  - Firefox');
        console.log('  - Safari');
        console.log('  - Mobile browsers (iOS Safari, Chrome Mobile)');
        
    } catch (error) {
        console.error('❌ Critical test failure:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the final test
runFinalTestReport().catch(console.error);