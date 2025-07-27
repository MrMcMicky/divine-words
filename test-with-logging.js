import puppeteer from 'puppeteer';

async function testDivineWordsWithLogging() {
    console.log('🧪 Divine Words Comprehensive Testing with Detailed Logging\n');
    console.log('==================================================\n');
    
    const browser = await puppeteer.launch({ 
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Enable detailed console logging
    page.on('console', msg => {
        console.log(`[Browser Console ${msg.type()}]:`, msg.text());
    });
    
    page.on('pageerror', error => {
        console.log('❌ Page Error:', error.message);
    });
    
    // Enable request logging
    page.on('request', request => {
        if (request.url().includes('api/bible')) {
            console.log(`📤 API Request: ${request.method()} ${request.url()}`);
        }
    });
    
    page.on('response', response => {
        if (response.url().includes('api/bible')) {
            console.log(`📥 API Response: ${response.status()} ${response.url()}`);
        }
    });
    
    try {
        // Navigate to the page
        console.log('1️⃣ Testing Page Load...\n');
        await page.goto('https://divine-words.assistent.my.id', { 
            waitUntil: 'networkidle2',
            timeout: 30000 
        });
        
        console.log('✅ Page loaded successfully\n');
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'divine-words-screenshot.png' });
        console.log('📸 Screenshot saved as divine-words-screenshot.png\n');
        
        // Get page content structure
        console.log('2️⃣ Analyzing Page Structure...\n');
        
        const pageStructure = await page.evaluate(() => {
            const structure = {
                title: document.title,
                hasApp: !!document.querySelector('#app'),
                appContent: document.querySelector('#app')?.innerHTML?.substring(0, 200),
                buttons: Array.from(document.querySelectorAll('button')).map(btn => btn.textContent),
                inputs: Array.from(document.querySelectorAll('input')).map(input => ({
                    type: input.type,
                    placeholder: input.placeholder,
                    id: input.id
                })),
                selects: Array.from(document.querySelectorAll('select')).map(select => ({
                    id: select.id,
                    options: Array.from(select.options).map(opt => opt.text)
                })),
                verseElements: {
                    text: document.querySelector('.verse-text')?.textContent,
                    reference: document.querySelector('.verse-reference')?.textContent
                },
                errorElements: document.querySelector('.error-message')?.textContent
            };
            return structure;
        });
        
        console.log('Page Structure:', JSON.stringify(pageStructure, null, 2));
        console.log();
        
        // Wait for app to fully load
        console.log('3️⃣ Waiting for Vue App to Initialize...\n');
        await page.waitForFunction(() => {
            return window.Vue || document.querySelector('.verse-text') || document.querySelector('button');
        }, { timeout: 10000 });
        
        // Check if there's an error state
        const errorState = await page.evaluate(() => {
            const errorEl = document.querySelector('.error-message') || 
                           document.querySelector('[class*="text-red"]') ||
                           document.querySelector('[class*="bg-red"]');
            return errorEl ? errorEl.textContent : null;
        });
        
        if (errorState) {
            console.log('⚠️  App is showing error state:', errorState);
        }
        
        // Test API directly
        console.log('\n4️⃣ Testing API Endpoints Directly...\n');
        
        const apiTests = [
            { url: '/api/bible/John+3:16?translation=kjv', name: 'English Bible API' },
            { url: '/api/bible/Johannes+3:16?translation=elberfelder1905', name: 'German Bible API' }
        ];
        
        for (const test of apiTests) {
            try {
                const response = await page.evaluate(async (url) => {
                    const res = await fetch(url);
                    const data = await res.json();
                    return { status: res.status, data };
                }, `https://divine-words.assistent.my.id${test.url}`);
                
                console.log(`✅ ${test.name}: Status ${response.status}`);
                if (response.data.text) {
                    console.log(`   Text: ${response.data.text.substring(0, 100)}...`);
                } else {
                    console.log(`   Response:`, response.data);
                }
            } catch (error) {
                console.log(`❌ ${test.name} failed:`, error.message);
            }
        }
        
        // Check if daily verse section is visible
        console.log('\n5️⃣ Testing UI Components...\n');
        
        const uiState = await page.evaluate(() => {
            return {
                hasDailyVerseSection: !!document.querySelector('.verse-text'),
                hasSearchSection: !!document.querySelector('input[type="text"]'),
                hasTranslationSelect: !!document.querySelector('select'),
                hasLanguageButtons: document.querySelectorAll('[data-lang]').length,
                visibleButtons: Array.from(document.querySelectorAll('button')).filter(btn => {
                    const rect = btn.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                }).map(btn => btn.textContent.trim())
            };
        });
        
        console.log('UI State:', JSON.stringify(uiState, null, 2));
        
        // If search section is not visible, try to show it
        if (!uiState.hasSearchSection && uiState.visibleButtons.length > 0) {
            console.log('\n6️⃣ Attempting to switch to search mode...\n');
            
            // Find button that might switch to search
            const switchButton = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const searchButton = buttons.find(btn => 
                    btn.textContent.toLowerCase().includes('such') || 
                    btn.textContent.toLowerCase().includes('search')
                );
                if (searchButton) {
                    searchButton.click();
                    return searchButton.textContent;
                }
                return null;
            });
            
            if (switchButton) {
                console.log(`✅ Clicked button: "${switchButton}"`);
                await page.waitForTimeout(2000);
                
                // Check UI state again
                const newUiState = await page.evaluate(() => {
                    return {
                        hasSearchSection: !!document.querySelector('input[type="text"]'),
                        inputCount: document.querySelectorAll('input[type="text"]').length,
                        selectCount: document.querySelectorAll('select').length
                    };
                });
                
                console.log('New UI State after switching:', newUiState);
            }
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the test
testDivineWordsWithLogging().catch(console.error);